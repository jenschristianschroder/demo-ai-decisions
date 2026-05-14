-- ============================================================================
-- MusicBrainz query optimization — extensions, indexes, statistics
-- ============================================================================
-- This script is **idempotent** and can be run against an existing populated
-- database WITHOUT re-importing the MusicBrainz dump. It adds the indexes,
-- extensions, helper functions, and statistics required for the accuracy and
-- performance fixes in `pgClient.ts`.
--
-- All indexes use `CREATE INDEX CONCURRENTLY IF NOT EXISTS` so the database
-- remains queryable during the build.
--
-- IMPORTANT: This file must NOT be wrapped in BEGIN/COMMIT — psql will run
-- each statement in its own implicit transaction, which is what
-- `CREATE INDEX CONCURRENTLY` requires.
--
-- Usage (standalone):
--   psql "$CONN" -v ON_ERROR_STOP=0 -f server/src/db/optimize_indexes.sql
--
-- Note: ON_ERROR_STOP=0 is used because a single failing CONCURRENTLY index
-- (e.g. a temporary deadlock with autovacuum) leaves an INVALID index that
-- can simply be re-run; we don't want one such failure to abort the rest.
-- ============================================================================

-- ── 1. Extensions ──────────────────────────────────────────────────────────
-- pg_trgm:  trigram operators for fast ILIKE/similarity search
-- unaccent: removes diacritics for diacritic-insensitive matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ── 2. Immutable unaccent wrapper ──────────────────────────────────────────
-- The built-in `unaccent(text)` is marked STABLE (the dictionary can change),
-- so PostgreSQL refuses to use it in expression indexes. The standard
-- workaround is a thin IMMUTABLE wrapper. We accept the (theoretical) risk
-- that the unaccent dictionary changes and pin the function explicitly.
CREATE OR REPLACE FUNCTION musicbrainz.immutable_unaccent(text)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
AS $func$ SELECT public.unaccent('public.unaccent', $1) $func$;

