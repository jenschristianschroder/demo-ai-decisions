import React from 'react';
import type { MusicCatalogInsight } from '../../types/music';

interface Props {
  insights: MusicCatalogInsight[];
}

const confidenceColor = (c: string): React.CSSProperties => {
  switch (c) {
    case 'high': return { background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' };
    case 'medium': return { background: '#fffbeb', color: '#92400e', borderColor: '#fde68a' };
    case 'low': return { background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' };
    default: return {};
  }
};

const typeColor = (t: string): React.CSSProperties => {
  switch (t) {
    case 'duplicate': return { background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' };
    case 'missing-relationship': return { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' };
    case 'incomplete-metadata': return { background: '#fffbeb', color: '#92400e', borderColor: '#fde68a' };
    case 'enrichment-opportunity': return { background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' };
    default: return {};
  }
};

const MusicCatalogInsights: React.FC<Props> = ({ insights }) => {
  return (
    <div className="music-ci-root">
      <h3 className="music-ci-title">Catalog Insights</h3>

      {insights.length === 0 ? (
        <p className="music-ci-empty">No catalog insights available.</p>
      ) : (
        <div className="music-ci-list">
          {insights.map((insight, idx) => (
            <div key={idx} className="music-ci-card">
              <div className="music-ci-header">
                <span className="music-ci-type-badge" style={typeColor(insight.type)}>
                  {insight.type.replace(/-/g, ' ')}
                </span>
                <span className="music-ci-entity-name">{insight.entityName}</span>
                <span className="music-ci-entity-type">({insight.entityType})</span>
                <span className="music-ci-confidence-badge" style={confidenceColor(insight.confidence)}>
                  {insight.confidence}
                </span>
              </div>

              <p className="music-ci-description">{insight.description}</p>

              <div className="music-ci-action">
                <span className="music-ci-action-label">Suggested Action:</span>
                <span className="music-ci-action-text">{insight.suggestedAction}</span>
              </div>

              {(insight.evidence ?? []).length > 0 && (
                <ul className="music-ci-evidence">
                  {(insight.evidence ?? []).map((e, ei) => (
                    <li key={ei} className="music-ci-evidence-item">{e}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MusicCatalogInsights;
