import React from 'react';
import type { ContractRecommendation } from '../../types/contract';

interface Props {
  recommendations: ContractRecommendation[];
}

const categoryColor = (c: string): string => {
  switch (c) {
    case 'negotiate': return '#a16207';
    case 'accept': return '#166534';
    case 'reject': return '#b91c1c';
    case 'escalate': return '#7c3aed';
    case 'add-clause': return '#1d4ed8';
    default: return '#666666';
  }
};

const categoryBg = (c: string): string => {
  switch (c) {
    case 'negotiate': return '#fffbeb';
    case 'accept': return '#f0fdf4';
    case 'reject': return '#fef2f2';
    case 'escalate': return '#f5f3ff';
    case 'add-clause': return '#eff6ff';
    default: return '#f8f9fa';
  }
};

const priorityColor = (p: string): string => {
  switch (p) {
    case 'high': return '#b91c1c';
    case 'medium': return '#a16207';
    case 'low': return '#166534';
    default: return '#666666';
  }
};

const priorityBg = (p: string): string => {
  switch (p) {
    case 'high': return '#fef2f2';
    case 'medium': return '#fffbeb';
    case 'low': return '#f0fdf4';
    default: return '#f8f9fa';
  }
};

const ContractRecommendationsView: React.FC<Props> = ({ recommendations }) => {
  return (
    <div className="contract-recs-root">
      <h3 className="contract-recs-title">Recommendations</h3>
      <div className="contract-recs-table-wrap">
        <table className="contract-recs-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Category</th>
              <th>Title</th>
              <th>Description</th>
              <th>Affected Clauses</th>
              <th>Assigned To</th>
              <th>Playbook Ref</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((rec) => (
              <tr key={rec.recommendationId}>
                <td>
                  <span
                    className="contract-recs-priority-badge"
                    style={{ color: priorityColor(rec.priority), background: priorityBg(rec.priority) }}
                  >
                    {rec.priority}
                  </span>
                </td>
                <td>
                  <span
                    className="contract-recs-category-badge"
                    style={{ color: categoryColor(rec.category), background: categoryBg(rec.category) }}
                  >
                    {rec.category}
                  </span>
                </td>
                <td>{rec.title}</td>
                <td>{rec.description}</td>
                <td>{(rec.affectedClauses ?? []).join(', ') || '—'}</td>
                <td>{rec.assignedTo || '—'}</td>
                <td>{rec.playbookReference || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractRecommendationsView;
