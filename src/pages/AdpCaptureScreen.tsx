import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { InteractionType, ExtractionResult } from '../types/adp';
import { getAdpAccount } from '../data/mockAdpData';
import { extractSignals } from '../lib/adpAi';
import InteractionInput from '../components/adp/capture/InteractionInput';
import ExtractionPreview from '../components/adp/capture/ExtractionPreview';
import './AdpCaptureScreen.css';

type Phase = 'input' | 'loading' | 'preview' | 'saved' | 'error';

const AdpCaptureScreen: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const account = getAdpAccount(accountId ?? '');

  const [phase, setPhase] = useState<Phase>('input');
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleExtract = async (_type: InteractionType, rawText: string) => {
    setPhase('loading');
    setErrorMessage('');
    try {
      const extraction = await extractSignals(rawText);
      setResult(extraction);
      setPhase('preview');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(message);
      setPhase('error');
    }
  };

  const handleSave = () => {
    setPhase('saved');
    setTimeout(() => {
      navigate(`/adp/account/${accountId}`, { state: { tab: 'signals' } });
    }, 1200);
  };

  const handleBack = () => {
    setPhase('input');
    setResult(null);
    setErrorMessage('');
  };

  if (!account) {
    return (
      <div className="adp-capture-root">
        <div className="adp-capture-not-found">
          <p>Account not found.</p>
          <button className="adp-capture-btn-secondary" onClick={() => navigate('/adp/dashboard')}>
            Back to Portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="adp-capture-root">
      {/* Sticky header */}
      <div className="adp-capture-header-bar">
        <div className="adp-capture-header-inner">
          <div className="adp-capture-breadcrumb">
            <button className="adp-capture-breadcrumb-link" onClick={() => navigate('/')}>
              Home
            </button>
            <span className="adp-capture-breadcrumb-sep">›</span>
            <button className="adp-capture-breadcrumb-link" onClick={() => navigate('/adp/dashboard')}>
              Account Portfolio
            </button>
            <span className="adp-capture-breadcrumb-sep">›</span>
            <button
              className="adp-capture-breadcrumb-link"
              onClick={() => navigate(`/adp/account/${accountId}`)}
            >
              {account.name}
            </button>
            <span className="adp-capture-breadcrumb-sep">›</span>
            <span className="adp-capture-breadcrumb-current">Capture Interaction</span>
          </div>
          <h1 className="adp-capture-page-title">Capture Interaction</h1>
        </div>
      </div>

      {/* Body */}
      <div className="adp-capture-body">
        <div className="adp-capture-body-inner">
          {phase === 'input' && <InteractionInput onExtract={handleExtract} />}

          {phase === 'loading' && (
            <div className="adp-capture-loading">
              <span className="adp-capture-pulse-dot" />
              <span>Analyzing interaction…</span>
            </div>
          )}

          {phase === 'preview' && result && (
            <ExtractionPreview result={result} onSave={handleSave} onBack={handleBack} />
          )}

          {phase === 'saved' && (
            <div className="adp-capture-success">
              <span className="adp-capture-success-icon">✓</span>
              <span>Saved successfully — redirecting to account…</span>
            </div>
          )}

          {phase === 'error' && (
            <div className="adp-capture-input-card">
              <div className="adp-capture-error">
                <p className="adp-capture-error-title">⚠ Failed to extract insights</p>
                <p className="adp-capture-error-details">{errorMessage}</p>
                <button className="adp-capture-btn-secondary" onClick={handleBack}>
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdpCaptureScreen;
