/**
 * Backfill pgvector embeddings for MusicBrainz entities.
 *
 * Reads rows whose `embedding` column is NULL from `musicbrainz.artist`
 * (and optionally `musicbrainz.recording`), composes a short text
 * representation, calls Azure OpenAI embeddings, and writes the resulting
 * vectors back. The script is fully resumable: each run processes only
 * rows that still have NULL `embedding`, in `id` order. It is safe to
 * interrupt and restart at any time.
 *
 * Usage (from the `server` directory):
 *
 *   npm run backfill:embeddings -- [--entity=artist|recording|all] \
 *                                  [--batch-size=64] [--limit=10000] \
 *                                  [--min-id=0] [--dry-run]
 *
 * Defaults are tuned for Azure OpenAI throughput limits:
 *   - 64 inputs per embeddings request (well under the 2048-input cap)
 *   - 5 concurrent batches in flight at a time
 *
 * Required environment variables:
 *   AZURE_AI_ENDPOINT, AZURE_AI_EMBEDDING_DEPLOYMENT (optional, defaults
 *   to text-embedding-3-small which matches the vector(1536) columns),
 *   plus the standard PG* connection variables consumed by pgClient.ts.
 */

import process from 'node:process';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import {
  embedBatch,
  toPgVector,
  EMBEDDING_DIM,
  DEFAULT_EMBEDDING_DEPLOYMENT,
} from '../embeddingsClient.js';
import {
  ensureProgressTable,
  startRun,
  heartbeat,
  finishRun,
} from './backfillProgress.js';

const { Pool } = pg;

// ---------------------------------------------------------------------------
// Cooperative cancellation (SIGTERM from Azure Container Apps Jobs)
// ---------------------------------------------------------------------------
//
// Container Apps Jobs send SIGTERM when an execution is stopped via
// `az containerapp job stop` (or when scaling down). We honour that by
// flipping a flag the page loop checks between batches so we can finish
// any in-flight write, mark progress as 'cancelled', and exit cleanly.

let stopRequested = false;

function installSignalHandlers(): void {
  const onSignal = (sig: string) => {
    if (stopRequested) return;
    stopRequested = true;
    console.warn(`\n[backfill] ${sig} received — finishing current page and stopping…`);
  };
  process.on('SIGTERM', () => onSignal('SIGTERM'));
  process.on('SIGINT', () => onSignal('SIGINT'));
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

type Entity = 'artist' | 'recording';

// Hard allowlist of table names that may be interpolated into SQL. Even
// though the `Entity` type narrows callers at compile time, this explicit
// runtime check is defence-in-depth so a future caller / refactor cannot
// accidentally splice an attacker-controlled string into raw SQL.
const ENTITY_TABLES: ReadonlySet<Entity> = new Set(['artist', 'recording']);

function assertEntityTable(name: string): asserts name is Entity {
  if (!ENTITY_TABLES.has(name as Entity)) {
    throw new Error(`Refusing to use non-allowlisted entity table name: ${name}`);
  }
}

interface Options {
  entities: Entity[];
  batchSize: number;
  concurrency: number;
  writeConcurrency: number;
  limit: number | null;
  minId: number;
  maxId: number | null;
  dryRun: boolean;
  runId: string;
  trackProgress: boolean;
  dropIndex: boolean;
  heartbeatEvery: number;
}

/**
 * Read an option from a CLI flag (`--key=value`) falling back to an
 * environment variable. Env-var-driven config is the primary path when
 * running as an Azure Container Apps Job because job templates configure
 * containers through `env`, not through `args`.
 */
function envOrFlag(
  argv: string[],
  flagName: string,
  envName: string,
): string | undefined {
  const prefix = `--${flagName}=`;
  for (const a of argv) {
    if (a === `--${flagName}`) return '';
    if (a.startsWith(prefix)) return a.slice(prefix.length);
  }
  const v = process.env[envName];
  return v === undefined ? undefined : v;
}

function parseInteger(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
  label: string,
): number {
  if (raw === undefined || raw === '') return fallback;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) throw new Error(`Invalid integer for ${label}: ${raw}`);
  return Math.max(min, Math.min(max, n));
}

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  if (raw === '') return true; // bare flag means "true"
  return /^(1|true|yes|on)$/i.test(raw);
}

