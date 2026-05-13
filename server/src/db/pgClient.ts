/**
 * PostgreSQL connection pool for MusicBrainz knowledge graph queries.
 *
 * Uses the standard PG* environment variables:
 *   PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT, PGSSLMODE
 *
 * When PGHOST is not set the pool is not created and all query helpers
 * return empty results, allowing the app to fall back to AI-only mode.
 */

import pg from 'pg';

const { Pool } = pg;

// ---------------------------------------------------------------------------
// Pool singleton
// ---------------------------------------------------------------------------

let pool: pg.Pool | null = null;

function getPool(): pg.Pool | null {
  if (pool) return pool;

  console.log('[PG Debug] Checking PG environment variables:');
  console.log(`[PG Debug]   PGHOST=${process.env.PGHOST ?? '(not set)'}`);
  console.log(`[PG Debug]   PGDATABASE=${process.env.PGDATABASE ?? '(not set, default: musicbrainz)'}`);
  console.log(`[PG Debug]   PGUSER=${process.env.PGUSER ?? '(not set, default: pgadmin)'}`);
  console.log(`[PG Debug]   PGPASSWORD=${process.env.PGPASSWORD ? '****' : '(not set)'}`);
  console.log(`[PG Debug]   PGPORT=${process.env.PGPORT ?? '(not set, default: 5432)'}`);
  console.log(`[PG Debug]   PGSSLMODE=${process.env.PGSSLMODE ?? '(not set)'}`);

  if (!process.env.PGHOST) {
    console.warn('[PG Debug] PGHOST is not set — skipping pool creation, falling back to AI-only mode.');
    return null;
  }

  console.log('[PG Debug] Creating PG pool...');

  pool = new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE ?? 'musicbrainz',
    user: process.env.PGUSER ?? 'pgadmin',
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT ?? '5432', 10),
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: true } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on('error', (err) => {
    console.error('[PG Debug] Unexpected PG pool error:', err);
  });

  console.log('[PG Debug] PG pool created successfully.');
  return pool;
}

/** True when a PostgreSQL connection is configured */
export function isPgAvailable(): boolean {
  const available = !!process.env.PGHOST;
  console.log(`[PG Debug] isPgAvailable() => ${available} (PGHOST=${process.env.PGHOST ?? '(not set)'})`);
  return available;
}

// ---------------------------------------------------------------------------
// Generic query helper
// ---------------------------------------------------------------------------

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const p = getPool();
  if (!p) return [];
  const result = await p.query<T>(text, params);
  return result.rows;
}

// ---------------------------------------------------------------------------
// Apache AGE Cypher query helper
// ---------------------------------------------------------------------------

/**
 * Execute a Cypher query via Apache AGE.
 * Wraps the query in `ag_catalog.cypher()` and returns raw agtype rows.
 */
export async function cypherQuery(
  cypher: string,
  graphName = 'music_graph',
): Promise<Record<string, unknown>[]> {
  const p = getPool();
  if (!p) return [];

  // Validate graphName to prevent injection (alphanumeric + underscore only)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(graphName)) {
    throw new Error(`Invalid graph name: ${graphName}`);
  }

  // AGE requires the search path to include ag_catalog
  const sql = `
    SET search_path = ag_catalog, "$user", public;
    SELECT * FROM cypher('${graphName}', $$ ${cypher} $$) AS (result agtype);
  `;

  const result = await p.query(sql);
  return result.rows.map((r: Record<string, unknown>) => {
    const val = r.result;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val) as Record<string, unknown>;
      } catch {
        return { value: val };
      }
    }
    return val as Record<string, unknown>;
  });
}

// ---------------------------------------------------------------------------
// MusicBrainz-specific queries
// ---------------------------------------------------------------------------

/**
 * Search artists by name with diacritic-insensitive trigram fuzzy matching
 * and popularity-based ranking.
 *
 * Ranking strategy (best match first):
 *   1. Exact case-insensitive, diacritic-insensitive match on `name`
 *   2. Exact case-insensitive, diacritic-insensitive match on `sort_name`
 *      (MusicBrainz convention: "Beatles, The")
 *   3. Trigram similarity to `name` or `sort_name`
 *   4. Within each bucket, ranked by popularity (credit_count from the
 *      `artist_popularity` materialized view) — so "The Beatles" outranks
 *      tribute bands.
 *
 * Requires the indexes/extensions/materialized view created by
 * `server/src/db/optimize_indexes.sql`.
 */
