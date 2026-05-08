import React, { useState } from 'react';
import type { MusicRelationshipPath } from '../../types/music';
import MusicForceGraph from './MusicForceGraph';

type ViewMode = 'graph' | 'list';

interface Props {
  paths: MusicRelationshipPath[];
}

const MusicRelationshipPaths: React.FC<Props> = ({ paths }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Debug: log incoming relationship path data so we can inspect the shape
  console.debug('[MusicRelationshipPaths] paths received:', paths);
  console.debug('[MusicRelationshipPaths] paths count:', paths.length);
  if (paths.length > 0) {
    console.debug('[MusicRelationshipPaths] first path sample:', JSON.stringify(paths[0], null, 2));
  }

  return (
    <div className="music-rp-root">
      <div className="music-rp-header">
        <h3 className="music-rp-title">Relationship Graph</h3>
        {paths.length > 0 && (
          <div className="music-rp-toggle">
            <button
              className={`music-rp-toggle-btn ${viewMode === 'graph' ? 'music-rp-toggle-btn--active' : ''}`}
              onClick={() => setViewMode('graph')}
            >
              Force Graph
            </button>
            <button
              className={`music-rp-toggle-btn ${viewMode === 'list' ? 'music-rp-toggle-btn--active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              Path List
            </button>
          </div>
        )}
      </div>

      {paths.length === 0 ? (
        <p className="music-rp-empty">No relationship paths found.</p>
      ) : viewMode === 'graph' ? (
        <MusicForceGraph paths={paths} />
      ) : (
        <div className="music-rp-list">
          {paths.map((path, idx) => (
            <div key={idx} className="music-rp-card">
              <div className="music-rp-chain">
                {path.nodes.map((node, ni) => (
                  <React.Fragment key={node.id + ni}>
                    <span className="music-rp-node">
                      <span className="music-rp-node-label">{node.label}</span>
                      <span className="music-rp-node-type">{node.type}</span>
                    </span>
                    {ni < path.edges.length && (
                      <span className="music-rp-edge">
                        <span className="music-rp-arrow">→</span>
                        <span className="music-rp-edge-type">{path.edges[ni].type.replace(/_/g, ' ')}</span>
                        <span className="music-rp-arrow">→</span>
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="music-rp-description">{path.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MusicRelationshipPaths;
