import React, { useState } from 'react';
import type { NdaRedlineItem } from '../../types/nda';

interface Props {
  redlines: NdaRedlineItem[];
}

const NdaRedlineAssessmentView: React.FC<Props> = ({ redlines }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const acceptCount = redlines.filter((r) => r.classification === 'accept').length;
  const rejectCount = redlines.filter((r) => r.classification === 'reject').length;
  const negotiateCount = redlines.filter((r) => r.classification === 'negotiate').length;
  const escalateCount = redlines.filter((r) => r.classification === 'escalate').length;

  return (
    <div className="nda-redline-root">
      <h3 className="nda-redline-title">Redline Assessment</h3>

      <div className="nda-redline-summary">
        {redlines.length} counterparty change{redlines.length !== 1 ? 's' : ''} analyzed:
        {acceptCount > 0 && <span className="nda-redline-classification-badge nda-redline-classification--accept">{acceptCount} accept</span>}
        {rejectCount > 0 && <span className="nda-redline-classification-badge nda-redline-classification--reject">{rejectCount} reject</span>}
        {negotiateCount > 0 && <span className="nda-redline-classification-badge nda-redline-classification--negotiate">{negotiateCount} negotiate</span>}
        {escalateCount > 0 && <span className="nda-redline-classification-badge nda-redline-classification--escalate">{escalateCount} escalate</span>}
      </div>

      <div className="nda-redline-list">
        {redlines.map((item) => (
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
              <span className={`nda-redline-classification-badge nda-redline-classification--${item.classification}`}>
                {item.classification}
              </span>
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
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NdaRedlineAssessmentView;
