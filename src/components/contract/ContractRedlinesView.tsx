import React, { useState } from 'react';
import type { RedlineItem } from '../../types/contract';

interface Props {
  redlines: RedlineItem[];
}

const typeColor = (t: string): string => {
  switch (t) {
    case 'addition': return '#166534';
    case 'deletion': return '#b91c1c';
    case 'modification': return '#a16207';
    case 'comment': return '#1d4ed8';
    default: return '#666666';
  }
};

const typeBg = (t: string): string => {
  switch (t) {
    case 'addition': return '#f0fdf4';
    case 'deletion': return '#fef2f2';
    case 'modification': return '#fffbeb';
    case 'comment': return '#eff6ff';
    default: return '#f8f9fa';
  }
};

const priorityColor = (p: string): string => {
  switch (p) {
    case 'required': return '#b91c1c';
    case 'recommended': return '#a16207';
    case 'optional': return '#666666';
    default: return '#666666';
  }
};

const priorityBg = (p: string): string => {
  switch (p) {
    case 'required': return '#fef2f2';
    case 'recommended': return '#fffbeb';
    case 'optional': return '#f8f9fa';
    default: return '#f8f9fa';
  }
};

const ContractRedlinesView: React.FC<Props> = ({ redlines }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="contract-redlines-root">
      <h3 className="contract-redlines-title">Redline Suggestions</h3>
      <div className="contract-redlines-list">
        {redlines.map((item) => {
          const isOpen = !!expanded[item.redlineId];
          return (
            <div key={item.redlineId} className={`contract-redlines-card ${isOpen ? 'contract-redlines-card--open' : ''}`}>
              <button className="contract-redlines-card-header" onClick={() => toggle(item.redlineId)}>
                <span className="contract-redlines-card-toggle">{isOpen ? '▾' : '▸'}</span>
                <span className="contract-redlines-card-id">{item.redlineId}</span>
                <span className="contract-redlines-card-clause">{item.clauseId}</span>
                <span
                  className="contract-redlines-type-badge"
                  style={{ color: typeColor(item.type), background: typeBg(item.type) }}
                >
                  {item.type}
                </span>
                <span
                  className="contract-redlines-priority-badge"
                  style={{ color: priorityColor(item.priority), background: priorityBg(item.priority) }}
                >
                  {item.priority}
                </span>
              </button>
              {isOpen && (
                <div className="contract-redlines-card-body">
                  <div className="contract-redlines-diff">
                    <div className="contract-redlines-original">
                      <span className="contract-redlines-diff-label">Original Text</span>
                      <div className="contract-redlines-original-text">{item.originalText}</div>
                    </div>
                    <div className="contract-redlines-suggested">
                      <span className="contract-redlines-diff-label">Suggested Text</span>
                      <div className="contract-redlines-suggested-text">{item.suggestedText}</div>
                    </div>
                  </div>
                  <div className="contract-redlines-meta">
                    <div className="contract-redlines-rationale">
                      <span className="contract-redlines-meta-label">Rationale:</span> {item.rationale}
                    </div>
                    <div className="contract-redlines-source">
                      <span className="contract-redlines-meta-label">Source:</span> {item.source}
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

export default ContractRedlinesView;
