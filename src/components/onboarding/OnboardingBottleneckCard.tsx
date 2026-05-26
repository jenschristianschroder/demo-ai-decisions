import React from 'react';
import type { CaseDurationEstimate } from '../../types/onboarding';

interface Props {
  estimate?: CaseDurationEstimate;
}

const STEP_LABELS: Record<string, string> = {
  intake: 'Intake',
  kyc: 'KYC',
  aml: 'AML review',
  'tech-integration': 'Technical integration',
  'signatory-verification': 'Signatory verification',
  'product-configuration': 'Product configuration',
  'go-live': 'Go-live',
};

const OnboardingBottleneckCard: React.FC<Props> = ({ estimate }) => {
  if (!estimate) {
    return <div className="onb-bottleneck-empty">No bottleneck data — run the Duration Agent.</div>;
  }

  return (
    <div className="onb-bottleneck-card">
      <div className="onb-bottleneck-h">Current bottleneck</div>
      <div className="onb-bottleneck-step">{STEP_LABELS[estimate.currentBottleneckStep] ?? estimate.currentBottleneckStep}</div>
      <div className="onb-bottleneck-meta">
        <div>
          <span className="onb-bottleneck-meta-label">Owner</span>
          <span className="onb-bottleneck-meta-value">{estimate.bottleneckOwner}</span>
        </div>
        <div>
          <span className="onb-bottleneck-meta-label">Historic wait (median)</span>
          <span className="onb-bottleneck-meta-value">{estimate.historicWaitForStepDays.medianDays} days</span>
        </div>
        <div>
          <span className="onb-bottleneck-meta-label">Historic wait (p90)</span>
          <span className="onb-bottleneck-meta-value">{estimate.historicWaitForStepDays.p90Days} days</span>
        </div>
      </div>
    </div>
  );
};

export default OnboardingBottleneckCard;
