import React from 'react';
import type { Stakeholder } from '../../../types/adp';

interface StakeholderMapProps {
  stakeholders: Stakeholder[];
}

function daysAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

const sentimentDot: Record<string, string> = {
  positive: 'adp-detail-dot-positive',
  neutral: 'adp-detail-dot-neutral',
  negative: 'adp-detail-dot-negative',
};

const StakeholderMap: React.FC<StakeholderMapProps> = ({ stakeholders }) => {
  return (
    <div className="adp-detail-stakeholders">
      <table className="adp-detail-stakeholder-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Sentiment</th>
            <th>Influence</th>
            <th>Last Contact</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {stakeholders.map((s) => (
            <tr key={s.id}>
              <td className="adp-detail-stakeholder-name">{s.name}</td>
              <td>{s.role}</td>
              <td>
                <span className={`adp-detail-sentiment-dot ${sentimentDot[s.sentiment]}`} />
                <span className="adp-detail-sentiment-text">{s.sentiment}</span>
              </td>
              <td>
                <span className={`adp-detail-influence-badge adp-detail-influence-${s.influenceLevel}`}>
                  {s.influenceLevel}
                </span>
              </td>
              <td>{daysAgo(s.lastContactDate)}</td>
              <td>
                <a className="adp-detail-email-link" href={`mailto:${s.email}`}>{s.email}</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StakeholderMap;
