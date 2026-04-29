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
              Transform account planning from static documentation into a living execution engine powered by AI insights.
            </p>
          </div>
        </div>

        <div className="adp-landing-features">
          <div className="adp-landing-feature">
            <span className="adp-landing-feature-icon">📝</span>
            <div>
              <div className="adp-landing-feature-title">Low-Friction Capture</div>
              <div className="adp-landing-feature-desc">Capture account intelligence from meetings, emails, and customer interactions with minimal effort</div>
            </div>
          </div>
          <div className="adp-landing-feature">
            <span className="adp-landing-feature-icon">💡</span>
            <div>
              <div className="adp-landing-feature-title">AI-Powered Insights</div>
              <div className="adp-landing-feature-desc">Identify risks, opportunities, and gaps across your account portfolio automatically</div>
            </div>
          </div>
          <div className="adp-landing-feature">
            <span className="adp-landing-feature-icon">🎯</span>
            <div>
              <div className="adp-landing-feature-title">Execution Engine</div>
              <div className="adp-landing-feature-desc">Turn insights into tracked initiatives with clear ownership, deadlines, and progress</div>
            </div>
          </div>
          <div className="adp-landing-feature">
            <span className="adp-landing-feature-icon">🔔</span>
            <div>
              <div className="adp-landing-feature-title">Continuous Nudges</div>
              <div className="adp-landing-feature-desc">Stay on top of stale data, overdue actions, and missing information with smart reminders</div>
            </div>
          </div>
        </div>

        <div className="adp-landing-scenario">
          <div className="adp-landing-scenario-label">Demo Scenario</div>
          <div className="adp-landing-scenario-text">6 accounts · 12 signals · 8 initiatives · Continuous execution model</div>
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
