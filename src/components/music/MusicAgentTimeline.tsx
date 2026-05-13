import React from 'react';
import type { MusicProgressStep } from '../../types/music';

interface Props {
  steps: MusicProgressStep[];
}

const phaseLabels: Record<string, string> = {
  'query-parse': 'Query Parsing',
  'graph-traversal': 'Graph Traversal',
  'semantic-search': 'Semantic Search',
  recommendation: 'Recommendation',
  explanation: 'Explanation Generation',
  complete: 'Complete',
};

const statusIcon = (status: string): React.ReactNode => {
  switch (status) {
    case 'done':
      return <span className="music-at-icon music-at-icon--done">✓</span>;
    case 'running':
      return <span className="music-at-icon music-at-icon--running"><span className="music-at-spinner" /></span>;
    case 'error':
      return <span className="music-at-icon music-at-icon--error">✗</span>;
    default:
      return <span className="music-at-icon music-at-icon--pending" />;
  }
};

const formatOutput = (output: unknown): string => {
  if (output === null || output === undefined) return '';
  if (typeof output === 'string') return output;
  try {
    return JSON.stringify(output, null, 2);
  } catch {
    return String(output);
  }
};

const MusicAgentTimeline: React.FC<Props> = ({ steps }) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="music-at-root">
        <h3 className="music-at-title">Agent Processing Timeline</h3>
        <div className="music-at-empty">
          No agent activity recorded yet. Run a query from the landing page to populate this timeline.
        </div>
      </div>
    );
  }

  return (
    <div className="music-at-root">
      <h3 className="music-at-title">Agent Processing Timeline</h3>
      <div className="music-at-list">
        {steps.map((step) => {
          const formattedOutput = step.output !== undefined ? formatOutput(step.output) : '';
          const hasDetails = !!(step.input || step.reasoning || formattedOutput);
          return (
            <div key={step.phase} className={`music-at-step music-at-step--${step.status}`}>
              <div className="music-at-connector" />
              {statusIcon(step.status)}
              <div className="music-at-content">
                <div className="music-at-phase">{phaseLabels[step.phase] ?? step.phase}</div>
                <div className="music-at-message">{step.message}</div>
                {hasDetails && (
                  <div className="music-at-details">
                    {step.input && (
                      <details className="music-at-detail">
                        <summary className="music-at-detail-summary">Input to agent</summary>
                        <pre className="music-at-detail-body">{step.input}</pre>
                      </details>
                    )}
                    {step.reasoning && (
                      <details className="music-at-detail" open>
                        <summary className="music-at-detail-summary">Reasoning</summary>
                        <div className="music-at-detail-body music-at-detail-body--prose">
                          {step.reasoning}
                        </div>
                      </details>
                    )}
                    {formattedOutput && (
                      <details className="music-at-detail">
                        <summary className="music-at-detail-summary">Output from agent</summary>
                        <pre className="music-at-detail-body">{formattedOutput}</pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MusicAgentTimeline;
