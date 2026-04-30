import React from 'react';
import { useNavigate } from 'react-router-dom';
import PortfolioSummary from '../components/adp/dashboard/PortfolioSummary';
import AccountCard from '../components/adp/dashboard/AccountCard';
import { getAdpAccounts, getAdpDashboardSummary, isUsingGeneratedData, resetAdpData } from '../data/mockAdpData';
import './AdpDashboardScreen.css';

const AdpDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [, setRefresh] = React.useState(0);
  const accounts = getAdpAccounts();
  const summary = getAdpDashboardSummary();
  const usingGenerated = isUsingGeneratedData();

  const handleResetData = () => {
    resetAdpData();
    setRefresh(n => n + 1);
  };

  const sorted = [...accounts].sort((a, b) => a.healthScore - b.healthScore);

  return (
    <div className="adp-dash-root">
      <header className="adp-dash-header">
        <div className="adp-dash-header-inner">
          <div className="adp-dash-breadcrumb">
            <button className="adp-dash-breadcrumb-link" onClick={() => navigate('/adp')}>
              Home
            </button>
            <span className="adp-dash-breadcrumb-sep">›</span>
            <span className="adp-dash-breadcrumb-current">Account Portfolio</span>
          </div>
          <div className="adp-dash-title-row">
            <div>
              <h1 className="adp-dash-title">Account Portfolio</h1>
              <div className="adp-dash-subtitle">
                {accounts.length} accounts · KAM overview
              </div>
            </div>
            {usingGenerated && (
              <button className="adp-dash-reset-btn" onClick={handleResetData}>
                ↩ Reset to Default Data
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="adp-dash-main">
        <PortfolioSummary summary={summary} />

        <div className="adp-dash-section-header">
          <h2 className="adp-dash-section-title">All Accounts</h2>
          <span className="adp-dash-section-subtitle">Sorted by health score — worst first</span>
        </div>

        <div className="adp-dash-account-grid">
          {sorted.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdpDashboardScreen;
