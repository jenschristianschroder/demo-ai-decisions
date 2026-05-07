import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getContractScenario, resetContractData } from '../data/mockContractData';
import ContractDocumentSummaryView from '../components/contract/ContractDocumentSummaryView';
import ContractClausesView from '../components/contract/ContractClausesView';
import ContractDeviationsView from '../components/contract/ContractDeviationsView';
import ContractRisksView from '../components/contract/ContractRisksView';
import ContractRedlinesView from '../components/contract/ContractRedlinesView';
import ContractRecommendationsView from '../components/contract/ContractRecommendationsView';
import './ContractDashboardScreen.css';

type TabId =
  | 'summary'
  | 'clauses'
  | 'deviations'
  | 'risks'
  | 'redlines'
  | 'recommendations';

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'summary', label: 'Document Summary' },
  { id: 'clauses', label: 'Clauses' },
  { id: 'deviations', label: 'Playbook Deviations' },
  { id: 'risks', label: 'Risk Assessment' },
  { id: 'redlines', label: 'Redlines' },
  { id: 'recommendations', label: 'Recommendations' },
];

const ContractDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const scenario = getContractScenario();
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const outputs = scenario.agentOutputs;

  const handleReset = () => {
    resetContractData();
    navigate('/contract');
  };

  return (
    <div className="contract-dash-root">
      <header className="contract-dash-header">
        <div className="contract-dash-header-inner">
          <div className="contract-dash-breadcrumb">
            <button className="contract-dash-breadcrumb-link" onClick={() => navigate('/')}>
              Demos
            </button>
            <span className="contract-dash-breadcrumb-sep">›</span>
            <button className="contract-dash-breadcrumb-link" onClick={() => navigate('/contract')}>
              Contract Review Demo
            </button>
            <span className="contract-dash-breadcrumb-sep">›</span>
            <span className="contract-dash-breadcrumb-current">Dashboard</span>
          </div>
          <div className="contract-dash-title-row">
            <div>
              <h1 className="contract-dash-title">{scenario.title}</h1>
              <div className="contract-dash-subtitle">{scenario.description}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="contract-dash-tab-bar">
        <div className="contract-dash-tab-bar-inner">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`contract-dash-tab ${activeTab === tab.id ? 'contract-dash-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="contract-dash-main">
        {!outputs ? (
          <div className="contract-dash-empty">
            <p className="contract-dash-empty-text">No review data available yet.</p>
            <button className="contract-dash-btn-secondary" onClick={() => navigate('/contract')}>
              ← Back to Contract Landing
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'summary' && (
              <ContractDocumentSummaryView summary={outputs.documentSummary} />
            )}
            {activeTab === 'clauses' && (
              <ContractClausesView clauses={outputs.clauses} />
            )}
            {activeTab === 'deviations' && (
              <ContractDeviationsView deviations={outputs.deviations} />
            )}
            {activeTab === 'risks' && (
              <ContractRisksView risks={outputs.risks} />
            )}
            {activeTab === 'redlines' && (
              <ContractRedlinesView redlines={outputs.redlines} />
            )}
            {activeTab === 'recommendations' && (
              <ContractRecommendationsView recommendations={outputs.recommendations} />
            )}
          </>
        )}

        <div className="contract-dash-actions-bar">
          <button className="contract-dash-btn-secondary" onClick={() => navigate('/contract')}>
            ← Back to Landing
          </button>
          <button className="contract-dash-btn-danger" onClick={handleReset}>
            Reset Demo
          </button>
        </div>
      </main>
    </div>
  );
};

export default ContractDashboardScreen;
