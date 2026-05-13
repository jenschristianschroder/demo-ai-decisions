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
import pg from 'pg';
import {
  embedBatch,
  toPgVector,
  EMBEDDING_DIM,
  DEFAULT_EMBEDDING_DEPLOYMENT,
} from '../embeddingsClient.js';

const { Pool } = pg;

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

type Entity = 'artist' | 'recording';

interface Options {
  entities: Entity[];
  batchSize: number;
  concurrency: number;
  limit: number | null;
  minId: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    entities: ['artist'],
    batchSize: 64,
    concurrency: 5,
    limit: null,
    minId: 0,
    dryRun: false,
  };
  for (const arg of argv) {
    const [k, v] = arg.startsWith('--') ? arg.slice(2).split('=') : [arg, ''];
    switch (k) {
      case 'entity': {
        if (v === 'all') opts.entities = ['artist', 'recording'];
        else if (v === 'artist' || v === 'recording') opts.entities = [v];
        else throw new Error(`Unknown --entity value: ${v}`);
        break;
      }
      case 'batch-size':
        opts.batchSize = Math.max(1, Math.min(parseInt(v, 10) || 64, 256));
        break;
      case 'concurrency':
        opts.concurrency = Math.max(1, Math.min(parseInt(v, 10) || 5, 20));
        break;
      case 'limit':
        opts.limit = v === '' ? null : parseInt(v, 10);
        if (opts.limit !== null && (Number.isNaN(opts.limit) || opts.limit < 0)) {
          throw new Error(`Invalid --limit: ${v}`);
        }
        break;
      case 'min-id':
        opts.minId = Math.max(0, parseInt(v, 10) || 0);
        break;
      case 'dry-run':
        opts.dryRun = true;
        break;
      case 'help':
      case 'h':
        printHelpAndExit();
        break;
      default:
        if (arg.startsWith('--')) {
          throw new Error(`Unknown option: ${arg}`);
        }
    }
  }
  return opts;
}

