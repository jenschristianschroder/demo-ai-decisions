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
 * Search artists by name. Prefers exact (case-insensitive) match first
 * — this both improves relevance ("The Beatles" should not be drowned out
 * by tribute bands) and avoids the planner doing a leading-wildcard scan
 * when an exact hit exists.
 */
export async function searchArtists(namePart: string, limit = 20) {
  return query(
    `SELECT a.gid, a.name, at.name AS type, ar.name AS area,
            a.begin_date_year, a.end_date_year, a.comment,
            CASE WHEN LOWER(a.name) = LOWER($1) THEN 0 ELSE 1 END AS rank
     FROM musicbrainz.artist a
     LEFT JOIN musicbrainz.artist_type at ON at.id = a.type
     LEFT JOIN musicbrainz.area ar ON ar.id = a.area
     WHERE LOWER(a.name) = LOWER($1) OR a.name ILIKE $2
     ORDER BY rank, a.name
     LIMIT $3`,
    [namePart, `%${namePart}%`, limit],
  );
}

/** Get artist tags/genres */
export async function getArtistGenres(artistId: number) {
  return query(
    `SELECT t.name
     FROM musicbrainz.artist_tag atg
     JOIN musicbrainz.tag t ON t.id = atg.tag
     WHERE atg.artist = $1
     ORDER BY atg.count DESC
     LIMIT 10`,
    [artistId],
  );
}

/**
 * Get recordings for an artist via artist_credit.
 *
 * Uses a CTE to first resolve the artist's set of artist_credit ids, then
 * joins those against `recording`. This pushes the artist filter down so
 * the planner can use the index on `artist_credit_name.artist` instead of
 * scanning recording → artist_credit → artist_credit_name → artist for
 * popular artists (which is very expensive for e.g. The Beatles).
 */
export async function getArtistRecordings(artistGid: string, limit = 20) {
  return query(
    `WITH credits AS (
       SELECT DISTINCT acn.artist_credit
       FROM musicbrainz.artist_credit_name acn
       JOIN musicbrainz.artist a ON a.id = acn.artist
       WHERE a.gid = $1
     )
     SELECT r.gid, r.name, r.length,
            ac.name AS artist_credit_name
     FROM credits c
     JOIN musicbrainz.recording r ON r.artist_credit = c.artist_credit
     JOIN musicbrainz.artist_credit ac ON ac.id = r.artist_credit
     ORDER BY r.name
     LIMIT $2`,
    [artistGid, limit],
  );
}

/**
 * Get releases for an artist.
 *
 * Same CTE optimisation as `getArtistRecordings`.
 */
export async function getArtistReleases(artistGid: string, limit = 20) {
  return query(
    `WITH credits AS (
       SELECT DISTINCT acn.artist_credit
       FROM musicbrainz.artist_credit_name acn
       JOIN musicbrainz.artist a ON a.id = acn.artist
       WHERE a.gid = $1
     )
     SELECT rel.gid, rel.name, rg.type, rc.date_year, rc.date_month,
            l.name AS label_name, ar.name AS country_name,
            ac.name AS artist_credit_name
     FROM credits c
     JOIN musicbrainz.release rel ON rel.artist_credit = c.artist_credit
     JOIN musicbrainz.artist_credit ac ON ac.id = rel.artist_credit
     LEFT JOIN musicbrainz.release_group rg ON rg.id = rel.release_group
     LEFT JOIN LATERAL (
       SELECT country, date_year, date_month, date_day
       FROM musicbrainz.release_country
       WHERE release = rel.id
       ORDER BY date_year NULLS LAST
       LIMIT 1
     ) rc ON true
     LEFT JOIN LATERAL (
       SELECT label
       FROM musicbrainz.release_label
       WHERE release = rel.id
       LIMIT 1
     ) rl ON true
     LEFT JOIN musicbrainz.label l ON l.id = rl.label
     LEFT JOIN musicbrainz.area ar ON ar.id = rc.country
     ORDER BY rc.date_year DESC NULLS LAST
     LIMIT $2`,
    [artistGid, limit],
  );
}

// ---------------------------------------------------------------------------
// Safe string escaping for Cypher literals
// ---------------------------------------------------------------------------

