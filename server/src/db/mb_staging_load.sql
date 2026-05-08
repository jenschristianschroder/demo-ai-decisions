-- ============================================================================
-- MusicBrainz Import — Step 3: Transform staging data into demo schema
-- ============================================================================
-- This script moves data from mb_staging.* tables (loaded from the raw dump)
-- into the musicbrainz.* demo tables, selecting only the columns the demo
-- application uses.
--
-- Prerequisites:
--   1. initSchema.sql has been run (demo tables exist).
--   2. mb_staging_create.sql has been run and data has been loaded via COPY.
--
-- The script:
--   • Disables foreign-key triggers during load for performance.
--   • Truncates demo tables (full refresh).
--   • Inserts the subset of columns from staging into demo tables.
--     – Very large tables (recording, l_artist_recording) are batched in
--       chunks of 500 000 rows using psql \gexec to avoid connection timeouts.
--   • Joins the link table to resolve link_type for relationship tables.
--   • Re-enables triggers.
--   • Drops the staging schema.
--
-- NOTE: Each statement auto-commits independently (no wrapping transaction).
-- This prevents Azure PostgreSQL from terminating long-running connections.
-- If the script fails partway through, re-run it from the beginning.
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

-- recording (batched – table may exceed 30 M rows)
SELECT format(
  'INSERT INTO musicbrainz.recording (id, gid, name, artist_credit, length, comment)
   SELECT id, gid, name, artist_credit, length, COALESCE(comment, '''')
   FROM mb_staging.recording
   WHERE id >= %s AND id < %s',
  gs, gs + 500000
)
FROM generate_series(
  (SELECT min(id) FROM mb_staging.recording),
  (SELECT max(id) FROM mb_staging.recording),
  500000
) gs
\gexec

SELECT setval(pg_get_serial_sequence('musicbrainz.recording', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.recording), 1));

-- release_group
INSERT INTO musicbrainz.release_group (id, gid, name, artist_credit, type, comment)
SELECT id, gid, name, artist_credit, type, COALESCE(comment, '')
FROM mb_staging.release_group;

SELECT setval(pg_get_serial_sequence('musicbrainz.release_group', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.release_group), 1));

-- release (join with release_country and release_label for country/label/date)
INSERT INTO musicbrainz.release (id, gid, name, artist_credit, release_group,
                                  date_year, date_month, date_day, country, label, comment)
SELECT r.id, r.gid, r.name, r.artist_credit, r.release_group,
       rc.date_year, rc.date_month, rc.date_day, rc.country,
       rl.label,
       COALESCE(r.comment, '')
FROM mb_staging.release r
LEFT JOIN LATERAL (
  SELECT country, date_year, date_month, date_day
  FROM mb_staging.release_country
  WHERE release = r.id
  ORDER BY date_year NULLS LAST
  LIMIT 1
) rc ON true
LEFT JOIN LATERAL (
  SELECT label
  FROM mb_staging.release_label
  WHERE release = r.id
  LIMIT 1
) rl ON true;

SELECT setval(pg_get_serial_sequence('musicbrainz.release', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.release), 1));

-- label
INSERT INTO musicbrainz.label (id, gid, name, type, area, begin_date_year, end_date_year, comment)
SELECT id, gid, name, type, area, begin_date_year, end_date_year, COALESCE(comment, '')
FROM mb_staging.label;

SELECT setval(pg_get_serial_sequence('musicbrainz.label', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.label), 1));

-- work
INSERT INTO musicbrainz.work (id, gid, name, type, comment)
SELECT id, gid, name, type, COALESCE(comment, '')
FROM mb_staging.work;

SELECT setval(pg_get_serial_sequence('musicbrainz.work', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.work), 1));

-- ── Load supporting tables ───────────────────────────────────────────────────

-- artist_credit
INSERT INTO musicbrainz.artist_credit (id, name, artist_count)
SELECT id, name, artist_count FROM mb_staging.artist_credit;

SELECT setval(pg_get_serial_sequence('musicbrainz.artist_credit', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.artist_credit), 1));

-- artist_credit_name
INSERT INTO musicbrainz.artist_credit_name (artist_credit, position, artist, name)
SELECT artist_credit, position, artist, name
FROM mb_staging.artist_credit_name;

-- genre
INSERT INTO musicbrainz.genre (id, gid, name)
SELECT id, gid, name FROM mb_staging.genre;

SELECT setval(pg_get_serial_sequence('musicbrainz.genre', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.genre), 1));

-- tag
INSERT INTO musicbrainz.tag (id, name)
SELECT id, name FROM mb_staging.tag;

SELECT setval(pg_get_serial_sequence('musicbrainz.tag', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.tag), 1));

-- artist_tag
INSERT INTO musicbrainz.artist_tag (artist, tag, count)
SELECT artist, tag, count FROM mb_staging.artist_tag;

-- ── Load relationship / link tables ──────────────────────────────────────────

-- link_type
INSERT INTO musicbrainz.link_type (id, gid, name, entity_type0, entity_type1, description)
SELECT id, gid, name, entity_type0, entity_type1, COALESCE(description, '')
FROM mb_staging.link_type;

SELECT setval(pg_get_serial_sequence('musicbrainz.link_type', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.link_type), 1));

-- l_artist_artist  (resolve link → link_type via staging link table)
INSERT INTO musicbrainz.l_artist_artist (id, entity0, entity1, link_type, begin_date_year, end_date_year)
SELECT laa.id, laa.entity0, laa.entity1, l.link_type, l.begin_date_year, l.end_date_year
FROM mb_staging.l_artist_artist laa
JOIN mb_staging.link l ON l.id = laa.link;

SELECT setval(pg_get_serial_sequence('musicbrainz.l_artist_artist', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.l_artist_artist), 1));

-- l_artist_recording (batched – large table with JOIN)
SELECT format(
  'INSERT INTO musicbrainz.l_artist_recording (id, entity0, entity1, link_type)
   SELECT lar.id, lar.entity0, lar.entity1, l.link_type
   FROM mb_staging.l_artist_recording lar
   JOIN mb_staging.link l ON l.id = lar.link
   WHERE lar.id >= %s AND lar.id < %s',
  gs, gs + 500000
)
FROM generate_series(
  (SELECT min(id) FROM mb_staging.l_artist_recording),
  (SELECT max(id) FROM mb_staging.l_artist_recording),
  500000
) gs
\gexec

SELECT setval(pg_get_serial_sequence('musicbrainz.l_artist_recording', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.l_artist_recording), 1));

-- l_artist_release
INSERT INTO musicbrainz.l_artist_release (id, entity0, entity1, link_type)
SELECT lar.id, lar.entity0, lar.entity1, l.link_type
FROM mb_staging.l_artist_release lar
JOIN mb_staging.link l ON l.id = lar.link;

SELECT setval(pg_get_serial_sequence('musicbrainz.l_artist_release', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.l_artist_release), 1));

-- l_artist_work
INSERT INTO musicbrainz.l_artist_work (id, entity0, entity1, link_type)
SELECT law.id, law.entity0, law.entity1, l.link_type
FROM mb_staging.l_artist_work law
JOIN mb_staging.link l ON l.id = law.link;

SELECT setval(pg_get_serial_sequence('musicbrainz.l_artist_work', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.l_artist_work), 1));

-- ── Re-enable triggers ──────────────────────────────────────────────────────
SET session_replication_role = 'origin';

-- ── Drop staging schema ─────────────────────────────────────────────────────
DROP SCHEMA mb_staging CASCADE;
