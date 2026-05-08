-- ============================================================================
-- MusicBrainz Import — Transform Part 1: Setup & core entity tables
-- ============================================================================
-- Truncates demo tables and loads artist, artist_type, area from staging.
-- Recording is handled externally via batched shell loop.
--
-- Must be run BEFORE the recording batch loop and mb_staging_load_tables.sql.
-- ============================================================================

-- ── Session-level settings to prevent timeouts ──────────────────────────────
SET statement_timeout = 0;
SET lock_timeout = 0;

-- ── Temporarily disable triggers (foreign keys) for bulk load ────────────────
SET session_replication_role = 'replica';

-- ── Clear existing data (full refresh) ───────────────────────────────────────
TRUNCATE musicbrainz.l_artist_work,
         musicbrainz.l_artist_release,
         musicbrainz.l_artist_recording,
         musicbrainz.l_artist_artist,
         musicbrainz.link_type,
         musicbrainz.artist_tag,
         musicbrainz.artist_credit_name,
         musicbrainz.artist_credit,
         musicbrainz.genre,
         musicbrainz.tag,
         musicbrainz.work,
         musicbrainz.label,
         musicbrainz.release,
         musicbrainz.release_group,
         musicbrainz.recording,
         musicbrainz.area,
         musicbrainz.artist_type,
         musicbrainz.artist
CASCADE;

-- ── Load core entity tables ──────────────────────────────────────────────────

-- artist
INSERT INTO musicbrainz.artist (id, gid, name, sort_name, type, area, begin_date_year, end_date_year, comment)
SELECT id, gid, name, sort_name, type, area, begin_date_year, end_date_year, COALESCE(comment, '')
FROM mb_staging.artist;

-- Reset sequence
SELECT setval(pg_get_serial_sequence('musicbrainz.artist', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.artist), 1));

-- artist_type
INSERT INTO musicbrainz.artist_type (id, name)
SELECT id, name FROM mb_staging.artist_type
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval(pg_get_serial_sequence('musicbrainz.artist_type', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.artist_type), 1));

-- area
INSERT INTO musicbrainz.area (id, gid, name, type)
SELECT id, gid, name, type FROM mb_staging.area;

SELECT setval(pg_get_serial_sequence('musicbrainz.area', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.area), 1));
