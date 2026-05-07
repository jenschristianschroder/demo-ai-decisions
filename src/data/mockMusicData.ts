import type { MusicScenario, MusicQuery } from '../types/music';

// ---------------------------------------------------------------------------
// GeneratedMusicData — used by setMusicData / resetMusicData
// ---------------------------------------------------------------------------

export interface GeneratedMusicData {
  scenario: MusicScenario;
}

// ---------------------------------------------------------------------------
// Sample queries for the landing page
// ---------------------------------------------------------------------------

export const SAMPLE_QUERIES: { label: string; query: string; type: MusicQuery['queryType'] }[] = [
  { label: 'Bristol Trip-Hop Network', query: 'Find artists connected to 1990s UK trip-hop through collaborations, labels, or shared releases, and explain the relationship paths.', type: 'scene-analysis' },
  { label: 'Brian Eno Collaborations', query: 'Find artists within two relationship hops of Brian Eno who are connected through production, collaboration, or shared releases.', type: 'collaboration-network' },
  { label: 'Talking Heads Recommendations', query: 'Recommend artists related to Talking Heads and explain the graph path for each recommendation.', type: 'recommendation' },
  { label: 'UK Electronic Labels', query: 'Which labels are most connected to early UK electronic music?', type: 'label-intelligence' },
  { label: 'Bob Dylan Covers', query: 'Which recordings are covers of songs written by Bob Dylan?', type: 'artist-discovery' },
  { label: 'Berlin Electronic 1970s', query: 'Find albums connected to Berlin electronic music in the 1970s.', type: 'scene-analysis' },
  { label: 'Catalog Quality Check', query: 'Which recordings have strong evidence of being connected to a work but are missing that relationship?', type: 'catalog-quality' },
  { label: 'International Collaborations', query: 'Which releases connect artists from Japan, Germany, and the United States?', type: 'collaboration-network' },
];

// ---------------------------------------------------------------------------
// Default scenario
// ---------------------------------------------------------------------------

const ORIGINAL_SCENARIO: MusicScenario = {
  id: 'music-graph-demo',
  title: 'Music Intelligence Graph',
  description: 'Discover hidden relationships across artists, recordings, releases, labels, and genres using graph-backed AI.',
  progressSteps: [],
};

// ---------------------------------------------------------------------------
// Mutable state (allows AI-generated data to replace defaults)
// ---------------------------------------------------------------------------

let currentScenario: MusicScenario = structuredClone(ORIGINAL_SCENARIO);

export function setMusicData(data: GeneratedMusicData): void {
  currentScenario = data.scenario;
}

export function resetMusicData(): void {
  currentScenario = structuredClone(ORIGINAL_SCENARIO);
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

export function getMusicScenario(): MusicScenario {
  return currentScenario;
}

export function updateMusicScenario(updater: (s: MusicScenario) => MusicScenario): void {
  currentScenario = updater(currentScenario);
}
