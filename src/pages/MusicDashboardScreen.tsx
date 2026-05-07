import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMusicScenario, resetMusicData } from '../data/mockMusicData';
import MusicQueryResults from '../components/music/MusicQueryResults';
import MusicRelationshipPaths from '../components/music/MusicRelationshipPaths';
import MusicRecommendations from '../components/music/MusicRecommendations';
import MusicCatalogInsights from '../components/music/MusicCatalogInsights';
import MusicAgentTimeline from '../components/music/MusicAgentTimeline';
import type { DataSourceInfo } from '../types/music';
import './MusicDashboardScreen.css';

type TabId =
  | 'query'
  | 'graph'
  | 'recommendations'
  | 'insights'
  | 'timeline';

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'query', label: 'Query Results' },
  { id: 'graph', label: 'Relationship Graph' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'insights', label: 'Catalog Insights' },
  { id: 'timeline', label: 'Agent Timeline' },
];

const MusicDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const scenario = getMusicScenario();
  const [activeTab, setActiveTab] = useState<TabId>('query');
  const outputs = scenario.agentOutputs;
  const [dataSource, setDataSource] = useState<DataSourceInfo | null>(null);

  useEffect(() => {
    console.log('[MusicDashboard] Fetching data source status...');
    fetch('/api/ai/music/data-source')
      .then((res) => {
        console.log('[MusicDashboard] /api/ai/music/data-source response status:', res.status);
        return res.json();
      })
      .then((info: DataSourceInfo) => {
        console.log('[MusicDashboard] Data source info received:', JSON.stringify(info));
        setDataSource(info);
      })
      .catch((err) => {
        console.warn('[MusicDashboard] Failed to fetch data source status:', err);
        setDataSource({ source: 'mock', label: 'AI-Generated Demo Data' });
      });
  }, []);

  const handleReset = () => {
    resetMusicData();
    navigate('/music');
  };

  return (
    <div className="music-dash-root">
      <header className="music-dash-header">
        <div className="music-dash-header-inner">
          <div className="music-dash-breadcrumb">
            <button className="music-dash-breadcrumb-link" onClick={() => navigate('/')}>
              Demos
            </button>
            <span className="music-dash-breadcrumb-sep">›</span>
            <button className="music-dash-breadcrumb-link" onClick={() => navigate('/music')}>
              Music Intelligence Demo
            </button>
            <span className="music-dash-breadcrumb-sep">›</span>
            <span className="music-dash-breadcrumb-current">Dashboard</span>
          </div>
          <div className="music-dash-title-row">
            <div>
              <h1 className="music-dash-title">{scenario.title}</h1>
              <div className="music-dash-subtitle">{scenario.description}</div>
            </div>
            {dataSource && (
              <div className={`music-dash-data-source music-dash-data-source--${dataSource.source}`}>
                <span className="music-dash-data-source-dot" />
                {dataSource.label}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="music-dash-tab-bar">
        <div className="music-dash-tab-bar-inner">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`music-dash-tab ${activeTab === tab.id ? 'music-dash-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="music-dash-main">
        {!outputs ? (
          <div className="music-dash-empty">
            <p className="music-dash-empty-text">No analysis data available. Run a query from the landing page to generate results.</p>
            <button className="music-dash-btn-secondary" onClick={() => navigate('/music')}>
              ← Back to Music Landing
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'query' && (
              <MusicQueryResults queryResult={outputs.queryResult} />
            )}
            {activeTab === 'graph' && (
              <MusicRelationshipPaths paths={outputs.queryResult.relationshipPaths} />
            )}
            {activeTab === 'recommendations' && (
              <MusicRecommendations recommendations={outputs.recommendations} />
            )}
            {activeTab === 'insights' && (
              <MusicCatalogInsights insights={outputs.catalogInsights} />
            )}
            {activeTab === 'timeline' && (
              <MusicAgentTimeline steps={scenario.progressSteps} />
            )}
          </>
        )}

        <div className="music-dash-actions-bar">
          <button className="music-dash-btn-secondary" onClick={() => navigate('/music')}>
            ← Back to Landing
          </button>
          <button className="music-dash-btn-danger" onClick={handleReset}>
            Reset Demo
          </button>
        </div>
      </main>
    </div>
  );
};

export default MusicDashboardScreen;
