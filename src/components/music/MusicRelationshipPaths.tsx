import React from 'react';
import type { MusicRelationshipPath } from '../../types/music';

interface Props {
  paths: MusicRelationshipPath[];
}

const MusicRelationshipPaths: React.FC<Props> = ({ paths }) => {
  return (
    <div className="music-rp-root">
      <h3 className="music-rp-title">Relationship Graph</h3>

      {paths.length === 0 ? (
        <p className="music-rp-empty">No relationship paths found.</p>
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
