-- ============================================================================
-- MusicBrainz Import — Transform Part 2: Remaining entity & supporting tables
-- ============================================================================
-- Loads release_group through artist_tag, plus link_type and l_artist_artist.
-- Run AFTER the recording batch loop completes.
-- l_artist_recording is handled externally via batched shell loop.
-- ============================================================================

-- ── Session-level settings to prevent timeouts ──────────────────────────────
SET statement_timeout = 0;
SET lock_timeout = 0;

-- ── Disable triggers for bulk load ──────────────────────────────────────────
SET session_replication_role = 'replica';

-- ── Reset recording sequence (recording data loaded by shell loop) ──────────
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
