import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomeScreen.css';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <h1 className="welcome-title">AI-Assisted Decision Making</h1>
        <p className="welcome-subtitle">
          Experience how AI agents assist humans in complex decision workflows —
          from anomaly detection to evidence-based review and follow-up.
        </p>

        <button
          className="welcome-cta"
          onClick={() => navigate('/features')}
          type="button"
        >
          Try the Demos
        </button>
      </div>

      <footer className="welcome-footer">
        Microsoft Innovation Hub Denmark
      </footer>
    </div>
  );
};

export default WelcomeScreen;