function printHelpAndExit(): never {
  console.log(`Backfill pgvector embeddings for MusicBrainz entities.

Options:
  --entity=artist|recording|all  (default: artist)
  --batch-size=N                 (default: 64, max: 256)
  --concurrency=N                (default: 5, max: 20)
  --limit=N                      (default: no limit)
  --min-id=N                     (default: 0)
  --dry-run                      compose source text without calling Azure or writing
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
    max: 4,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });
}

// ---------------------------------------------------------------------------
// Streaming readers
// ---------------------------------------------------------------------------

async function* readArtists(
  pool: pg.Pool,
  startId: number,
  pageSize: number,
): AsyncGenerator<ArtistSourceRow[]> {
  let cursorId = startId;
  // We page by `id` rather than OFFSET so progress is stable and resumable.
  // `LATERAL` aggregates tags per artist so we issue one query per page,
  // not one per row.
  while (true) {
    const { rows } = await pool.query<ArtistSourceRow>(
      `SELECT a.id, a.name, a.comment,
              a.begin_date_year, a.end_date_year,
              at.name AS type_name,
              ar.name AS area_name,
              tg.tags AS tags
       FROM musicbrainz.artist a
       LEFT JOIN musicbrainz.artist_type at ON at.id = a.type
       LEFT JOIN musicbrainz.area ar ON ar.id = a.area
       LEFT JOIN LATERAL (
         SELECT array_agg(DISTINCT lower(t.name) ORDER BY lower(t.name)) AS tags
         FROM musicbrainz.artist_tag atg
         JOIN musicbrainz.tag t ON t.id = atg.tag
         WHERE atg.artist = a.id
           AND atg.count > 0
       ) tg ON true
       WHERE a.embedding IS NULL
         AND a.id >= $1
       ORDER BY a.id
       LIMIT $2`,
      [cursorId, pageSize],
    );
    if (rows.length === 0) return;
    yield rows;
    cursorId = rows[rows.length - 1].id + 1;
  }
}

async function* readRecordings(
  pool: pg.Pool,
  startId: number,
  pageSize: number,
): AsyncGenerator<RecordingSourceRow[]> {
  let cursorId = startId;
  while (true) {
    const { rows } = await pool.query<RecordingSourceRow>(
      `SELECT r.id, r.name, r.comment, r.length,
              ac.name AS artist_credit_name
       FROM musicbrainz.recording r
       LEFT JOIN musicbrainz.artist_credit ac ON ac.id = r.artist_credit
       WHERE r.embedding IS NULL
         AND r.id >= $1
       ORDER BY r.id
       LIMIT $2`,
      [cursorId, pageSize],
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
  // `table` is a hard-coded literal from the Entity union; not user input.
  await pool.query(
    `UPDATE musicbrainz.${table} AS t
        SET embedding = v.embedding::vector
       FROM (SELECT UNNEST($1::int[]) AS id,
                    UNNEST($2::text[]) AS embedding) v
      WHERE t.id = v.id`,
    [ids, vecs],
  );
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
): Promise<void> {
  console.log(`\n=== Backfilling embeddings for musicbrainz.${entity} ===`);

  // Count remaining rows (cheap estimate is fine; this is just for logging).
  // `entity` is constrained to 'artist' | 'recording' by the type system.
  const { rows: countRows } = await pool.query<{ remaining: string }>(
    `SELECT COUNT(*)::text AS remaining
       FROM musicbrainz.${entity}
      WHERE embedding IS NULL AND id >= $1`,
    [opts.minId],
  );
  console.log(`Rows with NULL embedding (id >= ${opts.minId}): ${countRows[0].remaining}`);

  const pageSize = opts.batchSize * opts.concurrency;
  const source =
    entity === 'artist'
      ? readArtists(pool, opts.minId, pageSize)
      : readRecordings(pool, opts.minId, pageSize);

  const limit = opts.limit;
  const startedAt = Date.now();

  for await (const page of source) {
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

    const toWrite: Array<{ id: number; embedding: number[] }> = [];
    for (const r of results) {
      stats.processed += r.processed;
      stats.skipped += r.skipped;
      stats.errors += r.errors;
      for (const item of r.embedded) toWrite.push(item);
    }
    stats.embedded += toWrite.length;

    if (!opts.dryRun) {
      try {
        await writeEmbeddings(pool, entity, toWrite);
      } catch (err) {
        console.error(`  ✗ write failed for ${toWrite.length} rows:`, err);
        stats.errors += toWrite.length;
        stats.embedded -= toWrite.length;
      }
    }

    const elapsedSec = (Date.now() - startedAt) / 1000;
    const rate = elapsedSec > 0 ? (stats.processed / elapsedSec).toFixed(1) : '∞';
    console.log(
      `  → processed=${stats.processed} embedded=${stats.embedded} ` +
        `skipped=${stats.skipped} errors=${stats.errors} ` +
        `rate=${rate}/s elapsed=${elapsedSec.toFixed(1)}s`,
    );

    if (limit !== null && stats.processed >= limit) {
      console.log(`Reached --limit=${limit}, stopping.`);
      return;
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
    for (let i = 0; i < idsToEmbed.length; i += 1) {
      result.embedded.push({ id: idsToEmbed[i], embedding: vectors[i] });
    }
  } catch (err) {
    console.error(`  ✗ embeddings batch failed (${idsToEmbed.length} rows):`, err);
    result.errors += idsToEmbed.length;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  console.log('pgvector embedding backfill');
  console.log(`  entities    : ${opts.entities.join(', ')}`);
  console.log(`  batch-size  : ${opts.batchSize}`);
  console.log(`  concurrency : ${opts.concurrency}`);
  console.log(`  limit       : ${opts.limit ?? '(none)'}`);
  console.log(`  min-id      : ${opts.minId}`);
  console.log(`  dry-run     : ${opts.dryRun}`);
  console.log(
    `  deployment  : ${process.env.AZURE_AI_EMBEDDING_DEPLOYMENT || DEFAULT_EMBEDDING_DEPLOYMENT + ' (default)'}`,
  );

  if (!opts.dryRun && !process.env.AZURE_AI_ENDPOINT) {
    throw new Error('AZURE_AI_ENDPOINT must be set unless --dry-run is used.');
  }

  const pool = buildPool();
  const stats: Stats = { processed: 0, embedded: 0, skipped: 0, errors: 0 };
  try {
    for (const entity of opts.entities) {
      await processEntity(pool, entity, opts, stats);
    }

    // Refresh planner stats so the IVFFlat index is chosen for queries.
    if (!opts.dryRun && stats.embedded > 0) {
      console.log('\nRunning ANALYZE on updated tables…');
      for (const entity of opts.entities) {
        await pool.query(`ANALYZE musicbrainz.${entity}`);
      }
    }
  } finally {
    await pool.end();
  }

  console.log('\n=== Backfill complete ===');
  console.log(`  processed : ${stats.processed}`);
  console.log(`  embedded  : ${stats.embedded}`);
  console.log(`  skipped   : ${stats.skipped}`);
  console.log(`  errors    : ${stats.errors}`);
  if (stats.errors > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
