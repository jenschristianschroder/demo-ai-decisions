import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdpLandingScreen.css';

const AdpLandingScreen: React.FC = () => {
  const navigate = useNavigate();

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
