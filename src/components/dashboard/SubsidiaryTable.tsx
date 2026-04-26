import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Entity } from '../../types/finance';

interface SubsidiaryTableProps {
  entities: Entity[];
}

const statusColors: Record<string, { bg: string; color: string }> = {
  Submitted: { bg: '#dcfce7', color: '#166534' },
  Late: { bg: '#fee2e2', color: '#b91c1c' },
  Pending: { bg: '#fef3c7', color: '#92400e' },
  Resubmitted: { bg: '#dbeafe', color: '#1e40af' },
};

const priorityDot: Record<string, string> = {
  High: '#b91c1c',
  Medium: '#d97706',
  Low: '#15803d',
};

const SubsidiaryTable: React.FC<SubsidiaryTableProps> = ({ entities }) => {
  const navigate = useNavigate();

  return (
    <div className="subsidiary-table-wrap">
      <table className="subsidiary-table">
        <thead>
          <tr>
            <th>Entity</th>
            <th>Country</th>
            <th>Region</th>
            <th>Submission</th>
            <th>Priority</th>
            <th className="text-right">High</th>
            <th className="text-right">Medium</th>
            <th className="text-right">IC Breaks</th>
            <th className="text-right">Risk Score</th>
          </tr>
        </thead>
        <tbody>
          {entities.map((entity) => (
            <tr
              key={entity.id}
              className="subsidiary-row"
              onClick={() => navigate(`/entity/${entity.id}`)}
            >
              <td>
                <div className="entity-name-cell">
                  <span className="entity-code">{entity.code}</span>
                  <span className="entity-name">{entity.name}</span>
                </div>
              </td>
              <td className="text-secondary">{entity.country}</td>
              <td className="text-secondary">{entity.region}</td>
              <td>
                <span
                  className="badge"
                  style={{ background: statusColors[entity.submissionStatus]?.bg, color: statusColors[entity.submissionStatus]?.color }}
                >
                  {entity.submissionStatus}
                </span>
              </td>
              <td>
                <div className="priority-cell">
                  <span
                    className="priority-dot"
                    style={{ background: priorityDot[entity.reviewPriority] }}
                  />
                  <span className={`priority-text priority-${entity.reviewPriority.toLowerCase()}`}>
                    {entity.reviewPriority}
                  </span>
                </div>
              </td>
              <td className="text-right">
                {entity.highRiskAnomalies > 0 ? (
                  <span className="count-badge count-high">{entity.highRiskAnomalies}</span>
                ) : (
                  <span className="count-zero">—</span>
                )}
              </td>
              <td className="text-right">
                {entity.mediumRiskAnomalies > 0 ? (
                  <span className="count-badge count-medium">{entity.mediumRiskAnomalies}</span>
                ) : (
                  <span className="count-zero">—</span>
                )}
              </td>
              <td className="text-right">
                {entity.intercompanyBreaks > 0 ? (
                  <span className="count-badge count-ic">{entity.intercompanyBreaks}</span>
                ) : (
                  <span className="count-zero">—</span>
                )}
              </td>
              <td className="text-right">
                <div className="risk-score-cell">
                  <div className="risk-bar-bg">
                    <div
                      className="risk-bar-fill"
                      style={{
                        width: `${entity.riskScore}%`,
                        background: entity.riskScore >= 70 ? '#b91c1c' : entity.riskScore >= 40 ? '#d97706' : '#15803d',
                      }}
                    />
                  </div>
                  <span className="risk-score-num">{entity.riskScore}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubsidiaryTable;
