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
  // ── Single Artist Deep-Dive ───────────────────────────────────────────────
  { label: 'Miles Davis — Full Profile', query: 'Show me all recordings, releases, and collaborators for Miles Davis.', type: 'artist-discovery' },
  { label: 'David Bowie — Discography & Collaborations', query: "Explore David Bowie's discography, collaborations, and label history.", type: 'artist-discovery' },
  { label: 'Björk — Recordings & Collaborators', query: 'What recordings and releases does Björk have, and who has she collaborated with?', type: 'artist-discovery' },

  // ── Band Member Networks ──────────────────────────────────────────────────
  { label: 'Radiohead Members & Side Projects', query: 'Show the members of Radiohead and their solo projects and side bands.', type: 'collaboration-network' },
  { label: 'Beatles Post-Breakup Projects', query: 'Map the members of The Beatles and all their post-Beatles solo projects and recordings.', type: 'collaboration-network' },
  { label: 'Wu-Tang Clan Solo Discographies', query: 'Who are the members of Wu-Tang Clan and what solo recordings do they have?', type: 'collaboration-network' },

  // ── Label Rosters ─────────────────────────────────────────────────────────
  { label: 'Blue Note Records Roster', query: 'Show all artists who have released recordings on Blue Note Records.', type: 'label-intelligence' },
  { label: 'Sub Pop Artists & Genres', query: 'Which artists have releases on Sub Pop and what genres do they span?', type: 'label-intelligence' },
  { label: 'Motown Label Exploration', query: 'Explore the Motown label roster and the recordings released under it.', type: 'label-intelligence' },

  // ── Genre / Tag Clusters ──────────────────────────────────────────────────
  { label: 'Post-Punk Connections', query: 'Find artists tagged as post-punk and show how they connect through shared labels and collaborations.', type: 'scene-analysis' },
  { label: 'Trip Hop Artists & Recordings', query: 'Show artists connected to the trip hop genre and their key recordings.', type: 'scene-analysis' },
  { label: 'Shoegaze Label Landscape', query: 'Who are the top artists in the shoegaze genre and what labels have they released on?', type: 'scene-analysis' },

  // ── Simple Two-Artist Connections ─────────────────────────────────────────
  { label: 'Bowie ↔ Eno Connection', query: 'How are David Bowie and Brian Eno connected through collaborations and shared recordings?', type: 'collaboration-network' },
  { label: 'Hancock ↔ Miles Davis Link', query: 'What recordings and collaborations connect Herbie Hancock and Miles Davis?', type: 'collaboration-network' },

  // ── Recommendations ───────────────────────────────────────────────────────
  { label: 'If You Like Radiohead…', query: 'Recommend artists similar to Radiohead based on shared genres, collaborators, and labels.', type: 'recommendation' },
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
