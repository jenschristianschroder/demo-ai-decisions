import React from 'react';
import type { AdpAccount, AccountPlan } from '../../../types/adp';

interface AccountOverviewProps {
  account: AdpAccount;
  plan: AccountPlan;
}

const trendIcon: Record<string, string> = {
  improving: '↑',
  stable: '→',
  declining: '↓',
};

const trendLabel: Record<string, string> = {
  improving: 'Improving',
  stable: 'Stable',
  declining: 'Declining',
};

const AccountOverview: React.FC<AccountOverviewProps> = ({ account, plan }) => {
  const stakeholderCount = 0; // rendered at page level
  const swot = plan.swotSummary;

  return (
    <div className="adp-detail-overview">
      {/* Health Score */}
      <div className="adp-detail-health-card">
        <div className="adp-detail-health-top">
          <span className="adp-detail-health-number">{account.healthScore}</span>
          <span className={`adp-detail-health-trend adp-detail-trend-${account.healthTrend}`}>
            {trendIcon[account.healthTrend]} {trendLabel[account.healthTrend]}
          </span>
        </div>
        <div className="adp-detail-health-bar-bg">
          <div
            className="adp-detail-health-bar-fill"
            style={{ width: `${account.healthScore}%` }}
          />
        </div>
        <span className="adp-detail-health-label">Account Health</span>
      </div>

      {/* Key Metrics */}
      <div className="adp-detail-metrics-row">
        <div className="adp-detail-metric-card">
          <span className="adp-detail-metric-value">{plan.linkedInitiativeIds.length}</span>
          <span className="adp-detail-metric-label">Initiatives</span>
        </div>
        <div className="adp-detail-metric-card">
          <span className="adp-detail-metric-value">{account.signalCount}</span>
          <span className="adp-detail-metric-label">Open Signals</span>
        </div>
        <div className="adp-detail-metric-card">
          <span className="adp-detail-metric-value">{stakeholderCount || '—'}</span>
          <span className="adp-detail-metric-label">Stakeholders</span>
        </div>
        <div className="adp-detail-metric-card">
          <span className="adp-detail-metric-value">{plan.completenessPercent}%</span>
          <span className="adp-detail-metric-label">Plan Completeness</span>
        </div>
      </div>

      {/* SWOT Summary */}
      <div className="adp-detail-swot-grid">
        <div className="adp-detail-swot-cell adp-detail-swot-strengths">
          <h4>Strengths</h4>
          <ul>{swot.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
        <div className="adp-detail-swot-cell adp-detail-swot-weaknesses">
          <h4>Weaknesses</h4>
          <ul>{swot.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
        <div className="adp-detail-swot-cell adp-detail-swot-opportunities">
          <h4>Opportunities</h4>
          <ul>{swot.opportunities.map((o, i) => <li key={i}>{o}</li>)}</ul>
        </div>
        <div className="adp-detail-swot-cell adp-detail-swot-threats">
          <h4>Threats</h4>
          <ul>{swot.threats.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      </div>

      {/* Vision */}
      <div className="adp-detail-vision-card">
        <h4>Vision</h4>
        <p>{plan.vision}</p>
      </div>

      {/* Objectives */}
      <div className="adp-detail-objectives-card">
        <h4>Objectives</h4>
        <ol>
          {plan.objectives.map((obj, i) => (
            <li key={i}>{obj}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default AccountOverview;