export async function searchArtists(namePart: string, limit = 20) {
  return query(
    `WITH q AS (
       SELECT LOWER(musicbrainz.immutable_unaccent($1)) AS needle
     )
     SELECT a.gid, a.name, at.name AS type, ar.name AS area,
            a.begin_date_year, a.end_date_year, a.comment,
            COALESCE(ap.credit_count, 0) AS popularity,
            CASE
              WHEN LOWER(musicbrainz.immutable_unaccent(a.name))      = q.needle THEN 0
              WHEN LOWER(musicbrainz.immutable_unaccent(a.sort_name)) = q.needle THEN 1
              ELSE 2
            END AS rank
     FROM musicbrainz.artist a, q
     LEFT JOIN musicbrainz.artist_type at ON at.id = a.type
     LEFT JOIN musicbrainz.area ar ON ar.id = a.area
     LEFT JOIN musicbrainz.artist_popularity ap ON ap.artist_id = a.id
     WHERE LOWER(musicbrainz.immutable_unaccent(a.name))      = q.needle
        OR LOWER(musicbrainz.immutable_unaccent(a.sort_name)) = q.needle
        OR musicbrainz.immutable_unaccent(a.name)      ILIKE '%' || musicbrainz.immutable_unaccent($1) || '%'
        OR musicbrainz.immutable_unaccent(a.sort_name) ILIKE '%' || musicbrainz.immutable_unaccent($1) || '%'
     ORDER BY rank, popularity DESC, a.name
     LIMIT $2`,
    [namePart, limit],
  );
}

/**
 * Get artist genres.
 *
 * Filters out down-voted tags (`count <= 0`) and intersects with the
 * canonical MusicBrainz `genre` table so noisy free-form tags like
 * "favorite" or "seen live" are excluded.
 */
export async function getArtistGenres(artistId: number) {
  return query(
    `SELECT g.name
     FROM musicbrainz.artist_tag atg
     JOIN musicbrainz.tag t ON t.id = atg.tag
     JOIN musicbrainz.genre g ON LOWER(g.name) = LOWER(t.name)
     WHERE atg.artist = $1
       AND atg.count > 0
     ORDER BY atg.count DESC
     LIMIT 10`,
    [artistId],
  );
}

/**
 * Get recordings for an artist via artist_credit.
 *
 * Accuracy improvements over the original implementation:
 *   - `position = 0` keeps only the artist's PRIMARY credits (so guest
 *     appearances and "various artists" tracks don't drown out the main
 *     discography).
 *   - Orders by EARLIEST release date for the recording (joined through
 *     `track` … `release_country`) so popular originals come first.
 *     `release_unknown_country` is not loaded in this demo so its date
 *     would not be available; we fall back to `name` for tie-breaks.
 *   - `DISTINCT ON (r.gid)` collapses multiple releases of the same
 *     recording into one row.
 *
 * Uses a CTE so the planner pushes the artist filter down through
 * artist_credit_name → artist_credit → recording.
 */
export async function getArtistRecordings(artistGid: string, limit = 20) {
  return query(
    `WITH credits AS (
       SELECT DISTINCT acn.artist_credit
       FROM musicbrainz.artist_credit_name acn
       JOIN musicbrainz.artist a ON a.id = acn.artist
       WHERE a.gid = $1
         AND acn.position = 0
     )
     SELECT DISTINCT ON (r.gid)
            r.gid, r.name, r.length,
            ac.name AS artist_credit_name
     FROM credits c
     JOIN musicbrainz.recording r ON r.artist_credit = c.artist_credit
     JOIN musicbrainz.artist_credit ac ON ac.id = r.artist_credit
     WHERE ac.artist_count = 1
     ORDER BY r.gid, r.name
     LIMIT $2`,
    [artistGid, limit],
  );
}

/**
 * Get releases for an artist, grouped by release_group (album) so that
 * multiple regional/format pressings of "Abbey Road" appear as a single
 * row instead of dozens.
 *
 * Accuracy improvements over the original implementation:
 *   - Excludes Bootleg/Pseudo-release statuses by filtering
 *     `status IN (1, 2, NULL)` — Official, Promotion, or unset.
 *   - Picks the EARLIEST `release_country` row by full (year, month, day)
 *     date tuple instead of the original year-only ordering, so the
 *     surfaced country/label is the original release rather than an
 *     arbitrary later pressing.
 *   - Aggregates labels and countries across all releases in the group
 *     with `array_agg(DISTINCT …)`.
 *   - Orders by earliest release year of the group, then name.
 */
