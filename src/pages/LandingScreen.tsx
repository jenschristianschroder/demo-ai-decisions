import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingScreen.css';

const LandingScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-root">
      <div className="landing-card">
        <div className="landing-badge">Decision</div>

        <div className="landing-header">
          <div className="landing-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#111111"/>
              <path d="M8 22L14 10L18 18L21 14L24 22H8Z" fill="white" opacity="0.9"/>
              <circle cx="24" cy="11" r="2.5" fill="white"/>
            </svg>
          </div>
          <div className="landing-title-block">
            <h1 className="landing-title">Group Finance Anomaly Review Assistant</h1>
            <p className="landing-subtitle">
              Detect unusual subsidiary reporting patterns, explain the risk, and accelerate close review.
            </p>
          </div>
        </div>

        <div className="landing-features">
          <div className="landing-feature">
            <span className="feature-icon">🔍</span>
            <div>
              <div className="feature-title">Anomaly Detection</div>
              <div className="feature-desc">Variance, trend, ratio and intercompany checks across all entities</div>
            </div>
          </div>
          <div className="landing-feature">
            <span className="feature-icon">🤖</span>
            <div>
              <div className="feature-title">AI Explanation</div>
              <div className="feature-desc">Evidence-based findings with possible causes and recommended follow-up</div>
            </div>
          </div>
          <div className="landing-feature">
            <span className="feature-icon">📧</span>
            <div>
              <div className="feature-title">Draft Communications</div>
              <div className="feature-desc">Auto-generated follow-up emails to subsidiary controllers</div>
            </div>
          </div>
          <div className="landing-feature">
            <span className="feature-icon">📋</span>
            <div>
              <div className="feature-title">Audit Trail</div>
              <div className="feature-desc">Full action log for every anomaly decision and status change</div>
            </div>
          </div>
        </div>

        <div className="landing-scenario">
          <div className="scenario-label">Demo Scenario</div>
          <div className="scenario-text">March 2026 Group Close — 12 subsidiaries, 23 anomalies detected</div>
        </div>

        <div className="landing-actions">
          <button className="btn-primary btn-launch" onClick={() => navigate('/dashboard')}>
            Launch Demo
          </button>
          <button className="btn-secondary" onClick={() => navigate('/upload')}>
            Upload Data
          </button>
        </div>

        <div className="landing-footer">
          <span className="footer-tag">Azure AI Foundry</span>
          <span className="footer-sep">·</span>
          <span className="footer-tag">React + TypeScript</span>
          <span className="footer-sep">·</span>
          <span className="footer-tag">Group Finance</span>
        </div>
      </div>
    </div>
  );
};

export default LandingScreen;
