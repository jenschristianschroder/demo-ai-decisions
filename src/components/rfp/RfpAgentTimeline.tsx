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

const RfpAgentTimeline: React.FC<Props> = ({ steps }) => {
  return (
    <div className="rfp-timeline-root">
      <h3 className="rfp-timeline-title">Agent Processing Timeline</h3>
      <div className="rfp-timeline-list">
        {steps.map((step) => (
          <div key={step.phase} className={`rfp-timeline-step rfp-timeline-step--${step.status}`}>
            <div className="rfp-timeline-connector" />
            {statusIcon(step.status)}
            <div className="rfp-timeline-content">
              <div className="rfp-timeline-phase">{phaseLabels[step.phase] ?? step.phase}</div>
              <div className="rfp-timeline-message">{step.message}</div>
              {step.reasoning && (
                <div className="rfp-timeline-reasoning">{step.reasoning}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RfpAgentTimeline;
