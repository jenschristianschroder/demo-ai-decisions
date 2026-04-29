import React from 'react';
import { useNavigate } from 'react-router-dom';
import SummaryCards from '../components/dashboard/SummaryCards';
import SubsidiaryTable from '../components/dashboard/SubsidiaryTable';
import { getEntities, getDashboardSummary } from '../data/mockFinancialData';
import './DashboardScreen.css';

const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const entities = getEntities();
  const summary = getDashboardSummary();

  const sorted = [...entities].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="breadcrumb">
            <button className="breadcrumb-link" onClick={() => navigate('/finance-anomaly-demo')}>Home</button>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Group Dashboard</span>
          </div>
          <div className="dashboard-title-row">
            <div>
              <h1 className="dashboard-title">Group Finance Anomaly Review</h1>
              <div className="dashboard-period">March 2026 · {entities.length} entities</div>
            </div>
            <button className="btn-header-action" onClick={() => navigate('/upload')}>
              Upload New Data
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <SummaryCards summary={summary} />

        <div className="section-header">
          <h2 className="section-title">Subsidiary Entities</h2>
          <span className="section-subtitle">Click a row to review anomalies</span>
        </div>

        <SubsidiaryTable entities={sorted} />
      </main>
    </div>
  );
};

export default DashboardScreen;
