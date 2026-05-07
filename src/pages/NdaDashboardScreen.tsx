import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNdaScenario, resetNdaData, NDA_TEMPLATE_CATALOG } from '../data/mockNdaData';
import NdaTemplateRecommendationView from '../components/nda/NdaTemplateRecommendationView';
import NdaDraftView from '../components/nda/NdaDraftView';
import NdaRedlineAssessmentView from '../components/nda/NdaRedlineAssessmentView';
import NdaApprovalView from '../components/nda/NdaApprovalView';
import NdaVersionHistoryView from '../components/nda/NdaVersionHistoryView';
import NdaAuditTrailView from '../components/nda/NdaAuditTrailView';
import NdaStatusBadge from '../components/nda/NdaStatusBadge';
import './NdaDashboardScreen.css';

type TabId =
  | 'template-selection'
  | 'draft'
  | 'redline'
  | 'playbook'
  | 'approval'
  | 'versions'
  | 'audit';

interface TabDef { id: TabId; label: string; }

const TABS: TabDef[] = [
  { id: 'template-selection', label: 'Template Selection' },
  { id: 'draft', label: 'Draft' },
  { id: 'redline', label: 'Redline Assessment' },
  { id: 'playbook', label: 'Playbook Validation' },
  { id: 'approval', label: 'Approval' },
  { id: 'versions', label: 'Version History' },
  { id: 'audit', label: 'Audit Trail' },
];

const NdaDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const scenario = getNdaScenario();
  const [activeTab, setActiveTab] = useState<TabId>('template-selection');
  const outputs = scenario.agentOutputs;

  const handleReset = () => {
    resetNdaData();
    navigate('/nda');
  };

  return (
    <div className="nda-dash-root">
      <header className="nda-dash-header">
        <div className="nda-dash-header-inner">
          <div className="nda-dash-breadcrumb">
            <button className="nda-dash-breadcrumb-link" onClick={() => navigate('/')}>Demos</button>
            <span className="nda-dash-breadcrumb-sep">›</span>
            <button className="nda-dash-breadcrumb-link" onClick={() => navigate('/nda')}>NDA Automation</button>
            <span className="nda-dash-breadcrumb-sep">›</span>
            <span className="nda-dash-breadcrumb-current">Dashboard</span>
          </div>
          <div className="nda-dash-title-row">
            <div>
              <h1 className="nda-dash-title">{scenario.title}</h1>
              <div className="nda-dash-subtitle">
                {scenario.description}
                <NdaStatusBadge status={scenario.status} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="nda-dash-tab-bar">
        <div className="nda-dash-tab-bar-inner">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`nda-dash-tab ${activeTab === tab.id ? 'nda-dash-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="nda-dash-main">
        {!outputs ? (
          <div className="nda-dash-empty">
            <p className="nda-dash-empty-text">No NDA data available yet. Run the workflow from the landing page.</p>
            <button className="nda-dash-btn-secondary" onClick={() => navigate('/nda')}>← Back to NDA Landing</button>
          </div>
        ) : (
          <>
            {activeTab === 'template-selection' && outputs.templateRecommendation && (
              <NdaTemplateRecommendationView
                recommendation={outputs.templateRecommendation}
                catalog={NDA_TEMPLATE_CATALOG}
                onSelectTemplate={() => {}}
                selectedTemplateId={scenario.intakeData.selectedTemplateId}
              />
            )}
            {activeTab === 'template-selection' && !outputs.templateRecommendation && (
              <div className="nda-dash-empty">
                <p className="nda-dash-empty-text">No template recommendation data available.</p>
              </div>
            )}
            {activeTab === 'draft' && outputs.draft && (
              <NdaDraftView draft={outputs.draft} />
            )}
            {activeTab === 'draft' && !outputs.draft && (
              <div className="nda-dash-empty">
                <p className="nda-dash-empty-text">No draft generated yet.</p>
              </div>
            )}
            {activeTab === 'redline' && outputs.redlineAssessment && outputs.redlineAssessment.length > 0 && (
              <NdaRedlineAssessmentView redlines={outputs.redlineAssessment} />
            )}
            {activeTab === 'redline' && (!outputs.redlineAssessment || outputs.redlineAssessment.length === 0) && (
              <div className="nda-dash-empty">
                <p className="nda-dash-empty-text">No redline assessment data available (counterparty redline not provided or skipped).</p>
              </div>
            )}
            {activeTab === 'playbook' && outputs.playbookValidation && (
              <div className="nda-playbook-root">
                <h3 className="nda-playbook-title">Playbook Validation</h3>
                <div className={`nda-playbook-status nda-playbook-status--${outputs.playbookValidation.compliant ? 'compliant' : 'non-compliant'}`}>
                  {outputs.playbookValidation.compliant ? '✓ Compliant' : '⚠ Non-Compliant'}
                </div>
                <div className="nda-playbook-table-wrap">
                  <table className="nda-playbook-table">
                    <thead>
                      <tr>
                        <th>Clause</th>
                        <th>Status</th>
                        <th>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outputs.playbookValidation.findings.map((f, i) => (
                        <tr key={i}>
                          <td>{f.clause}</td>
                          <td><span className={`nda-playbook-finding-badge nda-playbook-finding--${f.status}`}>{f.status}</span></td>
                          <td>{f.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {outputs.playbookValidation.reasoning && (
                  <div className="nda-playbook-reasoning">{outputs.playbookValidation.reasoning}</div>
                )}
              </div>
            )}
            {activeTab === 'playbook' && !outputs.playbookValidation && (
              <div className="nda-dash-empty">
                <p className="nda-dash-empty-text">No playbook validation data available.</p>
              </div>
            )}
            {activeTab === 'approval' && outputs.approval && (
              <NdaApprovalView approval={outputs.approval} />
            )}
            {activeTab === 'approval' && !outputs.approval && (
              <div className="nda-dash-empty">
                <p className="nda-dash-empty-text">No approval routing data available.</p>
              </div>
            )}
            {activeTab === 'versions' && outputs.versionHistory && outputs.versionHistory.length > 0 && (
              <NdaVersionHistoryView versions={outputs.versionHistory} />
            )}
            {activeTab === 'versions' && (!outputs.versionHistory || outputs.versionHistory.length === 0) && (
              <div className="nda-dash-empty">
                <p className="nda-dash-empty-text">No version history available.</p>
              </div>
            )}
            {activeTab === 'audit' && outputs.auditTrail && outputs.auditTrail.length > 0 && (
              <NdaAuditTrailView entries={outputs.auditTrail} />
            )}
            {activeTab === 'audit' && (!outputs.auditTrail || outputs.auditTrail.length === 0) && (
              <div className="nda-dash-empty">
                <p className="nda-dash-empty-text">No audit trail available.</p>
              </div>
            )}
          </>
        )}

        <div className="nda-dash-actions-bar">
          <button className="nda-dash-btn-secondary" onClick={() => navigate('/nda')}>← Back to Landing</button>
          <button className="nda-dash-btn-danger" onClick={handleReset}>Reset Demo</button>
        </div>
      </main>
    </div>
  );
};

export default NdaDashboardScreen;
