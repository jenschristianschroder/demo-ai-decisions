import React from 'react';
import type { Action } from '../../../types/adp';

interface ActionChecklistProps {
  actions: Action[];
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const ActionChecklist: React.FC<ActionChecklistProps> = ({ actions }) => {
  return (
    <ul className="adp-detail-action-list">
      {actions.map((action) => {
        const statusClass =
          action.status === 'done'
            ? 'adp-detail-action-done'
            : action.status === 'overdue'
              ? 'adp-detail-action-overdue'
              : 'adp-detail-action-pending';
        const days = daysUntil(action.dueDate);
        const dueLabel =
          action.status === 'done'
            ? 'Completed'
            : days < 0
              ? `${Math.abs(days)}d overdue`
              : days === 0
                ? 'Due today'
                : `Due in ${days}d`;

        return (
          <li key={action.id} className={`adp-detail-action-item ${statusClass}`}>
            <span className="adp-detail-action-check">
              {action.status === 'done' ? '✓' : '○'}
            </span>
            <div className="adp-detail-action-body">
              <span className="adp-detail-action-desc">{action.description}</span>
              <span className="adp-detail-action-meta">
                {action.owner} · {dueLabel}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default ActionChecklist;
