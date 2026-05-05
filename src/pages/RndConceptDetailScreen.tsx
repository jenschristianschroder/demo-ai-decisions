import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRndScenario, getRndConcept } from '../data/mockRndData';
import './RndConceptDetailScreen.css';

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

const RndConceptDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { conceptId } = useParams<{ conceptId: string }>();
  const scenario = getRndScenario();
  const concept = conceptId ? getRndConcept(conceptId) : undefined;

  if (!concept || !conceptId) {
    return (
      <div className="rnd-detail-root">
        <div className="rnd-detail-empty">
          <h2>Concept not found</h2>
          <button className="rnd-detail-btn-secondary" onClick={() => navigate('/rnd/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { agentOutputs, finalDecision } = scenario;
  const score = finalDecision.scores.find((s) => s.conceptId === conceptId);
  const action = finalDecision.conceptActions.find((a) => a.conceptId === conceptId);
  const isRecommended = conceptId === finalDecision.recommendedConceptId;

  // Agent entries for this concept
  const simEntry = agentOutputs.simulation.entries.find((e) => e.conceptId === conceptId);
  const labEntry = agentOutputs.labTest.entries.find((e) => e.conceptId === conceptId);
  const failureMode = agentOutputs.labTest.failureModes.find((f) => f.conceptId === conceptId);
  const hfEntry = agentOutputs.humanFactors.entries.find((e) => e.conceptId === conceptId);
  const regEntry = agentOutputs.regulatoryRisk.entries.find((e) => e.conceptId === conceptId);
  const mfgEntry = agentOutputs.manufacturingCost.entries.find((e) => e.conceptId === conceptId);
  const susEntry = agentOutputs.sustainability.entries.find((e) => e.conceptId === conceptId);
  const designEntry = agentOutputs.designConcept.entries.find((e) => e.conceptId === conceptId);

  const Badge: React.FC<{ level: string }> = ({ level }) => (
    <span className="rnd-detail-rating-badge" style={{ background: ratingBg(level), color: ratingColor(level) }}>
      {level}
    </span>
  );

  return (
    <div className="rnd-detail-root">
      <header className="rnd-detail-header">
        <div className="rnd-detail-header-inner">
          <div className="rnd-detail-breadcrumb">
            <button className="rnd-detail-breadcrumb-link" onClick={() => navigate('/rnd')}>Home</button>
            <span className="rnd-detail-breadcrumb-sep">›</span>
            <button className="rnd-detail-breadcrumb-link" onClick={() => navigate('/rnd/dashboard')}>Dashboard</button>
            <span className="rnd-detail-breadcrumb-sep">›</span>
            <span className="rnd-detail-breadcrumb-current">{concept.label}</span>
          </div>
          <div className="rnd-detail-title-row">
            <div>
              <h1 className="rnd-detail-title">{concept.label}: {concept.name}</h1>
              <div className="rnd-detail-subtitle">{concept.description}</div>
            </div>
            {isRecommended && (
              <span className="rnd-detail-recommended-badge">★ Recommended</span>
            )}
          </div>
        </div>
      </header>

      <main className="rnd-detail-main">
        {/* Overview card */}
        <div className="rnd-detail-overview">
          <div className="rnd-detail-overview-left">
            <div className="rnd-detail-overview-score">
              <span className="rnd-detail-overview-score-value">{score?.weightedScore.toFixed(1) ?? '—'}</span>
              <span className="rnd-detail-overview-score-label">Weighted Score</span>
            </div>
            {action && (
              <span className={`rnd-detail-action-badge rnd-detail-action-${action.action}`}>
                {action.action === 'advance' ? '✓ Advance' : action.action === 'backup' ? '↻ Backup' : '↓ Deprioritize'}
              </span>
            )}
          </div>
          <div className="rnd-detail-overview-right">
            <div className="rnd-detail-overview-hypothesis">
              <span className="rnd-detail-overview-label">Hypothesis</span>
              <span>{concept.hypothesis}</span>
            </div>
            {designEntry && (
              <div className="rnd-detail-overview-hypothesis">
                <span className="rnd-detail-overview-label">Core Design Hypothesis</span>
                <span>{designEntry.coreHypothesis}</span>
              </div>
            )}
            {action && (
              <div className="rnd-detail-overview-hypothesis">
                <span className="rnd-detail-overview-label">Decision Rationale</span>
                <span>{action.reason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Scoring breakdown */}
        {score && (
          <div className="rnd-detail-section">
            <h2 className="rnd-detail-section-title">Scoring Breakdown</h2>
            <div className="rnd-detail-score-grid">
              {finalDecision.criteria.map((cr) => {
                const val = score.scores[cr.name];
                return (
                  <div key={cr.name} className="rnd-detail-score-item">
                    <div className="rnd-detail-score-item-header">
                      <span className="rnd-detail-score-item-name">{cr.name}</span>
                      <span className="rnd-detail-score-item-weight">{cr.weight}%</span>
                    </div>
                    <div className="rnd-detail-score-bar-track">
                      <div
                        className="rnd-detail-score-bar-fill"
                        style={{ width: `${(val / 10) * 100}%` }}
                      />
                    </div>
                    <span className="rnd-detail-score-item-value">{val}/10</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Simulation */}
        {simEntry && (
          <div className="rnd-detail-section">
            <h2 className="rnd-detail-section-title">🧪 Simulation Results</h2>
            <div className="rnd-detail-kv-grid">
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Predicted Leakage Reduction</span>
                <span className="rnd-detail-kv-value">{simEntry.predictedLeakageReduction}</span>
              </div>
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Confidence</span>
                <Badge level={simEntry.confidence} />
              </div>
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Key Concern</span>
                <span className="rnd-detail-kv-value">{simEntry.keyConcern}</span>
              </div>
            </div>
          </div>
        )}

        {/* Lab Test */}
        {labEntry && (
          <div className="rnd-detail-section">
            <h2 className="rnd-detail-section-title">🔬 Lab Test Results</h2>
            <div className="rnd-detail-kv-grid">
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Adhesion</span>
                <Badge level={labEntry.adhesion} />
              </div>
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Flexibility</span>
                <Badge level={labEntry.flexibility} />
              </div>
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Leakage Resistance</span>
                <Badge level={labEntry.leakageResistance} />
              </div>
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Wear-Time Stability</span>
                <Badge level={labEntry.wearTimeStability} />
              </div>
            </div>
            {failureMode && (
              <div className="rnd-detail-insight-box">
                <span className="rnd-detail-insight-label">Failure Mode</span>
                <span>{failureMode.description}</span>
              </div>
            )}
          </div>
        )}

        {/* Human Factors */}
        {hfEntry && (
          <div className="rnd-detail-section">
            <h2 className="rnd-detail-section-title">👤 Human Factors</h2>
            <div className="rnd-detail-kv-grid">
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Ease of Use</span>
                <Badge level={hfEntry.easeOfUse} />
              </div>
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Use-Error Risk</span>
                <Badge level={hfEntry.useErrorRisk} />
              </div>
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">User Confidence</span>
                <Badge level={hfEntry.userConfidence} />
              </div>
            </div>
          </div>
        )}

        {/* Regulatory */}
        {regEntry && (
          <div className="rnd-detail-section">
            <h2 className="rnd-detail-section-title">⚠️ Regulatory &amp; Risk</h2>
            <div className="rnd-detail-kv-grid">
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Safety Risk</span>
                <Badge level={regEntry.safetyRisk} />
              </div>
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Claims Risk</span>
                <Badge level={regEntry.claimsRisk} />
              </div>
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Documentation Burden</span>
                <Badge level={regEntry.documentationBurden} />
              </div>
            </div>
          </div>
        )}

        {/* Manufacturing */}
        {mfgEntry && (
          <div className="rnd-detail-section">
            <h2 className="rnd-detail-section-title">🏭 Manufacturing &amp; Cost</h2>
            <div className="rnd-detail-kv-grid">
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Manufacturability</span>
                <Badge level={mfgEntry.manufacturability} />
              </div>
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Estimated Cost Impact</span>
                <Badge level={mfgEntry.estimatedCostImpact} />
              </div>
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Scale-Up Risk</span>
                <Badge level={mfgEntry.scaleUpRisk} />
              </div>
            </div>
          </div>
        )}

        {/* Sustainability */}
        {susEntry && (
          <div className="rnd-detail-section">
            <h2 className="rnd-detail-section-title">🌿 Sustainability</h2>
            <div className="rnd-detail-kv-grid">
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Material Footprint</span>
                <Badge level={susEntry.materialFootprint} />
              </div>
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Packaging Impact</span>
                <Badge level={susEntry.packagingImpact} />
              </div>
              <div className="rnd-detail-kv">
                <span className="rnd-detail-kv-label">Sustainability Risk</span>
                <Badge level={susEntry.sustainabilityRisk} />
              </div>
            </div>
          </div>
        )}

        {/* Agent Reasoning Traces */}
        {(() => {
          const reasoningTraces: Array<{ title: string; icon: string; reasoning: string | undefined }> = [
            { title: 'User Insights', icon: '👤', reasoning: agentOutputs.userInsights.reasoning },
            { title: 'Clinical Evidence', icon: '📋', reasoning: agentOutputs.clinicalEvidence.reasoning },
            { title: 'Design Concept', icon: '✏️', reasoning: agentOutputs.designConcept.reasoning },
            { title: 'Simulation', icon: '🧪', reasoning: agentOutputs.simulation.reasoning },
            { title: 'Lab Test', icon: '🔬', reasoning: agentOutputs.labTest.reasoning },
            { title: 'Human Factors', icon: '👤', reasoning: agentOutputs.humanFactors.reasoning },
            { title: 'Regulatory & Risk', icon: '⚠️', reasoning: agentOutputs.regulatoryRisk.reasoning },
            { title: 'Manufacturing & Cost', icon: '🏭', reasoning: agentOutputs.manufacturingCost.reasoning },
            { title: 'Sustainability', icon: '🌿', reasoning: agentOutputs.sustainability.reasoning },
          ];
          const hasReasoning = reasoningTraces.some(t => t.reasoning);
          if (!hasReasoning) return null;
          return (
            <div className="rnd-detail-section">
              <h2 className="rnd-detail-section-title">🧠 Agent Reasoning</h2>
              <p className="rnd-detail-reasoning-intro">Chain-of-thought reasoning from each specialist agent:</p>
              {reasoningTraces.map(t => t.reasoning ? (
                <div key={t.title} className="rnd-detail-reasoning-block">
                  <div className="rnd-detail-reasoning-agent">{t.icon} {t.title}</div>
                  <div className="rnd-detail-reasoning-text">{t.reasoning}</div>
                </div>
              ) : null)}
            </div>
          );
        })()}

        <div className="rnd-detail-actions-bar">
          <button className="rnd-detail-btn-primary" onClick={() => navigate('/rnd/decision')}>
            View Decision Package
          </button>
          <button className="rnd-detail-btn-secondary" onClick={() => navigate('/rnd/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
};

export default RndConceptDetailScreen;
