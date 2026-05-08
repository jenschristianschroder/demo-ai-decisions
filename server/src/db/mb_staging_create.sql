-- ============================================================================
-- MusicBrainz Import — Step 1: Create staging tables
-- ============================================================================
-- These tables mirror the exact column order of the MusicBrainz full-export
-- dump files so that raw tab-separated data can be loaded with COPY FROM STDIN.
--
-- After loading, run the transform steps — see import-musicbrainz.yml workflow.
-- ============================================================================

DROP SCHEMA IF EXISTS mb_staging CASCADE;
CREATE SCHEMA mb_staging;

-- ── artist ───────────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.artist (
    id                  INTEGER,
    gid                 UUID,
    name                TEXT,
    sort_name           TEXT,
    begin_date_year     SMALLINT,
    begin_date_month    SMALLINT,
    begin_date_day      SMALLINT,
    end_date_year       SMALLINT,
    end_date_month      SMALLINT,
    end_date_day        SMALLINT,
    type                INTEGER,
    area                INTEGER,
    gender              INTEGER,
    comment             TEXT,
    edits_pending       INTEGER,
    last_updated        TEXT,
    ended               TEXT,
    begin_area          INTEGER,
    end_area            INTEGER
);

-- ── artist_type ──────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.artist_type (
    id                  INTEGER,
    name                TEXT,
    parent              INTEGER,
    child_order         INTEGER,
    description         TEXT,
    gid                 UUID
);

-- ── area ─────────────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.area (
    id                  INTEGER,
    gid                 UUID,
    name                TEXT,
    type                INTEGER,
    edits_pending       INTEGER,
    last_updated        TEXT,
    begin_date_year     SMALLINT,
    begin_date_month    SMALLINT,
    begin_date_day      SMALLINT,
    end_date_year       SMALLINT,
    end_date_month      SMALLINT,
    end_date_day        SMALLINT,
    ended               TEXT,
    comment             TEXT
);

-- ── recording ────────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.recording (
    id                  INTEGER,
    gid                 UUID,
    name                TEXT,
    artist_credit       INTEGER,
    length              INTEGER,
    comment             TEXT,
    edits_pending       INTEGER,
    last_updated        TEXT,
    video               TEXT
);

-- ── release_group ────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.release_group (
    id                  INTEGER,
    gid                 UUID,
    name                TEXT,
    artist_credit       INTEGER,
    type                INTEGER,
    comment             TEXT,
    edits_pending       INTEGER,
    last_updated        TEXT
);

-- ── release ──────────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.release (
    id                  INTEGER,
    gid                 UUID,
    name                TEXT,
    artist_credit       INTEGER,
    release_group       INTEGER,
    status              INTEGER,
    packaging           INTEGER,
    language            INTEGER,
    script              INTEGER,
    barcode             TEXT,
    comment             TEXT,
    edits_pending       INTEGER,
    quality             SMALLINT,
    last_updated        TEXT
);

-- ── release_country ──────────────────────────────────────────────────────────
CREATE TABLE mb_staging.release_country (
    release             INTEGER,
    country             INTEGER,
    date_year           SMALLINT,
    date_month          SMALLINT,
    date_day            SMALLINT
);

-- ── release_label ────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.release_label (
    id                  INTEGER,
    release             INTEGER,
    label               INTEGER,
    catalog_number      TEXT,
    last_updated        TEXT
);

-- ── label ────────────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.label (
    id                  INTEGER,
    gid                 UUID,
    name                TEXT,
    begin_date_year     SMALLINT,
    begin_date_month    SMALLINT,
    begin_date_day      SMALLINT,
    end_date_year       SMALLINT,
    end_date_month      SMALLINT,
    end_date_day        SMALLINT,
    label_code          INTEGER,
    type                INTEGER,
    area                INTEGER,
    comment             TEXT,
    edits_pending       INTEGER,
    last_updated        TEXT,
    ended               TEXT
);

