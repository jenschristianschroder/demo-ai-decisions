import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DoeLandingScreen.css';

const DoeLandingScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="doe-landing-root">
      <div className="doe-landing-card">
        <div className="doe-landing-badge">Decision · Documentation</div>

        <div className="doe-landing-header">
          <div className="doe-landing-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#111111" />
              <rect x="7" y="20" width="4" height="6" rx="1" fill="white" opacity="0.9" />
              <rect x="14" y="14" width="4" height="12" rx="1" fill="white" opacity="0.9" />
              <rect x="21" y="9" width="4" height="17" rx="1" fill="white" opacity="0.9" />
              <circle cx="9" cy="9" r="2.5" fill="white" />
            </svg>
          </div>
          <div className="doe-landing-title-block">
            <h1 className="doe-landing-title">R&amp;D DoE Report Assistant</h1>
            <p className="doe-landing-subtitle">
              AI-augmented Design of Experiments reporting for a medical-device R&amp;D team.
              A scientist provides experiment data; a chain of specialized AI steps computes the
              statistics and drafts a structured, compliant, human-reviewable DoE report.
            </p>
          </div>
        </div>

        <div className="doe-landing-features">
          <div className="doe-landing-feature">
            <span className="doe-feature-icon">🧪</span>
            <div>
              <div className="doe-feature-title">Real statistics</div>
              <div className="doe-feature-desc">Main effects, interactions, p-values and model fit computed in TypeScript — never faked</div>
            </div>
          </div>
          <div className="doe-landing-feature">
            <span className="doe-feature-icon">📝</span>
            <div>
              <div className="doe-feature-title">Grounded drafting</div>
              <div className="doe-feature-desc">An 11-section report generated only from the analysis output and the template</div>
            </div>
          </div>
          <div className="doe-landing-feature">
            <span className="doe-feature-icon">✅</span>
            <div>
              <div className="doe-feature-title">Fact-check &amp; completeness</div>
              <div className="doe-feature-desc">Every numeric claim verified against computed values; gaps surfaced against a Definition of Good</div>
            </div>
          </div>
          <div className="doe-landing-feature">
            <span className="doe-feature-icon">👤</span>
            <div>
              <div className="doe-feature-title">Scientist accountable</div>
              <div className="doe-feature-desc">AI drafts; the scientist edits and approves. Every draft carries a review banner</div>
            </div>
          </div>
        </div>

        <div className="doe-landing-scenario">
          <div className="doe-scenario-label">Demo Scenario</div>
          <div className="doe-scenario-text">
            Baseplate Gen-3 adhesive — 2³ factorial, 19 runs, 5 responses (synthetic sample data)
          </div>
        </div>

        <div className="doe-landing-actions">
          <button className="doe-btn-primary doe-btn-launch" onClick={() => navigate('/doe/dashboard')}>
            Launch Demo
          </button>
          <button className="doe-btn-secondary" onClick={() => navigate('/doe/upload')}>
            Upload Dataset
          </button>
          <button className="doe-btn-secondary" onClick={() => navigate('/doe/data')}>
            View Demo Data
          </button>
        </div>

        <div className="doe-landing-footer">
          <span className="doe-footer-tag">Azure AI Foundry</span>
          <span className="doe-footer-sep">·</span>
          <span className="doe-footer-tag">React + TypeScript</span>
          <span className="doe-footer-sep">·</span>
          <span className="doe-footer-tag">Coloplast R&amp;D context</span>
        </div>
      </div>

      <footer className="doe-landing-hub-footer">Microsoft Innovation Hub Denmark</footer>
    </div>
  );
};

export default DoeLandingScreen;
