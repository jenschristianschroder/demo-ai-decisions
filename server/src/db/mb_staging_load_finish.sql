-- ============================================================================
-- MusicBrainz Import — Transform Part 3: Final link tables & cleanup
-- ============================================================================
-- Resets l_artist_recording sequence, loads remaining link tables,
-- re-enables triggers, and drops the staging schema.
-- Run AFTER the l_artist_recording batch loop completes.
-- ============================================================================

-- ── Session-level settings to prevent timeouts ──────────────────────────────
SET statement_timeout = 0;
SET lock_timeout = 0;

-- ── Disable triggers for bulk load ──────────────────────────────────────────
SET session_replication_role = 'replica';

-- ── Reset l_artist_recording sequence (data loaded by shell loop) ───────────
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
