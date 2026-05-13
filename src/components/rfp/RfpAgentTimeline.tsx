import React from 'react';
import type { RfpProgressStep } from '../../types/rfp';

interface Props {
  steps: RfpProgressStep[];
}

const phaseLabels: Record<string, string> = {
  intake: 'Intake & Parsing',
  requirements: 'Requirement Extraction',
  knowledge: 'Knowledge Matching',
  drafting: 'Answer Drafting',
  'sme-routing': 'SME Routing',
  'risk-review': 'Risk Review',
  compliance: 'Compliance Check',
  assembly: 'Response Assembly',
  complete: 'Complete',
};

const statusIcon = (status: string): React.ReactNode => {
  switch (status) {
    case 'done':
      return <span className="rfp-timeline-icon rfp-timeline-icon--done">✓</span>;
    case 'running':
      return <span className="rfp-timeline-icon rfp-timeline-icon--running"><span className="rfp-timeline-spinner" /></span>;
    case 'error':
      return <span className="rfp-timeline-icon rfp-timeline-icon--error">✗</span>;
    default:
      return <span className="rfp-timeline-icon rfp-timeline-icon--pending" />;
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

const RfpAgentTimeline: React.FC<Props> = ({ steps }) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="rfp-timeline-root">
        <h3 className="rfp-timeline-title">Agent Processing Timeline</h3>
        <div className="rfp-timeline-empty">
          No agent activity recorded yet. Run the analysis from the landing page to populate this timeline.
        </div>
      </div>
    );
  }

  return (
    <div className="rfp-timeline-root">
      <h3 className="rfp-timeline-title">Agent Processing Timeline</h3>
      <div className="rfp-timeline-list">
        {steps.map((step) => {
          const formattedOutput = step.output !== undefined ? formatOutput(step.output) : '';
          const hasDetails = !!(step.input || step.reasoning || formattedOutput);
          return (
            <div key={step.phase} className={`rfp-timeline-step rfp-timeline-step--${step.status}`}>
              <div className="rfp-timeline-connector" />
              {statusIcon(step.status)}
              <div className="rfp-timeline-content">
                <div className="rfp-timeline-phase">{phaseLabels[step.phase] ?? step.phase}</div>
                <div className="rfp-timeline-message">{step.message}</div>
                {hasDetails && (
                  <div className="rfp-timeline-details">
                    {step.input && (
                      <details className="rfp-timeline-detail">
                        <summary className="rfp-timeline-detail-summary">Input to agent</summary>
                        <pre className="rfp-timeline-detail-body">{step.input}</pre>
                      </details>
                    )}
                    {step.reasoning && (
                      <details className="rfp-timeline-detail" open>
                        <summary className="rfp-timeline-detail-summary">Reasoning</summary>
                        <div className="rfp-timeline-detail-body rfp-timeline-detail-body--prose">
                          {step.reasoning}
                        </div>
                      </details>
                    )}
                    {formattedOutput && (
                      <details className="rfp-timeline-detail">
                        <summary className="rfp-timeline-detail-summary">Output from agent</summary>
                        <pre className="rfp-timeline-detail-body">{formattedOutput}</pre>
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

export default RfpAgentTimeline;
