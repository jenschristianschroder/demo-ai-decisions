import React from 'react';
import type { PlaybookDeviation } from '../../types/contract';

interface Props {
  deviations: PlaybookDeviation[];
}

const severityColor = (s: string): string => {
  switch (s) {
    case 'critical': return '#7f1d1d';
    case 'high': return '#b91c1c';
    case 'medium': return '#a16207';
    case 'low': return '#166534';
    default: return '#666666';
  }
};

const severityBg = (s: string): string => {
  switch (s) {
    case 'critical': return '#fef2f2';
    case 'high': return '#fef2f2';
    case 'medium': return '#fffbeb';
    case 'low': return '#f0fdf4';
    default: return '#f8f9fa';
  }
};

const deviationTypeColor = (t: string): string => {
  switch (t) {
    case 'missing': return '#b91c1c';
    case 'weaker': return '#a16207';
    case 'stronger': return '#166534';
    case 'different': return '#1d4ed8';
    case 'non-standard': return '#7c3aed';
    case 'compliant': return '#047857';
    default: return '#666666';
  }
};

const deviationTypeBg = (t: string): string => {
  switch (t) {
    case 'missing': return '#fef2f2';
    case 'weaker': return '#fffbeb';
    case 'stronger': return '#f0fdf4';
    case 'different': return '#eff6ff';
    case 'non-standard': return '#f5f3ff';
    case 'compliant': return '#f0fdf4';
    default: return '#f8f9fa';
  }
};

const ContractDeviationsView: React.FC<Props> = ({ deviations }) => {
  return (
    <div className="contract-deviations-root">
      <h3 className="contract-deviations-title">Playbook Deviations</h3>
      <div className="contract-deviations-table-wrap">
        <table className="contract-deviations-table">
          <thead>
            <tr>
              <th>Clause ID</th>
              <th>Deviation Type</th>
              <th>Severity</th>
              <th>Contract Language</th>
              <th>Playbook Language</th>
              <th>Explanation</th>
            </tr>
          </thead>
          <tbody>
            {deviations.map((dev, idx) => (
              <tr key={`${dev.clauseId}-${idx}`}>
                <td className="contract-deviations-clause-id">{dev.clauseId}</td>
                <td>
                  <span
                    className="contract-deviations-type-badge"
                    style={{ color: deviationTypeColor(dev.deviationType), background: deviationTypeBg(dev.deviationType) }}
                  >
                    {dev.deviationType}
                  </span>
                </td>
                <td>
                  <span
                    className="contract-deviations-severity-badge"
                    style={{ color: severityColor(dev.severity), background: severityBg(dev.severity) }}
                  >
                    {dev.severity}
                  </span>
                </td>
                <td>{dev.contractLanguage}</td>
                <td>{dev.playbookLanguage}</td>
                <td>{dev.explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractDeviationsView;
