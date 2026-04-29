import React, { useState } from 'react';
import type { Initiative } from '../../../types/adp';
import ActionChecklist from './ActionChecklist';

interface InitiativeListProps {
  initiatives: Initiative[];
}

const statusColors: Record<string, string> = {
  proposed: '#6b7280',
  'in-progress': '#2563eb',
  completed: '#15803d',
  stalled: '#b91c1c',
};

const priorityColors: Record<string, string> = {
  high: '#b91c1c',
  medium: '#d97706',
  low: '#6b7280',
};

function isOverdue(dueDate: string, status: string): boolean {
  if (status === 'completed') return false;
  return new Date(dueDate) < new Date();
}

const InitiativeList: React.FC<InitiativeListProps> = ({ initiatives }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="adp-detail-initiatives">
      {initiatives.length === 0 && (
        <div className="adp-detail-empty">No initiatives found for this account.</div>
      )}
      {initiatives.map((init) => {
        const overdue = isOverdue(init.dueDate, init.status);
        const expanded = expandedId === init.id;

        return (
          <div
            key={init.id}
            className={`adp-detail-initiative-card${overdue ? ' adp-detail-overdue' : ''}`}
          >
            <div
              className="adp-detail-initiative-header"
              onClick={() => setExpandedId(expanded ? null : init.id)}
            >
              <div className="adp-detail-initiative-title-row">
                <span className="adp-detail-expand-icon">{expanded ? '▾' : '▸'}</span>
                <span className="adp-detail-initiative-title">{init.title}</span>
                <span
                  className="adp-detail-status-badge"
                  style={{ background: statusColors[init.status] }}
                >
                  {init.status}
                </span>
                <span
                  className="adp-detail-priority-badge"
                  style={{ color: priorityColors[init.priority] }}
                >
                  {init.priority}
                </span>
              </div>
              <div className="adp-detail-initiative-meta">
                <div className="adp-detail-progress-bar-bg">
                  <div
                    className="adp-detail-progress-bar-fill"
                    style={{ width: `${init.progressPercent}%` }}
                  />
                </div>
                <span className="adp-detail-progress-label">{init.progressPercent}%</span>
                <span className="adp-detail-initiative-owner">{init.owner}</span>
                <span className="adp-detail-initiative-due">
                  Due {new Date(init.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {expanded && (
              <div className="adp-detail-initiative-actions">
                <ActionChecklist actions={init.actions} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default InitiativeList;
