import React from 'react';
import { Link } from 'react-router-dom';
import type { Nudge, NudgeType } from '../../../types/adp';
import { getAdpAccount } from '../../../data/mockAdpData';

interface NudgeCardProps {
  nudge: Nudge;
  onDismiss: (id: string) => void;
}

const typeConfig: Record<NudgeType, { icon: string; label: string; color: string; bg: string }> = {
  reminder:     { icon: '🔔', label: 'Reminder',     color: '#1d4ed8', bg: '#dbeafe' },
  'stale-data': { icon: '📊', label: 'Stale Data',   color: '#b45309', bg: '#fef3c7' },
  'follow-up':  { icon: '📩', label: 'Follow-Up',    color: '#0f766e', bg: '#ccfbf1' },
  'missing-info':{ icon: '❓', label: 'Missing Info', color: '#b91c1c', bg: '#fee2e2' },
};

const borderColors: Record<NudgeType, string> = {
  reminder: '#3b82f6',
  'stale-data': '#f59e0b',
  'follow-up': '#14b8a6',
  'missing-info': '#ef4444',
};

function daysAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

const NudgeCard: React.FC<NudgeCardProps> = ({ nudge, onDismiss }) => {
  const cfg = typeConfig[nudge.type];
  const account = getAdpAccount(nudge.accountId);

  return (
    <div
      className="adp-nudge-card"
      style={{ borderLeftColor: borderColors[nudge.type] }}
    >
      <div className="adp-nudge-card-top">
        <span className="adp-nudge-icon">{cfg.icon}</span>
        <span
          className="adp-nudge-type-badge"
          style={{ color: cfg.color, background: cfg.bg }}
        >
          {cfg.label}
        </span>
        <span className="adp-nudge-date">{daysAgo(nudge.createdAt)}</span>
      </div>

      <p className="adp-nudge-message">{nudge.message}</p>

      <div className="adp-nudge-card-bottom">
        <span className="adp-nudge-account">{account?.name ?? nudge.accountId}</span>
        <div className="adp-nudge-actions">
          <button
            className="adp-nudge-dismiss-btn"
            onClick={() => onDismiss(nudge.id)}
          >
            Dismiss
          </button>
          <Link
            className="adp-nudge-goto-btn"
            to={`/adp/account/${nudge.accountId}`}
          >
            Go to Account →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NudgeCard;
