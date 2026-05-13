-- ============================================================================
-- MusicBrainz Knowledge Graph — PostgreSQL + Apache AGE + pgvector
-- ============================================================================
-- This script initialises the musicbrainz database with:
--   1. Required extensions (age, vector)
--   2. Core MusicBrainz relational tables (subset)
--   3. Apache AGE graph for relationship traversal
--   4. pgvector columns for semantic search
--
-- The MusicBrainz database dump can be loaded from:
--   https://musicbrainz.org/doc/MusicBrainz_Database/Download
--
-- After loading the full dump, run this script to add AGE graph and vector
-- columns on top of the existing data.
-- ============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS age;
CREATE EXTENSION IF NOT EXISTS vector;
-- pg_trgm and unaccent are required for the diacritic-insensitive trigram
-- search used by `pgClient.ts::searchArtists` and friends. They must also be
-- in the Azure extension allow-list (see import-musicbrainz.yml).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Load AGE into the search path so Cypher functions are available
SET search_path = ag_catalog, "$user", public;

-- ── Core MusicBrainz tables (created only if not already present) ────────────
-- These match the MusicBrainz schema subset used by the demo.
-- If you load the full MusicBrainz dump these tables will already exist.

CREATE SCHEMA IF NOT EXISTS musicbrainz;

CREATE TABLE IF NOT EXISTS musicbrainz.artist (
  id          SERIAL PRIMARY KEY,
  gid         UUID NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  sort_name   TEXT NOT NULL,
  type        INT,                -- 1=Person, 2=Group, 5=Orchestra, 6=Choir
  area        INT,
  begin_date_year  INT,
  end_date_year    INT,
  comment     TEXT DEFAULT '',
  embedding   vector(1536)        -- pgvector: artist description embedding
);

CREATE TABLE IF NOT EXISTS musicbrainz.artist_type (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL
);

-- Seed artist types if empty
INSERT INTO musicbrainz.artist_type (id, name)
VALUES (1, 'Person'), (2, 'Group'), (3, 'Other'), (5, 'Orchestra'), (6, 'Choir')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS musicbrainz.area (
  id    SERIAL PRIMARY KEY,
  gid   UUID NOT NULL UNIQUE,
  name  TEXT NOT NULL,
  type  INT   -- 1=Country, 2=Subdivision, 3=City
);

CREATE TABLE IF NOT EXISTS musicbrainz.recording (
  id          SERIAL PRIMARY KEY,
  gid         UUID NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  artist_credit INT,
  length      INT,          -- duration in milliseconds
  comment     TEXT DEFAULT '',
  embedding   vector(1536)
);

