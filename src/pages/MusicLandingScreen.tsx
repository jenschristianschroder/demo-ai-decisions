import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { runMusicWorkflow } from '../lib/musicAi';
import { SAMPLE_QUERIES, setMusicData, resetMusicData } from '../data/mockMusicData';
import type {
  MusicProgressStep,
  DataSourceInfo,
  TableCounts,
  MusicGraphTraversalOptions,
} from '../types/music';
import { DEFAULT_MUSIC_TRAVERSAL_OPTIONS } from '../types/music';
import './MusicLandingScreen.css';

/** Format large numbers with locale-aware separators (e.g. 1,234,567). */
const fmt = (n: number) => n.toLocaleString();

/** Convert a snake_case table name to a readable label. */
const tableLabel = (name: string) =>
  name.replace(/^l_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

/**
 * UI metadata for the configurable graph-traversal knobs. The min/max
 * bounds here mirror the clamps applied server-side in
 * `server/src/routes/musicAgents.ts::normalizeTraversalOptions`.
 */
const TRAVERSAL_FIELDS: {
  key: keyof Required<MusicGraphTraversalOptions>;
  label: string;
  help: string;
  min: number;
  max: number;
}[] = [
  {
    key: 'maxHops',
    label: 'Max hops',
    help: 'Depth of collaborator traversal in the graph (1–3).',
    min: 1,
    max: 3,
  },
  {
    key: 'maxArtistsPerEntity',
    label: 'Artists per entity',
    help: 'How many candidate artists to resolve per name in the query.',
    min: 1,
    max: 10,
  },
  {
    key: 'maxRecordingsPerArtist',
    label: 'Recordings per artist',
    help: 'Max recordings fetched for each resolved artist.',
    min: 0,
    max: 50,
  },
  {
    key: 'maxReleasesPerArtist',
    label: 'Releases per artist',
    help: 'Max releases fetched for each resolved artist.',
    min: 0,
    max: 50,
  },
  {
    key: 'maxCollaborators',
    label: 'Collaborators per seed',
    help: 'Max collaborators returned per seed artist.',
    min: 0,
    max: 25,
  },
  {
    key: 'maxBandMembers',
    label: 'Band members per artist',
    help: 'Max band-member relationships per resolved artist.',
    min: 0,
    max: 100,
  },
];

const MusicLandingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedQueryType, setSelectedQueryType] = useState('scene-analysis');
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [progressSteps, setProgressSteps] = useState<MusicProgressStep[]>([]);
  const [dataSource, setDataSource] = useState<DataSourceInfo | null>(null);
  const [tableCounts, setTableCounts] = useState<TableCounts | null>(null);
  const [traversal, setTraversal] = useState<Required<MusicGraphTraversalOptions>>({
    ...DEFAULT_MUSIC_TRAVERSAL_OPTIONS,
  });
  const [traversalOpen, setTraversalOpen] = useState(false);

  useEffect(() => {
    console.log('[MusicLanding] Fetching data source status...');
    fetch('/api/ai/music/data-source')
      .then((res) => {
        console.log('[MusicLanding] /api/ai/music/data-source response status:', res.status);
        return res.json();
      })
      .then((info: DataSourceInfo) => {
        console.log('[MusicLanding] Data source info received:', JSON.stringify(info));
        setDataSource(info);
        if (info.source === 'postgresql') {
          fetch('/api/ai/music/table-counts')
            .then((r) => r.json())
            .then((counts: TableCounts) => setTableCounts(counts))
            .catch((err) => console.warn('[MusicLanding] Failed to fetch table counts:', err));
        }
      })
      .catch((err) => {
        console.warn('[MusicLanding] Failed to fetch data source status:', err);
        setDataSource({ source: 'mock', label: 'AI-Generated Demo Data' });
      });
  }, []);

  const handleSelectSampleQuery = (index: number) => {
    const sample = SAMPLE_QUERIES[index];
    if (sample) {
      setQuery(sample.query);
      setSelectedQueryType(sample.type);
    }
  };

  const handleRunQuery = async () => {
    if (!query.trim()) return;
    setGenerating(true);
    setSuccessMsg('');
    setErrorMsg('');
    setProgressSteps([]);
    try {
      // Local accumulator – React state closures would be stale by the time
      // we persist the scenario, so we keep our own list in sync with setProgressSteps.
      const collectedSteps: MusicProgressStep[] = [];
      const outputs = await runMusicWorkflow(
        query,
        selectedQueryType,
        {},
        (step) => {
          const idx = collectedSteps.findIndex(s => s.phase === step.phase);
          if (idx >= 0) {
            collectedSteps[idx] = step;
          } else {
            collectedSteps.push(step);
          }
          setProgressSteps([...collectedSteps]);
        },
        traversal,
      );

      setMusicData({
        scenario: {
          id: 'music-graph-query',
          title: 'Music Intelligence Graph',
          description: query,
          query: {
            naturalLanguageQuery: query,
            queryType: selectedQueryType as import('../types/music').MusicQuery['queryType'],
          },
          agentOutputs: outputs,
          progressSteps: collectedSteps,
        },
      });
      setSuccessMsg('Music graph query completed successfully');
      setTimeout(() => navigate('/music/dashboard'), 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong while running the query. Please try again.';
      setErrorMsg(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    resetMusicData();
    setQuery('');
    setSelectedQueryType('scene-analysis');
    setSuccessMsg('');
    setErrorMsg('');
    setProgressSteps([]);
    setTraversal({ ...DEFAULT_MUSIC_TRAVERSAL_OPTIONS });
  };

  return (
    <div className="music-landing-root">
      <div className="music-landing-card">
        <div className="music-landing-badge">Music Intelligence</div>
        {dataSource && (
          <div className={`music-landing-data-source music-landing-data-source--${dataSource.source}`}>
            <span className="music-landing-data-source-dot" />
            {dataSource.label}
          </div>
        )}

        <div className="music-landing-header">
          <div className="music-landing-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#111111"/>
              <circle cx="10" cy="10" r="3" fill="white" opacity="0.9"/>
              <circle cx="22" cy="10" r="3" fill="white" opacity="0.9"/>
              <circle cx="16" cy="22" r="3" fill="white" opacity="0.9"/>
              <circle cx="10" cy="22" r="2" fill="white" opacity="0.6"/>
              <circle cx="22" cy="22" r="2" fill="white" opacity="0.6"/>
              <line x1="10" y1="10" x2="22" y2="10" stroke="white" strokeWidth="1.2" opacity="0.5"/>
              <line x1="10" y1="10" x2="16" y2="22" stroke="white" strokeWidth="1.2" opacity="0.5"/>
              <line x1="22" y1="10" x2="16" y2="22" stroke="white" strokeWidth="1.2" opacity="0.5"/>
              <line x1="10" y1="22" x2="16" y2="22" stroke="white" strokeWidth="1" opacity="0.4"/>
              <line x1="22" y1="22" x2="16" y2="22" stroke="white" strokeWidth="1" opacity="0.4"/>
            </svg>
          </div>
          <div className="music-landing-title-block">
            <h1 className="music-landing-title">Music Intelligence Graph</h1>
            <p className="music-landing-subtitle">
              Turn complex, interconnected data into actionable intelligence. This demo showcases how graph databases, vector search, and AI agents work together to surface hidden relationships, deliver explainable recommendations, and drive smarter decisions from your enterprise knowledge graph.
            </p>
          </div>
        </div>

        <div className="music-landing-value-shift">
          <div className="music-landing-shift-from">
            <div className="music-landing-shift-label">From</div>
            <div className="music-landing-shift-items">
              <span>Siloed data with no connections</span>
              <span>Manual, time-consuming research</span>
              <span>Black-box recommendations</span>
              <span>Reactive data quality management</span>
            </div>
          </div>
          <div className="music-landing-shift-arrow">{'\u2192'}</div>
          <div className="music-landing-shift-to">
            <div className="music-landing-shift-label">To</div>
            <div className="music-landing-shift-items">
              <span>Graph-powered relationship discovery</span>
              <span>Natural language knowledge exploration</span>
              <span>Transparent, evidence-based insights</span>
              <span>Proactive data enrichment &amp; quality</span>
            </div>
          </div>
        </div>

        <div className="music-landing-features">
          <div className="music-landing-feature">
            <span className="music-landing-feature-icon">{'\uD83D\uDD17'}</span>
            <div>
              <div className="music-landing-feature-title">Relationship Discovery</div>
              <div className="music-landing-feature-desc">Traverse multi-hop connections across entities to uncover hidden links, clusters, and influence networks within your data</div>
            </div>
          </div>
          <div className="music-landing-feature">
            <span className="music-landing-feature-icon">{'\uD83D\uDCAC'}</span>
            <div>
              <div className="music-landing-feature-title">Natural Language Queries</div>
              <div className="music-landing-feature-desc">Ask questions in plain English and let AI agents translate intent into graph traversals and semantic searches</div>
            </div>
          </div>
          <div className="music-landing-feature">
            <span className="music-landing-feature-icon">{'\uD83D\uDCA1'}</span>
            <div>
              <div className="music-landing-feature-title">Explainable Recommendations</div>
              <div className="music-landing-feature-desc">Every insight includes the graph path and evidence trail that supports it — full transparency, no black boxes</div>
            </div>
          </div>
          <div className="music-landing-feature">
            <span className="music-landing-feature-icon">{'\uD83D\uDD0D'}</span>
            <div>
              <div className="music-landing-feature-title">Data Quality Intelligence</div>
              <div className="music-landing-feature-desc">Proactively detect duplicates, missing connections, and enrichment opportunities across your knowledge graph</div>
            </div>
          </div>
        </div>

        <div className="music-landing-scenario">
          <div className="music-landing-scenario-label">Demo Scenario</div>
          <div className="music-landing-scenario-text">Enterprise Knowledge Graph &middot; 5 AI Agents &middot; Graph + Vector + AI workflow</div>
        </div>

        <div className="music-landing-outcomes">
          <div className="music-landing-outcomes-title">Agents Involved</div>
          <div className="music-landing-outcomes-grid">
            <div className="music-landing-outcome">
              <span className="music-landing-outcome-metric">{'\uD83D\uDD0E'}</span>
              <span className="music-landing-outcome-text">Query Parser</span>
            </div>
            <div className="music-landing-outcome">
              <span className="music-landing-outcome-metric">{'\uD83D\uDD78\uFE0F'}</span>
              <span className="music-landing-outcome-text">Graph Traversal</span>
            </div>
            <div className="music-landing-outcome">
              <span className="music-landing-outcome-metric">{'\uD83E\uDDE0'}</span>
              <span className="music-landing-outcome-text">Semantic Search</span>
            </div>
            <div className="music-landing-outcome">
              <span className="music-landing-outcome-metric">{'\uD83C\uDFAF'}</span>
              <span className="music-landing-outcome-text">Recommendation Engine</span>
            </div>
            <div className="music-landing-outcome">
              <span className="music-landing-outcome-metric">{'\uD83D\uDCDD'}</span>
              <span className="music-landing-outcome-text">Explanation Builder</span>
            </div>
          </div>
        </div>

        {tableCounts && (tableCounts.coreEntities.length > 0 || tableCounts.relationships.length > 0) && (
          <div className="music-landing-table-counts">
            <div className="music-landing-table-counts-title">Knowledge Graph Data Volume</div>
            {tableCounts.coreEntities.length > 0 && (
              <div className="music-landing-table-group">
                <div className="music-landing-table-group-label">Core Entities</div>
                <div className="music-landing-table-grid">
                  {tableCounts.coreEntities.map((t) => (
                    <div key={t.table} className="music-landing-table-item">
                      <span className="music-landing-table-count">{fmt(t.count)}</span>
                      <span className="music-landing-table-name">{tableLabel(t.table)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tableCounts.relationships.length > 0 && (
              <div className="music-landing-table-group">
                <div className="music-landing-table-group-label">Relationships</div>
                <div className="music-landing-table-grid">
                  {tableCounts.relationships.map((t) => (
                    <div key={t.table} className="music-landing-table-item">
                      <span className="music-landing-table-count">{fmt(t.count)}</span>
                      <span className="music-landing-table-name">{tableLabel(t.table)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="music-landing-generate">
          <div className="music-landing-generate-label">Ask the Knowledge Graph</div>
          <p className="music-landing-generate-hint">
            Select a sample query or type your own question to explore relationships and insights across the knowledge graph.
          </p>

          <select
            className="music-landing-query-select"
            value=""
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              if (!isNaN(idx)) handleSelectSampleQuery(idx);
            }}
          >
            <option value="" disabled>Select a sample query…</option>
            {SAMPLE_QUERIES.map((sq, i) => (
              <option key={i} value={i}>{sq.label}</option>
            ))}
          </select>

          <textarea
            className="music-landing-query-textarea"
            placeholder="Type a natural language query…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="music-landing-traversal">
            <button
              type="button"
              className="music-landing-traversal-toggle"
              onClick={() => setTraversalOpen((v) => !v)}
              aria-expanded={traversalOpen}
            >
              <span className="music-landing-traversal-caret">
                {traversalOpen ? '\u25BE' : '\u25B8'}
              </span>
              Graph traversal settings
              <span className="music-landing-traversal-summary">
                hops {traversal.maxHops} &middot; artists {traversal.maxArtistsPerEntity} &middot;
                {' '}recordings {traversal.maxRecordingsPerArtist} &middot; releases {traversal.maxReleasesPerArtist}
              </span>
            </button>
            {traversalOpen && (
              <div className="music-landing-traversal-panel">
                <p className="music-landing-traversal-hint">
                  Tune how deep and wide the graph traversal walks the knowledge graph. Higher values surface more relationships but take longer to run.
                </p>
                <div className="music-landing-traversal-grid">
                  {TRAVERSAL_FIELDS.map((f) => (
                    <label key={f.key} className="music-landing-traversal-field">
                      <span className="music-landing-traversal-label">{f.label}</span>
                      <input
                        type="number"
                        className="music-landing-traversal-input"
                        min={f.min}
                        max={f.max}
                        step={1}
                        value={traversal[f.key]}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value, 10);
                          const next = Number.isFinite(raw)
                            ? Math.min(Math.max(raw, f.min), f.max)
                            : DEFAULT_MUSIC_TRAVERSAL_OPTIONS[f.key];
                          setTraversal((prev) => ({ ...prev, [f.key]: next }));
                        }}
                        disabled={generating}
                      />
                      <span className="music-landing-traversal-help">{f.help}</span>
                    </label>
                  ))}
                </div>
                <div className="music-landing-traversal-actions">
                  <button
                    type="button"
                    className="music-landing-traversal-reset"
                    onClick={() => setTraversal({ ...DEFAULT_MUSIC_TRAVERSAL_OPTIONS })}
                    disabled={generating}
                  >
                    Reset to defaults
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="music-landing-generate-actions">
            <button
              className="music-landing-btn-primary music-landing-generate-btn"
              onClick={handleRunQuery}
              disabled={generating || !query.trim()}
            >
              {generating ? 'Running\u2026' : 'Run Query'}
            </button>
            {successMsg && (
              <button className="music-landing-generate-reset" onClick={handleReset}>
                Reset
              </button>
            )}
          </div>

          {generating && progressSteps.length === 0 && (
            <div className="music-landing-generate-status music-landing-generate-loading">
              <span className="music-landing-spinner" />
              Initializing agents...
            </div>
          )}
          {progressSteps.length > 0 && (
            <div className="music-landing-progress-list">
              {progressSteps.map((step) => (
                <div
                  key={step.phase}
                  className={`music-landing-progress-step music-landing-progress-${step.status}`}
                >
                  <span className="music-landing-progress-icon">
                    {step.status === 'pending' && '\u25CB'}
                    {step.status === 'running' && <span className="music-landing-spinner-sm" />}
                    {step.status === 'done' && '\u2713'}
                    {step.status === 'error' && '\u2717'}
                  </span>
                  <span className="music-landing-progress-msg">{step.message}</span>
                </div>
              ))}
            </div>
          )}
          {successMsg && (
            <div className="music-landing-generate-status music-landing-generate-success">
              {'\u2713'} {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="music-landing-generate-status music-landing-generate-error">
              {errorMsg}
            </div>
          )}
        </div>

        <div className="music-landing-actions">
          <button className="music-landing-btn-primary music-landing-btn-launch" onClick={() => navigate('/music/dashboard')}>
            Launch Demo
          </button>
          <button className="music-landing-btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </div>

        <div className="music-landing-footer">
          <span className="music-landing-footer-tag">Azure AI Foundry</span>
          <span className="music-landing-footer-sep">&middot;</span>
          <span className="music-landing-footer-tag">PostgreSQL + Apache AGE</span>
          <span className="music-landing-footer-sep">&middot;</span>
          <span className="music-landing-footer-tag">pgvector</span>
          <span className="music-landing-footer-sep">&middot;</span>
          <span className="music-landing-footer-tag">React + TypeScript</span>
        </div>
      </div>
    </div>
  );
};

export default MusicLandingScreen;
