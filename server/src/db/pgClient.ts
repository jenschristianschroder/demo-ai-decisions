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

/** Search artists by name (fuzzy ILIKE) */
export async function searchArtists(namePart: string, limit = 20) {
  return query(
    `SELECT a.gid, a.name, at.name AS type, ar.name AS area,
            a.begin_date_year, a.end_date_year, a.comment
     FROM musicbrainz.artist a
     LEFT JOIN musicbrainz.artist_type at ON at.id = a.type
     LEFT JOIN musicbrainz.area ar ON ar.id = a.area
     WHERE a.name ILIKE $1
     ORDER BY a.name
     LIMIT $2`,
    [`%${namePart}%`, limit],
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

/** Get recordings for an artist via artist_credit */
export async function getArtistRecordings(artistGid: string, limit = 20) {
  return query(
    `SELECT r.gid, r.name, r.length,
            ac.name AS artist_credit_name
     FROM musicbrainz.recording r
     JOIN musicbrainz.artist_credit ac ON ac.id = r.artist_credit
     JOIN musicbrainz.artist_credit_name acn ON acn.artist_credit = ac.id
     JOIN musicbrainz.artist a ON a.id = acn.artist
     WHERE a.gid = $1
     ORDER BY r.name
     LIMIT $2`,
    [artistGid, limit],
  );
}

/** Get releases for an artist */
export async function getArtistReleases(artistGid: string, limit = 20) {
  return query(
    `SELECT rel.gid, rel.name, rg.type, rel.date_year, rel.date_month,
            l.name AS label_name, ar.name AS country_name,
            ac.name AS artist_credit_name
     FROM musicbrainz.release rel
     JOIN musicbrainz.artist_credit ac ON ac.id = rel.artist_credit
     JOIN musicbrainz.artist_credit_name acn ON acn.artist_credit = ac.id
     JOIN musicbrainz.artist a ON a.id = acn.artist
     LEFT JOIN musicbrainz.release_group rg ON rg.id = rel.release_group
     LEFT JOIN musicbrainz.label l ON l.id = rel.label
     LEFT JOIN musicbrainz.area ar ON ar.id = rel.country
     WHERE a.gid = $1
     ORDER BY rel.date_year DESC NULLS LAST
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
