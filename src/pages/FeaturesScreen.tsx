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
