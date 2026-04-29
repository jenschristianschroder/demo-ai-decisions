import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdpAccount } from '../../../types/adp';

interface AccountCardProps {
  account: AdpAccount;
}

const trendArrow = (trend: AdpAccount['healthTrend']): string => {
  switch (trend) {
    case 'improving': return '↑';
    case 'declining': return '↓';
    default: return '→';
  }
};

const healthColor = (score: number): string => {
  if (score >= 70) return '#15803d';
  if (score >= 50) return '#d97706';
  return '#b91c1c';
};

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const navigate = useNavigate();

  const formattedDate = new Date(account.lastUpdated).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className="adp-dash-account-card"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/adp/account/${account.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/adp/account/${account.id}`);
        }
      }}
    >
      <div className="adp-dash-account-card-top">
        <h3 className="adp-dash-account-name">{account.name}</h3>
        <div className="adp-dash-account-subtitle">
          {account.industry} · {account.region}
        </div>
      </div>

      <div className="adp-dash-account-card-body">
        <div className="adp-dash-health-row">
          <span
            className="adp-dash-health-score"
            style={{ color: healthColor(account.healthScore) }}
          >
            {account.healthScore}
          </span>
          <span
            className="adp-dash-health-trend"
            style={{ color: healthColor(account.healthScore) }}
          >
            {trendArrow(account.healthTrend)}
          </span>
          <span className="adp-dash-health-label">Health</span>
        </div>

        <div className="adp-dash-account-meta">
          <span className="adp-dash-kam">👤 {account.kam}</span>
        </div>

        <div className="adp-dash-account-badges">
          <span className="adp-dash-badge adp-dash-badge-signals">
            {account.signalCount} signal{account.signalCount !== 1 ? 's' : ''}
          </span>
          {account.overdueActions > 0 && (
            <span className="adp-dash-badge adp-dash-badge-overdue">
              {account.overdueActions} overdue
            </span>
          )}
        </div>
      </div>

      <div className="adp-dash-account-card-footer">
        <span className="adp-dash-last-updated">Updated {formattedDate}</span>
      </div>
    </div>
  );
};

export default AccountCard;
