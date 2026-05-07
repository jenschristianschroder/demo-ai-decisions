import React, { useState } from 'react';
import type { NdaRedlineItem, RedlineClassification } from '../../types/nda';

interface Props {
  redlines: NdaRedlineItem[];
  onRedlineDecisionsChange?: (decisions: Record<string, RedlineClassification>) => void;
}

const NdaRedlineAssessmentView: React.FC<Props> = ({ redlines, onRedlineDecisionsChange }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [userDecisions, setUserDecisions] = useState<Record<string, RedlineClassification>>({});

  const effectiveRedlines = redlines.map((r) => ({
    ...r,
    effectiveClassification: userDecisions[r.clauseId] ?? r.classification,
  }));

  const acceptCount = effectiveRedlines.filter((r) => r.effectiveClassification === 'accept').length;
  const rejectCount = effectiveRedlines.filter((r) => r.effectiveClassification === 'reject').length;
  const negotiateCount = effectiveRedlines.filter((r) => r.effectiveClassification === 'negotiate').length;
  const escalateCount = effectiveRedlines.filter((r) => r.effectiveClassification === 'escalate').length;

  const handleDecision = (clauseId: string, decision: RedlineClassification) => {
    const updated = { ...userDecisions, [clauseId]: decision };
    setUserDecisions(updated);
    onRedlineDecisionsChange?.(updated);
  };

  const clearDecision = (clauseId: string) => {
    const updated = { ...userDecisions };
    delete updated[clauseId];
    setUserDecisions(updated);
    onRedlineDecisionsChange?.(updated);
  };

  const overriddenCount = Object.keys(userDecisions).length;

  return (
    <div className="nda-redline-root">
      <h3 className="nda-redline-title">Redline Assessment</h3>

      <div className="nda-redline-summary">
        {redlines.length} counterparty change{redlines.length !== 1 ? 's' : ''} analyzed:
        {acceptCount > 0 && <span className="nda-redline-classification-badge nda-redline-classification--accept">{acceptCount} accept</span>}
        {rejectCount > 0 && <span className="nda-redline-classification-badge nda-redline-classification--reject">{rejectCount} reject</span>}
        {negotiateCount > 0 && <span className="nda-redline-classification-badge nda-redline-classification--negotiate">{negotiateCount} negotiate</span>}
        {escalateCount > 0 && <span className="nda-redline-classification-badge nda-redline-classification--escalate">{escalateCount} escalate</span>}
        {overriddenCount > 0 && (
          <span className="nda-redline-override-count">{overriddenCount} overridden by user</span>
        )}
      </div>

      <div className="nda-redline-list">
        {effectiveRedlines.map((item) => {
          const isOverridden = userDecisions[item.clauseId] !== undefined;
          return (
            <div
              key={item.clauseId}
              className={`nda-redline-card ${openId === item.clauseId ? 'nda-redline-card--open' : ''}`}
            >
              <button
                className="nda-redline-card-header"
                onClick={() => setOpenId(openId === item.clauseId ? null : item.clauseId)}
              >
                <span className="nda-redline-card-toggle">{openId === item.clauseId ? '▾' : '▸'}</span>
                <span className="nda-redline-card-id">{item.clauseId}</span>
                <span className="nda-redline-card-clause">{item.clauseTitle}</span>
                <span className={`nda-redline-classification-badge nda-redline-classification--${item.effectiveClassification}`}>
                  {item.effectiveClassification}
                </span>
                {isOverridden && (
                  <span className="nda-redline-override-badge" title={`AI recommended: ${item.classification}`}>
                    overridden
                  </span>
                )}
                <span className={`nda-redline-severity-badge nda-redline-severity--${item.severity}`}>
                  {item.severity}
                </span>
              </button>
              {openId === item.clauseId && (
                <div className="nda-redline-card-body">
                  <div className="nda-redline-diff">
                    <div>
                      <span className="nda-redline-diff-label">Original (Our Draft)</span>
                      <div className="nda-redline-original-text">{item.originalText}</div>
                    </div>
                    <div>
                      <span className="nda-redline-diff-label">Counterparty Change (Input)</span>
                      <div className="nda-redline-counterparty-text">{item.counterpartyText}</div>
                    </div>
                  </div>
                  <div className="nda-redline-ai-output">
                    <span className="nda-redline-ai-output-label">AI Assessment</span>
                    <div className="nda-redline-meta">
                      <div>
                        <span className="nda-redline-meta-label">AI Recommendation:</span>
                        <span className={`nda-redline-classification-badge nda-redline-classification--${item.classification}`}>
                          {item.classification}
                        </span>
                      </div>
                      <div>
                        <span className="nda-redline-meta-label">Rationale:</span>
                        <span className="nda-redline-rationale">{item.rationale}</span>
                      </div>
                      <div>
                        <span className="nda-redline-meta-label">Suggested Response:</span>
                        <span className="nda-redline-response">{item.suggestedResponse}</span>
                      </div>
                      {item.playbookReference && (
                        <div>
                          <span className="nda-redline-meta-label">Playbook Ref:</span>
                          <span className="nda-redline-source">{item.playbookReference}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User decision buttons */}
                  <div className="nda-redline-decision-bar">
                    <span className="nda-redline-decision-label">Your Decision:</span>
                    <div className="nda-redline-decision-buttons">
                      <button
                        className={`nda-redline-decision-btn nda-redline-decision-btn--accept ${item.effectiveClassification === 'accept' ? 'nda-redline-decision-btn--selected' : ''}`}
                        onClick={() => handleDecision(item.clauseId, 'accept')}
                        title="Accept the counterparty's proposed change"
                      >
                        ✓ Accept
                      </button>
                      <button
                        className={`nda-redline-decision-btn nda-redline-decision-btn--reject ${item.effectiveClassification === 'reject' ? 'nda-redline-decision-btn--selected' : ''}`}
                        onClick={() => handleDecision(item.clauseId, 'reject')}
                        title="Reject the counterparty's proposed change"
                      >
                        ✕ Reject
                      </button>
                      <button
                        className={`nda-redline-decision-btn nda-redline-decision-btn--negotiate ${item.effectiveClassification === 'negotiate' ? 'nda-redline-decision-btn--selected' : ''}`}
                        onClick={() => handleDecision(item.clauseId, 'negotiate')}
                        title="Mark for negotiation — propose a counter"
                      >
                        ⇄ Negotiate
                      </button>
                      <button
                        className={`nda-redline-decision-btn nda-redline-decision-btn--escalate ${item.effectiveClassification === 'escalate' ? 'nda-redline-decision-btn--selected' : ''}`}
                        onClick={() => handleDecision(item.clauseId, 'escalate')}
                        title="Escalate for senior review"
                      >
                        ↑ Escalate
                      </button>
                      {isOverridden && (
                        <button
                          className="nda-redline-decision-btn nda-redline-decision-btn--reset"
                          onClick={() => clearDecision(item.clauseId)}
                          title="Revert to AI recommendation"
                        >
                          ↺ Use AI
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NdaRedlineAssessmentView;