function parseArgs(argv: string[]): Options {
  // Entities
  const entityRaw = envOrFlag(argv, 'entity', 'BACKFILL_ENTITY') ?? 'artist';
  let entities: Entity[];
  if (entityRaw === 'all') entities = ['artist', 'recording'];
  else if (entityRaw === 'artist' || entityRaw === 'recording') entities = [entityRaw];
  else throw new Error(`Unknown --entity value: ${entityRaw}`);

  const batchSize = parseInteger(
    envOrFlag(argv, 'batch-size', 'BACKFILL_BATCH_SIZE'),
    64,
    1,
    2048,
    'batch-size',
  );
  const concurrency = parseInteger(
    envOrFlag(argv, 'concurrency', 'BACKFILL_CONCURRENCY'),
    5,
    1,
    32,
    'concurrency',
  );
  const writeConcurrency = parseInteger(
    envOrFlag(argv, 'write-concurrency', 'BACKFILL_WRITE_CONCURRENCY'),
    Math.max(2, Math.min(concurrency, 4)),
    1,
    16,
    'write-concurrency',
  );

  const limitRaw = envOrFlag(argv, 'limit', 'BACKFILL_LIMIT');
  const limit =
    limitRaw === undefined || limitRaw === ''
      ? null
      : (() => {
          const n = parseInt(limitRaw, 10);
          if (Number.isNaN(n) || n < 0) {
            throw new Error(`Invalid --limit: ${limitRaw}`);
          }
          return n;
        })();

  const minId = parseInteger(
    envOrFlag(argv, 'min-id', 'BACKFILL_MIN_ID'),
    0,
    0,
    Number.MAX_SAFE_INTEGER,
    'min-id',
  );

  const maxIdRaw = envOrFlag(argv, 'max-id', 'BACKFILL_MAX_ID');
  const maxId =
    maxIdRaw === undefined || maxIdRaw === ''
      ? null
      : (() => {
          const n = parseInt(maxIdRaw, 10);
          if (Number.isNaN(n) || n < 0) {
            throw new Error(`Invalid --max-id: ${maxIdRaw}`);
          }
          return n;
        })();

  const dryRun = parseBool(envOrFlag(argv, 'dry-run', 'BACKFILL_DRY_RUN'), false);
  const dropIndex = parseBool(
    envOrFlag(argv, 'drop-index', 'BACKFILL_DROP_INDEX'),
    false,
  );
  const trackProgress = parseBool(
    envOrFlag(argv, 'track-progress', 'BACKFILL_TRACK_PROGRESS'),
    true,
  );

  // Run id: prefer Container Apps Job execution name so each execution has a
  // stable, externally discoverable id. Fall back to env override or UUID.
  const runId =
    envOrFlag(argv, 'run-id', 'BACKFILL_RUN_ID') ||
    process.env.CONTAINER_APP_JOB_EXECUTION_NAME ||
    process.env.CONTAINER_APP_REVISION ||
    `local-${randomUUID()}`;

  const heartbeatEvery = parseInteger(
    envOrFlag(argv, 'heartbeat-every', 'BACKFILL_HEARTBEAT_EVERY'),
    1,
    1,
    1000,
    'heartbeat-every',
  );

  // Detect bare --help / -h.
  for (const a of argv) {
    if (a === '--help' || a === '-h') printHelpAndExit();
  }

  return {
    entities,
    batchSize,
    concurrency,
    writeConcurrency,
    limit,
    minId,
    maxId,
    dryRun,
    runId,
    trackProgress,
    dropIndex,
    heartbeatEvery,
  };
}

