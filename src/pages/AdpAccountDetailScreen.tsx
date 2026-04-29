import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getAdpAccount,
  getStakeholders,
  getSignals,
  getInitiatives,
  getNudges,
  getAccountPlan,
} from '../data/mockAdpData';
import AccountOverview from '../components/adp/account/AccountOverview';
import StakeholderMap from '../components/adp/account/StakeholderMap';
import SignalFeed from '../components/adp/account/SignalFeed';
import InitiativeList from '../components/adp/account/InitiativeList';
import PlanCompletenessPanel from '../components/adp/account/PlanCompletenessPanel';
import './AdpAccountDetailScreen.css';

type Tab = 'overview' | 'stakeholders' | 'signals' | 'initiatives' | 'plan';

const tabs: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'stakeholders', label: 'Stakeholders' },
  { key: 'signals', label: 'Signals & Insights' },
  { key: 'initiatives', label: 'Initiatives & Actions' },
  { key: 'plan', label: 'Plan Completeness' },
];

const AdpAccountDetailScreen: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const account = accountId ? getAdpAccount(accountId) : undefined;
  const stakeholders = accountId ? getStakeholders(accountId) : [];
  const signals = accountId ? getSignals(accountId) : [];
  const initiatives = accountId ? getInitiatives(accountId) : [];
  const nudges = accountId ? getNudges(accountId) : [];
  const plan = accountId ? getAccountPlan(accountId) : undefined;

  if (!account) {
    return (
      <div className="adp-detail-not-found">
        <p>Account not found.</p>
        <button className="adp-detail-btn-secondary" onClick={() => navigate('/adp/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return plan ? (
          <AccountOverview account={account} plan={plan} />
        ) : (
          <div className="adp-detail-empty">No account plan available.</div>
        );
      case 'stakeholders':
        return <StakeholderMap stakeholders={stakeholders} />;
      case 'signals':
        return <SignalFeed signals={signals} />;
      case 'initiatives':
        return <InitiativeList initiatives={initiatives} />;
      case 'plan':
        return plan ? (
          <PlanCompletenessPanel plan={plan} />
        ) : (
          <div className="adp-detail-empty">No account plan available.</div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="adp-detail-root">
      {/* Sticky Header */}
      <header className="adp-detail-header-bar">
        <div className="adp-detail-header-inner">
          <div className="adp-detail-breadcrumb">
            <button className="adp-detail-breadcrumb-link" onClick={() => navigate('/adp')}>
              Home
            </button>
            <span className="adp-detail-breadcrumb-sep">›</span>
            <button
              className="adp-detail-breadcrumb-link"
              onClick={() => navigate('/adp/dashboard')}
            >
              Account Portfolio
            </button>
            <span className="adp-detail-breadcrumb-sep">›</span>
            <span className="adp-detail-breadcrumb-current">{account.name}</span>
          </div>
          <div className="adp-detail-title-row">
            <div>
              <h1 className="adp-detail-account-name">{account.name}</h1>
              <span className="adp-detail-subtitle">
                {account.industry} · {account.region}
              </span>
            </div>
            <button
              className="adp-detail-capture-btn"
              onClick={() => navigate(`/adp/account/${accountId}/capture`)}
            >
              Capture Interaction
            </button>
          </div>
        </div>
      </header>

      {/* Nudge Banner */}
      {nudges.length > 0 && (
        <div className="adp-detail-nudge-banner">
          <span className="adp-detail-nudge-icon">🔔</span>
          <span>
            {nudges.length} nudge{nudges.length !== 1 ? 's' : ''} requiring attention
          </span>
        </div>
      )}

      {/* Tab Bar */}
      <nav className="adp-detail-tab-bar">
        <div className="adp-detail-tab-bar-inner">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`adp-detail-tab${activeTab === tab.key ? ' adp-detail-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <main className="adp-detail-body">
        <div className="adp-detail-body-inner">{renderTab()}</div>
      </main>
    </div>
  );
};

export default AdpAccountDetailScreen;