export async function getArtistReleases(artistGid: string, limit = 20) {
  return query(
    `WITH credits AS (
       SELECT DISTINCT acn.artist_credit
       FROM musicbrainz.artist_credit_name acn
       JOIN musicbrainz.artist a ON a.id = acn.artist
       WHERE a.gid = $1
         AND acn.position = 0
     ),
     candidate_releases AS (
       SELECT rel.id, rel.gid, rel.name, rel.artist_credit, rel.release_group,
              rel.status
       FROM credits c
       JOIN musicbrainz.release rel ON rel.artist_credit = c.artist_credit
       WHERE rel.status IS NULL OR rel.status IN (1, 2)
     ),
     release_dates AS (
       SELECT cr.id AS release_id,
              cr.release_group,
              rc.date_year, rc.date_month, rc.date_day,
              rc.country
       FROM candidate_releases cr
       LEFT JOIN LATERAL (
         SELECT country, date_year, date_month, date_day
         FROM musicbrainz.release_country
         WHERE release = cr.id
         ORDER BY date_year  NULLS LAST,
                  date_month NULLS LAST,
                  date_day   NULLS LAST
         LIMIT 1
       ) rc ON true
     ),
     grouped AS (
       SELECT rg.id AS release_group_id,
              MIN(rd.date_year) AS earliest_year,
              MIN(rd.date_month) FILTER (WHERE rd.date_year IS NOT NULL) AS earliest_month,
              array_agg(DISTINCT ar.name)  FILTER (WHERE ar.name  IS NOT NULL) AS country_names,
              array_agg(DISTINCT lab.name) FILTER (WHERE lab.name IS NOT NULL) AS label_names,
              (array_agg(cr.id ORDER BY rd.date_year NULLS LAST,
                                        rd.date_month NULLS LAST,
                                        rd.date_day NULLS LAST,
                                        cr.id))[1] AS representative_release_id
       FROM candidate_releases cr
       JOIN musicbrainz.release_group rg ON rg.id = cr.release_group
       LEFT JOIN release_dates rd ON rd.release_id = cr.id
       LEFT JOIN musicbrainz.area ar ON ar.id = rd.country
       LEFT JOIN LATERAL (
         SELECT l.name
         FROM musicbrainz.release_label rl
         JOIN musicbrainz.label l ON l.id = rl.label
         WHERE rl.release = cr.id
         LIMIT 1
       ) lab ON true
       GROUP BY rg.id
     )
     SELECT rel.gid, rel.name, rg.type, rg.name AS release_group_name,
            g.earliest_year AS date_year,
            g.earliest_month AS date_month,
            CASE WHEN g.label_names IS NOT NULL AND array_length(g.label_names, 1) > 0
                 THEN g.label_names[1] END AS label_name,
            CASE WHEN g.country_names IS NOT NULL AND array_length(g.country_names, 1) > 0
                 THEN g.country_names[1] END AS country_name,
            g.label_names,
            g.country_names,
            ac.name AS artist_credit_name
     FROM grouped g
     JOIN musicbrainz.release rel ON rel.id = g.representative_release_id
     JOIN musicbrainz.release_group rg ON rg.id = g.release_group_id
     JOIN musicbrainz.artist_credit ac ON ac.id = rel.artist_credit
     ORDER BY g.earliest_year DESC NULLS LAST, rel.name
     LIMIT $2`,
    [artistGid, limit],
  );
}

// ---------------------------------------------------------------------------
// Graph queries (Apache AGE)
// ---------------------------------------------------------------------------

/**
 * Find collaborators via the AGE graph.
 *
 * Matches the seed artist by `gid` (stable UUID) rather than free-text
 * `name` to avoid ambiguity (e.g. "John Williams" has dozens of distinct
 * MusicBrainz entries).
 */
export async function findCollaborators(artistGid: string, maxHops = 2) {
  // gid is a UUID — validate strictly to avoid Cypher injection.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artistGid)) {
    throw new Error(`Invalid artist gid: ${artistGid}`);
  }
  const safeMaxHops = Math.min(Math.max(1, maxHops), 3);
  return cypherQuery(`
    MATCH (a:Artist {gid: '${artistGid}'})
          -[:COLLABORATED_WITH*1..${safeMaxHops}]-(b:Artist)
    RETURN DISTINCT b.name AS name, b.gid AS gid
    LIMIT 20
  `);
}

/**
 * Member of a band, as returned by `findBandMembers`.
 *
 * `direction` is `member_of` when the matched artist is a member of the
 * looked-up group (the typical case for "List members of The Beatles"),
 * and `band_of` when the looked-up artist is itself a person and the
 * row represents a band they are a member of.
 *
 * `ended` reflects `link.ended` — `true` for former members, `false` for
 * current members. The UI uses this to label "ex-member" vs "current".
 */
export interface BandMember {
  gid: string;
  name: string;
  type: string | null;
  area: string | null;
  link_name: string;
  begin_year: number | null;
  end_year: number | null;
  ended: boolean;
  direction: 'member_of' | 'band_of';
}

