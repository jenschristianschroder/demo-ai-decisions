import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getRndScenario } from '../data/mockRndData';
import './RndDecisionScreen.css';

const RndDecisionScreen: React.FC = () => {
  const navigate = useNavigate();
  const scenario = getRndScenario();
  const { concepts, agentOutputs, finalDecision } = scenario;
  const pkg = finalDecision.decisionPackage;

  return (
    <div className="rnd-decision-root">
      <header className="rnd-decision-header">
        <div className="rnd-decision-header-inner">
          <div className="rnd-decision-breadcrumb">
            <button className="rnd-decision-breadcrumb-link" onClick={() => navigate('/rnd')}>Home</button>
            <span className="rnd-decision-breadcrumb-sep">›</span>
            <button className="rnd-decision-breadcrumb-link" onClick={() => navigate('/rnd/dashboard')}>Dashboard</button>
            <span className="rnd-decision-breadcrumb-sep">›</span>
            <span className="rnd-decision-breadcrumb-current">Decision Package</span>
          </div>
          <h1 className="rnd-decision-title">Decision Package</h1>
          <div className="rnd-decision-subtitle">{scenario.title}</div>
        </div>
      </header>

      <main className="rnd-decision-main">
        {/* Recommendation banner */}
        <div className="rnd-decision-banner">
          <div className="rnd-decision-banner-label">Recommended Decision</div>
          <div className="rnd-decision-banner-action">{pkg.recommendedAction}</div>
        </div>

        {/* Concept actions */}
        <div className="rnd-decision-section">
          <h2 className="rnd-decision-section-title">Concept Disposition</h2>
          <div className="rnd-decision-disposition-grid">
            {finalDecision.conceptActions.map((ca) => {
              const concept = concepts.find((c) => c.id === ca.conceptId);
              const score = finalDecision.scores.find((s) => s.conceptId === ca.conceptId);
              return (
                <div key={ca.conceptId} className={`rnd-decision-disposition-card rnd-decision-disposition-${ca.action}`}>
                  <div className="rnd-decision-disposition-header">
                    <span className="rnd-decision-disposition-name">{concept?.label}: {concept?.name}</span>
                    <span className={`rnd-decision-disposition-badge rnd-decision-badge-${ca.action}`}>
                      {ca.action === 'advance' ? '✓ Advance' : ca.action === 'backup' ? '↻ Backup' : ca.action === 'kill' ? '✗ Kill' : '↓ Deprioritize'}
                    </span>
                  </div>
                  <div className="rnd-decision-disposition-score">Score: {score?.weightedScore.toFixed(1)}</div>
                  <div className="rnd-decision-disposition-reason">{ca.reason}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rationale */}
        <div className="rnd-decision-section">
          <h2 className="rnd-decision-section-title">Rationale</h2>
          <p className="rnd-decision-text">{finalDecision.rationale}</p>
        </div>

        {/* Evidence summary */}
        <div className="rnd-decision-section">
          <h2 className="rnd-decision-section-title">Evidence Summary</h2>
          <p className="rnd-decision-text">{pkg.evidenceSummary}</p>
        </div>

        {/* Agent insights (from user insights & clinical evidence) */}
        <div className="rnd-decision-section">
          <h2 className="rnd-decision-section-title">User &amp; Clinical Insights</h2>
          <div className="rnd-decision-findings-grid">
            <div className="rnd-decision-findings-col">
              <h3 className="rnd-decision-findings-heading">👤 User Insights</h3>
              {agentOutputs.userInsights.findings.map((f, i) => (
                <div key={i} className="rnd-decision-finding">
                  <span className="rnd-decision-finding-factor">{f.factor}</span>
                  <span className="rnd-decision-finding-text">{f.finding}</span>
                </div>
              ))}
              <div className="rnd-decision-implication">
                <span className="rnd-decision-implication-label">Implication</span>
                {agentOutputs.userInsights.implication}
              </div>
            </div>
            <div className="rnd-decision-findings-col">
              <h3 className="rnd-decision-findings-heading">📋 Clinical Evidence</h3>
              {agentOutputs.clinicalEvidence.findings.map((f, i) => (
                <div key={i} className="rnd-decision-finding">
                  <span className="rnd-decision-finding-factor">{f.factor}</span>
                  <span className="rnd-decision-finding-text">{f.finding}</span>
                </div>
              ))}
              <div className="rnd-decision-implication">
                <span className="rnd-decision-implication-label">Implication</span>
                {agentOutputs.clinicalEvidence.implication}
              </div>
            </div>
          </div>
        </div>

        {/* Key assumptions */}
        <div className="rnd-decision-section">
          <h2 className="rnd-decision-section-title">Key Assumptions</h2>
          <ul className="rnd-decision-list">
            {pkg.keyAssumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        {/* Risks to monitor */}
        <div className="rnd-decision-section">
          <h2 className="rnd-decision-section-title">Risks to Monitor</h2>
          <ul className="rnd-decision-list rnd-decision-list--risk">
            {pkg.risksToMonitor.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>

        {/* Next experiments */}
        <div className="rnd-decision-section">
          <h2 className="rnd-decision-section-title">Next Experiments</h2>
          <ol className="rnd-decision-list rnd-decision-list--ordered">
            {pkg.nextExperiments.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ol>
        </div>

        {/* Kill criteria */}
        <div className="rnd-decision-section rnd-decision-section--kill">
          <h2 className="rnd-decision-section-title">Kill Criteria</h2>
          <p className="rnd-decision-kill-intro">Stop or pivot if:</p>
          <ul className="rnd-decision-list rnd-decision-list--kill">
            {pkg.killCriteria.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </div>

        {/* Weighted scoring (for reference) */}
        <div className="rnd-decision-section">
          <h2 className="rnd-decision-section-title">Weighted Scoring Reference</h2>
          <div className="rnd-decision-table-wrap">
            <table className="rnd-decision-table">
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
                    <td className="rnd-decision-table-criterion">{cr.name}</td>
                    <td className="rnd-decision-table-weight">{cr.weight}%</td>
                    {finalDecision.scores.map((s) => (
                      <td key={s.conceptId} className="rnd-decision-table-score">{s.scores[cr.name]}</td>
                    ))}
                  </tr>
                ))}
                <tr className="rnd-decision-table-total-row">
                  <td className="rnd-decision-table-criterion"><strong>Weighted Total</strong></td>
                  <td></td>
                  {finalDecision.scores.map((s) => (
                    <td key={s.conceptId} className="rnd-decision-table-total">
                      <strong>{s.weightedScore.toFixed(1)}</strong>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="rnd-decision-actions-bar">
          <button className="rnd-decision-btn-secondary" onClick={() => navigate('/rnd/dashboard')}>
            ← Back to Dashboard
          </button>
          <button className="rnd-decision-btn-secondary" onClick={() => navigate('/rnd')}>
            ← Back to Overview
          </button>
        </div>
      </main>
    </div>
  );
};

export default RndDecisionScreen;
