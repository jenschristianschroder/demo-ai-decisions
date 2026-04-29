import React from 'react';
import type { AdpDashboardSummary } from '../../../types/adp';

interface PortfolioSummaryProps {
  summary: AdpDashboardSummary;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ summary }) => {
  const cards: { label: string; value: number | string; sub?: string; alert?: boolean }[] = [
    { label: 'Total Accounts', value: summary.totalAccounts, sub: 'Active portfolio' },
    { label: 'Accounts at Risk', value: summary.accountsAtRisk, sub: 'Health < 50', alert: summary.accountsAtRisk > 0 },
    { label: 'New Signals', value: summary.newSignals, sub: 'Awaiting review' },
    { label: 'Overdue Actions', value: summary.overdueActions, sub: 'Past due date', alert: summary.overdueActions > 0 },
    { label: 'Avg Health Score', value: summary.averageHealth, sub: 'Across portfolio' },
    { label: 'Stale Accounts', value: summary.staleAccounts, sub: 'No update > 30 days' },
  ];

  return (
    <div className="adp-dash-summary-cards">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`adp-dash-summary-card${card.alert ? ' adp-dash-summary-card--alert' : ''}`}
        >
          <div className="adp-dash-summary-card-value">{card.value}</div>
          <div className="adp-dash-summary-card-label">{card.label}</div>
          {card.sub && <div className="adp-dash-summary-card-sub">{card.sub}</div>}
        </div>
      ))}
    </div>
  );
};

export default PortfolioSummary;