CREATE TABLE IF NOT EXISTS musicbrainz.release_group (
  id          SERIAL PRIMARY KEY,
  gid         UUID NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  artist_credit INT,
  type        INT,          -- 1=Album, 2=Single, 3=EP, 11=Compilation
  comment     TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS musicbrainz.release (
  id              SERIAL PRIMARY KEY,
  gid             UUID NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  artist_credit   INT,
  release_group   INT REFERENCES musicbrainz.release_group(id),
  status          INT,
  packaging       INT,
  language        INT,
  script          INT,
  barcode         TEXT,
  comment         TEXT DEFAULT '',
  edits_pending   INT NOT NULL DEFAULT 0,
  quality         SMALLINT NOT NULL DEFAULT -1,
  last_updated    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS musicbrainz.release_country (
  release         INT NOT NULL,
  country         INT NOT NULL,
  date_year       SMALLINT,
  date_month      SMALLINT,
  date_day        SMALLINT,
  PRIMARY KEY (release, country)
);

CREATE TABLE IF NOT EXISTS musicbrainz.release_label (
  id              SERIAL PRIMARY KEY,
  release         INT NOT NULL,
  label           INT,
  catalog_number  TEXT,
  last_updated    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS musicbrainz.label (
  id          SERIAL PRIMARY KEY,
  gid         UUID NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  type        INT,
  area        INT,
  begin_date_year  INT,
  end_date_year    INT,
  comment     TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS musicbrainz.work (
  id          SERIAL PRIMARY KEY,
  gid         UUID NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  type        INT,
  comment     TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS musicbrainz.artist_credit (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  artist_count INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS musicbrainz.artist_credit_name (
  artist_credit INT NOT NULL,
  position      INT NOT NULL DEFAULT 0,
  artist        INT NOT NULL REFERENCES musicbrainz.artist(id),
  name          TEXT NOT NULL,
  PRIMARY KEY (artist_credit, position)
);

CREATE TABLE IF NOT EXISTS musicbrainz.genre (
  id    SERIAL PRIMARY KEY,
  gid   UUID NOT NULL UNIQUE,
  name  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS musicbrainz.artist_tag (
  artist  INT NOT NULL REFERENCES musicbrainz.artist(id),
  tag     INT NOT NULL,
  count   INT NOT NULL DEFAULT 0,
  PRIMARY KEY (artist, tag)
);

CREATE TABLE IF NOT EXISTS musicbrainz.tag (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL
);

-- Relationship link table (connects l_* tables to link_type)
CREATE TABLE IF NOT EXISTS musicbrainz.link (
  id              SERIAL PRIMARY KEY,
  link_type       INT NOT NULL,
  begin_date_year SMALLINT,
  begin_date_month SMALLINT,
  begin_date_day  SMALLINT,
  end_date_year   SMALLINT,
  end_date_month  SMALLINT,
  end_date_day    SMALLINT,
  attribute_count INT NOT NULL DEFAULT 0,
  created         TIMESTAMPTZ DEFAULT NOW(),
  ended           BOOLEAN NOT NULL DEFAULT FALSE
);

-- Relationship tables (link types between entities)
CREATE TABLE IF NOT EXISTS musicbrainz.l_artist_artist (
  id        SERIAL PRIMARY KEY,
  link      INT NOT NULL REFERENCES musicbrainz.link(id),
  entity0   INT NOT NULL REFERENCES musicbrainz.artist(id),
  entity1   INT NOT NULL REFERENCES musicbrainz.artist(id),
  edits_pending INT NOT NULL DEFAULT 0,
  last_updated  TIMESTAMPTZ DEFAULT NOW(),
  link_order    INT NOT NULL DEFAULT 0,
  entity0_credit TEXT NOT NULL DEFAULT '',
  entity1_credit TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS musicbrainz.l_artist_recording (
  id        SERIAL PRIMARY KEY,
  link      INT NOT NULL REFERENCES musicbrainz.link(id),
  entity0   INT NOT NULL REFERENCES musicbrainz.artist(id),
  entity1   INT NOT NULL REFERENCES musicbrainz.recording(id),
  edits_pending INT NOT NULL DEFAULT 0,
  last_updated  TIMESTAMPTZ DEFAULT NOW(),
  link_order    INT NOT NULL DEFAULT 0,
  entity0_credit TEXT NOT NULL DEFAULT '',
  entity1_credit TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS musicbrainz.l_artist_release (
  id        SERIAL PRIMARY KEY,
  link      INT NOT NULL REFERENCES musicbrainz.link(id),
  entity0   INT NOT NULL REFERENCES musicbrainz.artist(id),
  entity1   INT NOT NULL,
  edits_pending INT NOT NULL DEFAULT 0,
  last_updated  TIMESTAMPTZ DEFAULT NOW(),
  link_order    INT NOT NULL DEFAULT 0,
  entity0_credit TEXT NOT NULL DEFAULT '',
  entity1_credit TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS musicbrainz.l_artist_work (
  id        SERIAL PRIMARY KEY,
  link      INT NOT NULL REFERENCES musicbrainz.link(id),
  entity0   INT NOT NULL REFERENCES musicbrainz.artist(id),
  entity1   INT NOT NULL REFERENCES musicbrainz.work(id),
  edits_pending INT NOT NULL DEFAULT 0,
  last_updated  TIMESTAMPTZ DEFAULT NOW(),
  link_order    INT NOT NULL DEFAULT 0,
  entity0_credit TEXT NOT NULL DEFAULT '',
  entity1_credit TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS musicbrainz.link_type (
  id          SERIAL PRIMARY KEY,
  gid         UUID NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  entity_type0 TEXT NOT NULL,
  entity_type1 TEXT NOT NULL,
  description TEXT DEFAULT ''
);

-- ── Indexes for vector similarity search ─────────────────────────────────────
-- Indexes are PARTIAL so they don't waste space on rows where the embedding
-- has not yet been populated. The optimize_indexes.sql script will swap
-- these for HNSW indexes when pgvector supports it (better recall).

CREATE INDEX IF NOT EXISTS idx_artist_embedding
  ON musicbrainz.artist USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100)
  WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recording_embedding
  ON musicbrainz.recording USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100)
  WHERE embedding IS NOT NULL;

-- ── Apache AGE graph ─────────────────────────────────────────────────────────
-- Create the music knowledge graph. Vertices and edges are populated from
-- the relational tables via the sync functions below.

SELECT * FROM ag_catalog.create_graph('music_graph')
WHERE NOT EXISTS (
  SELECT 1 FROM ag_catalog.ag_graph WHERE name = 'music_graph'
);

-- ── Helper function: sync relational data into AGE graph ─────────────────────
-- Call this after loading MusicBrainz data to populate the graph.

CREATE OR REPLACE FUNCTION musicbrainz.sync_graph()
RETURNS void
LANGUAGE plpgsql
AS $func$
DECLARE
  r RECORD;
BEGIN
  -- Create Artist vertices
  FOR r IN SELECT gid, name, type, area FROM musicbrainz.artist LOOP
    EXECUTE format(
      $cypher$SELECT * FROM cypher('music_graph', $$ CREATE (:Artist {gid: %L, name: %L, type: %s, area: %s}) $$) AS (v agtype)$cypher$,
      r.gid, r.name, COALESCE(r.type, 0), COALESCE(r.area, 0)
    );
  END LOOP;

  -- Create Label vertices
  FOR r IN SELECT gid, name, type, area FROM musicbrainz.label LOOP
    EXECUTE format(
      $cypher$SELECT * FROM cypher('music_graph', $$ CREATE (:Label {gid: %L, name: %L, type: %s, area: %s}) $$) AS (v agtype)$cypher$,
      r.gid, r.name, COALESCE(r.type, 0), COALESCE(r.area, 0)
    );
  END LOOP;

  -- Create Recording vertices
  FOR r IN SELECT gid, name FROM musicbrainz.recording LIMIT 50000 LOOP
    EXECUTE format(
      $cypher$SELECT * FROM cypher('music_graph', $$ CREATE (:Recording {gid: %L, name: %L}) $$) AS (v agtype)$cypher$,
      r.gid, r.name
    );
  END LOOP;

  -- Create COLLABORATED_WITH edges from l_artist_artist
  FOR r IN
    SELECT a1.gid AS gid1, a2.gid AS gid2, lt.name AS link_name
    FROM musicbrainz.l_artist_artist laa
    JOIN musicbrainz.link lk ON lk.id = laa.link
    JOIN musicbrainz.artist a1 ON a1.id = laa.entity0
    JOIN musicbrainz.artist a2 ON a2.id = laa.entity1
    LEFT JOIN musicbrainz.link_type lt ON lt.id = lk.link_type
  LOOP
    EXECUTE format(
      $cypher$SELECT * FROM cypher('music_graph', $$
        MATCH (a:Artist {gid: %L}), (b:Artist {gid: %L})
        CREATE (a)-[:COLLABORATED_WITH {type: %L}]->(b)
      $$) AS (e agtype)$cypher$,
      r.gid1, r.gid2, COALESCE(r.link_name, 'associated')
    );
  END LOOP;

  -- Create PERFORMED edges from l_artist_recording
  FOR r IN
    SELECT a.gid AS artist_gid, rec.gid AS recording_gid
    FROM musicbrainz.l_artist_recording lar
    JOIN musicbrainz.link lk ON lk.id = lar.link
    JOIN musicbrainz.artist a ON a.id = lar.entity0
    JOIN musicbrainz.recording rec ON rec.id = lar.entity1
    LIMIT 100000
  LOOP
    EXECUTE format(
      $cypher$SELECT * FROM cypher('music_graph', $$
        MATCH (a:Artist {gid: %L}), (r:Recording {gid: %L})
        CREATE (a)-[:PERFORMED]->(r)
      $$) AS (e agtype)$cypher$,
      r.artist_gid, r.recording_gid
    );
  END LOOP;

  RAISE NOTICE 'Music graph sync complete';
END;
$func$;

-- ── Helper function: vector search for similar artists ───────────────────────

CREATE OR REPLACE FUNCTION musicbrainz.search_similar_artists(
  query_embedding vector(1536),
  max_results INT DEFAULT 10
)
RETURNS TABLE(gid UUID, name TEXT, similarity FLOAT)
LANGUAGE sql STABLE
AS $$
  SELECT a.gid, a.name,
         1 - (a.embedding <=> query_embedding) AS similarity
  FROM musicbrainz.artist a
  WHERE a.embedding IS NOT NULL
  ORDER BY a.embedding <=> query_embedding
  LIMIT max_results;
$$;

-- ── Helper function: vector search for similar recordings ────────────────────

CREATE OR REPLACE FUNCTION musicbrainz.search_similar_recordings(
  query_embedding vector(1536),
  max_results INT DEFAULT 10
)
RETURNS TABLE(gid UUID, name TEXT, similarity FLOAT)
LANGUAGE sql STABLE
AS $$
  SELECT r.gid, r.name,
         1 - (r.embedding <=> query_embedding) AS similarity
  FROM musicbrainz.recording r
  WHERE r.embedding IS NOT NULL
  ORDER BY r.embedding <=> query_embedding
  LIMIT max_results;
$$;
