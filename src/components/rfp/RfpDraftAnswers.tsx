import React, { useState } from 'react';
import type { DraftAnswer, RfpRequirement } from '../../types/rfp';

interface Props {
  answers: DraftAnswer[];
  requirements: RfpRequirement[];
}

const confidenceColor = (c: string): string => {
  switch (c) {
    case 'high': return '#166534';
    case 'medium': return '#a16207';
    case 'low': return '#b91c1c';
    default: return '#666666';
  }
};

const confidenceBg = (c: string): string => {
  switch (c) {
    case 'high': return '#f0fdf4';
    case 'medium': return '#fffbeb';
    case 'low': return '#fef2f2';
    default: return '#f8f9fa';
  }
};

const RfpDraftAnswers: React.FC<Props> = ({ answers, requirements }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getRequirementText = (reqId: string): string => {
    const req = requirements.find((r) => r.requirementId === reqId);
    return req ? req.requirementText : reqId;
  };

  return (
    <div className="rfp-answers-root">
      <h3 className="rfp-answers-title">Draft Answers</h3>
      <div className="rfp-answers-list">
        {answers.map((ans) => {
          const isOpen = !!expanded[ans.requirementId];
          return (
            <div key={ans.requirementId} className={`rfp-answers-card ${isOpen ? 'rfp-answers-card--open' : ''}`}>
              <button className="rfp-answers-card-header" onClick={() => toggle(ans.requirementId)}>
                <span className="rfp-answers-card-toggle">{isOpen ? '▾' : '▸'}</span>
                <span className="rfp-answers-card-req-id">{ans.requirementId}</span>
                <span className="rfp-answers-card-req-text">{getRequirementText(ans.requirementId)}</span>
                <span
                  className="rfp-answers-confidence-badge"
                  style={{ color: confidenceColor(ans.confidence), background: confidenceBg(ans.confidence) }}
                >
                  {ans.confidence}
                </span>
                {ans.needsSmeReview && (
                  <span className="rfp-answers-sme-flag">SME Review</span>
                )}
              </button>
              {isOpen && (
                <div className="rfp-answers-card-body">
                  <div className="rfp-answers-draft">{ans.draftAnswer}</div>
                  <div className="rfp-answers-meta">
                    <div className="rfp-answers-sources">
                      <span className="rfp-answers-meta-label">Sources:</span>
                      {ans.sourceFiles.map((f) => (
                        <span key={f} className="rfp-answers-source-tag">{f}</span>
                      ))}
                    </div>
                    {ans.needsSmeReview && ans.reviewReason && (
                      <div className="rfp-answers-review-reason">
                        <span className="rfp-answers-meta-label">Review Reason:</span> {ans.reviewReason}
                      </div>
                    )}
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

export default RfpDraftAnswers;
