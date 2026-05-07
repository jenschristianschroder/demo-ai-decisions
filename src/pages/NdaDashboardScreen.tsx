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

interface TabDef {
  id: TabId;
  label: string;
  stepNumber: number;
  description: string;
}

const TABS: TabDef[] = [
  { id: 'template-selection', label: 'Template Selection', stepNumber: 1, description: 'The AI agent analyzed the intake request and recommended the best-fit NDA template from our catalog of 6 templates. The confidence score reflects how well the template matches the stated purpose and scope.' },
  { id: 'draft', label: 'Draft', stepNumber: 2, description: 'The draft agent filled the selected template with deal-specific details (parties, term, jurisdiction) to produce this ready-to-review NDA document.' },
  { id: 'redline', label: 'Redline Assessment', stepNumber: 3, description: 'The counterparty proposed changes to the draft. The redline agent classified each change against our legal playbook as accept, reject, negotiate, or escalate.' },
  { id: 'playbook', label: 'Playbook Validation', stepNumber: 4, description: 'The validation agent checked the current draft against our NDA playbook standards across 10+ clause categories. This is independent of approval routing.' },
  { id: 'approval', label: 'Approval', stepNumber: 5, description: 'Based on the redline findings and escalation rules, the routing agent determined the required approval tier and assigned an approver.' },
  { id: 'versions', label: 'Version History', stepNumber: 6, description: 'A timeline of all changes to this NDA across versions, showing what changed and when.' },
  { id: 'audit', label: 'Audit Trail', stepNumber: 7, description: 'A complete log of every agent action, with timestamps and source citations for traceability.' },
];

const NdaDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const scenario = getNdaScenario();
  const [activeTab, setActiveTab] = useState<TabId>('template-selection');
  const [showGuide, setShowGuide] = useState(false);
  const outputs = scenario.agentOutputs;

  const handleReset = () => {
    resetNdaData();
    navigate('/nda');
  };

  const activeTabDef = TABS.find((t) => t.id === activeTab)!;

  // Build mini summary for header
  const templateName = outputs?.draft?.templateId ?? scenario.intakeData.selectedTemplateId ?? '—';
  const approvalTier = outputs?.approval?.tier?.replace('tier-', 'Tier ') ?? '—';
  const playbookOk = outputs?.playbookValidation?.compliant;
  const playbookFindings = outputs?.playbookValidation?.findings ?? [];
  const nonCompliantCount = playbookFindings.filter((f) => f.status === 'non-compliant').length;
  const warningCount = playbookFindings.filter((f) => f.status === 'warning').length;

  const playbookSummaryText = playbookOk === undefined
    ? '—'
    : playbookOk
      ? '✓ Compliant'
      : `${nonCompliantCount + warningCount} issue${nonCompliantCount + warningCount !== 1 ? 's' : ''}`;

  // Determine which steps are complete
  const stepHasData = (tabId: TabId): boolean => {
    if (!outputs) return false;
    switch (tabId) {
      case 'template-selection': return !!outputs.templateRecommendation;
      case 'draft': return !!outputs.draft;
      case 'redline': return !!(outputs.redlineAssessment && outputs.redlineAssessment.length > 0);
      case 'playbook': return !!outputs.playbookValidation;
      case 'approval': return !!outputs.approval;
      case 'versions': return !!(outputs.versionHistory && outputs.versionHistory.length > 0);
      case 'audit': return !!(outputs.auditTrail && outputs.auditTrail.length > 0);
    }
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
                <button className="nda-dash-guide-btn" onClick={() => setShowGuide(true)} title="About this demo">
                  ℹ About this demo
                </button>
              </div>
            </div>
          </div>
          {outputs && (
            <div className="nda-dash-mini-summary">
              <span className="nda-dash-mini-item">
                <span className="nda-dash-mini-label">Template:</span> {templateName}
              </span>
              <span className="nda-dash-mini-sep">·</span>
              <span className="nda-dash-mini-item">
                <span className="nda-dash-mini-label">Approval:</span> {approvalTier}
              </span>
              <span className="nda-dash-mini-sep">·</span>
              <span className="nda-dash-mini-item">
                <span className="nda-dash-mini-label">Playbook:</span> {playbookSummaryText}
              </span>
              {playbookOk === false && outputs?.approval?.decision === 'approved' && (
                <>
                  <span className="nda-dash-mini-sep">·</span>
                  <span className="nda-dash-mini-note">Approved with conditions — playbook issues flagged for reviewer</span>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Process Stepper */}
      <div className="nda-dash-stepper-bar">
        <div className="nda-dash-stepper-inner">
          {TABS.map((tab, idx) => {
            const hasData = stepHasData(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <React.Fragment key={tab.id}>
                {idx > 0 && <div className={`nda-dash-stepper-connector ${hasData || stepHasData(TABS[idx - 1].id) ? 'nda-dash-stepper-connector--done' : ''}`} />}
                <button
                  className={`nda-dash-stepper-step ${isActive ? 'nda-dash-stepper-step--active' : ''} ${hasData ? 'nda-dash-stepper-step--done' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.description}
                >
                  <span className="nda-dash-stepper-circle">
                    {hasData ? '✓' : tab.stepNumber}
                  </span>
                  <span className="nda-dash-stepper-label">{tab.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <main className="nda-dash-main">
        {/* Contextual explanation banner for active tab */}
        {outputs && (
          <div className="nda-dash-context-banner">
            <div className="nda-dash-context-step">Step {activeTabDef.stepNumber} of 7</div>
            <div className="nda-dash-context-desc">{activeTabDef.description}</div>
          </div>
        )}

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
            {activeTab === 'playbook' && outputs.playbookValidation && (() => {
              const pv = outputs.playbookValidation!;
              const compliantCount = pv.findings.filter((f) => f.status === 'compliant').length;
              const ncCount = pv.findings.filter((f) => f.status === 'non-compliant').length;
              const warnCount = pv.findings.filter((f) => f.status === 'warning').length;
              const totalFindings = pv.findings.length;
              const nonCompliantClauses = pv.findings
                .filter((f) => f.status === 'non-compliant')
                .map((f) => f.clause);
              const warningClauses = pv.findings
                .filter((f) => f.status === 'warning')
                .map((f) => f.clause);

              return (
                <div className="nda-playbook-root">
                  <h3 className="nda-playbook-title">Playbook Validation</h3>

                  <div className={`nda-playbook-status nda-playbook-status--${pv.compliant ? 'compliant' : 'non-compliant'}`}>
                    {pv.compliant ? '✓ Compliant' : '⚠ Non-Compliant'}
                  </div>

                  {/* Summary sentence */}
                  <div className="nda-playbook-summary">
                    {pv.compliant
                      ? `All ${totalFindings} clauses are compliant with the NDA playbook.`
                      : `${compliantCount} of ${totalFindings} clause${totalFindings !== 1 ? 's' : ''} compliant.`
                        + (ncCount > 0 ? ` ${ncCount} non-compliant: ${nonCompliantClauses.join(', ')}.` : '')
                        + (warnCount > 0 ? ` ${warnCount} warning${warnCount !== 1 ? 's' : ''}: ${warningClauses.join(', ')}.` : '')
                        + ' See details below.'
                    }
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
                        {pv.findings.map((f, i) => (
                          <tr key={i} className={f.status !== 'compliant' ? 'nda-playbook-row--flagged' : ''}>
                            <td>{f.clause}</td>
                            <td><span className={`nda-playbook-finding-badge nda-playbook-finding--${f.status}`}>{f.status}</span></td>
                            <td>{f.detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {pv.reasoning && (
                    <div className="nda-playbook-reasoning">
                      <span className="nda-playbook-reasoning-label">Agent Reasoning: </span>{pv.reasoning}
                    </div>
                  )}
                </div>
              );
            })()}
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

      {/* Demo Guide Modal */}
      {showGuide && (
        <div className="nda-dash-guide-overlay" onClick={() => setShowGuide(false)}>
          <div className="nda-dash-guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nda-dash-guide-header">
              <h2 className="nda-dash-guide-title">About This Demo</h2>
              <button className="nda-dash-guide-close" onClick={() => setShowGuide(false)}>✕</button>
            </div>
            <div className="nda-dash-guide-body">
              <p><strong>What you're seeing:</strong> An end-to-end AI-powered NDA automation pipeline processing a technology partnership NDA for Acme Corp.</p>

              <h4>The 7-Agent Pipeline</h4>
              <ol className="nda-dash-guide-steps">
                <li><strong>Template Recommendation</strong> — AI recommends the best NDA template from a catalog of 6 based on the intake request.</li>
                <li><strong>Draft Generation</strong> — The selected template is filled with deal-specific details (parties, term, jurisdiction).</li>
                <li><strong>Redline Assessment</strong> — Counterparty changes are classified (accept/reject/negotiate/escalate) against the legal playbook.</li>
                <li><strong>Playbook Validation</strong> — The draft is validated clause-by-clause against organizational NDA standards.</li>
                <li><strong>Approval Routing</strong> — Escalation rules determine the correct approval tier (1/2/3) and assign an approver.</li>
                <li><strong>Version History</strong> — All changes to the NDA are tracked across versions.</li>
                <li><strong>Audit Trail</strong> — Every agent action is logged with timestamps and citations.</li>
              </ol>

              <h4>Key Things to Notice</h4>
              <ul>
                <li>Each tab shows the output of one AI agent — navigate sequentially to follow the workflow.</li>
                <li>The process stepper at the top shows the overall progress through all 7 stages.</li>
                <li>Playbook validation is independent of approval routing — an NDA can be approved even if playbook issues are flagged for the reviewer's attention.</li>
                <li>In the Redline Assessment tab, expand each clause to see the original text vs. counterparty changes side-by-side.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NdaDashboardScreen;
