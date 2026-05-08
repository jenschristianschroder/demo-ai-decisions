-- ============================================================================
-- MusicBrainz Import — Transform Part 1: Setup & core entity tables
-- ============================================================================
-- Loads artist, artist_type, area from staging using idempotent upserts.
-- Recording is handled externally via batched shell loop.
--
-- All inserts use ON CONFLICT … DO UPDATE / DO NOTHING so the workflow is
-- **resumable** — a re-run after a mid-import failure picks up where it left
-- off instead of starting from scratch.
--
-- Must be run BEFORE the recording batch loop and mb_staging_load_tables.sql.
-- ============================================================================

-- ── Session-level settings to prevent timeouts ──────────────────────────────
SET statement_timeout = 0;
SET lock_timeout = 0;

-- ── Temporarily disable triggers (foreign keys) for bulk load ────────────────
SET session_replication_role = 'replica';

-- NOTE: We deliberately do NOT truncate tables here.  Every INSERT uses
-- ON CONFLICT … DO UPDATE (or DO NOTHING) so rows that already exist from a
-- previous partial run are simply skipped or refreshed.  This makes the
-- entire import idempotent and resumable.

-- ── Load core entity tables ──────────────────────────────────────────────────

-- artist (upsert — full refresh of every column)
INSERT INTO musicbrainz.artist (id, gid, name, sort_name, type, area, begin_date_year, end_date_year, comment)
SELECT id, gid, name, sort_name, type, area, begin_date_year, end_date_year, COALESCE(comment, '')
FROM mb_staging.artist
ON CONFLICT (id) DO UPDATE SET
  gid             = EXCLUDED.gid,
  name            = EXCLUDED.name,
  sort_name       = EXCLUDED.sort_name,
  type            = EXCLUDED.type,
  area            = EXCLUDED.area,
  begin_date_year = EXCLUDED.begin_date_year,
  end_date_year   = EXCLUDED.end_date_year,
  comment         = EXCLUDED.comment;

-- Reset sequence
SELECT setval(pg_get_serial_sequence('musicbrainz.artist', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.artist), 1));

-- artist_type
INSERT INTO musicbrainz.artist_type (id, name)
SELECT id, name FROM mb_staging.artist_type
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval(pg_get_serial_sequence('musicbrainz.artist_type', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.artist_type), 1));

-- area (upsert)
INSERT INTO musicbrainz.area (id, gid, name, type)
SELECT id, gid, name, type FROM mb_staging.area
ON CONFLICT (id) DO UPDATE SET
  gid  = EXCLUDED.gid,
  name = EXCLUDED.name,
  type = EXCLUDED.type;

SELECT setval(pg_get_serial_sequence('musicbrainz.area', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.area), 1));