-- ── 3. Artist search indexes ───────────────────────────────────────────────
-- Equality lookups go through the LOWER(unaccent(...)) btree index;
-- fuzzy / ILIKE lookups go through the trigram GIN indexes.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artist_lower_unaccent_name
  ON musicbrainz.artist (LOWER(musicbrainz.immutable_unaccent(name)));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artist_lower_unaccent_sort_name
  ON musicbrainz.artist (LOWER(musicbrainz.immutable_unaccent(sort_name)));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artist_name_trgm
  ON musicbrainz.artist
  USING gin (musicbrainz.immutable_unaccent(name) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artist_sort_name_trgm
  ON musicbrainz.artist
  USING gin (musicbrainz.immutable_unaccent(sort_name) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artist_area
  ON musicbrainz.artist (area);

-- ── 4. Area / Label search ─────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_area_name_trgm
  ON musicbrainz.area
  USING gin (musicbrainz.immutable_unaccent(name) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_area_type
  ON musicbrainz.area (type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_label_area
  ON musicbrainz.label (area);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_label_name_trgm
  ON musicbrainz.label
  USING gin (musicbrainz.immutable_unaccent(name) gin_trgm_ops);

-- ── 5. Artist credits → recordings / releases ──────────────────────────────
-- The CTE pattern used in getArtistRecordings/getArtistReleases needs:
--   artist_credit_name(artist)     — find credits for an artist
--   recording(artist_credit)       — find recordings for those credits
--   release(artist_credit)         — find releases for those credits
--   release(release_group)         — group releases by album
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artist_credit_name_artist
  ON musicbrainz.artist_credit_name (artist);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recording_artist_credit
  ON musicbrainz.recording (artist_credit);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_release_artist_credit
  ON musicbrainz.release (artist_credit);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_release_release_group
  ON musicbrainz.release (release_group);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_release_group_artist_credit
  ON musicbrainz.release_group (artist_credit);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_release_status
  ON musicbrainz.release (status);

-- ── 6. release_country / release_label ─────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_release_country_release
  ON musicbrainz.release_country (release);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_release_country_country
  ON musicbrainz.release_country (country);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_release_label_release
  ON musicbrainz.release_label (release);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_release_label_label
  ON musicbrainz.release_label (label);

-- ── 7. Relationship (link) tables ──────────────────────────────────────────
-- Each l_* table needs btree indexes on the FKs we join through.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_laa_entity0
  ON musicbrainz.l_artist_artist (entity0);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_laa_entity1
  ON musicbrainz.l_artist_artist (entity1);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_laa_link
  ON musicbrainz.l_artist_artist (link);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lar_entity0
  ON musicbrainz.l_artist_recording (entity0);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lar_entity1
  ON musicbrainz.l_artist_recording (entity1);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lar_link
  ON musicbrainz.l_artist_recording (link);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lre_entity0
  ON musicbrainz.l_artist_release (entity0);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lre_entity1
  ON musicbrainz.l_artist_release (entity1);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lre_link
  ON musicbrainz.l_artist_release (link);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lw_entity0
  ON musicbrainz.l_artist_work (entity0);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lw_entity1
  ON musicbrainz.l_artist_work (entity1);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lw_link
  ON musicbrainz.l_artist_work (link);

-- link is joined to from every l_* row to resolve link_type.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_link_link_type
  ON musicbrainz.link (link_type);

-- link_type.gid is used as the stable canonical identifier for filters
-- like the "member of band" relationship. Already UNIQUE, but make sure.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_link_type_gid
  ON musicbrainz.link_type (gid);

-- ── 8. Tags / genres ───────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artist_tag_artist
  ON musicbrainz.artist_tag (artist);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artist_tag_tag
  ON musicbrainz.artist_tag (tag);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_genre_lower_name
  ON musicbrainz.genre (LOWER(name));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tag_lower_name
  ON musicbrainz.tag (LOWER(name));

-- ── 9. Vector indexes — switch ivfflat → HNSW (partial) ────────────────────
-- HNSW (pgvector >= 0.5.0) has much higher recall than ivfflat at the same
-- query cost and doesn't need a training step. Falls back to ivfflat when
-- HNSW isn't available. Indexes are PARTIAL (WHERE embedding IS NOT NULL)
-- so they don't waste space on the many rows that have no embedding.
DO $do$
BEGIN
  -- Drop the old non-partial ivfflat indexes (no-op if absent).
  EXECUTE 'DROP INDEX IF EXISTS musicbrainz.idx_artist_embedding';
  EXECUTE 'DROP INDEX IF EXISTS musicbrainz.idx_recording_embedding';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping vector index drop: %', SQLERRM;
END
$do$;

DO $do$
BEGIN
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_artist_embedding_hnsw '
       || 'ON musicbrainz.artist USING hnsw (embedding vector_cosine_ops) '
       || 'WHERE embedding IS NOT NULL';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_recording_embedding_hnsw '
       || 'ON musicbrainz.recording USING hnsw (embedding vector_cosine_ops) '
       || 'WHERE embedding IS NOT NULL';
  RAISE NOTICE 'HNSW vector indexes created';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'HNSW unavailable (%); falling back to partial ivfflat', SQLERRM;
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_artist_embedding '
       || 'ON musicbrainz.artist USING ivfflat (embedding vector_cosine_ops) '
       || 'WITH (lists = 1000) WHERE embedding IS NOT NULL';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_recording_embedding '
       || 'ON musicbrainz.recording USING ivfflat (embedding vector_cosine_ops) '
       || 'WITH (lists = 1000) WHERE embedding IS NOT NULL';
END
$do$;

-- ── 9b. Backfill helper indexes ────────────────────────────────────────────
-- The embedding backfill paginates with
--     WHERE embedding IS NULL AND id >= $1 ORDER BY id LIMIT $2
-- As rows get embedded, the artist_pkey index walk has to skip ever-larger
-- prefixes of already-embedded rows, each requiring a heap fetch to check
-- the (large) `embedding` column. On Azure remote storage that walk can
-- easily stall the workflow for tens of minutes. A partial index keyed on
-- `id` and filtered on `embedding IS NULL` makes "find the next N NULL ids
-- in order" O(log N): rows are automatically removed from the index as
-- they get backfilled, so the index stays small and shrinks to zero when
-- the backfill is complete.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artist_embedding_null
  ON musicbrainz.artist (id) WHERE embedding IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recording_embedding_null
  ON musicbrainz.recording (id) WHERE embedding IS NULL;

-- ── 10. Artist popularity materialized view ────────────────────────────────
-- Used as a tie-breaker in searchArtists ranking so that "Beatles" returns
-- the canonical artist before tribute bands. Refresh after large data loads
-- with:   REFRESH MATERIALIZED VIEW CONCURRENTLY musicbrainz.artist_popularity;
CREATE MATERIALIZED VIEW IF NOT EXISTS musicbrainz.artist_popularity AS
  SELECT a.id AS artist_id,
         COALESCE(c.cnt, 0) AS credit_count
  FROM musicbrainz.artist a
  LEFT JOIN (
    SELECT artist, COUNT(*) AS cnt
    FROM musicbrainz.artist_credit_name
    GROUP BY artist
  ) c ON c.artist = a.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_artist_popularity_artist
  ON musicbrainz.artist_popularity (artist_id);

CREATE INDEX IF NOT EXISTS idx_artist_popularity_count
  ON musicbrainz.artist_popularity (credit_count DESC);

-- Refresh the materialized view so it reflects any data already loaded.
-- We use a plain (non-CONCURRENTLY) refresh because CONCURRENTLY cannot
-- run inside a transaction block (and psql's DO block is a transaction).
-- Subsequent refreshes — e.g. after an incremental data load — can use
--   REFRESH MATERIALIZED VIEW CONCURRENTLY musicbrainz.artist_popularity;
-- as a standalone statement.
REFRESH MATERIALIZED VIEW musicbrainz.artist_popularity;

-- ── 11. Update planner statistics ──────────────────────────────────────────
-- The import workflow bulk-loads with triggers disabled, so autovacuum has
-- to catch up. Force ANALYZE on the tables most queries touch so the
-- planner picks index scans instead of sequential scans.
ANALYZE musicbrainz.artist;
ANALYZE musicbrainz.artist_credit;
ANALYZE musicbrainz.artist_credit_name;
ANALYZE musicbrainz.recording;
ANALYZE musicbrainz.release;
ANALYZE musicbrainz.release_group;
ANALYZE musicbrainz.release_country;
ANALYZE musicbrainz.release_label;
ANALYZE musicbrainz.l_artist_artist;
ANALYZE musicbrainz.l_artist_recording;
ANALYZE musicbrainz.l_artist_release;
ANALYZE musicbrainz.l_artist_work;
ANALYZE musicbrainz.link;
ANALYZE musicbrainz.link_type;
ANALYZE musicbrainz.area;
ANALYZE musicbrainz.label;
ANALYZE musicbrainz.artist_tag;
ANALYZE musicbrainz.tag;
ANALYZE musicbrainz.genre;
ANALYZE musicbrainz.artist_popularity;
