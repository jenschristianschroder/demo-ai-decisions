import React from 'react';
import type { OnboardingProgressStep } from '../../types/onboarding';

interface Props {
  steps: OnboardingProgressStep[];
}

const PHASE_LABEL: Record<string, string> = {
  'revenue-estimation': 'Revenue Estimation Agent',
  'duration-case': 'Duration Agent (case)',
  'duration-portfolio': 'Duration Agent (portfolio)',
  'client-chat': 'Client Guidance Agent',
};

const OnboardingAgentTimeline: React.FC<Props> = ({ steps }) => {
  if (steps.length === 0) return null;

  return (
    <ol className="onb-timeline">
      {steps.map((s, i) => (
        <li key={i} className={`onb-timeline-step onb-timeline-step--${s.status}`}>
          <span className="onb-timeline-dot" aria-hidden="true" />
          <div className="onb-timeline-body">
            <div className="onb-timeline-h">{PHASE_LABEL[s.phase] ?? s.phase}</div>
            <div className="onb-timeline-msg">{s.message}</div>
            {s.reasoning && <div className="onb-timeline-reasoning">{s.reasoning}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
};

export default OnboardingAgentTimeline;
