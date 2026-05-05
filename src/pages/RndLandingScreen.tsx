import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRndDataPhased, type RndProgressStep } from '../lib/rndAi';
import { setRndData, resetRndData } from '../data/mockRndData';
import './RndLandingScreen.css';

const RndLandingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [progressSteps, setProgressSteps] = useState<RndProgressStep[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setSuccessMsg('');
    setErrorMsg('');
    setProgressSteps([]);
    try {
      const result = await generateRndDataPhased(prompt.trim(), (step) => {
        setProgressSteps(prev => {
          const updated = [...prev];
          if (step.phase === 'plan') {
            const idx = updated.findIndex(s => s.phase === 'plan');
            if (idx >= 0) { updated[idx] = step; return updated; }
          } else if (step.phase === 'agent') {
            const idx = updated.findIndex(
              s => s.phase === 'agent' && s.agentName === step.agentName
            );
            if (idx >= 0) { updated[idx] = step; return updated; }
          if (step.phase === 'decision') {
            const idx = updated.findIndex(s => s.phase === 'decision' && (!('step' in step) || !('step' in s) || s.step === step.step));
            if (idx >= 0) { updated[idx] = step; return updated; }
          }
          return [...updated, step];
        });
      });
      if (result.valid) {
        setRndData(result.data);
        setSuccessMsg('R&D scenario generated successfully');
        setTimeout(() => navigate('/rnd/dashboard'), 1500);
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
    resetRndData();
    setSuccessMsg('');
    setErrorMsg('');
    setPrompt('');
    setProgressSteps([]);
  };

  return (
    <div className="rnd-landing-root">
      <div className="rnd-landing-card">
        <div className="rnd-landing-badge">Decision</div>

        <div className="rnd-landing-header">
          <div className="rnd-landing-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#111111"/>
              <path d="M16 6L20 12H12L16 6Z" fill="white" opacity="0.9"/>
              <path d="M8 18L12 24H4L8 18Z" fill="white" opacity="0.7"/>
              <path d="M24 18L28 24H20L24 18Z" fill="white" opacity="0.7"/>
              <line x1="14" y1="13" x2="10" y2="17" stroke="white" strokeWidth="1.2" opacity="0.5"/>
              <line x1="18" y1="13" x2="22" y2="17" stroke="white" strokeWidth="1.2" opacity="0.5"/>
            </svg>
          </div>
          <div className="rnd-landing-title-block">
            <h1 className="rnd-landing-title">Research &amp; Development Decision Assistant</h1>
            <p className="rnd-landing-subtitle">
              Select the best product concept to advance — using a network of specialized AI agents that gather evidence, challenge assumptions, and make trade-offs visible.
            </p>
          </div>
        </div>

        <div className="rnd-landing-value-shift">
          <div className="rnd-landing-shift-from">
            <div className="rnd-landing-shift-label">From</div>
            <div className="rnd-landing-shift-items">
              <span>Expert judgment alone</span>
              <span>Isolated datasets</span>
              <span>Implicit trade-offs</span>
              <span>Subjective scoring</span>
            </div>
          </div>
          <div className="rnd-landing-shift-arrow">→</div>
          <div className="rnd-landing-shift-to">
            <div className="rnd-landing-shift-label">To</div>
            <div className="rnd-landing-shift-items">
              <span>Evidence-based decisions</span>
              <span>Integrated analysis</span>
              <span>Visible trade-offs</span>
              <span>Weighted scoring model</span>
            </div>
          </div>
        </div>

        <div className="rnd-landing-features">
          <div className="rnd-landing-feature">
            <span className="rnd-landing-feature-icon">🔬</span>
            <div>
              <div className="rnd-landing-feature-title">Multi-Agent Analysis</div>
              <div className="rnd-landing-feature-desc">Nine specialized agents evaluate each concept across user value, clinical evidence, simulation, lab tests, usability, regulatory risk, manufacturing, and sustainability</div>
            </div>
          </div>
          <div className="rnd-landing-feature">
            <span className="rnd-landing-feature-icon">⚖️</span>
            <div>
              <div className="rnd-landing-feature-title">Weighted Decision Model</div>
              <div className="rnd-landing-feature-desc">Combine all agent outputs into a transparent, weighted scoring model that ranks concepts and recommends the best path forward</div>
            </div>
          </div>
          <div className="rnd-landing-feature">
            <span className="rnd-landing-feature-icon">📋</span>
            <div>
              <div className="rnd-landing-feature-title">Decision Package</div>
              <div className="rnd-landing-feature-desc">Produce a complete decision package with evidence summary, key assumptions, risks, next experiments, and kill criteria</div>
            </div>
          </div>
          <div className="rnd-landing-feature">
            <span className="rnd-landing-feature-icon">👥</span>
            <div>
              <div className="rnd-landing-feature-title">Human-in-the-Loop</div>
              <div className="rnd-landing-feature-desc">The R&amp;D team remains accountable — agents make trade-offs visible and evidence-based, not replace human judgment</div>
            </div>
          </div>
        </div>

        <div className="rnd-landing-generate">
          <div className="rnd-landing-generate-label">Generate Custom Scenario</div>
          <p className="rnd-landing-generate-hint">
            Describe an R&amp;D decision scenario and AI will generate a complete multi-agent analysis tailored to your context.
          </p>
          <textarea
            className="rnd-landing-generate-textarea"
            placeholder="e.g. An R&D team evaluating three battery chemistry options for a next-generation electric vehicle…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
            rows={3}
          />
          <div className="rnd-landing-generate-actions">
            <button
              className="rnd-landing-btn-primary rnd-landing-generate-btn"
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
            >
              {generating ? 'Generating…' : 'Generate Scenario'}
            </button>
            {successMsg && (
              <button className="rnd-landing-generate-reset" onClick={handleReset}>
                Reset to Default
              </button>
            )}
          </div>

          {generating && progressSteps.length === 0 && (
            <div className="rnd-landing-generate-status rnd-landing-generate-loading">
              <span className="rnd-landing-spinner" />
              Starting generation…
            </div>
          )}
          {progressSteps.length > 0 && (
            <div className="rnd-landing-progress-list">
              {progressSteps.map((step) => {
                const key = step.phase === 'agent' ? `agent-${step.agentName}` : step.phase === 'decision' && 'step' in step && step.step ? `decision-${step.step}` : step.phase;
                return (
                  <div
                    key={key}
                    className={`rnd-landing-progress-step rnd-landing-progress-${step.status}`}
                  >
                    <span className="rnd-landing-progress-icon">
                      {step.status === 'running' && <span className="rnd-landing-spinner-sm" />}
                      {step.status === 'done' && '✓'}
                      {step.status === 'error' && '✗'}
                    </span>
                    <span className="rnd-landing-progress-msg">{step.message}</span>
                  </div>
                );
              })}
            </div>
          )}
          {successMsg && (
            <div className="rnd-landing-generate-status rnd-landing-generate-success">
              ✓ {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="rnd-landing-generate-status rnd-landing-generate-error">
              {errorMsg}
            </div>
          )}
        </div>

        <div className="rnd-landing-scenario">
          <div className="rnd-landing-scenario-label">Demo Scenario</div>
          <div className="rnd-landing-scenario-text">3 concepts · 9 agents · Weighted decision model</div>
        </div>

        <div className="rnd-landing-outcomes">
          <div className="rnd-landing-outcomes-title">Agents Involved</div>
          <div className="rnd-landing-outcomes-grid">
            <div className="rnd-landing-outcome">
              <span className="rnd-landing-outcome-metric">👤</span>
              <span className="rnd-landing-outcome-text">User Insights · Clinical Evidence · Design</span>
            </div>
            <div className="rnd-landing-outcome">
              <span className="rnd-landing-outcome-metric">🧪</span>
              <span className="rnd-landing-outcome-text">Simulation · Lab Test · Human Factors</span>
            </div>
            <div className="rnd-landing-outcome">
              <span className="rnd-landing-outcome-metric">📊</span>
              <span className="rnd-landing-outcome-text">Regulatory · Manufacturing · Sustainability</span>
            </div>
            <div className="rnd-landing-outcome">
              <span className="rnd-landing-outcome-metric">🎯</span>
              <span className="rnd-landing-outcome-text">Decision Agent → Recommendation + Package</span>
            </div>
          </div>
        </div>

        <div className="rnd-landing-actions">
          <button className="rnd-landing-btn-primary rnd-landing-btn-launch" onClick={() => navigate('/rnd/dashboard')}>
            Launch Demo
          </button>
          <button className="rnd-landing-btn-secondary" onClick={() => navigate('/rnd/decision')}>
            Decision Summary
          </button>
        </div>

        <div className="rnd-landing-footer">
          <span className="rnd-landing-footer-tag">Azure AI Foundry</span>
          <span className="rnd-landing-footer-sep">·</span>
          <span className="rnd-landing-footer-tag">React + TypeScript</span>
          <span className="rnd-landing-footer-sep">·</span>
          <span className="rnd-landing-footer-tag">R&amp;D Concept Selection</span>
        </div>
      </div>
    </div>
  );
};

export default RndLandingScreen;
