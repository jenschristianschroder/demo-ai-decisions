import React from 'react';
import type { MusicQueryResult } from '../../types/music';

interface Props {
  queryResult: MusicQueryResult;
}

const MusicQueryResults: React.FC<Props> = ({ queryResult }) => {
  const artists = queryResult.artists ?? [];
  const recordings = queryResult.recordings ?? [];
  const releases = queryResult.releases ?? [];
  const works = queryResult.works ?? [];
  const labels = queryResult.labels ?? [];

  return (
    <div className="music-qr-root">
      <h3 className="music-qr-title">Query Results</h3>

      <div className="music-qr-query-box">
        <span className="music-qr-query-label">Query</span>
        <span className="music-qr-query-text">{queryResult.query?.naturalLanguageQuery ?? ''}</span>
      </div>

      <p className="music-qr-summary">{queryResult.summary}</p>

      {queryResult.reasoning && (
        <p className="music-qr-reasoning">{queryResult.reasoning}</p>
      )}

      {artists.length > 0 && (
        <>
          <h4 className="music-qr-section-title">Artists ({artists.length})</h4>
          <div className="music-qr-grid">
            {artists.map((a) => (
              <div key={a.id} className="music-qr-card">
                <div className="music-qr-card-name">{a.name}</div>
                <div className="music-qr-card-meta">
                  <span className="music-qr-badge">{a.type}</span>
                  {a.area && <span className="music-qr-meta-text">{a.area}</span>}
                </div>
                {(a.genres ?? []).length > 0 && (
                  <div className="music-qr-tags">
                    {(a.genres ?? []).map((g) => (
                      <span key={g} className="music-qr-tag">{g}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {recordings.length > 0 && (
        <>
          <h4 className="music-qr-section-title">Recordings ({recordings.length})</h4>
          <div className="music-qr-grid">
            {recordings.map((r) => (
              <div key={r.id} className="music-qr-card">
                <div className="music-qr-card-name">{r.title}</div>
                <div className="music-qr-card-meta">
                  <span className="music-qr-meta-text">{(r.artistCredits ?? []).join(', ')}</span>
                  {r.year && <span className="music-qr-meta-text">{r.year}</span>}
                  {r.duration && <span className="music-qr-meta-text">{Math.floor(r.duration / 60)}:{String(r.duration % 60).padStart(2, '0')}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {releases.length > 0 && (
        <>
          <h4 className="music-qr-section-title">Releases ({releases.length})</h4>
          <div className="music-qr-grid">
            {releases.map((r) => (
              <div key={r.id} className="music-qr-card">
                <div className="music-qr-card-name">{r.title}</div>
                <div className="music-qr-card-meta">
                  <span className="music-qr-badge">{r.type}</span>
                  {r.date && <span className="music-qr-meta-text">{r.date}</span>}
                  {r.label && <span className="music-qr-meta-text">{r.label}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {works.length > 0 && (
        <>
          <h4 className="music-qr-section-title">Works ({works.length})</h4>
          <div className="music-qr-grid">
            {works.map((w) => (
              <div key={w.id} className="music-qr-card">
                <div className="music-qr-card-name">{w.title}</div>
                <div className="music-qr-card-meta">
                  <span className="music-qr-meta-text">{(w.composers ?? []).join(', ')}</span>
                  {w.type && <span className="music-qr-badge">{w.type}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {labels.length > 0 && (
        <>
          <h4 className="music-qr-section-title">Labels ({labels.length})</h4>
          <div className="music-qr-grid">
            {labels.map((l) => (
              <div key={l.id} className="music-qr-card">
                <div className="music-qr-card-name">{l.name}</div>
                <div className="music-qr-card-meta">
                  {l.type && <span className="music-qr-badge">{l.type}</span>}
                  {l.area && <span className="music-qr-meta-text">{l.area}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MusicQueryResults;
