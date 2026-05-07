import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { runMusicWorkflow } from '../lib/musicAi';
import { SAMPLE_QUERIES, setMusicData, resetMusicData } from '../data/mockMusicData';
import type { MusicProgressStep } from '../types/music';
import './MusicLandingScreen.css';

interface DataSourceInfo {
  source: 'postgresql' | 'mock';
  label: string;
}

const MusicLandingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedQueryType, setSelectedQueryType] = useState('scene-analysis');
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [progressSteps, setProgressSteps] = useState<MusicProgressStep[]>([]);
  const [dataSource, setDataSource] = useState<DataSourceInfo | null>(null);

  useEffect(() => {
    fetch('/api/ai/music/data-source')
      .then((res) => res.json())
      .then((info: DataSourceInfo) => setDataSource(info))
      .catch(() => setDataSource({ source: 'mock', label: 'AI-Generated Demo Data' }));
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
      const outputs = await runMusicWorkflow(
        query,
        selectedQueryType,
        {},
        (step) => {
          setProgressSteps(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(s => s.phase === step.phase);
            if (idx >= 0) {
              updated[idx] = step;
              return updated;
            }
            return [...updated, step];
          });
        },
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
          progressSteps: [],
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
              Discover hidden relationships across artists, recordings, releases, labels, and genres using PostgreSQL graph capabilities, semantic search, and AI-powered natural language queries.
            </p>
          </div>
        </div>

        <div className="music-landing-value-shift">
          <div className="music-landing-shift-from">
            <div className="music-landing-shift-label">From</div>
            <div className="music-landing-shift-items">
              <span>Keyword-only catalog search</span>
              <span>Manual relationship research</span>
              <span>Opaque recommendations</span>
              <span>Reactive metadata fixes</span>
            </div>
          </div>
          <div className="music-landing-shift-arrow">{'\u2192'}</div>
          <div className="music-landing-shift-to">
            <div className="music-landing-shift-label">To</div>
            <div className="music-landing-shift-items">
              <span>Graph-powered relationship discovery</span>
              <span>AI-assisted catalog intelligence</span>
              <span>Explainable graph-backed recommendations</span>
              <span>Proactive metadata enrichment</span>
            </div>
          </div>
        </div>

        <div className="music-landing-features">
          <div className="music-landing-feature">
            <span className="music-landing-feature-icon">{'\uD83D\uDD17'}</span>
            <div>
              <div className="music-landing-feature-title">Relationship Discovery</div>
              <div className="music-landing-feature-desc">Traverse artist collaborations, shared releases, labels, locations, and genre connections through graph paths</div>
            </div>
          </div>
          <div className="music-landing-feature">
            <span className="music-landing-feature-icon">{'\uD83C\uDFB5'}</span>
            <div>
              <div className="music-landing-feature-title">Scene Intelligence</div>
              <div className="music-landing-feature-desc">Map music scenes like 1990s Bristol trip-hop by following graph clusters of artists, labels, and releases</div>
            </div>
          </div>
          <div className="music-landing-feature">
            <span className="music-landing-feature-icon">{'\uD83D\uDCA1'}</span>
            <div>
              <div className="music-landing-feature-title">Explainable Recommendations</div>
              <div className="music-landing-feature-desc">Every recommendation includes the graph path and relationship evidence that supports it</div>
            </div>
          </div>
          <div className="music-landing-feature">
            <span className="music-landing-feature-icon">{'\uD83D\uDD0D'}</span>
            <div>
              <div className="music-landing-feature-title">Catalog Quality</div>
              <div className="music-landing-feature-desc">Detect duplicates, missing relationships, and enrichment opportunities across the music knowledge graph</div>
            </div>
          </div>
        </div>

        <div className="music-landing-scenario">
          <div className="music-landing-scenario-label">Demo Scenario</div>
          <div className="music-landing-scenario-text">MusicBrainz Knowledge Graph &middot; 5 agents &middot; Graph + AI workflow</div>
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

        <div className="music-landing-generate">
          <div className="music-landing-generate-label">Ask the Music Graph</div>
          <p className="music-landing-generate-hint">
            Select a sample query or type your own question to explore the music knowledge graph.
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
