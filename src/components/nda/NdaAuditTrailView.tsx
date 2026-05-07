import React from 'react';
import type { NdaAuditEntry } from '../../types/nda';

interface Props {
  entries: NdaAuditEntry[];
}

const NdaAuditTrailView: React.FC<Props> = ({ entries }) => {
  return (
    <div className="nda-audit-root">
      <h3 className="nda-audit-title">Audit Trail</h3>
      <div className="nda-audit-table-wrap">
        <table className="nda-audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Agent</th>
              <th>Phase</th>
              <th>Action</th>
              <th>Detail</th>
              <th>Citations</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={i}>
                <td className="nda-audit-timestamp">{entry.timestamp}</td>
                <td>{entry.agent}</td>
                <td>
                  <span className="nda-audit-phase-badge">{entry.phase}</span>
                </td>
                <td>{entry.action}</td>
                <td>{entry.detail}</td>
                <td>
                  {entry.citations?.map((c, ci) => (
                    <span key={ci} className="nda-audit-citation">{c}</span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NdaAuditTrailView;
