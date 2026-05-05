import React from 'react';
import type { RiskItem } from '../../types/rfp';

interface Props {
  risks: RiskItem[];
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

const RfpRiskRegister: React.FC<Props> = ({ risks }) => {
  return (
    <div className="rfp-risk-root">
      <h3 className="rfp-risk-title">Risk Register</h3>
      <div className="rfp-risk-table-wrap">
        <table className="rfp-risk-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Risk Area</th>
              <th>Req ID</th>
              <th>Reason</th>
              <th>Recommended Action</th>
              <th>Required Approver</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk) => (
              <tr key={risk.riskId}>
                <td>
                  <span
                    className="rfp-risk-severity-badge"
                    style={{ color: severityColor(risk.severity), background: severityBg(risk.severity) }}
                  >
                    {risk.severity}
                  </span>
                </td>
                <td>{risk.riskArea}</td>
                <td className="rfp-risk-req-id">{risk.requirementId}</td>
                <td>{risk.reason}</td>
                <td>{risk.recommendedAction}</td>
                <td>{risk.requiredApprover}</td>
                <td>
                  <span
                    className="rfp-risk-status-badge"
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

export default RfpRiskRegister;
