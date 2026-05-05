import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRfpScenario, resetRfpData } from '../data/mockRfpData';
import RfpIntakeSummary from '../components/rfp/RfpIntakeSummary';
import RfpComplianceMatrix from '../components/rfp/RfpComplianceMatrix';
import RfpDraftAnswers from '../components/rfp/RfpDraftAnswers';
import RfpSmeQuestions from '../components/rfp/RfpSmeQuestions';
import RfpRiskRegister from '../components/rfp/RfpRiskRegister';
import RfpResponsePreview from '../components/rfp/RfpResponsePreview';
import RfpAgentTimeline from '../components/rfp/RfpAgentTimeline';
import './RfpDashboardScreen.css';

type TabId =
  | 'intake'
  | 'compliance'
  | 'answers'
  | 'sme'
  | 'risk'
  | 'preview'
  | 'timeline';

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'intake', label: 'Intake Summary' },
  { id: 'compliance', label: 'Compliance Matrix' },
  { id: 'answers', label: 'Draft Answers' },
  { id: 'sme', label: 'SME Questions' },
  { id: 'risk', label: 'Risk Register' },
  { id: 'preview', label: 'Response Preview' },
  { id: 'timeline', label: 'Agent Timeline' },
];

const RfpDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const scenario = getRfpScenario();
  const [activeTab, setActiveTab] = useState<TabId>('intake');
  const outputs = scenario.agentOutputs;

  const handleReset = () => {
    resetRfpData();
    navigate('/rfp');
  };

  return (
    <div className="rfp-dash-root">
      <header className="rfp-dash-header">
        <div className="rfp-dash-header-inner">
          <div className="rfp-dash-breadcrumb">
            <button className="rfp-dash-breadcrumb-link" onClick={() => navigate('/')}>
              Demos
            </button>
            <span className="rfp-dash-breadcrumb-sep">›</span>
            <button className="rfp-dash-breadcrumb-link" onClick={() => navigate('/rfp')}>
              RFP Response Demo
            </button>
            <span className="rfp-dash-breadcrumb-sep">›</span>
            <span className="rfp-dash-breadcrumb-current">Dashboard</span>
          </div>
          <div className="rfp-dash-title-row">
            <div>
              <h1 className="rfp-dash-title">{scenario.title}</h1>
              <div className="rfp-dash-subtitle">{scenario.description}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="rfp-dash-tab-bar">
        <div className="rfp-dash-tab-bar-inner">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`rfp-dash-tab ${activeTab === tab.id ? 'rfp-dash-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="rfp-dash-main">
        {!outputs ? (
          <div className="rfp-dash-empty">
            <p className="rfp-dash-empty-text">No analysis data available yet.</p>
            <button className="rfp-dash-btn-secondary" onClick={() => navigate('/rfp')}>
              ← Back to RFP Landing
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'intake' && (
              <RfpIntakeSummary intake={outputs.intake} />
            )}
            {activeTab === 'compliance' && (
              <RfpComplianceMatrix rows={outputs.compliance} />
            )}
            {activeTab === 'answers' && (
              <RfpDraftAnswers
                answers={outputs.draftAnswers}
                requirements={outputs.requirements}
              />
            )}
            {activeTab === 'sme' && (
              <RfpSmeQuestions questions={outputs.smeQuestions} />
            )}
            {activeTab === 'risk' && (
              <RfpRiskRegister risks={outputs.risks} />
            )}
            {activeTab === 'preview' && (
              <RfpResponsePreview assembly={outputs.assembly} />
            )}
            {activeTab === 'timeline' && (
              <RfpAgentTimeline steps={scenario.progressSteps} />
            )}
          </>
        )}

        <div className="rfp-dash-actions-bar">
          <button className="rfp-dash-btn-secondary" onClick={() => navigate('/rfp')}>
            ← Back to Landing
          </button>
          <button className="rfp-dash-btn-danger" onClick={handleReset}>
            Reset Demo
          </button>
        </div>
      </main>
    </div>
  );
};

export default RfpDashboardScreen;
