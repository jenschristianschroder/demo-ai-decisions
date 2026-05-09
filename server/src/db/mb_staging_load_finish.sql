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
INSERT INTO musicbrainz.l_artist_release (id, link, entity0, entity1, edits_pending, link_order, entity0_credit, entity1_credit)
SELECT id, link, entity0, entity1, COALESCE(edits_pending, 0), COALESCE(link_order, 0),
       COALESCE(entity0_credit, ''), COALESCE(entity1_credit, '')
FROM mb_staging.l_artist_release;

SELECT setval(pg_get_serial_sequence('musicbrainz.l_artist_release', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.l_artist_release), 1));

-- l_artist_work
INSERT INTO musicbrainz.l_artist_work (id, link, entity0, entity1, edits_pending, link_order, entity0_credit, entity1_credit)
SELECT id, link, entity0, entity1, COALESCE(edits_pending, 0), COALESCE(link_order, 0),
       COALESCE(entity0_credit, ''), COALESCE(entity1_credit, '')
FROM mb_staging.l_artist_work;

SELECT setval(pg_get_serial_sequence('musicbrainz.l_artist_work', 'id'),
              COALESCE((SELECT MAX(id) FROM musicbrainz.l_artist_work), 1));

-- ── Re-enable triggers ──────────────────────────────────────────────────────
SET session_replication_role = 'origin';

-- ── Drop staging schema ─────────────────────────────────────────────────────
DROP SCHEMA mb_staging CASCADE;
