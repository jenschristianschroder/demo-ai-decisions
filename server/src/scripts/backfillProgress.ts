/**
 * Progress tracking for the embeddings backfill job.
 *
 * Stores one row per job execution in `musicbrainz.backfill_progress`,
 * updated as the job streams through pages. This lets operators query
 * progress (and ETA) at any time, even while the job is running, and
 * lets the job resume cleanly across stop/start cycles.
 *
 * The progress row keys on `run_id` (job execution id from
 * `CONTAINER_APP_JOB_EXECUTION_NAME`, or a generated id locally). Each
 * heartbeat updates `last_heartbeat_at`, `processed`, `embedded`,
 * `errors`, and `last_id` (the highest id observed so far for the
 * current entity).
 */
import pg from 'pg';

export type RunStatus = 'running' | 'completed' | 'cancelled' | 'failed';

const TABLE_DDL = `
CREATE TABLE IF NOT EXISTS musicbrainz.backfill_progress (
  run_id            text PRIMARY KEY,
  entity            text NOT NULL,
  status            text NOT NULL,
  started_at        timestamptz NOT NULL DEFAULT now(),
  finished_at       timestamptz,
  last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
  processed         bigint NOT NULL DEFAULT 0,
  embedded          bigint NOT NULL DEFAULT 0,
  skipped           bigint NOT NULL DEFAULT 0,
  errors            bigint NOT NULL DEFAULT 0,
  last_id           bigint NOT NULL DEFAULT 0,
  min_id            bigint NOT NULL DEFAULT 0,
  max_id            bigint,
  batch_size        int,
  concurrency       int,
  message           text
);

CREATE INDEX IF NOT EXISTS idx_backfill_progress_started_at
  ON musicbrainz.backfill_progress (started_at DESC);
`;

export interface ProgressInit {
  runId: string;
  entity: string;
  minId: number;
  maxId: number | null;
  batchSize: number;
  concurrency: number;
}

export interface ProgressSnapshot {
  processed: number;
  embedded: number;
  skipped: number;
  errors: number;
  lastId: number;
}

/** Create the progress table if it doesn't exist. Safe to call repeatedly. */
export async function ensureProgressTable(pool: pg.Pool): Promise<void> {
  await pool.query(TABLE_DDL);
}

/** Insert (or resume) the row for this execution. */
export async function startRun(pool: pg.Pool, init: ProgressInit): Promise<void> {
  await pool.query(
    `INSERT INTO musicbrainz.backfill_progress
       (run_id, entity, status, started_at, last_heartbeat_at,
        min_id, max_id, batch_size, concurrency)
     VALUES ($1, $2, 'running', now(), now(), $3, $4, $5, $6)
     ON CONFLICT (run_id) DO UPDATE
       SET status            = 'running',
           last_heartbeat_at = now(),
           entity            = EXCLUDED.entity,
           min_id            = EXCLUDED.min_id,
           max_id            = EXCLUDED.max_id,
           batch_size        = EXCLUDED.batch_size,
           concurrency       = EXCLUDED.concurrency,
           finished_at       = NULL,
           message           = NULL`,
    [init.runId, init.entity, init.minId, init.maxId, init.batchSize, init.concurrency],
  );
}

/** Update progress counters + heartbeat. Called once per page. */
export async function heartbeat(
  pool: pg.Pool,
  runId: string,
  snap: ProgressSnapshot,
): Promise<void> {
  await pool.query(
    `UPDATE musicbrainz.backfill_progress
        SET last_heartbeat_at = now(),
            processed         = $2,
            embedded          = $3,
            skipped           = $4,
            errors            = $5,
            last_id           = GREATEST(last_id, $6)
      WHERE run_id = $1`,
    [runId, snap.processed, snap.embedded, snap.skipped, snap.errors, snap.lastId],
  );
}

/** Mark the run as completed/cancelled/failed. */
export async function finishRun(
  pool: pg.Pool,
  runId: string,
  status: RunStatus,
  message?: string,
): Promise<void> {
  await pool.query(
    `UPDATE musicbrainz.backfill_progress
        SET status      = $2,
            finished_at = now(),
            last_heartbeat_at = now(),
            message     = $3
      WHERE run_id = $1`,
    [runId, status, message ?? null],
  );
}
