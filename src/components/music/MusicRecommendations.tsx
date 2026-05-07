import React from 'react';
import type { MusicRecommendation } from '../../types/music';

interface Props {
  recommendations: MusicRecommendation[];
}

const MusicRecommendations: React.FC<Props> = ({ recommendations }) => {
  return (
    <div className="music-rec-root">
      <h3 className="music-rec-title">Recommendations</h3>

      {recommendations.length === 0 ? (
        <p className="music-rec-empty">No recommendations available.</p>
      ) : (
        <div className="music-rec-list">
          {recommendations.map((rec) => (
            <div key={rec.artistId} className="music-rec-card">
              <div className="music-rec-header">
                <span className="music-rec-name">{rec.artistName}</span>
                <span className="music-rec-score-badge">{Math.round(rec.score * 100)}%</span>
              </div>

              <div className="music-rec-score-bar-track">
                <div
                  className="music-rec-score-bar-fill"
                  style={{ width: `${Math.round(rec.score * 100)}%` }}
                />
              </div>

              <p className="music-rec-explanation">{rec.explanation}</p>

              <div className="music-rec-reasons">
                {rec.reasons.map((reason) => (
                  <span key={reason} className="music-rec-reason-chip">{reason}</span>
                ))}
              </div>

              <div className="music-rec-path">
                <span className="music-rec-path-label">Path:</span>
                <span className="music-rec-path-text">{rec.relationshipPath.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MusicRecommendations;
