// ---------------------------------------------------------------------------
// Music Intelligence Graph Demo — Type definitions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Progress tracking (follows RfpProgressStep pattern)
// ---------------------------------------------------------------------------

export type MusicAgentPhase =
  | 'query-parse'
  | 'graph-traversal'
  | 'semantic-search'
  | 'recommendation'
  | 'explanation'
  | 'complete';

export interface MusicProgressStep {
  phase: MusicAgentPhase;
  status: 'pending' | 'running' | 'done' | 'error';
  message: string;
  reasoning?: string;
}

// ---------------------------------------------------------------------------
// Core graph entities
// ---------------------------------------------------------------------------

export interface MusicArtist {
  id: string;
  name: string;
  type: 'person' | 'group' | 'orchestra' | 'choir' | 'character';
  area?: string;
  beginDate?: string;
  endDate?: string;
  genres: string[];
  description?: string;
}

export interface MusicRecording {
  id: string;
  title: string;
  artistCredits: string[];
  duration?: number;
  year?: number;
}

export interface MusicRelease {
  id: string;
  title: string;
  type: 'album' | 'single' | 'ep' | 'compilation' | 'soundtrack';
  date?: string;
  label?: string;
  country?: string;
  artistCredits: string[];
}

export interface MusicReleaseGroup {
  id: string;
  title: string;
  type: string;
  firstReleaseDate?: string;
}

export interface MusicWork {
  id: string;
  title: string;
  composers: string[];
  type?: string;
}

export interface MusicLabel {
  id: string;
  name: string;
  type?: string;
  area?: string;
  beginDate?: string;
  endDate?: string;
}

export interface MusicArea {
  id: string;
  name: string;
  type: 'country' | 'city' | 'region';
}

export interface MusicGenre {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Graph relationships
// ---------------------------------------------------------------------------

export type MusicRelationshipType =
  | 'PERFORMED'
  | 'WROTE'
  | 'RECORDED_AS'
  | 'APPEARS_ON'
  | 'PART_OF_GROUP'
  | 'RELEASED_BY'
  | 'ASSOCIATED_WITH_AREA'
  | 'HAS_GENRE'
  | 'COLLABORATED_WITH'
  | 'COVER_OF'
  | 'REMIX_OF'
  | 'MEMBER_OF'
  | 'ALIAS_OF';

export interface MusicRelationship {
  type: MusicRelationshipType;
  sourceId: string;
  sourceLabel: string;
  targetId: string;
  targetLabel: string;
  properties?: Record<string, string>;
}

export interface MusicRelationshipPath {
  nodes: { id: string; label: string; type: string }[];
  edges: MusicRelationship[];
  description: string;
}

// ---------------------------------------------------------------------------
// Query & results
// ---------------------------------------------------------------------------

export interface MusicQuery {
  naturalLanguageQuery: string;
  queryType:
    | 'artist-discovery'
    | 'collaboration-network'
    | 'scene-analysis'
    | 'label-intelligence'
    | 'catalog-quality'
    | 'recommendation';
  filters?: {
    decade?: string;
    country?: string;
    genre?: string;
    label?: string;
    maxHops?: number;
  };
}

export interface MusicQueryResult {
  query: MusicQuery;
  artists: MusicArtist[];
  recordings: MusicRecording[];
  releases: MusicRelease[];
  works: MusicWork[];
  labels: MusicLabel[];
  relationshipPaths: MusicRelationshipPath[];
  summary: string;
  reasoning?: string;
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export interface MusicRecommendation {
  artistId: string;
  artistName: string;
  score: number;
  explanation: string;
  relationshipPath: MusicRelationshipPath;
  reasons: string[];
}

// ---------------------------------------------------------------------------
// Catalog insights
// ---------------------------------------------------------------------------

export interface MusicCatalogInsight {
  type: 'duplicate' | 'missing-relationship' | 'incomplete-metadata' | 'enrichment-opportunity';
  entityId: string;
  entityName: string;
  entityType: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  suggestedAction: string;
  evidence: string[];
}

// ---------------------------------------------------------------------------
// Container for all agent outputs
// ---------------------------------------------------------------------------

export interface MusicAgentOutputs {
  queryResult: MusicQueryResult;
  recommendations: MusicRecommendation[];
  catalogInsights: MusicCatalogInsight[];
  graphStats: {
    totalNodes: number;
    totalEdges: number;
    artistCount: number;
    recordingCount: number;
    releaseCount: number;
    workCount: number;
    labelCount: number;
  };
}

// ---------------------------------------------------------------------------
// Top-level scenario
// ---------------------------------------------------------------------------

export interface MusicScenario {
  id: string;
  title: string;
  description: string;
  query?: MusicQuery;
  agentOutputs?: MusicAgentOutputs;
  progressSteps: MusicProgressStep[];
}
