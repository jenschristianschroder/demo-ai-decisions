import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ingestContractFiles, loadContractPlaybookData } from '../lib/contractDataLoader';
import { runContractWorkflow } from '../lib/contractAi';
import { setContractData, resetContractData } from '../data/mockContractData';
import type { ContractProgressStep, ContractFileInfo } from '../types/contract';
import './ContractLandingScreen.css';

const ContractLandingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [progressSteps, setProgressSteps] = useState<ContractProgressStep[]>([]);
  const [loadedFiles, setLoadedFiles] = useState<ContractFileInfo[]>([]);

  const handleRunAnalysis = async () => {
    setGenerating(true);
    setSuccessMsg('');
    setErrorMsg('');
    setProgressSteps([]);
    setLoadedFiles([]);
    try {
      const files = await ingestContractFiles();
      setLoadedFiles(files);

      const contractFile = files.find(f => f.type === 'contract' && f.extractedText);
      if (!contractFile?.extractedText) {
        setErrorMsg('Could not load contract document text. Please try again.');
        setGenerating(false);
        return;
      }

      const { playbookText, clauseLibraryText } = await loadContractPlaybookData();

      const outputs = await runContractWorkflow(
        contractFile.extractedText,
        playbookText,
        clauseLibraryText,
        (step) => {
          setProgressSteps(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(s => s.phase === step.phase);
            if (idx >= 0) {
              updated[idx] = step;
              return updated;
            }
            return [...updated, step];
          });
        },
      );

      setContractData({
        scenario: {
          id: 'vendor-service-agreement-2026',
          title: 'Vendor Service Agreement - Full Review',
          description: 'Contract review for vendor service agreement with automated red-lining and risk assessment.',
          files,
          agentOutputs: outputs,
          progressSteps: [],
        },
      });
      setSuccessMsg('Contract analysis completed successfully');
      setTimeout(() => navigate('/contract/dashboard'), 1500);
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
    resetContractData();
    setSuccessMsg('');
    setErrorMsg('');
    setProgressSteps([]);
    setLoadedFiles([]);
  };

  return (
    <div className="contract-landing-root">
      <div className="contract-landing-card">
        <div className="contract-landing-badge">AI Contract Review</div>

        <div className="contract-landing-header">
          <div className="contract-landing-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#111111"/>
              <rect x="8" y="5" width="12" height="18" rx="2" fill="white" opacity="0.9"/>
              <path d="M22 14L25 11L27 13L24 16L22 14Z" fill="white" opacity="0.8"/>
              <line x1="22" y1="14" x2="24" y2="16" stroke="#111111" strokeWidth="0.5"/>
            </svg>
          </div>
          <div className="contract-landing-title-block">
            <h1 className="contract-landing-title">AI Contract Review</h1>
            <p className="contract-landing-subtitle">
              Enhance productivity and quality of legal's contract review process by automatically highlighting deviations from standards, identifying inconsistencies, suggesting edits from the legal playbook, and assessing risk levels.
            </p>
          </div>
        </div>

        <div className="contract-landing-value-shift">
          <div className="contract-landing-shift-from">
            <div className="contract-landing-shift-label">From</div>
            <div className="contract-landing-shift-items">
              <span>Manual contract review</span>
              <span>292+ hours per practitioner per year</span>
              <span>Risk based on individual experience</span>
              <span>Generic AI tools lacking legal context</span>
            </div>
          </div>
          <div className="contract-landing-shift-arrow">{'\u2192'}</div>
          <div className="contract-landing-shift-to">
            <div className="contract-landing-shift-label">To</div>
            <div className="contract-landing-shift-items">
              <span>Automated red-lining and deviation detection</span>
              <span>AI-powered clause comparison</span>
              <span>Playbook-grounded risk assessment</span>
              <span>Multi-language contract handling</span>
            </div>
          </div>
        </div>

        <div className="contract-landing-features">
          <div className="contract-landing-feature">
            <span className="contract-landing-feature-icon">{'\uD83D\uDD0D'}</span>
            <div>
              <div className="contract-landing-feature-title">Automated Red-Lining</div>
              <div className="contract-landing-feature-desc">Highlights changes, discrepancies, and duplicity in definitions against standard contract templates and clause libraries</div>
            </div>
          </div>
          <div className="contract-landing-feature">
            <span className="contract-landing-feature-icon">{'\u2696\uFE0F'}</span>
            <div>
              <div className="contract-landing-feature-title">Risk Assessment</div>
              <div className="contract-landing-feature-desc">Assesses degrees of risk and suggests potential alternatives from the legal department playbook</div>
            </div>
          </div>
          <div className="contract-landing-feature">
            <span className="contract-landing-feature-icon">{'\uD83D\uDCCB'}</span>
            <div>
              <div className="contract-landing-feature-title">Legal Playbook Workbench</div>
              <div className="contract-landing-feature-desc">Upload standard contracts and templates that the tool uses as the playbook for contract review</div>
            </div>
          </div>
          <div className="contract-landing-feature">
            <span className="contract-landing-feature-icon">{'\uD83C\uDF10'}</span>
            <div>
              <div className="contract-landing-feature-title">Multi-Language Support</div>
              <div className="contract-landing-feature-desc">Compare contracts in different languages and provide updates in both languages</div>
            </div>
          </div>
        </div>

        <div className="contract-landing-scenario">
          <div className="contract-landing-scenario-label">Demo Scenario</div>
          <div className="contract-landing-scenario-text">Vendor Service Agreement &middot; 6 agents &middot; Full review workflow</div>
        </div>

        <div className="contract-landing-outcomes">
          <div className="contract-landing-outcomes-title">Agents Involved</div>
          <div className="contract-landing-outcomes-grid">
            <div className="contract-landing-outcome">
              <span className="contract-landing-outcome-metric">{'\uD83D\uDCC4'}</span>
              <span className="contract-landing-outcome-text">Document Parser &middot; Clause Extractor</span>
            </div>
            <div className="contract-landing-outcome">
              <span className="contract-landing-outcome-metric">{'\uD83D\uDCDA'}</span>
              <span className="contract-landing-outcome-text">Playbook Comparison &middot; Risk Assessment</span>
            </div>
            <div className="contract-landing-outcome">
              <span className="contract-landing-outcome-metric">{'\u270F\uFE0F'}</span>
              <span className="contract-landing-outcome-text">Redline Generator &middot; Recommendation Engine</span>
            </div>
          </div>
        </div>

        <div className="contract-landing-generate">
          <div className="contract-landing-generate-label">Demo Data</div>
          <p className="contract-landing-generate-hint">
            Load the sample contract package and run the full 6-agent review workflow to generate a complete contract analysis.
          </p>

          {loadedFiles.length > 0 && (
            <div className="contract-landing-files">
              {loadedFiles.map((file) => (
                <div key={file.name} className="contract-landing-file">
                  <span className="contract-landing-file-name">{file.name}</span>
                  <span className={`contract-landing-file-status contract-landing-file-status--${file.status}`}>
                    {file.status}
                  </span>
                </div>
              ))}
              <div className="contract-landing-file-count">
                {loadedFiles.filter(f => f.status === 'parsed').length} of {loadedFiles.length} files loaded
              </div>
            </div>
          )}

          <div className="contract-landing-generate-actions">
            <button
              className="contract-landing-btn-primary contract-landing-generate-btn"
              onClick={handleRunAnalysis}
              disabled={generating}
            >
              {generating ? 'Analyzing\u2026' : 'Run Analysis'}
            </button>
            {successMsg && (
              <button className="contract-landing-generate-reset" onClick={handleReset}>
                Reset
              </button>
            )}
          </div>

          {generating && progressSteps.length === 0 && (
            <div className="contract-landing-generate-status contract-landing-generate-loading">
              <span className="contract-landing-spinner" />
              Loading contract files...
            </div>
          )}
          {progressSteps.length > 0 && (
            <div className="contract-landing-progress-list">
              {progressSteps.map((step) => (
                <div
                  key={step.phase}
                  className={`contract-landing-progress-step contract-landing-progress-${step.status}`}
                >
                  <span className="contract-landing-progress-icon">
                    {step.status === 'running' && <span className="contract-landing-spinner-sm" />}
                    {step.status === 'done' && '\u2713'}
                    {step.status === 'error' && '\u2717'}
                  </span>
                  <span className="contract-landing-progress-msg">{step.message}</span>
                </div>
              ))}
            </div>
          )}
          {successMsg && (
            <div className="contract-landing-generate-status contract-landing-generate-success">
              {'\u2713'} {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="contract-landing-generate-status contract-landing-generate-error">
              {errorMsg}
            </div>
          )}
        </div>

        <div className="contract-landing-actions">
          <button className="contract-landing-btn-primary contract-landing-btn-launch" onClick={() => navigate('/contract/dashboard')}>
            Launch Demo
          </button>
          <button className="contract-landing-btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </div>

        <div className="contract-landing-footer">
          <span className="contract-landing-footer-tag">Azure AI Foundry</span>
          <span className="contract-landing-footer-sep">&middot;</span>
          <span className="contract-landing-footer-tag">React + TypeScript</span>
          <span className="contract-landing-footer-sep">&middot;</span>
          <span className="contract-landing-footer-tag">Contract Review</span>
        </div>
      </div>
    </div>
  );
};

export default ContractLandingScreen;