/**
 * Escape a string for use in Apache AGE Cypher string literals.
 * Handles backslashes first, then single quotes, to prevent injection.
 */
function escapeCypher(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** Find collaborators via AGE graph */
export async function findCollaborators(artistName: string, maxHops = 2) {
  const safeName = escapeCypher(artistName);
  const safeMaxHops = Math.min(Math.max(1, maxHops), 6);
  return cypherQuery(`
    MATCH (a:Artist {name: '${safeName}'})
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
 */
export interface BandMember {
  gid: string;
  name: string;
  type: string | null;
  area: string | null;
  link_name: string;
  begin_year: number | null;
  end_year: number | null;
  direction: 'member_of' | 'band_of';
}

/**
 * Find members of a band (or bands an artist belongs to) via the
 * MusicBrainz `l_artist_artist` relationship table.
 *
 * Uses `link_type.name` to match the "member of band" family of
 * relationships (which also covers things like "founder", "subgroup of"
 * — link types whose name starts with "member" cover the membership
 * variants used by MusicBrainz). See
 * https://musicbrainz.org/relationships/artist-artist for the full list.
 *
 * Convention in `l_artist_artist` for "member of band":
 *   entity0 = the person (member)
 *   entity1 = the group (band)
 */
export async function findBandMembers(artistGid: string, limit = 50): Promise<BandMember[]> {
  return query<BandMember>(
    `WITH target AS (
       SELECT id, type FROM musicbrainz.artist WHERE gid = $1
     )
     -- Members of the target group (target is entity1 = band)
     SELECT a.gid, a.name, at.name AS type, ar.name AS area,
            lt.name AS link_name,
            lk.begin_date_year AS begin_year,
            lk.end_date_year   AS end_year,
            'member_of'::text  AS direction
     FROM target t
     JOIN musicbrainz.l_artist_artist laa ON laa.entity1 = t.id
     JOIN musicbrainz.link lk ON lk.id = laa.link
     JOIN musicbrainz.link_type lt ON lt.id = lk.link_type
     JOIN musicbrainz.artist a ON a.id = laa.entity0
     LEFT JOIN musicbrainz.artist_type at ON at.id = a.type
     LEFT JOIN musicbrainz.area ar ON ar.id = a.area
     WHERE lt.name ILIKE 'member%'

     UNION ALL

     -- Bands that the target person belongs to (target is entity0 = member)
     SELECT a.gid, a.name, at.name AS type, ar.name AS area,
            lt.name AS link_name,
            lk.begin_date_year AS begin_year,
            lk.end_date_year   AS end_year,
            'band_of'::text    AS direction
     FROM target t
     JOIN musicbrainz.l_artist_artist laa ON laa.entity0 = t.id
     JOIN musicbrainz.link lk ON lk.id = laa.link
     JOIN musicbrainz.link_type lt ON lt.id = lk.link_type
     JOIN musicbrainz.artist a ON a.id = laa.entity1
     LEFT JOIN musicbrainz.artist_type at ON at.id = a.type
     LEFT JOIN musicbrainz.area ar ON ar.id = a.area
     WHERE lt.name ILIKE 'member%'

     ORDER BY end_year NULLS LAST, begin_year NULLS LAST, name
     LIMIT $2`,
    [artistGid, limit],
  );
}

/** Find relationship paths between two artists */
export async function findPaths(artistName1: string, artistName2: string, maxHops = 4) {
  const safe1 = escapeCypher(artistName1);
  const safe2 = escapeCypher(artistName2);
  const safeMaxHops = Math.min(Math.max(1, maxHops), 6);
  return cypherQuery(`
    MATCH path = (a:Artist {name: '${safe1}'})-[*1..${safeMaxHops}]-(b:Artist {name: '${safe2}'})
    RETURN path
    LIMIT 5
  `);
}

/** Get labels in an area */
export async function getAreaLabels(areaName: string, limit = 10) {
  return query(
    `SELECT l.gid, l.name, l.type, ar.name AS area
     FROM musicbrainz.label l
     JOIN musicbrainz.area ar ON ar.id = l.area
     WHERE ar.name ILIKE $1
     ORDER BY l.name
     LIMIT $2`,
    [`%${areaName}%`, limit],
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