-- ── work ─────────────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.work (
    id                  INTEGER,
    gid                 UUID,
    name                TEXT,
    type                INTEGER,
    comment             TEXT,
    edits_pending       INTEGER,
    last_updated        TEXT
);

-- ── artist_credit ────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.artist_credit (
    id                  INTEGER,
    name                TEXT,
    artist_count        SMALLINT,
    ref_count           INTEGER,
    created             TEXT,
    edits_pending       INTEGER,
    gid                 UUID
);

-- ── artist_credit_name ───────────────────────────────────────────────────────
CREATE TABLE mb_staging.artist_credit_name (
    artist_credit       INTEGER,
    position            SMALLINT,
    artist              INTEGER,
    name                TEXT,
    join_phrase         TEXT
);

-- ── genre ────────────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.genre (
    id                  INTEGER,
    gid                 UUID,
    name                TEXT,
    comment             TEXT,
    edits_pending       INTEGER,
    last_updated        TEXT
);

-- ── tag ──────────────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.tag (
    id                  INTEGER,
    name                TEXT,
    ref_count           INTEGER
);

-- ── artist_tag ───────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.artist_tag (
    artist              INTEGER,
    tag                 INTEGER,
    count               INTEGER,
    last_updated        TEXT
);

-- ── link (needed to resolve link_type in relationship tables) ────────────────
CREATE TABLE mb_staging.link (
    id                  INTEGER,
    link_type           INTEGER,
    begin_date_year     SMALLINT,
    begin_date_month    SMALLINT,
    begin_date_day      SMALLINT,
    end_date_year       SMALLINT,
    end_date_month      SMALLINT,
    end_date_day        SMALLINT,
    attribute_count     INTEGER,
    created             TEXT,
    ended               TEXT
);

-- ── link_type ────────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.link_type (
    id                  INTEGER,
    parent              INTEGER,
    child_order         INTEGER,
    gid                 UUID,
    entity_type0        TEXT,
    entity_type1        TEXT,
    name                TEXT,
    description         TEXT,
    link_phrase         TEXT,
    reverse_link_phrase TEXT,
    long_link_phrase    TEXT,
    last_updated        TEXT,
    is_deprecated       TEXT,
    has_dates           TEXT,
    entity0_cardinality SMALLINT,
    entity1_cardinality SMALLINT
);

-- ── l_artist_artist ──────────────────────────────────────────────────────────
CREATE TABLE mb_staging.l_artist_artist (
    id                  INTEGER,
    link                INTEGER,
    entity0             INTEGER,
    entity1             INTEGER,
    edits_pending       INTEGER,
    last_updated        TEXT,
    link_order          INTEGER,
    entity0_credit      TEXT,
    entity1_credit      TEXT
);

-- ── l_artist_recording ───────────────────────────────────────────────────────
CREATE TABLE mb_staging.l_artist_recording (
    id                  INTEGER,
    link                INTEGER,
    entity0             INTEGER,
    entity1             INTEGER,
    edits_pending       INTEGER,
    last_updated        TEXT,
    link_order          INTEGER,
    entity0_credit      TEXT,
    entity1_credit      TEXT
);

-- ── l_artist_release ─────────────────────────────────────────────────────────
CREATE TABLE mb_staging.l_artist_release (
    id                  INTEGER,
    link                INTEGER,
    entity0             INTEGER,
    entity1             INTEGER,
    edits_pending       INTEGER,
    last_updated        TEXT,
    link_order          INTEGER,
    entity0_credit      TEXT,
    entity1_credit      TEXT
);

-- ── l_artist_work ────────────────────────────────────────────────────────────
CREATE TABLE mb_staging.l_artist_work (
    id                  INTEGER,
    link                INTEGER,
    entity0             INTEGER,
    entity1             INTEGER,
    edits_pending       INTEGER,
    last_updated        TEXT,
    link_order          INTEGER,
    entity0_credit      TEXT,
    entity1_credit      TEXT
);
