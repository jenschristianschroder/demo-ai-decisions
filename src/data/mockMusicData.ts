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
  // ── Category 1: Multi-Hop Collaboration Networks ──────────────────────────
  { label: 'Wrecking Crew Session Network', query: 'Map the collaboration network of The Wrecking Crew — show all artists they performed as session musicians for, the recordings they appear on, and how they connect Phil Spector, Brian Wilson, and Frank Sinatra through shared sessions.', type: 'collaboration-network' },
  { label: 'Afrobeat to Hip-Hop Pipeline', query: 'Trace all collaboration paths from Fela Kuti through Afrobeat musicians to modern hip-hop artists like Jay-Z, Nas, and Erykah Badu — include producers, samplers, featured artists, and shared band members.', type: 'collaboration-network' },
  { label: 'Nashville Songwriter Circle', query: 'Show the full co-writing and collaboration network between Nashville songwriters Dolly Parton, Kris Kristofferson, Willie Nelson, and Johnny Cash — include all shared recordings, joint releases, co-written works, and mutual collaborators.', type: 'collaboration-network' },

  // ── Category 2: Artist Discovery via Path Finding ─────────────────────────
  { label: 'Classical to Electronic Bridge', query: 'Find all paths connecting Johann Sebastian Bach to Aphex Twin through performances, covers, samples, and collaborations — identify the key bridge artists who connect classical and electronic music.', type: 'artist-discovery' },
  { label: 'K-Pop to Motown Connection', query: 'Discover how BTS connects to The Supremes through producer lineages, songwriting credits, sampled works, and featured collaborations — show each hop in the relationship chain.', type: 'artist-discovery' },
  { label: 'Opera Meets Jazz', query: 'Find relationship paths between Luciano Pavarotti and John Coltrane — trace through shared concert venues, crossover collaborations, cover recordings, and mutual collaborators.', type: 'artist-discovery' },

  // ── Category 3: Scene & Geographic Analysis ───────────────────────────────
  { label: 'Seattle Grunge Family Tree', query: 'Build the complete family tree of Seattle grunge — show how Nirvana, Pearl Jam, Soundgarden, Alice in Chains, and Mudhoney are interconnected through band members, side projects, shared producers, and the Sub Pop label, including all pre-grunge and post-grunge projects.', type: 'scene-analysis' },
  { label: 'Afrobeats Global Network', query: 'Trace how the Afrobeats scene connects Lagos, London, and New York — show artists like Burna Boy, Wizkid, and Skepta, their label connections, featured collaborations with Western artists, and the geographic flow of the genre.', type: 'scene-analysis' },
  { label: 'Jamaican Sound System to Global Dancehall', query: "Map the evolution from Jamaican sound system culture through reggae and dub to global dancehall — connect Bob Marley, Lee 'Scratch' Perry, King Tubby, Shaggy, and Sean Paul through producer relationships, label lineages, and genre evolution.", type: 'scene-analysis' },

  // ── Category 4: Label Intelligence ────────────────────────────────────────
  { label: 'Independent Label Ecosystem', query: 'Compare the artist rosters and cross-pollination between Rough Trade, 4AD, Creation Records, and Factory Records — show shared artists, compilation appearances, and how these labels collectively defined UK indie music.', type: 'label-intelligence' },
  { label: 'Major Label Family Tree', query: 'Map the parent-subsidiary relationships between Universal Music Group, its sub-labels (Interscope, Def Jam, Republic, Island), and the artists on each — show which artists have moved between sub-labels and which recordings were released on different labels.', type: 'label-intelligence' },

  // ── Category 5: Composition & Work Relationships ──────────────────────────
  { label: "Standards Journey: 'Summertime'", query: "Trace all known recordings of the work 'Summertime' (by George Gershwin) — show how this single composition connects artists across jazz, blues, rock, pop, and classical through cover recordings, and map the relationship from each performer back to the original work.", type: 'artist-discovery' },
  { label: 'Lennon-McCartney Songwriting Web', query: 'Map every work written by Lennon-McCartney, all recordings of those works (including covers by other artists), the releases those recordings appear on, and the labels that released them — show the full 4-level deep graph from songwriter to label.', type: 'recommendation' },

  // ── Category 6: Catalog Quality & Enrichment ──────────────────────────────
  { label: 'Ghost Collaborations', query: 'Find pairs of artists who appear on the same recordings but have no direct COLLABORATED_WITH relationship in the graph — these are likely missing relationship edges that should be added.', type: 'catalog-quality' },
  { label: 'Orphaned Recordings', query: 'Find recordings that have artist credits but no PERFORMED relationship edge in the graph, and identify which artist-recording links are missing from the knowledge graph.', type: 'catalog-quality' },

  // ── Category 7: Recommendation via Graph Similarity ───────────────────────
  { label: 'If You Like Radiohead…', query: 'Recommend artists similar to Radiohead by finding artists within 3 hops who share genres, collaborators, labels, or have covered the same works — rank by number of distinct relationship paths.', type: 'recommendation' },
  { label: 'Genre-Crossing Pioneers', query: 'Find artists who bridge the most genre communities — those connected by collaborations or shared recordings to artists in at least 3 different genre clusters. Recommend the top bridge artists.', type: 'recommendation' },
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
