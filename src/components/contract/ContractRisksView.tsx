import React from 'react';
import type { ContractRisk } from '../../types/contract';

interface Props {
  risks: ContractRisk[];
}

const riskLevelColor = (s: string): string => {
  switch (s) {
    case 'critical': return '#7f1d1d';
    case 'high': return '#b91c1c';
    case 'medium': return '#a16207';
    case 'low': return '#166534';
    default: return '#666666';
  }
};

const riskLevelBg = (s: string): string => {
  switch (s) {
    case 'critical': return '#fef2f2';
    case 'high': return '#fef2f2';
    case 'medium': return '#fffbeb';
    case 'low': return '#f0fdf4';
    default: return '#f8f9fa';
  }
};

const riskStatusColor = (s: string): string => {
  switch (s) {
    case 'mitigated': return '#166534';
    case 'accepted': return '#1d4ed8';
    case 'escalated': return '#b91c1c';
    case 'identified': return '#a16207';
    default: return '#666666';
  }
};

const riskStatusBg = (s: string): string => {
  switch (s) {
    case 'mitigated': return '#f0fdf4';
    case 'accepted': return '#eff6ff';
    case 'escalated': return '#fef2f2';
    case 'identified': return '#fffbeb';
    default: return '#f8f9fa';
  }
};

const ContractRisksView: React.FC<Props> = ({ risks }) => {
  return (
    <div className="contract-risks-root">
      <h3 className="contract-risks-title">Risk Assessment</h3>
      <div className="contract-risks-table-wrap">
        <table className="contract-risks-table">
          <thead>
            <tr>
              <th>Risk Level</th>
              <th>Category</th>
              <th>Clause ID</th>
              <th>Description</th>
              <th>Potential Impact</th>
              <th>Likelihood</th>
              <th>Recommended Action</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk) => (
              <tr key={risk.riskId}>
                <td>
                  <span
                    className="contract-risks-level-badge"
                    style={{ color: riskLevelColor(risk.riskLevel), background: riskLevelBg(risk.riskLevel) }}
                  >
                    {risk.riskLevel}
                  </span>
                </td>
                <td>{risk.category}</td>
                <td className="contract-risks-clause-id">{risk.clauseId}</td>
                <td>{risk.description}</td>
                <td>{risk.potentialImpact}</td>
                <td>{risk.likelihood}</td>
                <td>{risk.recommendedAction}</td>
                <td>
                  <span
                    className="contract-risks-status-badge"
                    style={{ color: riskStatusColor(risk.status), background: riskStatusBg(risk.status) }}
                  >
                    {risk.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractRisksView;
