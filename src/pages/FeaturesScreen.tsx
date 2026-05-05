import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FeaturesScreen.css';

interface DemoInfo {
  id: string;
  label: string;
  description: string;
  route: string;
}

const DEMOS: DemoInfo[] = [
  {
    id: 'finance-anomaly-review',
    label: 'Group Finance Anomaly Review',
    description:
      'Detect unusual subsidiary reporting patterns, explain the risk, and accelerate close review with AI-assisted decisions',
    route: '/finance-anomaly-demo',
  },
  {
    id: 'account-development-planning',
    label: 'Account Development Planning',
    description:
      'Transform account planning from static documentation into a living execution engine — capture insights, drive initiatives, and sustain follow-through',
    route: '/adp',
  },
  {
    id: 'research-and-development',
    label: 'Research & Development',
    description:
      'Select the best product concept to advance using a network of specialized AI agents that evaluate user value, clinical evidence, simulation, lab data, usability, regulatory risk, and more',
    route: '/rnd',
  },
  {
    id: 'rfp-response',
    label: 'RFP Response Automation',
    description:
      'Analyze an incoming RFP with multiple AI agents to produce intake summaries, compliance matrices, draft answers, risk registers, and a complete response package',
    route: '/rfp',
  },
];

const DemoIcon: React.FC<{ id: string }> = ({ id }) => {
  switch (id) {
    case 'finance-anomaly-review':
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#111111" />
          <path d="M8 22L14 10L18 18L21 14L24 22H8Z" fill="white" opacity="0.9" />
          <circle cx="24" cy="11" r="2.5" fill="white" />
        </svg>
      );
    case 'account-development-planning':
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#111111" />
          <circle cx="16" cy="10" r="3" fill="white" opacity="0.9" />
          <circle cx="9" cy="22" r="2.5" fill="white" opacity="0.9" />
          <circle cx="23" cy="22" r="2.5" fill="white" opacity="0.9" />
          <line x1="14" y1="12.5" x2="10.5" y2="19.5" stroke="white" strokeWidth="1.2" opacity="0.7" />
          <line x1="18" y1="12.5" x2="21.5" y2="19.5" stroke="white" strokeWidth="1.2" opacity="0.7" />
        </svg>
      );
    case 'research-and-development':
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#111111" />
          <path d="M16 6L20 12H12L16 6Z" fill="white" opacity="0.9" />
          <path d="M8 18L12 24H4L8 18Z" fill="white" opacity="0.7" />
          <path d="M24 18L28 24H20L24 18Z" fill="white" opacity="0.7" />
          <line x1="14" y1="13" x2="10" y2="17" stroke="white" strokeWidth="1.2" opacity="0.5" />
          <line x1="18" y1="13" x2="22" y2="17" stroke="white" strokeWidth="1.2" opacity="0.5" />
        </svg>
      );
    case 'rfp-response':
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#111111" />
          <rect x="9" y="6" width="14" height="20" rx="2" fill="white" opacity="0.9" />
          <line x1="12" y1="11" x2="20" y2="11" stroke="#111111" strokeWidth="1.2" opacity="0.6" />
          <line x1="12" y1="14.5" x2="20" y2="14.5" stroke="#111111" strokeWidth="1.2" opacity="0.6" />
          <line x1="12" y1="18" x2="17" y2="18" stroke="#111111" strokeWidth="1.2" opacity="0.6" />
          <circle cx="22" cy="22" r="5" fill="#0f766e" />
          <path d="M20 22L21.5 23.5L24.5 20.5" stroke="white" strokeWidth="1.5" fill="none" />
        </svg>
      );
    default:
      return null;
  }
};

const FeaturesScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="features-container">
      <h1 className="features-title">Demos</h1>
      <p className="features-subtitle">Select a scenario to explore</p>
      <div className="features-list">
        {DEMOS.map((demo) => (
          <div
            key={demo.id}
            className="feature-card"
            role="button"
            tabIndex={0}
            onClick={() => navigate(demo.route)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(demo.route); } }}
          >
            <span className="feature-card-icon">
              <DemoIcon id={demo.id} />
            </span>
            <div className="feature-card-text">
              <span className="feature-card-label">{demo.label}</span>
              <span className="feature-card-desc">{demo.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesScreen;
