/**
 * Music Intelligence Graph Agent Orchestration routes.
 *
 * Runs 5 Music Intelligence agents sequentially via Azure AI Foundry,
 * streaming progress to the frontend via SSE.
 *
 * Agent pipeline:
 *   1. Query Parser — parse natural language music query into structured intent
 *   2. Graph Traversal — traverse MusicBrainz knowledge graph for connected entities
 *   3. Semantic Search — vector similarity search for additional related entities
 *   4. Recommendation Engine — generate ranked artist recommendations
 *   5. Explanation Builder — synthesize narrative summary and catalog insights
 */

import { Router, type Request, type Response } from 'express';
import { chatCompletion } from '../aiClient.js';
import {
  isPgAvailable,
  searchArtists,
  getArtistRecordings,
  getArtistReleases,
  getAreaLabels,
  findCollaborators,
  query as pgQuery,
  cypherQuery,
} from '../db/pgClient.js';

export const musicAgentsRouter = Router();

// ---------------------------------------------------------------------------
// Data-source status endpoint — tells the frontend whether PostgreSQL is
// configured and reachable, so the UI can show an indicator.
// ---------------------------------------------------------------------------

musicAgentsRouter.get('/music/data-source', (_req: Request, res: Response) => {
  console.log('[Music Data-Source] /music/data-source endpoint hit');
  const pgAvailable = isPgAvailable();
  const response = {
    source: pgAvailable ? 'postgresql' : 'mock',
    label: pgAvailable ? 'PostgreSQL Data' : 'AI-Generated Demo Data',
  };
  console.log('[Music Data-Source] Responding with:', JSON.stringify(response));
  res.json(response);
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const today = () => new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// SSE helpers
// ---------------------------------------------------------------------------

interface SSEEvent {
  type: 'agent-start' | 'agent-done' | 'agent-error' | 'all-done' | 'error';
  phase?: string;
  message?: string;
  reasoning?: string;
  data?: unknown;
  error?: string;
}

function sendSSE(res: Response, event: SSEEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// ---------------------------------------------------------------------------
// Agent system prompts
// ---------------------------------------------------------------------------

function queryParserSystemPrompt(): string {
  return `You are the Music Query Parser Agent. Analyze the user's natural language music query and extract structured intent including the query type, target entities (artists, genres, areas, labels, time periods), relationship types to traverse, and any filters. Return JSON with: { queryIntent, targetEntities: string[], relationshipTypes: string[], filters: { decade?, country?, genre?, label?, maxHops? }, reasoning: string }

Today's date: ${today()}

REASONING INSTRUCTIONS:
1. Identify the core intent of the music query (e.g., discover similar artists, explore genre connections, find collaborations)
2. Extract all mentioned entities — artists, genres, geographic areas, labels, and time periods
3. Determine which relationship types are relevant (e.g., member-of, collaborated-with, influenced-by, recorded-for)
4. Apply any explicit or implicit filters from the query
5. Explain your parsing decisions in the reasoning field

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "queryIntent": "<concise description of what the user wants>",
  "targetEntities": ["<entity 1>", "<entity 2>"],
  "relationshipTypes": ["<relationship type 1>", "<relationship type 2>"],
  "filters": {
    "decade": "<optional decade filter>",
    "country": "<optional country filter>",
    "genre": "<optional genre filter>",
    "label": "<optional label filter>",
    "maxHops": "<optional max graph hops>"
  },
  "reasoning": "<your detailed reasoning about how you parsed the query>"
}

No markdown, no commentary outside the JSON.`;
}

function graphTraversalSystemPrompt(): string {
  return `You are the Music Graph Traversal Agent. Given the parsed query intent, simulate traversing a MusicBrainz knowledge graph to find connected entities. Return JSON with: { artists: [{id, name, type, area?, genres, description?}], recordings: [{id, title, artistCredits, year?}], releases: [{id, title, type, date?, label?, country?, artistCredits}], works: [{id, title, composers}], labels: [{id, name, type?, area?}], relationshipPaths: [{nodes: [{id, label, type}], edges: [{type, sourceId, sourceLabel, targetId, targetLabel}], description}], reasoning: string }. Generate realistic MusicBrainz-style data related to the query. Include 5-10 artists, 5-8 recordings, 4-6 releases, 2-3 works, 2-4 labels, and 3-5 relationship paths.

Today's date: ${today()}

REASONING INSTRUCTIONS:
1. Use the parsed query intent and target entities to determine graph traversal starting points
2. Traverse relationships outward from each starting entity, respecting maxHops if specified
3. Collect all discovered artists, recordings, releases, works, and labels
4. Build relationship paths showing how entities are connected
5. Generate realistic MusicBrainz-style UUIDs and metadata
6. Explain your traversal strategy in the reasoning field

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "artists": [{"id": "<uuid>", "name": "<name>", "type": "<Person|Group>", "area": "<country/region>", "genres": ["<genre>"], "description": "<brief bio>"}],
  "recordings": [{"id": "<uuid>", "title": "<title>", "artistCredits": ["<artist name>"], "year": "<year>"}],
  "releases": [{"id": "<uuid>", "title": "<title>", "type": "<Album|Single|EP>", "date": "<date>", "label": "<label>", "country": "<country>", "artistCredits": ["<artist name>"]}],
  "works": [{"id": "<uuid>", "title": "<title>", "composers": ["<composer>"]}],
  "labels": [{"id": "<uuid>", "name": "<name>", "type": "<Original Production|Distributor>", "area": "<country>"}],
  "relationshipPaths": [{"nodes": [{"id": "<uuid>", "label": "<name>", "type": "<Artist|Recording|Release|Label>"}], "edges": [{"type": "<relationship type>", "sourceId": "<uuid>", "sourceLabel": "<name>", "targetId": "<uuid>", "targetLabel": "<name>"}], "description": "<path description>"}],
  "reasoning": "<your detailed reasoning about the graph traversal>"
}

No markdown, no commentary outside the JSON.`;
}

function semanticSearchSystemPrompt(): string {
  return `You are the Music Semantic Search Agent. Using vector similarity search on artist descriptions, release annotations, and genre tags, find additional entities semantically related to the query that the graph traversal may have missed. Return JSON with: { additionalArtists: [{id, name, type, area?, genres, description?, similarityScore: number}], additionalRelationshipPaths: [{nodes, edges, description}], semanticClusters: [{name, entities: string[], description}], reasoning: string }

Today's date: ${today()}

REASONING INSTRUCTIONS:
1. Analyze the semantic meaning of the original query beyond exact entity matches
2. Search for artists with similar descriptions, styles, or thematic content
3. Identify entities the graph traversal may have missed due to indirect or implicit relationships
4. Group discovered entities into semantic clusters (e.g., scenes, movements, styles)
5. Assign similarity scores based on semantic relevance (0-1)
6. Explain your search strategy in the reasoning field

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "additionalArtists": [{"id": "<uuid>", "name": "<name>", "type": "<Person|Group>", "area": "<country/region>", "genres": ["<genre>"], "description": "<brief bio>", "similarityScore": 0.85}],
  "additionalRelationshipPaths": [{"nodes": [{"id": "<uuid>", "label": "<name>", "type": "<Artist|Recording|Release|Label>"}], "edges": [{"type": "<relationship type>", "sourceId": "<uuid>", "sourceLabel": "<name>", "targetId": "<uuid>", "targetLabel": "<name>"}], "description": "<path description>"}],
  "semanticClusters": [{"name": "<cluster name>", "entities": ["<entity name>"], "description": "<cluster description>"}],
  "reasoning": "<your detailed reasoning about the semantic search>"
}

No markdown, no commentary outside the JSON.`;
}

function recommendationSystemPrompt(): string {
  return `You are the Music Recommendation Agent. Based on the graph traversal and semantic search results, generate ranked recommendations for artists related to the query. Each recommendation must include an explanation referencing specific graph paths and relationship types. Return JSON with: { recommendations: [{artistId, artistName, score (0-1), explanation, relationshipPath: {nodes, edges, description}, reasons: string[]}], reasoning: string }. Generate 5-8 recommendations ranked by score.

Today's date: ${today()}

REASONING INSTRUCTIONS:
1. Evaluate all discovered artists from graph traversal and semantic search
2. Score each artist based on relevance to the original query (0-1)
3. For each recommendation, explain why using specific graph paths and relationships
4. Reference concrete relationship types (e.g., "collaborated with X on recording Y")
5. Rank recommendations by score in descending order
6. Explain your scoring methodology in the reasoning field

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "recommendations": [
    {
      "artistId": "<uuid>",
      "artistName": "<name>",
      "score": 0.95,
      "explanation": "<why this artist is recommended, referencing graph paths>",
      "relationshipPath": {"nodes": [{"id": "<uuid>", "label": "<name>", "type": "<type>"}], "edges": [{"type": "<rel type>", "sourceId": "<uuid>", "sourceLabel": "<name>", "targetId": "<uuid>", "targetLabel": "<name>"}], "description": "<path description>"},
      "reasons": ["<reason 1>", "<reason 2>"]
    }
  ],
  "reasoning": "<your detailed reasoning about the recommendation scoring>"
}

No markdown, no commentary outside the JSON.`;
}

function explanationBuilderSystemPrompt(): string {
  return `You are the Music Explanation Builder Agent. Synthesize all discovered entities, relationships, and recommendations into a clear, narrative summary that answers the user's original question. Include: detected patterns (clusters, scenes, eras), the most important relationship paths, and actionable insights for music curators. Also identify any catalog quality issues (missing relationships, potential duplicates, incomplete metadata). Return JSON with: { summary: string, catalogInsights: [{type ('duplicate'|'missing-relationship'|'incomplete-metadata'|'enrichment-opportunity'), entityId, entityName, entityType, description, confidence ('high'|'medium'|'low'), suggestedAction, evidence: string[]}], graphStats: {totalNodes, totalEdges, artistCount, recordingCount, releaseCount, workCount, labelCount}, reasoning: string }

Today's date: ${today()}

REASONING INSTRUCTIONS:
1. Synthesize all agent outputs into a coherent narrative answering the user's query
2. Highlight detected patterns — scenes, movements, eras, geographic clusters
3. Describe the most important relationship paths in plain language
4. Identify catalog quality issues: missing relationships, duplicates, incomplete metadata
5. Calculate graph statistics from all discovered entities
6. Provide actionable insights for music curators and data maintainers
7. Explain your synthesis approach in the reasoning field

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "summary": "<narrative summary answering the user's question>",
  "catalogInsights": [
    {
      "type": "<duplicate|missing-relationship|incomplete-metadata|enrichment-opportunity>",
      "entityId": "<uuid>",
      "entityName": "<name>",
      "entityType": "<Artist|Recording|Release|Work|Label>",
      "description": "<description of the issue>",
      "confidence": "<high|medium|low>",
      "suggestedAction": "<what to do about it>",
      "evidence": ["<evidence 1>", "<evidence 2>"]
    }
  ],
  "graphStats": {
    "totalNodes": 0,
    "totalEdges": 0,
    "artistCount": 0,
    "recordingCount": 0,
    "releaseCount": 0,
    "workCount": 0,
    "labelCount": 0
  },
  "reasoning": "<your detailed reasoning about the synthesis>"
}

No markdown, no commentary outside the JSON.`;
}

// ---------------------------------------------------------------------------
// PostgreSQL data fetching helpers
// ---------------------------------------------------------------------------

/**
 * Fetch real graph data from PostgreSQL + Apache AGE for a parsed query.
 * Returns structured data matching the graph traversal agent output format.
 */
async function fetchGraphDataFromPg(
  parsedQuery: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  if (!isPgAvailable()) return null;

  try {
    const targetEntities = (parsedQuery.targetEntities as string[]) ?? [];
    const allArtists: Record<string, unknown>[] = [];
    const allRecordings: Record<string, unknown>[] = [];
    const allReleases: Record<string, unknown>[] = [];
    const allLabels: Record<string, unknown>[] = [];
    const relationshipPaths: Record<string, unknown>[] = [];

    for (const entity of targetEntities) {
      // Search artists matching this entity name
      const artists = await searchArtists(entity, 10);
      for (const a of artists) {
        allArtists.push({
          id: a.gid,
          name: a.name,
          type: a.type ?? 'Group',
          area: a.area,
          genres: [],
          description: a.comment ?? '',
        });

        // Fetch recordings and releases for each artist
        const recordings = await getArtistRecordings(a.gid as string, 8);
        for (const rec of recordings) {
          allRecordings.push({
            id: rec.gid,
            title: rec.name,
            artistCredits: [rec.artist_credit_name],
            duration: rec.length,
          });
        }

        const releases = await getArtistReleases(a.gid as string, 6);
        for (const rel of releases) {
          allReleases.push({
            id: rel.gid,
            title: rel.name,
            type: mapReleaseType(rel.type as number),
            date: rel.date_year ? `${rel.date_year}` : undefined,
            label: rel.label_name,
            country: rel.country_name,
            artistCredits: [rel.artist_credit_name],
          });
        }
      }
    }

    // Try to find collaborators via AGE graph
    for (const entity of targetEntities) {
      try {
        const collabs = await findCollaborators(entity, 2);
        if (collabs.length > 0) {
          relationshipPaths.push({
            nodes: [
              { id: entity, label: entity, type: 'Artist' },
              ...collabs.slice(0, 5).map((c) => ({
                id: c.gid ?? c.name,
                label: c.name,
                type: 'Artist',
              })),
            ],
            edges: collabs.slice(0, 5).map((c) => ({
              type: 'COLLABORATED_WITH',
              sourceId: entity,
              sourceLabel: entity,
              targetId: c.gid ?? c.name,
              targetLabel: c.name,
            })),
            description: `Collaboration network from ${entity}`,
          });
        }
      } catch {
        // AGE graph might not be populated yet — continue
      }
    }

    // Fetch labels if any area filters are present
    const filters = parsedQuery.filters as Record<string, string> | undefined;
    if (filters?.country) {
      const labels = await getAreaLabels(filters.country, 5);
      for (const l of labels) {
        allLabels.push({
          id: l.gid,
          name: l.name,
          type: l.type,
          area: l.area,
        });
      }
    }

    // Fetch works (simple query)
    const works = await pgQuery(
      `SELECT w.gid, w.name
       FROM musicbrainz.work w
       ORDER BY w.name LIMIT 5`,
    );

    return {
      artists: allArtists,
      recordings: allRecordings,
      releases: allReleases,
      works: works.map((w) => ({ id: w.gid, title: w.name, composers: [] })),
      labels: allLabels,
      relationshipPaths,
      reasoning: `Data fetched from PostgreSQL + Apache AGE graph. Found ${allArtists.length} artists, ${allRecordings.length} recordings, ${allReleases.length} releases across ${targetEntities.length} target entities.`,
    };
  } catch (err) {
    console.error('PostgreSQL graph data fetch error:', err);
    return null;
  }
}

function mapReleaseType(type: number | null | undefined): string {
  switch (type) {
    case 1: return 'Album';
    case 2: return 'Single';
    case 3: return 'EP';
    case 11: return 'Compilation';
    default: return 'Album';
  }
}

/**
 * Fetch semantically similar entities from pgvector.
 * Falls back to null when pgvector embeddings are not populated.
 */
async function fetchSemanticDataFromPg(
  parsedQuery: Record<string, unknown>,
  graphData: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  if (!isPgAvailable()) return null;

  try {
    // Check if any embeddings exist
    const embeddingCheck = await pgQuery(
      'SELECT COUNT(*) AS cnt FROM musicbrainz.artist WHERE embedding IS NOT NULL',
    );
    const hasEmbeddings = embeddingCheck.length > 0 && Number(embeddingCheck[0].cnt) > 0;

    if (!hasEmbeddings) {
      // No embeddings populated — fall back to tag-based similarity
      const targetEntities = (parsedQuery.targetEntities as string[]) ?? [];
      const graphArtists = (graphData.artists as Array<Record<string, unknown>>) ?? [];
      const graphArtistNames = new Set(graphArtists.map((a) => a.name as string));
      const additionalArtists: Record<string, unknown>[] = [];

      // Find artists that share tags with the target entities
      for (const entity of targetEntities) {
        const tagBased = await pgQuery(
          `SELECT DISTINCT a2.gid, a2.name, at.name AS type, ar.name AS area
           FROM musicbrainz.artist a1
           JOIN musicbrainz.artist_tag atg1 ON atg1.artist = a1.id
           JOIN musicbrainz.artist_tag atg2 ON atg2.tag = atg1.tag AND atg2.artist != a1.id
           JOIN musicbrainz.artist a2 ON a2.id = atg2.artist
           LEFT JOIN musicbrainz.artist_type at ON at.id = a2.type
           LEFT JOIN musicbrainz.area ar ON ar.id = a2.area
           WHERE a1.name ILIKE $1
           ORDER BY a2.name
           LIMIT 10`,
          [`%${entity}%`],
        );

        for (const row of tagBased) {
          if (!graphArtistNames.has(row.name as string)) {
            additionalArtists.push({
              id: row.gid,
              name: row.name,
              type: row.type ?? 'Group',
              area: row.area,
              genres: [],
              similarityScore: 0.7,
            });
            graphArtistNames.add(row.name as string);
          }
        }
      }

      return {
        additionalArtists,
        additionalRelationshipPaths: [],
        semanticClusters: [],
        reasoning: `Tag-based similarity search from PostgreSQL (no vector embeddings populated yet). Found ${additionalArtists.length} additional artists sharing tags.`,
      };
    }

    // Vector similarity search would go here when embeddings are populated
    return null;
  } catch (err) {
    console.error('PostgreSQL semantic search error:', err);
    return null;
  }
}

/**
 * Fetch graph statistics from PostgreSQL.
 */
async function fetchGraphStatsFromPg(): Promise<Record<string, unknown> | null> {
  if (!isPgAvailable()) return null;

  try {
    const counts = await pgQuery(`
      SELECT
        (SELECT COUNT(*) FROM musicbrainz.artist) AS artist_count,
        (SELECT COUNT(*) FROM musicbrainz.recording) AS recording_count,
        (SELECT COUNT(*) FROM musicbrainz.release) AS release_count,
        (SELECT COUNT(*) FROM musicbrainz.work) AS work_count,
        (SELECT COUNT(*) FROM musicbrainz.label) AS label_count
    `);

    if (counts.length === 0) return null;
    const c = counts[0];
    const artistCount = Number(c.artist_count ?? 0);
    const recordingCount = Number(c.recording_count ?? 0);
    const releaseCount = Number(c.release_count ?? 0);
    const workCount = Number(c.work_count ?? 0);
    const labelCount = Number(c.label_count ?? 0);
    const totalNodes = artistCount + recordingCount + releaseCount + workCount + labelCount;

    // Try to get edge count from AGE graph
    let totalEdges = 0;
    try {
      const edgeResult = await cypherQuery(
        "MATCH ()-[e]->() RETURN count(e) AS cnt",
      );
      if (edgeResult.length > 0) {
        totalEdges = Number(edgeResult[0].cnt ?? 0);
      }
    } catch {
      // AGE graph may not be populated
      const relCounts = await pgQuery(`
        SELECT
          (SELECT COUNT(*) FROM musicbrainz.l_artist_artist) +
          (SELECT COUNT(*) FROM musicbrainz.l_artist_recording) +
          (SELECT COUNT(*) FROM musicbrainz.l_artist_release) +
          (SELECT COUNT(*) FROM musicbrainz.l_artist_work) AS total
      `);
      totalEdges = Number(relCounts[0]?.total ?? 0);
    }

    return {
      totalNodes,
      totalEdges,
      artistCount,
      recordingCount,
      releaseCount,
      workCount,
      labelCount,
    };
  } catch (err) {
    console.error('PostgreSQL graph stats error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Agent definitions
// ---------------------------------------------------------------------------

interface AgentDef {
  phase: string;
  name: string;
  systemPrompt: () => string;
  buildUserContent: (context: OrchestrationContext) => string;
  maxTokens?: number;
}

interface OrchestrationContext {
  query: string;
  queryType: string;
  filters: Record<string, string>;
  priorOutputs: Record<string, unknown>;
}

const AGENTS: AgentDef[] = [
  {
    phase: 'query-parse',
    name: 'Query Parser Agent',
    systemPrompt: queryParserSystemPrompt,
    buildUserContent: (ctx) =>
      `Analyze the following music query and extract structured intent:\n\nQuery: ${ctx.query}\nQuery Type: ${ctx.queryType}\nFilters: ${JSON.stringify(ctx.filters)}`,
  },
  {
    phase: 'graph-traversal',
    name: 'Graph Traversal Agent',
    systemPrompt: graphTraversalSystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      const parsedQuery = ctx.priorOutputs.parsedQuery;
      return `Traverse the MusicBrainz knowledge graph based on the parsed query intent:\n\nParsed Query:\n${JSON.stringify(parsedQuery, null, 2)}\n\nOriginal Query: ${ctx.query}`;
    },
  },
  {
    phase: 'semantic-search',
    name: 'Semantic Search Agent',
    systemPrompt: semanticSearchSystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      const parsedQuery = ctx.priorOutputs.parsedQuery;
      const graphData = ctx.priorOutputs.graphData;
      return `Find additional semantically related entities that the graph traversal may have missed:\n\nParsed Query:\n${JSON.stringify(parsedQuery, null, 2)}\n\nGraph Traversal Results:\n${JSON.stringify(graphData, null, 2)}\n\nOriginal Query: ${ctx.query}`;
    },
  },
  {
    phase: 'recommendation',
    name: 'Recommendation Agent',
    systemPrompt: recommendationSystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      const parsedQuery = ctx.priorOutputs.parsedQuery;
      const graphData = ctx.priorOutputs.graphData;
      const semanticData = ctx.priorOutputs.semanticData;
      return `Generate ranked artist recommendations based on all discovered data:\n\nParsed Query:\n${JSON.stringify(parsedQuery, null, 2)}\n\nGraph Traversal Results:\n${JSON.stringify(graphData, null, 2)}\n\nSemantic Search Results:\n${JSON.stringify(semanticData, null, 2)}\n\nOriginal Query: ${ctx.query}`;
    },
  },
  {
    phase: 'explanation',
    name: 'Explanation Builder Agent',
    systemPrompt: explanationBuilderSystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      const parsedQuery = ctx.priorOutputs.parsedQuery;
      const graphData = ctx.priorOutputs.graphData;
      const semanticData = ctx.priorOutputs.semanticData;
      const recommendations = ctx.priorOutputs.recommendations;
      return `Synthesize all results into a narrative summary and catalog insights:\n\nParsed Query:\n${JSON.stringify(parsedQuery, null, 2)}\n\nGraph Traversal Results:\n${JSON.stringify(graphData, null, 2)}\n\nSemantic Search Results:\n${JSON.stringify(semanticData, null, 2)}\n\nRecommendations:\n${JSON.stringify(recommendations, null, 2)}\n\nOriginal Query: ${ctx.query}`;
    },
  },
];

// ---------------------------------------------------------------------------
// Map raw LLM output to structured agent outputs
// ---------------------------------------------------------------------------

function mapAgentOutput(phase: string, raw: Record<string, unknown>): unknown {
  switch (phase) {
    case 'query-parse':
      return raw;
    case 'graph-traversal': {
      const data = { ...raw } as Record<string, unknown>;
      delete data.reasoning;
      return data;
    }
    case 'semantic-search': {
      const data = { ...raw } as Record<string, unknown>;
      delete data.reasoning;
      return data;
    }
    case 'recommendation':
      return (raw as { recommendations?: unknown[] }).recommendations ?? [];
    case 'explanation': {
      const data = { ...raw } as Record<string, unknown>;
      delete data.reasoning;
      return data;
    }
    default:
      return raw;
  }
}

// Phase to output key mapping
const PHASE_TO_KEY: Record<string, string> = {
  'query-parse': 'parsedQuery',
  'graph-traversal': 'graphData',
  'semantic-search': 'semanticData',
  recommendation: 'recommendations',
  explanation: 'explanationData',
};

// ---------------------------------------------------------------------------
// SSE Orchestrator — runs 5 agents sequentially
// ---------------------------------------------------------------------------

musicAgentsRouter.post('/music/run-agents-sse', async (req: Request, res: Response) => {
  try {
    const { query, queryType, filters } = req.body as {
      query: string;
      queryType?: string;
      filters?: Record<string, string>;
    };

    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const context: OrchestrationContext = {
      query,
      queryType: queryType ?? 'general',
      filters: filters ?? {},
      priorOutputs: {},
    };

    // Run agents sequentially — each builds on prior outputs
    for (const agent of AGENTS) {
      sendSSE(res, {
        type: 'agent-start',
        phase: agent.phase,
        message: `Running ${agent.name}…`,
      });

      try {
        let mapped: unknown;
        let reasoning: string | undefined;

        // ── PostgreSQL fast-path for graph-traversal and semantic-search ──
        if (agent.phase === 'graph-traversal' && isPgAvailable()) {
          const pgData = await fetchGraphDataFromPg(
            context.priorOutputs.parsedQuery as Record<string, unknown> ?? {},
          );
          if (pgData) {
            reasoning = pgData.reasoning as string;
            delete pgData.reasoning;
            mapped = pgData;
          }
        }

        if (agent.phase === 'semantic-search' && isPgAvailable()) {
          const pgData = await fetchSemanticDataFromPg(
            context.priorOutputs.parsedQuery as Record<string, unknown> ?? {},
            context.priorOutputs.graphData as Record<string, unknown> ?? {},
          );
          if (pgData) {
            reasoning = pgData.reasoning as string;
            delete pgData.reasoning;
            mapped = pgData;
          }
        }

        // ── Fall back to AI agent if no PG data ──
        if (mapped === undefined) {
          const userContent = agent.buildUserContent(context);
          const result = await chatCompletion<Record<string, unknown>>(
            [
              { role: 'system', content: agent.systemPrompt() },
              { role: 'user', content: userContent },
            ],
            0.3,
            agent.maxTokens ?? 4096,
          );
          reasoning = (result as Record<string, unknown>).reasoning as string | undefined;
          mapped = mapAgentOutput(agent.phase, result);
        }

        // Store the output
        const outputKey = PHASE_TO_KEY[agent.phase] ?? agent.phase;
        context.priorOutputs[outputKey] = mapped;

        sendSSE(res, {
          type: 'agent-done',
          phase: agent.phase,
          message: `${agent.name} complete`,
          reasoning,
          data: mapped,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Agent failed';
        sendSSE(res, {
          type: 'agent-error',
          phase: agent.phase,
          message: `${agent.name} failed`,
          error: message,
        });
        // Continue with remaining agents even if one fails
      }
    }

    // Build the combined final result matching MusicAgentOutputs structure
    const parsedQuery = context.priorOutputs.parsedQuery as Record<string, unknown> | undefined;
    const graphData = context.priorOutputs.graphData as Record<string, unknown> | undefined;
    const semanticData = context.priorOutputs.semanticData as Record<string, unknown> | undefined;
    const recommendations = context.priorOutputs.recommendations as unknown[] | undefined;
    const explanationData = context.priorOutputs.explanationData as Record<string, unknown> | undefined;

    // Fetch real graph stats from PostgreSQL if available
    const pgGraphStats = await fetchGraphStatsFromPg();

    const combinedResult = {
      queryResult: {
        query: parsedQuery ?? {},
        artists: [
          ...((graphData?.artists as unknown[]) ?? []),
          ...((semanticData?.additionalArtists as unknown[]) ?? []),
        ],
        recordings: (graphData?.recordings as unknown[]) ?? [],
        releases: (graphData?.releases as unknown[]) ?? [],
        works: (graphData?.works as unknown[]) ?? [],
        labels: (graphData?.labels as unknown[]) ?? [],
        relationshipPaths: [
          ...((graphData?.relationshipPaths as unknown[]) ?? []),
          ...((semanticData?.additionalRelationshipPaths as unknown[]) ?? []),
        ],
        summary: (explanationData?.summary as string) ?? '',
        reasoning: (parsedQuery?.reasoning as string) ?? '',
      },
      recommendations: recommendations ?? [],
      catalogInsights: (explanationData?.catalogInsights as unknown[]) ?? [],
      graphStats: pgGraphStats ?? (explanationData?.graphStats as Record<string, unknown>) ?? {},
    };

    // Send final combined result
    sendSSE(res, {
      type: 'all-done',
      data: combinedResult,
    });
    res.end();
  } catch (err) {
    console.error('music/run-agents-sse error:', err);
    const message = err instanceof Error ? err.message : 'Orchestrator failed';
    if (res.headersSent) {
      sendSSE(res, { type: 'error', error: message });
      res.end();
    } else {
      res.status(502).json({ error: 'AI request failed', details: message });
    }
  }
});
