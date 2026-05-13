import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ingestRfpFiles, loadRfpDemoData } from '../lib/rfpDataLoader';
import { runRfpWorkflow } from '../lib/rfpAi';
import { setRfpData, resetRfpData } from '../data/mockRfpData';
import type { RfpProgressStep, RfpFileInfo } from '../types/rfp';
import './RfpLandingScreen.css';

const RfpLandingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [progressSteps, setProgressSteps] = useState<RfpProgressStep[]>([]);
  const [loadedFiles, setLoadedFiles] = useState<RfpFileInfo[]>([]);

  const handleRunAnalysis = async () => {
    setGenerating(true);
    setSuccessMsg('');
    setErrorMsg('');
    setProgressSteps([]);
    setLoadedFiles([]);
    try {
      const files = await ingestRfpFiles();
      setLoadedFiles(files);

      const rfpFile = files.find(f => f.type === 'rfp' && f.extractedText);
      if (!rfpFile?.extractedText) {
        setErrorMsg('Could not load RFP document text. Please try again.');
        setGenerating(false);
        return;
      }

      const demoData = await loadRfpDemoData();

      // Local accumulator – React state closures would be stale by the time
      // we persist the scenario, so we keep our own list in sync with setProgressSteps.
      const collectedSteps: RfpProgressStep[] = [];
      const outputs = await runRfpWorkflow(
        rfpFile.extractedText,
        demoData,
        (step) => {
          const idx = collectedSteps.findIndex(s => s.phase === step.phase);
          if (idx >= 0) {
            collectedSteps[idx] = step;
          } else {
            collectedSteps.push(step);
          }
          setProgressSteps([...collectedSteps]);
        },
      );

      setRfpData({
        scenario: {
          id: 'acme-rfp-2026',
          title: 'Acme Public Services - Enterprise Analytics RFP',
          description: 'RFP response for Acme Public Services enterprise analytics and reporting platform procurement.',
          files,
          agentOutputs: outputs,
          progressSteps: collectedSteps,
        },
      });
      setSuccessMsg('RFP analysis completed successfully');
      setTimeout(() => navigate('/rfp/dashboard'), 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong while running the analysis. Please try again.';
      setErrorMsg(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    resetRfpData();
    setSuccessMsg('');
    setErrorMsg('');
    setProgressSteps([]);
    setLoadedFiles([]);
  };

  return (
    <div className="rfp-landing-root">
      <div className="rfp-landing-card">
        <div className="rfp-landing-badge">RFP Response</div>

        <div className="rfp-landing-header">
          <div className="rfp-landing-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#111111"/>
              <rect x="9" y="6" width="14" height="20" rx="2" fill="white" opacity="0.9"/>
              <line x1="12" y1="11" x2="20" y2="11" stroke="#111111" strokeWidth="1.2" opacity="0.5"/>
              <line x1="12" y1="14" x2="20" y2="14" stroke="#111111" strokeWidth="1.2" opacity="0.5"/>
              <line x1="12" y1="17" x2="17" y2="17" stroke="#111111" strokeWidth="1.2" opacity="0.5"/>
              <line x1="12" y1="20" x2="19" y2="20" stroke="#111111" strokeWidth="1.2" opacity="0.5"/>
            </svg>
          </div>
          <div className="rfp-landing-title-block">
            <h1 className="rfp-landing-title">RFP Response Automation</h1>
            <p className="rfp-landing-subtitle">
              Automate proposal responses using a network of specialized AI agents that analyze requirements, ground answers in approved knowledge, detect risks, and assemble compliant submissions.
            </p>
          </div>
        </div>

        <div className="rfp-landing-value-shift">
          <div className="rfp-landing-shift-from">
            <div className="rfp-landing-shift-label">From</div>
            <div className="rfp-landing-shift-items">
              <span>Manual requirement extraction</span>
              <span>Copy-paste from old proposals</span>
              <span>Ad-hoc risk identification</span>
              <span>Last-minute compliance checks</span>
            </div>
          </div>
          <div className="rfp-landing-shift-arrow">{'\u2192'}</div>
          <div className="rfp-landing-shift-to">
            <div className="rfp-landing-shift-label">To</div>
            <div className="rfp-landing-shift-items">
              <span>Automated requirement parsing</span>
              <span>Knowledge-grounded drafting</span>
              <span>Proactive risk detection</span>
              <span>Continuous compliance tracking</span>
            </div>
          </div>
        </div>

        <div className="rfp-landing-features">
          <div className="rfp-landing-feature">
            <span className="rfp-landing-feature-icon">{'\uD83D\uDD2C'}</span>
            <div>
              <div className="rfp-landing-feature-title">Multi-Agent Analysis</div>
              <div className="rfp-landing-feature-desc">Eight specialized agents handle intake, requirements extraction, knowledge matching, drafting, SME routing, risk review, compliance, and final assembly</div>
            </div>
          </div>
          <div className="rfp-landing-feature">
            <span className="rfp-landing-feature-icon">{'\uD83D\uDCDA'}</span>
            <div>
              <div className="rfp-landing-feature-title">Knowledge Grounding</div>
              <div className="rfp-landing-feature-desc">Answers are grounded in approved answer libraries, product documentation, case studies, and historical RFP responses</div>
            </div>
          </div>
          <div className="rfp-landing-feature">
            <span className="rfp-landing-feature-icon">{'\u26A0\uFE0F'}</span>
            <div>
              <div className="rfp-landing-feature-title">Risk Detection</div>
              <div className="rfp-landing-feature-desc">Automatically identifies contractual, technical, and compliance risks with severity ratings and recommended mitigations</div>
            </div>
          </div>
          <div className="rfp-landing-feature">
            <span className="rfp-landing-feature-icon">{'\u2705'}</span>
            <div>
              <div className="rfp-landing-feature-title">Compliance Tracking</div>
              <div className="rfp-landing-feature-desc">Tracks response status for every requirement — compliant, partial, or non-compliant — with evidence and next actions</div>
            </div>
          </div>
        </div>

        <div className="rfp-landing-scenario">
          <div className="rfp-landing-scenario-label">Demo Scenario</div>
          <div className="rfp-landing-scenario-text">Acme Public Services RFP &middot; 8 agents &middot; Full response workflow</div>
        </div>

        <div className="rfp-landing-outcomes">
          <div className="rfp-landing-outcomes-title">Agents Involved</div>
          <div className="rfp-landing-outcomes-grid">
            <div className="rfp-landing-outcome">
              <span className="rfp-landing-outcome-metric">{'\uD83D\uDCE5'}</span>
              <span className="rfp-landing-outcome-text">Intake Agent &middot; Requirements Agent</span>
            </div>
            <div className="rfp-landing-outcome">
              <span className="rfp-landing-outcome-metric">{'\uD83D\uDCDA'}</span>
              <span className="rfp-landing-outcome-text">Knowledge Agent &middot; Drafting Agent</span>
            </div>
            <div className="rfp-landing-outcome">
              <span className="rfp-landing-outcome-metric">{'\uD83D\uDC64'}</span>
              <span className="rfp-landing-outcome-text">SME Router &middot; Risk Review Agent</span>
            </div>
            <div className="rfp-landing-outcome">
              <span className="rfp-landing-outcome-metric">{'\uD83D\uDCCB'}</span>
              <span className="rfp-landing-outcome-text">Compliance Agent &middot; Assembly Agent</span>
            </div>
          </div>
        </div>

        <div className="rfp-landing-generate">
          <div className="rfp-landing-generate-label">Demo Data</div>
          <p className="rfp-landing-generate-hint">
            Load the sample RFP package and run the full 8-agent analysis workflow to generate a complete proposal response.
          </p>

          {loadedFiles.length > 0 && (
            <div className="rfp-landing-files">
              {loadedFiles.map((file) => (
                <div key={file.name} className="rfp-landing-file">
                  <span className="rfp-landing-file-name">{file.name}</span>
                  <span className={`rfp-landing-file-status rfp-landing-file-status--${file.status}`}>
                    {file.status}
                  </span>
                </div>
              ))}
              <div className="rfp-landing-file-count">
                {loadedFiles.filter(f => f.status === 'parsed').length} of {loadedFiles.length} files loaded
              </div>
            </div>
          )}

          <div className="rfp-landing-generate-actions">
            <button
              className="rfp-landing-btn-primary rfp-landing-generate-btn"
              onClick={handleRunAnalysis}
              disabled={generating}
            >
              {generating ? 'Analyzing\u2026' : 'Run Analysis'}
            </button>
            {successMsg && (
              <button className="rfp-landing-generate-reset" onClick={handleReset}>
                Reset
              </button>
            )}
          </div>

          {generating && progressSteps.length === 0 && (
            <div className="rfp-landing-generate-status rfp-landing-generate-loading">
              <span className="rfp-landing-spinner" />
              Loading RFP files...
            </div>
          )}
          {progressSteps.length > 0 && (
            <div className="rfp-landing-progress-list">
              {progressSteps.map((step) => (
                <div
                  key={step.phase}
                  className={`rfp-landing-progress-step rfp-landing-progress-${step.status}`}
                >
                  <span className="rfp-landing-progress-icon">
                    {step.status === 'running' && <span className="rfp-landing-spinner-sm" />}
                    {step.status === 'done' && '\u2713'}
                    {step.status === 'error' && '\u2717'}
                  </span>
                  <span className="rfp-landing-progress-msg">{step.message}</span>
                </div>
              ))}
            </div>
          )}
          {successMsg && (
            <div className="rfp-landing-generate-status rfp-landing-generate-success">
              {'\u2713'} {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="rfp-landing-generate-status rfp-landing-generate-error">
              {errorMsg}
            </div>
          )}
        </div>

        <div className="rfp-landing-actions">
          <button className="rfp-landing-btn-primary rfp-landing-btn-launch" onClick={() => navigate('/rfp/dashboard')}>
            Launch Demo
          </button>
          <button className="rfp-landing-btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </div>

        <div className="rfp-landing-footer">
          <span className="rfp-landing-footer-tag">Azure AI Foundry</span>
          <span className="rfp-landing-footer-sep">&middot;</span>
          <span className="rfp-landing-footer-tag">React + TypeScript</span>
          <span className="rfp-landing-footer-sep">&middot;</span>
          <span className="rfp-landing-footer-tag">RFP Response</span>
        </div>
      </div>
    </div>
  );
};

export default RfpLandingScreen;