function printHelpAndExit(): never {
  console.log(`Backfill pgvector embeddings for MusicBrainz entities.

All options can be set via CLI flag (--key=value) OR environment variable
(BACKFILL_KEY). Env-var-only is the recommended path when running as an
Azure Container Apps Job.

Options:
  --entity=artist|recording|all  (BACKFILL_ENTITY, default: artist)
  --batch-size=N                 (BACKFILL_BATCH_SIZE, default: 64, max 2048)
  --concurrency=N                (BACKFILL_CONCURRENCY, default: 5, max 32)
  --write-concurrency=N          (BACKFILL_WRITE_CONCURRENCY, default: min(concurrency,4))
  --limit=N                      (BACKFILL_LIMIT, default: no limit)
  --min-id=N                     (BACKFILL_MIN_ID, default: 0)
  --max-id=N                     (BACKFILL_MAX_ID, default: no upper bound — sharding)
  --dry-run                      (BACKFILL_DRY_RUN, default: false)
  --drop-index                   (BACKFILL_DROP_INDEX, default: false; drop+rebuild
                                  vector index around the run for max insert speed)
  --track-progress               (BACKFILL_TRACK_PROGRESS, default: true; write to
                                  musicbrainz.backfill_progress)
  --run-id=ID                    (BACKFILL_RUN_ID, default: $CONTAINER_APP_JOB_EXECUTION_NAME
                                  or a generated UUID)
  --heartbeat-every=N            (BACKFILL_HEARTBEAT_EVERY, default: 1 page)
`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Source-text composition
// ---------------------------------------------------------------------------

// Cap individual values so a pathological row can't blow the token budget.
const MAX_TEXT_LEN = 1500;

function clamp(text: string | null | undefined): string {
  if (!text) return '';
  return text.length > MAX_TEXT_LEN ? text.slice(0, MAX_TEXT_LEN) : text;
}

/**
 * Compose the text to embed for an artist row. We deliberately concatenate
 * the most descriptive structured fields (name, type, area, disambiguation
 * comment, top tags) so the vector captures both identity and style.
 *
 * Tags are pre-filtered to those with positive vote counts (see SQL
 * below). They are deduplicated and lower-cased for stable embeddings.
 */
function composeArtistText(row: ArtistSourceRow): string {
  const parts: string[] = [];
  parts.push(`Artist: ${clamp(row.name)}`);
  if (row.type_name) parts.push(`Type: ${row.type_name}`);
  if (row.area_name) parts.push(`Area: ${row.area_name}`);
  if (row.comment) parts.push(`Disambiguation: ${clamp(row.comment)}`);
  if (row.begin_date_year) parts.push(`Active from: ${row.begin_date_year}`);
  if (row.end_date_year) parts.push(`Active to: ${row.end_date_year}`);
  if (row.tags && row.tags.length > 0) {
    parts.push(`Tags: ${row.tags.slice(0, 20).join(', ')}`);
  }
  return parts.join('. ');
}

function composeRecordingText(row: RecordingSourceRow): string {
  const parts: string[] = [];
  parts.push(`Recording: ${clamp(row.name)}`);
  if (row.artist_credit_name) parts.push(`By: ${clamp(row.artist_credit_name)}`);
  if (row.comment) parts.push(`Disambiguation: ${clamp(row.comment)}`);
  if (row.length) {
    const seconds = Math.round(row.length / 1000);
    parts.push(`Duration: ${seconds}s`);
  }
  return parts.join('. ');
}

interface ArtistSourceRow {
  id: number;
  name: string;
  comment: string | null;
  begin_date_year: number | null;
  end_date_year: number | null;
  type_name: string | null;
  area_name: string | null;
  tags: string[] | null;
}

interface RecordingSourceRow {
  id: number;
  name: string;
  comment: string | null;
  length: number | null;
  artist_credit_name: string | null;
}

// ---------------------------------------------------------------------------
// PG pool
// ---------------------------------------------------------------------------

function buildPool(): pg.Pool {
  if (!process.env.PGHOST) {
    throw new Error('PGHOST is not set. Cannot run backfill.');
  }
  return new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE ?? 'musicbrainz',
    user: process.env.PGUSER ?? 'pgadmin',
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT ?? '5432', 10),
    ssl:
      process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: true } : undefined,
    // Increased from 4 → 10 to support parallel writes plus the streaming
    // page-read query and the periodic progress-heartbeat UPDATEs.
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    // TCP keepalive avoids silent NAT drops on long-running Azure connections
    // (these manifested as ETIMEDOUT mid-page in earlier runs).
    keepAlive: true,
    // Abort any single statement that runs longer than 5 minutes so the job
    // never hangs indefinitely on a slow query. With HNSW (the default
    // vector index in optimize_indexes.sql) per-row insert cost is
    // dramatically lower than IVFFlat, but we still keep a generous ceiling
    // for the slowest pages and large ANALYZEs.
    statement_timeout: 300_000,
  });
}

