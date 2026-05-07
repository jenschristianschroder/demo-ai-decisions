import React from 'react';
import type { NdaVersionEntry } from '../../types/nda';

interface Props {
  versions: NdaVersionEntry[];
}

const NdaVersionHistoryView: React.FC<Props> = ({ versions }) => {
  return (
    <div className="nda-versions-root">
      <h3 className="nda-versions-title">Version History</h3>
      <div className="nda-versions-timeline">
        {versions.map((v) => (
          <div key={v.version} className="nda-versions-entry">
            <div className="nda-versions-marker" />
            <div className="nda-versions-content">
              <div className="nda-versions-header">
                <span className="nda-versions-version">v{v.version}</span>
                <span className="nda-versions-date">{v.date}</span>
                <span className="nda-versions-action">{v.action}</span>
              </div>
              <div className="nda-versions-actor">{v.actor}</div>
              <div className="nda-versions-summary">{v.summary}</div>
              {v.changes && v.changes.length > 0 && (
                <ul className="nda-versions-changes">
                  {v.changes.map((ch, i) => <li key={i}>{ch}</li>)}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NdaVersionHistoryView;
