import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateDemoDataPhased, type ProgressStep } from '../lib/adpAi';
import { setAdpData, resetAdpData } from '../data/mockAdpData';
import './AdpLandingScreen.css';

const AdpLandingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setSuccessMsg('');
    setErrorMsg('');
    setProgressSteps([]);
    try {
      const result = await generateDemoDataPhased(prompt.trim(), (step) => {
        setProgressSteps(prev => {
          // Replace the last step if it's the same phase/account (running→done)
          const updated = [...prev];
          if (step.phase === 'plan') {
            const idx = updated.findIndex(s => s.phase === 'plan');
            if (idx >= 0) {
              updated[idx] = step;
              return updated;
            }
          } else if (step.phase === 'account') {
            const idx = updated.findIndex(
              s => s.phase === 'account' && s.accountName === step.accountName
            );
            if (idx >= 0) {
              updated[idx] = step;
              return updated;
            }
          }
          return [...updated, step];
        });
      });
      if (result.valid) {
        setAdpData(result.data);
        const count = result.data.accounts.length;
        setSuccessMsg(`Demo data generated — ${count} account${count !== 1 ? 's' : ''} loaded`);
        setTimeout(() => navigate('/adp/dashboard'), 1500);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong while generating demo data. Please try again.';
      setErrorMsg(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    resetAdpData();
    setSuccessMsg('');
    setErrorMsg('');
    setPrompt('');
    setProgressSteps([]);
  };

  return (
    <div className="adp-landing-root">
      <div className="adp-landing-card">
        <div className="adp-landing-badge">Decision</div>

        <div className="adp-landing-header">
          <div className="adp-landing-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#111111"/>
              <circle cx="16" cy="10" r="3" fill="white" opacity="0.9"/>
              <circle cx="9" cy="22" r="2.5" fill="white" opacity="0.9"/>
              <circle cx="23" cy="22" r="2.5" fill="white" opacity="0.9"/>
              <line x1="14" y1="12.5" x2="10.5" y2="19.5" stroke="white" strokeWidth="1.2" opacity="0.7"/>
              <line x1="18" y1="12.5" x2="21.5" y2="19.5" stroke="white" strokeWidth="1.2" opacity="0.7"/>
            </svg>
          </div>
          <div className="adp-landing-title-block">
            <h1 className="adp-landing-title">Account Development Planning Assistant</h1>
            <p className="adp-landing-subtitle">
              Transform account planning from static documentation into a living, data-driven execution system — one that supports daily account management and enables sustained follow-through on strategic priorities.
            </p>
          </div>
        </div>

        <div className="adp-landing-value-shift">
          <div className="adp-landing-shift-from">
            <div className="adp-landing-shift-label">From</div>
            <div className="adp-landing-shift-items">
              <span>Static documentation</span>
              <span>Annual workshops</span>
              <span>Fragmented data</span>
              <span>Low adoption</span>
            </div>
          </div>
          <div className="adp-landing-shift-arrow">→</div>
          <div className="adp-landing-shift-to">
            <div className="adp-landing-shift-label">To</div>
            <div className="adp-landing-shift-items">
              <span>Living execution engine</span>
              <span>Continuous planning</span>
              <span>Single source of truth</span>
              <span>Daily engagement</span>
            </div>
          </div>
        </div>

        <div className="adp-landing-features">
          <div className="adp-landing-feature">
            <span className="adp-landing-feature-icon">📝</span>
            <div>
              <div className="adp-landing-feature-title">Low-Friction Capture</div>
              <div className="adp-landing-feature-desc">Remove adoption barriers — capture intelligence from meetings, emails, and customer interactions with minimal effort, improving data quality over time</div>
            </div>
          </div>
          <div className="adp-landing-feature">
            <span className="adp-landing-feature-icon">💡</span>
            <div>
              <div className="adp-landing-feature-title">AI-Powered Insights</div>
              <div className="adp-landing-feature-desc">Move from subjective judgement to data-driven decision support — automatically identify risks, opportunities, and gaps across your account portfolio</div>
            </div>
          </div>
          <div className="adp-landing-feature">
            <span className="adp-landing-feature-icon">🎯</span>
            <div>
              <div className="adp-landing-feature-title">Insight-to-Execution Linkage</div>
              <div className="adp-landing-feature-desc">Close the gap between insight and outcome — translate signals into tracked initiatives with clear ownership, deadlines, and measurable progress</div>
            </div>
          </div>
          <div className="adp-landing-feature">
            <span className="adp-landing-feature-icon">🔔</span>
            <div>
              <div className="adp-landing-feature-title">Continuous Execution Discipline</div>
              <div className="adp-landing-feature-desc">Sustain follow-through with smart nudges — the KAM supervises execution, not manual data entry, ensuring ideas drive outcomes</div>
            </div>
          </div>
        </div>

        <div className="adp-landing-generate">
          <div className="adp-landing-generate-label">Generate Custom Demo Data</div>
          <p className="adp-landing-generate-hint">
            Describe a business or industry and AI will generate a complete set of sample data tailored to your scenario.
          </p>
          <textarea
            className="adp-landing-generate-textarea"
            placeholder="e.g. A software vendor managing 5 enterprise healthcare accounts across EMEA…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
            rows={3}
          />
          <div className="adp-landing-generate-actions">
            <button
              className="adp-landing-btn-primary adp-landing-generate-btn"
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
            >
              {generating ? 'Generating…' : 'Generate Demo Data'}
            </button>
            {successMsg && (
              <button className="adp-landing-generate-reset" onClick={handleReset}>
                Reset to Default
              </button>
            )}
          </div>

          {generating && progressSteps.length === 0 && (
            <div className="adp-landing-generate-status adp-landing-generate-loading">
              <span className="adp-landing-spinner" />
              Starting generation…
            </div>
          )}
          {progressSteps.length > 0 && (
            <div className="adp-landing-progress-list">
              {progressSteps.map((step, i) => (
                <div
                  key={i}
                  className={`adp-landing-progress-step adp-landing-progress-${step.status}`}
                >
                  <span className="adp-landing-progress-icon">
                    {step.status === 'running' && <span className="adp-landing-spinner-sm" />}
                    {step.status === 'done' && '✓'}
                    {step.status === 'error' && '✗'}
                  </span>
                  <span className="adp-landing-progress-msg">{step.message}</span>
                </div>
              ))}
            </div>
          )}
          {successMsg && (
            <div className="adp-landing-generate-status adp-landing-generate-success">
              ✓ {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="adp-landing-generate-status adp-landing-generate-error">
              {errorMsg}
            </div>
          )}
        </div>

        <div className="adp-landing-scenario">
          <div className="adp-landing-scenario-label">Demo Scenario</div>
          <div className="adp-landing-scenario-text">6 accounts · 12 signals · 8 initiatives · Continuous execution model</div>
        </div>

        <div className="adp-landing-outcomes">
          <div className="adp-landing-outcomes-title">Business Value</div>
          <div className="adp-landing-outcomes-grid">
            <div className="adp-landing-outcome">
              <span className="adp-landing-outcome-metric">↑</span>
              <span className="adp-landing-outcome-text">ADP adoption through friction removal</span>
            </div>
            <div className="adp-landing-outcome">
              <span className="adp-landing-outcome-metric">↑</span>
              <span className="adp-landing-outcome-text">Data quality and relevance over time</span>
            </div>
            <div className="adp-landing-outcome">
              <span className="adp-landing-outcome-metric">🔗</span>
              <span className="adp-landing-outcome-text">Insights → Initiatives → Actions → Outcomes</span>
            </div>
            <div className="adp-landing-outcome">
              <span className="adp-landing-outcome-metric">⟳</span>
              <span className="adp-landing-outcome-text">Documentation → Decision Support → Execution</span>
            </div>
          </div>
        </div>

        <div className="adp-landing-actions">
          <button className="adp-landing-btn-primary adp-landing-btn-launch" onClick={() => navigate('/adp/dashboard')}>
            Launch Demo
          </button>
          <button className="adp-landing-btn-secondary" onClick={() => navigate('/adp/nudges')}>
            Nudge Centre
          </button>
        </div>

        <div className="adp-landing-footer">
          <span className="adp-landing-footer-tag">Azure AI Foundry</span>
          <span className="adp-landing-footer-sep">·</span>
          <span className="adp-landing-footer-tag">React + TypeScript</span>
          <span className="adp-landing-footer-sep">·</span>
          <span className="adp-landing-footer-tag">Account Management</span>
        </div>
      </div>
    </div>
  );
};

export default AdpLandingScreen;