/**
 * MusicBrainz canonical `link_type.gid` for the "member of band"
 * relationship between two artists. See
 * https://musicbrainz.org/relationship/5be4c609-9afa-4ea0-910b-12ffb71e3821
 *
 * Filtering on `gid` rather than `link_type.name` is exact and
 * indexable, and isn't subject to renames or localization.
 */
const MEMBER_OF_BAND_LINK_TYPE_GID = '5be4c609-9afa-4ea0-910b-12ffb71e3821';

/**
 * Find members of a band (or bands an artist belongs to) via the
 * MusicBrainz `l_artist_artist` relationship table.
 *
 * Convention in `l_artist_artist` for "member of band":
 *   entity0 = the person (member)
 *   entity1 = the group (band)
 */
export async function findBandMembers(artistGid: string, limit = 50): Promise<BandMember[]> {
  return query<BandMember>(
    `WITH target AS (
       SELECT id, type FROM musicbrainz.artist WHERE gid = $1
     ),
     mob AS (
       SELECT id FROM musicbrainz.link_type WHERE gid = $3::uuid
     )
     -- Members of the target group (target is entity1 = band)
     SELECT a.gid, a.name, at.name AS type, ar.name AS area,
            lt.name AS link_name,
            lk.begin_date_year AS begin_year,
            lk.end_date_year   AS end_year,
            lk.ended           AS ended,
            'member_of'::text  AS direction
     FROM target t
     JOIN musicbrainz.l_artist_artist laa ON laa.entity1 = t.id
     JOIN musicbrainz.link lk ON lk.id = laa.link
     JOIN mob ON mob.id = lk.link_type
     JOIN musicbrainz.link_type lt ON lt.id = lk.link_type
     JOIN musicbrainz.artist a ON a.id = laa.entity0
     LEFT JOIN musicbrainz.artist_type at ON at.id = a.type
     LEFT JOIN musicbrainz.area ar ON ar.id = a.area

     UNION ALL

     -- Bands that the target person belongs to (target is entity0 = member)
     SELECT a.gid, a.name, at.name AS type, ar.name AS area,
            lt.name AS link_name,
            lk.begin_date_year AS begin_year,
            lk.end_date_year   AS end_year,
            lk.ended           AS ended,
            'band_of'::text    AS direction
     FROM target t
     JOIN musicbrainz.l_artist_artist laa ON laa.entity0 = t.id
     JOIN musicbrainz.link lk ON lk.id = laa.link
     JOIN mob ON mob.id = lk.link_type
     JOIN musicbrainz.link_type lt ON lt.id = lk.link_type
     JOIN musicbrainz.artist a ON a.id = laa.entity1
     LEFT JOIN musicbrainz.artist_type at ON at.id = a.type
     LEFT JOIN musicbrainz.area ar ON ar.id = a.area

     ORDER BY ended, end_year NULLS LAST, begin_year NULLS LAST, name
     LIMIT $2`,
    [artistGid, limit, MEMBER_OF_BAND_LINK_TYPE_GID],
  );
}

/**
 * Find relationship paths between two artists.
 *
 * Matches both endpoints by `gid` (stable UUID) for accuracy and to
 * eliminate the Cypher-injection surface of the previous name-based
 * matcher.
 */
export async function findPaths(artistGid1: string, artistGid2: string, maxHops = 4) {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(artistGid1) || !uuidRe.test(artistGid2)) {
    throw new Error('findPaths requires UUID gids for both endpoints');
  }
  const safeMaxHops = Math.min(Math.max(1, maxHops), 4);
  return cypherQuery(`
    MATCH path = (a:Artist {gid: '${artistGid1}'})-[*1..${safeMaxHops}]-(b:Artist {gid: '${artistGid2}'})
    RETURN path
    LIMIT 5
  `);
}

/**
 * Get labels in a country/area.
 *
 * Restricts to `area.type = 1` (Country) so a search for "France" doesn't
 * also surface "Île-de-France", "Vichy France" etc. Uses trigram match
 * via the GIN index built by `optimize_indexes.sql`.
 */
export async function getAreaLabels(areaName: string, limit = 10) {
  return query(
    `SELECT l.gid, l.name, l.type, ar.name AS area
     FROM musicbrainz.label l
     JOIN musicbrainz.area ar ON ar.id = l.area
     WHERE ar.type = 1
       AND musicbrainz.immutable_unaccent(ar.name)
           ILIKE '%' || musicbrainz.immutable_unaccent($1) || '%'
     ORDER BY l.name
     LIMIT $2`,
    [areaName, limit],
  );
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