// ---------------------------------------------------------------------------
// Streaming readers
// ---------------------------------------------------------------------------

async function* readArtists(
  pool: pg.Pool,
  startId: number,
  endId: number | null,
  pageSize: number,
): AsyncGenerator<ArtistSourceRow[]> {
  let cursorId = startId;
  // We page by `id` rather than OFFSET so progress is stable and resumable.
  // Tags are fetched in a separate query to avoid a LATERAL subquery that
  // can cause the planner to choose a nested-loop plan scanning the full
  // artist_tag table for each row — which hangs on large tables without
  // an index on artist_tag(artist).
  while (true) {
    if (endId !== null && cursorId > endId) return;
    console.log(`  [readArtists] fetching page id >= ${cursorId} …`);
    const { rows } = await pool.query<Omit<ArtistSourceRow, 'tags'> & { tags: null }>(
      `SELECT a.id, a.name, a.comment,
              a.begin_date_year, a.end_date_year,
              at.name AS type_name,
              ar.name AS area_name,
              NULL AS tags
       FROM musicbrainz.artist a
       LEFT JOIN musicbrainz.artist_type at ON at.id = a.type
       LEFT JOIN musicbrainz.area ar ON ar.id = a.area
       WHERE a.embedding IS NULL
         AND a.id >= $1
         AND ($2::bigint IS NULL OR a.id <= $2)
       ORDER BY a.id
       LIMIT $3`,
      [cursorId, endId, pageSize],
    );
    if (rows.length === 0) return;

    // Batch-fetch tags for all rows in the page in a single query.
    const ids = rows.map((r) => r.id);
    const { rows: tagRows } = await pool.query<{
      artist: number;
      tags: string[];
    }>(
      `SELECT atg.artist,
              array_agg(DISTINCT lower(t.name) ORDER BY lower(t.name)) AS tags
       FROM musicbrainz.artist_tag atg
       JOIN musicbrainz.tag t ON t.id = atg.tag
       WHERE atg.artist = ANY($1)
         AND atg.count > 0
       GROUP BY atg.artist`,
      [ids],
    );
    const tagMap = new Map(tagRows.map((r) => [r.artist, r.tags]));

    const enriched: ArtistSourceRow[] = rows.map((r) => ({
      ...r,
      tags: tagMap.get(r.id) ?? null,
    }));

    yield enriched;
    cursorId = rows[rows.length - 1].id + 1;
  }
}

async function* readRecordings(
  pool: pg.Pool,
  startId: number,
  endId: number | null,
  pageSize: number,
): AsyncGenerator<RecordingSourceRow[]> {
  let cursorId = startId;
  while (true) {
    if (endId !== null && cursorId > endId) return;
    const { rows } = await pool.query<RecordingSourceRow>(
      `SELECT r.id, r.name, r.comment, r.length,
              ac.name AS artist_credit_name
       FROM musicbrainz.recording r
       LEFT JOIN musicbrainz.artist_credit ac ON ac.id = r.artist_credit
       WHERE r.embedding IS NULL
         AND r.id >= $1
         AND ($2::bigint IS NULL OR r.id <= $2)
       ORDER BY r.id
       LIMIT $3`,
      [cursorId, endId, pageSize],
    );
    if (rows.length === 0) return;
    yield rows;
    cursorId = rows[rows.length - 1].id + 1;
  }
}

// ---------------------------------------------------------------------------
// Writer
// ---------------------------------------------------------------------------

