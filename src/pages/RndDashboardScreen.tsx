import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRndScenario, getRndDashboardSummary, setRndData } from '../data/mockRndData';
import { runRndAgentChain, type RndProgressStep } from '../lib/rndAi';
import './RndDashboardScreen.css';

const ratingColor = (level: string): string => {
  switch (level) {
    case 'High': return '#166534';
    case 'Medium-high': return '#15803d';
    case 'Medium': return '#a16207';
    case 'Medium-low': return '#c2410c';
    case 'Low': return '#b91c1c';
    default: return '#666666';
  }
};

const ratingBg = (level: string): string => {
  switch (level) {
    case 'High': return '#f0fdf4';
    case 'Medium-high': return '#f0fdf4';
    case 'Medium': return '#fffbeb';
    case 'Medium-low': return '#fff7ed';
    case 'Low': return '#fef2f2';
    default: return '#f8f9fa';
  }
};

const RndDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(getRndScenario());
  const [summary, setSummary] = useState(getRndDashboardSummary());
  const { concepts, agentOutputs, finalDecision } = scenario;
  const hasResults = !!agentOutputs && !!finalDecision;

  const [running, setRunning] = useState(false);
  const [progressSteps, setProgressSteps] = useState<RndProgressStep[]>([]);
  const [runError, setRunError] = useState('');

  const handleRunChain = async () => {
    setRunning(true);
    setRunError('');
    setProgressSteps([]);
    try {
      const result = await runRndAgentChain(
        { id: scenario.id, title: scenario.title, businessQuestion: scenario.businessQuestion, context: scenario.context, concepts: scenario.concepts },
        (step) => {
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
            } else if (step.phase === 'decision') {
              const idx = updated.findIndex(s => s.phase === 'decision' && (!('step' in step) || !('step' in s) || s.step === step.step));
              if (idx >= 0) { updated[idx] = step; return updated; }
            }
            return [...updated, step];
          });
        }
      );
      if (result.valid) {
        setRndData(result.data);
        setScenario(getRndScenario());
        setSummary(getRndDashboardSummary());
      } else {
        setRunError(result.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error && err.message
        ? err.message
        : 'Something went wrong while running the agent chain.';
      setRunError(message);
    } finally {
      setRunning(false);
    }
  };

  // Sort concepts by weighted score descending (only when results exist)
  const sortedScores = finalDecision
    ? [...finalDecision.scores].sort(
        (a, b) => b.weightedScore - a.weightedScore,
      )
    : [];

  return (
    <div className="rnd-dash-root">
      <header className="rnd-dash-header">
        <div className="rnd-dash-header-inner">
          <div className="rnd-dash-breadcrumb">
            <button className="rnd-dash-breadcrumb-link" onClick={() => navigate('/rnd')}>
              Home
            </button>
            <span className="rnd-dash-breadcrumb-sep">›</span>
            <span className="rnd-dash-breadcrumb-current">R&amp;D Decision Dashboard</span>
          </div>
          <div className="rnd-dash-title-row">
            <div>
              <h1 className="rnd-dash-title">{scenario.title}</h1>
              <div className="rnd-dash-subtitle">{scenario.businessQuestion}</div>
            </div>
            <button
              className="rnd-dash-btn-run-chain"
              onClick={handleRunChain}
              disabled={running}
            >
              {running ? (
                <>
                  <span className="rnd-dash-spinner" />
                  Running Agents…
                </>
              ) : (
                '🚀 Run AI Agent Chain'
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Agent chain progress panel */}
      {(progressSteps.length > 0 || runError) && (
        <div className="rnd-dash-progress-panel">
          <div className="rnd-dash-progress-panel-inner">
            <div className="rnd-dash-progress-title">Agent Reasoning Chain</div>
            {progressSteps.length > 0 && (
              <div className="rnd-dash-progress-list">
                {progressSteps.map((step) => {
                  const key = step.phase === 'agent' ? `agent-${step.agentName}` : step.phase === 'decision' && 'step' in step && step.step ? `decision-${step.step}` : step.phase;
                  return (
                    <div
                      key={key}
                      className={`rnd-dash-progress-step rnd-dash-progress-${step.status}`}
                    >
                      <span className="rnd-dash-progress-icon">
                        {step.status === 'running' && <span className="rnd-dash-spinner-sm" />}
                        {step.status === 'done' && '✓'}
                        {step.status === 'error' && '✗'}
                      </span>
                      <span className="rnd-dash-progress-msg">{step.message}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {runError && (
              <div className="rnd-dash-progress-error-msg">{runError}</div>
            )}
          </div>
        </div>
      )}

      <main className="rnd-dash-main">
        {/* Summary cards */}
        <div className="rnd-dash-summary-cards">
          <div className="rnd-dash-summary-card">
            <div className="rnd-dash-summary-card-value">{summary.totalConcepts}</div>
            <div className="rnd-dash-summary-card-label">Concepts</div>
            <div className="rnd-dash-summary-card-sub">Under evaluation</div>
          </div>
          <div className="rnd-dash-summary-card">
            <div className="rnd-dash-summary-card-value">{summary.agentsCompleted}/{summary.totalAgents}</div>
            <div className="rnd-dash-summary-card-label">Agents</div>
            <div className="rnd-dash-summary-card-sub">Completed</div>
          </div>
          {hasResults && (
            <>
              <div className="rnd-dash-summary-card rnd-dash-summary-card--highlight">
                <div className="rnd-dash-summary-card-value">{summary.recommendedConcept}</div>
                <div className="rnd-dash-summary-card-label">Recommended</div>
                <div className="rnd-dash-summary-card-sub">Highest weighted score</div>
              </div>
              <div className="rnd-dash-summary-card">
                <div className="rnd-dash-summary-card-value">{summary.weightedScoreRange.min.toFixed(1)}–{summary.weightedScoreRange.max.toFixed(1)}</div>
                <div className="rnd-dash-summary-card-label">Score Range</div>
                <div className="rnd-dash-summary-card-sub">Weighted (1–10)</div>
              </div>
            </>
          )}
        </div>

        {/* Context */}
        <div className="rnd-dash-context">
          <div className="rnd-dash-context-label">Context</div>
          <div className="rnd-dash-context-text">{scenario.context}</div>
        </div>

        {/* Concept cards */}
        <div className="rnd-dash-section-header">
          <h2 className="rnd-dash-section-title">Concepts</h2>
          {hasResults && <span className="rnd-dash-section-subtitle">Ranked by weighted score</span>}
          {!hasResults && <span className="rnd-dash-section-subtitle">In pipeline</span>}
        </div>

        <div className="rnd-dash-concept-grid">
          {hasResults ? (
            sortedScores.map((score, idx) => {
              const concept = concepts.find((c) => c.id === score.conceptId);
              if (!concept) return null;
              const action = finalDecision.conceptActions.find((a) => a.conceptId === concept.id);
              const isRecommended = concept.id === finalDecision.recommendedConceptId;
              return (
                <div
                  key={concept.id}
                  className={`rnd-dash-concept-card ${isRecommended ? 'rnd-dash-concept-card--recommended' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/rnd/concept/${concept.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/rnd/concept/${concept.id}`); } }}
                >
                  <div className="rnd-dash-concept-card-top">
                    <div className="rnd-dash-concept-rank">#{idx + 1}</div>
                    <div>
                      <div className="rnd-dash-concept-name">{concept.label}: {concept.name}</div>
                      <div className="rnd-dash-concept-desc">{concept.description}</div>
                    </div>
                  </div>

                  <div className="rnd-dash-concept-score-row">
                    <span className="rnd-dash-concept-score">{score.weightedScore.toFixed(1)}</span>
                    <span className="rnd-dash-concept-score-label">Weighted Score</span>
                  </div>

                  {action && (
                    <div className="rnd-dash-concept-badges">
                      <span className={`rnd-dash-badge rnd-dash-badge-${action.action}`}>
                        {action.action === 'advance' ? '✓ Advance' : action.action === 'backup' ? '↻ Backup' : '↓ Deprioritize'}
                      </span>
                      {isRecommended && <span className="rnd-dash-badge rnd-dash-badge-recommended">★ Recommended</span>}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            concepts.map((concept) => (
              <div key={concept.id} className="rnd-dash-concept-card">
                <div className="rnd-dash-concept-card-top">
                  <div>
                    <div className="rnd-dash-concept-name">{concept.label}: {concept.name}</div>
                    <div className="rnd-dash-concept-desc">{concept.description}</div>
                  </div>
                </div>
                <div className="rnd-dash-concept-score-row">
                  <span className="rnd-dash-concept-score-label">{concept.hypothesis}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Agents overview — show list when no results, show table when results exist */}
        <div className="rnd-dash-section-header">
          <h2 className="rnd-dash-section-title">{hasResults ? 'Agent Analysis Summary' : 'Available Agents'}</h2>
        </div>

        {hasResults && agentOutputs ? (
          <>
            <div className="rnd-dash-table-wrap">
              <table className="rnd-dash-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    {concepts.map((c) => (
                      <th key={c.id}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="rnd-dash-table-agent">🧪 Simulation</td>
                    {agentOutputs.simulation.entries.map((e) => (
                      <td key={e.conceptId}>
                        <span className="rnd-dash-table-value">{e.predictedLeakageReduction}</span>
                        <span className="rnd-dash-table-sub" style={{ color: ratingColor(e.confidence) }}>
                          {e.confidence}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="rnd-dash-table-agent">🔬 Lab Test — Leakage</td>
                    {agentOutputs.labTest.entries.map((e) => (
                      <td key={e.conceptId}>
                        <span className="rnd-dash-table-badge" style={{ background: ratingBg(e.leakageResistance), color: ratingColor(e.leakageResistance) }}>
                          {e.leakageResistance}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="rnd-dash-table-agent">👤 Usability</td>
                    {agentOutputs.humanFactors.entries.map((e) => (
                      <td key={e.conceptId}>
                        <span className="rnd-dash-table-badge" style={{ background: ratingBg(e.easeOfUse), color: ratingColor(e.easeOfUse) }}>
                          {e.easeOfUse}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="rnd-dash-table-agent">⚠️ Regulatory Risk</td>
                    {agentOutputs.regulatoryRisk.entries.map((e) => (
                      <td key={e.conceptId}>
                        <span className="rnd-dash-table-badge" style={{ background: ratingBg(e.safetyRisk), color: ratingColor(e.safetyRisk) }}>
                          {e.safetyRisk}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="rnd-dash-table-agent">🏭 Manufacturing</td>
                    {agentOutputs.manufacturingCost.entries.map((e) => (
                      <td key={e.conceptId}>
                        <span className="rnd-dash-table-badge" style={{ background: ratingBg(e.manufacturability), color: ratingColor(e.manufacturability) }}>
                          {e.manufacturability}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="rnd-dash-table-agent">🌿 Sustainability</td>
                    {agentOutputs.sustainability.entries.map((e) => (
                      <td key={e.conceptId}>
                        <span className="rnd-dash-table-badge" style={{ background: ratingBg(e.sustainabilityRisk), color: ratingColor(e.sustainabilityRisk) }}>
                          {e.sustainabilityRisk}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Scoring table */}
            <div className="rnd-dash-section-header">
              <h2 className="rnd-dash-section-title">Weighted Scoring</h2>
            </div>

            <div className="rnd-dash-table-wrap">
              <table className="rnd-dash-table">
                <thead>
                  <tr>
                    <th>Criterion</th>
                    <th>Weight</th>
                    {concepts.map((c) => (
                      <th key={c.id}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {finalDecision.criteria.map((cr) => (
                    <tr key={cr.name}>
                      <td className="rnd-dash-table-agent">{cr.name}</td>
                      <td><span className="rnd-dash-table-weight">{cr.weight}%</span></td>
                      {finalDecision.scores.map((s) => (
                        <td key={s.conceptId}>
                          <span className="rnd-dash-table-score">{s.scores[cr.name]}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="rnd-dash-table-total-row">
                    <td className="rnd-dash-table-agent"><strong>Weighted Total</strong></td>
                    <td></td>
                    {finalDecision.scores.map((s) => (
                      <td key={s.conceptId}>
                        <strong className="rnd-dash-table-total">{s.weightedScore.toFixed(1)}</strong>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="rnd-dash-agents-list">
            {[
              { icon: '👤', name: 'User Insights Agent', desc: 'Analyzes user complaints, needs, and segmentation' },
              { icon: '📋', name: 'Clinical Evidence Agent', desc: 'Reviews clinical endpoints and evidence gaps' },
              { icon: '✏️', name: 'Design Concept Agent', desc: 'Maps core design hypotheses for each concept' },
              { icon: '🧪', name: 'Simulation Agent', desc: 'Models predicted performance under use conditions' },
              { icon: '🔬', name: 'Lab Test Agent', desc: 'Evaluates bench test results across key dimensions' },
              { icon: '👤', name: 'Human Factors Agent', desc: 'Assesses usability, use-error risk, and user confidence' },
              { icon: '⚠️', name: 'Regulatory & Risk Agent', desc: 'Evaluates safety, claims, and documentation risks' },
              { icon: '🏭', name: 'Manufacturing & Cost Agent', desc: 'Analyzes manufacturability, cost, and scale-up risk' },
              { icon: '🌿', name: 'Sustainability Agent', desc: 'Assesses material footprint, packaging, and sustainability risk' },
            ].map((agent) => (
              <div key={agent.name} className="rnd-dash-agent-item">
                <span className="rnd-dash-agent-icon">{agent.icon}</span>
                <div>
                  <div className="rnd-dash-agent-name">{agent.name}</div>
                  <div className="rnd-dash-agent-desc">{agent.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="rnd-dash-actions-bar">
          {hasResults && (
            <button className="rnd-dash-btn-primary" onClick={() => navigate('/rnd/decision')}>
              View Decision Package
            </button>
          )}
          <button className="rnd-dash-btn-secondary" onClick={() => navigate('/rnd')}>
            ← Back to Overview
          </button>
        </div>
      </main>
    </div>
  );
};

export default RndDashboardScreen;