/**
 * UPDATE … FROM (VALUES …) is dramatically faster than N individual
 * UPDATE statements, especially on Azure where each round-trip carries
 * ~10–50ms of latency.
 *
 * Inserting `vector(1536)` values is expensive on Azure PG when a partial
 * IVFFlat index is present (each new row must be placed into a list,
 * which requires computing distances to every list centroid). To stay
 * comfortably under `statement_timeout`, callers should pass in
 * embedding-batch-sized chunks (typically 64 rows) rather than whole
 * pages. A bounded retry handles transient timeouts so a single slow
 * write doesn't discard already-computed embeddings.
 */
async function writeEmbeddings(
  pool: pg.Pool,
  table: 'artist' | 'recording',
  rows: Array<{ id: number; embedding: number[] }>,
): Promise<void> {
  if (rows.length === 0) return;
  const ids: number[] = [];
  const vecs: string[] = [];
  for (const r of rows) {
    if (r.embedding.length !== EMBEDDING_DIM) {
      throw new Error(
        `Embedding for ${table} id=${r.id} has ${r.embedding.length} dims, expected ${EMBEDDING_DIM}`,
      );
    }
    ids.push(r.id);
    vecs.push(toPgVector(r.embedding));
  }
  // `table` is a hard-coded literal from the Entity union; the assertion
  // is defence-in-depth against future callers passing arbitrary strings.
  assertEntityTable(table);

  const sql = `UPDATE musicbrainz.${table} AS t
        SET embedding = v.embedding::vector
       FROM (SELECT UNNEST($1::int[]) AS id,
                    UNNEST($2::text[]) AS embedding) v
      WHERE t.id = v.id`;

  // Retry transient statement-timeout errors (Postgres SQLSTATE 57014).
  // A page that times out once may complete on a second attempt if the
  // server was momentarily contended; failing fast loses 64 freshly
  // computed embeddings that we'd otherwise have to recompute.
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await pool.query(sql, [ids, vecs]);
      return;
    } catch (err) {
      lastErr = err;
      const code = (err as { code?: string } | null)?.code;
      if (code !== '57014' || attempt === MAX_ATTEMPTS) {
        throw err;
      }
      const backoffMs = 1000 * attempt;
      console.warn(
        `  ⚠ write for ${rows.length} rows timed out (attempt ${attempt}/${MAX_ATTEMPTS}); retrying in ${backoffMs}ms…`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

interface Stats {
  processed: number;
  embedded: number;
  skipped: number;
  errors: number;
}

async function processEntity(
  pool: pg.Pool,
  entity: Entity,
  opts: Options,
  stats: Stats,
  onHeartbeat?: (lastId: number) => Promise<void>,
): Promise<void> {
  console.log(`\n=== Backfilling embeddings for musicbrainz.${entity} ===`);

  // Defence-in-depth: validate the entity name before interpolating into SQL.
  assertEntityTable(entity);

  // Count remaining rows (cheap estimate is fine; this is just for logging).
  const { rows: countRows } = await pool.query<{ remaining: string }>(
    `SELECT COUNT(*)::text AS remaining
       FROM musicbrainz.${entity}
      WHERE embedding IS NULL
        AND id >= $1
        AND ($2::bigint IS NULL OR id <= $2)`,
    [opts.minId, opts.maxId],
  );
  console.log(
    `Rows with NULL embedding (id >= ${opts.minId}` +
      (opts.maxId !== null ? `, id <= ${opts.maxId}` : '') +
      `): ${countRows[0].remaining}`,
  );

  const pageSize = opts.batchSize * opts.concurrency;
  const source =
    entity === 'artist'
      ? readArtists(pool, opts.minId, opts.maxId, pageSize)
      : readRecordings(pool, opts.minId, opts.maxId, pageSize);

  const limit = opts.limit;
  const startedAt = Date.now();
  let pageCount = 0;
  let lastId = opts.minId;

  for await (const page of source) {
    if (stopRequested) {
      console.log('  ⏹ stop requested — exiting page loop.');
      return;
    }
    // Track the highest id we've seen for progress reporting.
    if (page.length > 0) {
      lastId = Math.max(lastId, page[page.length - 1].id);
    }

    // Split page into embedding-sized batches and run them concurrently.
    const batches: Array<ArtistSourceRow[] | RecordingSourceRow[]> = [];
    for (let i = 0; i < page.length; i += opts.batchSize) {
      batches.push(
        page.slice(i, i + opts.batchSize) as ArtistSourceRow[] | RecordingSourceRow[],
      );
    }

    const results = await Promise.all(
      batches.map((batch) => processBatch(entity, batch, opts)),
    );

    // Run writes in parallel with bounded concurrency (writeConcurrency).
    // Previously the loop awaited each writeEmbeddings serially, which
    // wasted the parallelism we just paid for on the embedding step. With
    // HNSW vector indexes (see optimize_indexes.sql), per-row insert cost
    // is low enough that several writes can safely overlap.
    let pageEmbedded = 0;
    let pageErrors = 0;
    const writable = results
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => !opts.dryRun && r.embedded.length > 0);

    // Accumulate stats up-front; correct for failed writes below.
    for (const r of results) {
      stats.processed += r.processed;
      stats.skipped += r.skipped;
      stats.errors += r.errors;
      stats.embedded += r.embedded.length;
    }

    const writeLimit = Math.max(1, Math.min(opts.writeConcurrency, writable.length || 1));
    const queue = writable.slice();
    let cursor = 0;
    const next = (): { r: BatchResult } | null => {
      if (cursor >= queue.length) return null;
      const item = queue[cursor];
      cursor += 1;
      return item;
    };
    const worker = async (): Promise<void> => {
      let item = next();
      while (item) {
        const toWrite = item.r.embedded;
        try {
          await writeEmbeddings(pool, entity, toWrite);
          pageEmbedded += toWrite.length;
        } catch (err) {
          console.error(`  ✗ write failed for ${toWrite.length} rows:`, err);
          // Rebalance stats — we counted them as embedded above.
          stats.errors += toWrite.length;
          stats.embedded -= toWrite.length;
          pageErrors += toWrite.length;
        }
        item = next();
      }
    };
    await Promise.all(Array.from({ length: writeLimit }, () => worker()));

    if (opts.dryRun) {
      // dry-run: treat all "embedded" as page-embedded for logging.
      for (const r of results) pageEmbedded += r.embedded.length;
    }

    pageCount += 1;

    const elapsedSec = (Date.now() - startedAt) / 1000;
    const rate = elapsedSec > 0 ? (stats.processed / elapsedSec).toFixed(1) : '∞';
    console.log(
      `  → processed=${stats.processed} embedded=${stats.embedded} ` +
        `skipped=${stats.skipped} errors=${stats.errors} ` +
        `(page: embedded=${pageEmbedded} write-errors=${pageErrors}) ` +
        `rate=${rate}/s elapsed=${elapsedSec.toFixed(1)}s last_id=${lastId}`,
    );

    if (onHeartbeat && pageCount % opts.heartbeatEvery === 0) {
      try {
        await onHeartbeat(lastId);
      } catch (err) {
        console.warn('  ⚠ progress heartbeat failed:', err);
      }
    }

    if (limit !== null && stats.processed >= limit) {
      console.log(`Reached --limit=${limit}, stopping.`);
      return;
    }
  }

  // Final heartbeat so the row reflects the end-of-stream state.
  if (onHeartbeat) {
    try {
      await onHeartbeat(lastId);
    } catch {
      /* non-fatal */
    }
  }
}

interface BatchResult {
  processed: number;
  skipped: number;
  errors: number;
  embedded: Array<{ id: number; embedding: number[] }>;
}

async function processBatch(
  entity: Entity,
  rows: ArtistSourceRow[] | RecordingSourceRow[],
  opts: Options,
): Promise<BatchResult> {
  const result: BatchResult = { processed: 0, skipped: 0, errors: 0, embedded: [] };
  if (rows.length === 0) return result;

  // Compose source texts; skip rows that produce empty text so we don't
  // store meaningless zero-information embeddings.
  const idsToEmbed: number[] = [];
  const textsToEmbed: string[] = [];
  for (const row of rows) {
    result.processed += 1;
    const text =
      entity === 'artist'
        ? composeArtistText(row as ArtistSourceRow)
        : composeRecordingText(row as RecordingSourceRow);
    if (!text.trim()) {
      result.skipped += 1;
      continue;
    }
    idsToEmbed.push(row.id);
    textsToEmbed.push(text);
  }

  if (idsToEmbed.length === 0) return result;
  if (opts.dryRun) {
    if (textsToEmbed[0]) {
      console.log(`  [dry-run] sample text: ${textsToEmbed[0].slice(0, 160)}…`);
    }
    return result;
  }

  try {
    const vectors = await embedBatch(textsToEmbed);
    if (vectors.length !== idsToEmbed.length) {
      throw new Error(
        `embedBatch returned ${vectors.length} vectors for ${idsToEmbed.length} inputs`,
      );
    }
    for (let i = 0; i < idsToEmbed.length; i += 1) {
      const vec = vectors[i];
      if (!vec) {
        throw new Error(`embedBatch returned a missing vector at index ${i}`);
      }
      result.embedded.push({ id: idsToEmbed[i], embedding: vec });
    }
  } catch (err) {
    console.error(`  ✗ embeddings batch failed (${idsToEmbed.length} rows):`, err);
    result.errors += idsToEmbed.length;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Optional vector index drop + rebuild
// ---------------------------------------------------------------------------
//
// Inserting `vector(1536)` rows into a populated vector index is the
// single biggest cost of the backfill. When `--drop-index` is set, we
// drop the partial HNSW/IVFFlat indexes before the run and recreate
// them afterwards (only when no rows remain NULL — partial state is
// pointless to index). Falls back to HNSW where available, else IVFFlat.

async function dropVectorIndexes(pool: pg.Pool, entities: Entity[]): Promise<void> {
  for (const e of entities) {
    assertEntityTable(e);
    console.log(`  Dropping vector index on musicbrainz.${e} (if any)…`);
    await pool.query(`DROP INDEX IF EXISTS musicbrainz.idx_${e}_embedding_hnsw`);
    await pool.query(`DROP INDEX IF EXISTS musicbrainz.idx_${e}_embedding`);
  }
}

async function rebuildVectorIndexes(pool: pg.Pool, entities: Entity[]): Promise<void> {
  for (const e of entities) {
    assertEntityTable(e);
    // Only rebuild when no rows remain NULL — otherwise the index will be
    // immediately invalidated as the next chained run inserts more rows.
    const { rows } = await pool.query<{ pending: string }>(
      `SELECT COUNT(*)::text AS pending
         FROM musicbrainz.${e}
        WHERE embedding IS NULL`,
    );
    const pending = parseInt(rows[0].pending, 10);
    if (pending > 0) {
      console.log(
        `  Skipping vector index rebuild on musicbrainz.${e}: ${pending} rows still NULL.`,
      );
      continue;
    }
    console.log(`  Rebuilding vector index on musicbrainz.${e} (HNSW preferred)…`);
    try {
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_${e}_embedding_hnsw
           ON musicbrainz.${e} USING hnsw (embedding vector_cosine_ops)
           WHERE embedding IS NOT NULL`,
      );
    } catch (err) {
      console.warn(
        `  HNSW unavailable on musicbrainz.${e} (${(err as Error).message}); falling back to IVFFlat.`,
      );
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_${e}_embedding
           ON musicbrainz.${e} USING ivfflat (embedding vector_cosine_ops)
           WITH (lists = 1000) WHERE embedding IS NOT NULL`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  installSignalHandlers();
  const opts = parseArgs(process.argv.slice(2));
  console.log('pgvector embedding backfill');
  console.log(`  run-id           : ${opts.runId}`);
  console.log(`  entities         : ${opts.entities.join(', ')}`);
  console.log(`  batch-size       : ${opts.batchSize}`);
  console.log(`  concurrency      : ${opts.concurrency}`);
  console.log(`  write-concurrency: ${opts.writeConcurrency}`);
  console.log(`  limit            : ${opts.limit ?? '(none)'}`);
  console.log(`  min-id           : ${opts.minId}`);
  console.log(`  max-id           : ${opts.maxId ?? '(none)'}`);
  console.log(`  dry-run          : ${opts.dryRun}`);
  console.log(`  drop-index       : ${opts.dropIndex}`);
  console.log(`  track-progress   : ${opts.trackProgress}`);
  console.log(
    `  deployment       : ${process.env.AZURE_AI_EMBEDDING_DEPLOYMENT || DEFAULT_EMBEDDING_DEPLOYMENT + ' (default)'}`,
  );

  if (!opts.dryRun && !process.env.AZURE_AI_ENDPOINT) {
    throw new Error('AZURE_AI_ENDPOINT must be set unless --dry-run is used.');
  }

  const pool = buildPool();
  const stats: Stats = { processed: 0, embedded: 0, skipped: 0, errors: 0 };

  let trackingActive = false;
  let runStatus: 'completed' | 'cancelled' | 'failed' = 'completed';
  let runMessage: string | undefined;

  try {
    // Set up progress tracking before we do any heavy lifting so that
    // operators can see the run in `musicbrainz.backfill_progress` from
    // the moment it starts.
    if (opts.trackProgress && !opts.dryRun) {
      try {
        await ensureProgressTable(pool);
        await startRun(pool, {
          runId: opts.runId,
          entity: opts.entities.join(','),
          minId: opts.minId,
          maxId: opts.maxId,
          batchSize: opts.batchSize,
          concurrency: opts.concurrency,
        });
        trackingActive = true;
      } catch (err) {
        console.warn(
          `  ⚠ progress tracking disabled (could not init table): ${(err as Error).message}`,
        );
      }
    }

    if (opts.dropIndex && !opts.dryRun) {
      console.log('\nDropping vector indexes before backfill…');
      await dropVectorIndexes(pool, opts.entities);
    }

    for (const entity of opts.entities) {
      if (stopRequested) break;
      await processEntity(pool, entity, opts, stats, async (lastId) => {
        if (trackingActive) {
          await heartbeat(pool, opts.runId, {
            processed: stats.processed,
            embedded: stats.embedded,
            skipped: stats.skipped,
            errors: stats.errors,
            lastId,
          });
        }
      });
    }

    if (stopRequested) {
      runStatus = 'cancelled';
      runMessage = 'SIGTERM/SIGINT received';
    } else if (stats.errors > 0) {
      runStatus = 'failed';
      runMessage = `Completed with ${stats.errors} write/embedding errors`;
    }

    // Rebuild vector index (only if we dropped it and there's nothing left to do)
    if (opts.dropIndex && !opts.dryRun && !stopRequested) {
      console.log('\nRebuilding vector indexes…');
      await rebuildVectorIndexes(pool, opts.entities);
    }

    // Refresh planner stats so the vector index is chosen for queries.
    if (!opts.dryRun && stats.embedded > 0 && !stopRequested) {
      console.log('\nRunning ANALYZE on updated tables…');
      for (const entity of opts.entities) {
        assertEntityTable(entity);
        await pool.query(`ANALYZE musicbrainz.${entity}`);
      }
    }
  } catch (err) {
    runStatus = 'failed';
    runMessage = (err as Error).message;
    if (trackingActive) {
      try {
        await finishRun(pool, opts.runId, 'failed', runMessage);
      } catch {
        /* ignore */
      }
    }
    await pool.end();
    throw err;
  } finally {
    if (trackingActive) {
      try {
        await finishRun(pool, opts.runId, runStatus, runMessage);
      } catch {
        /* ignore */
      }
    }
  }

  await pool.end();

  console.log('\n=== Backfill complete ===');
  console.log(`  run-id    : ${opts.runId}`);
  console.log(`  status    : ${runStatus}`);
  console.log(`  processed : ${stats.processed}`);
  console.log(`  embedded  : ${stats.embedded}`);
  console.log(`  skipped   : ${stats.skipped}`);
  console.log(`  errors    : ${stats.errors}`);
  if (stats.errors > 0 || runStatus === 'failed') process.exitCode = 1;
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
