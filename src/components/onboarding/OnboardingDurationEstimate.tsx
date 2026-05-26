import React, { useState } from 'react';
import type { CaseDurationEstimate } from '../../types/onboarding';

interface Props {
  estimate?: CaseDurationEstimate;
}

const OnboardingDurationEstimate: React.FC<Props> = ({ estimate }) => {
  const [copied, setCopied] = useState(false);

  if (!estimate) {
    return (
      <div className="onb-duration-empty">
        Run the Duration & Bottleneck Agent to estimate the go-live window for this case.
      </div>
    );
  }

  const formatRange = `${estimate.expectedGoLiveStart} → ${estimate.expectedGoLiveEnd}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(estimate.clientSafeSummary).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => undefined,
    );
  };

  return (
    <div className="onb-duration">
      <div className="onb-duration-headline">
        <span className="onb-duration-label">Expected go-live</span>
        <span className="onb-duration-window">{formatRange}</span>
        <span className={`onb-duration-conf onb-duration-conf--${estimate.confidence}`}>
          {estimate.confidence} confidence
        </span>
      </div>

      <p className="onb-duration-rationale">{estimate.rationale}</p>

      <div className="onb-duration-shareable">
        <div className="onb-duration-shareable-h">Client-safe summary</div>
        <p className="onb-duration-shareable-body">{estimate.clientSafeSummary}</p>
        <button className="onb-duration-copy-btn" type="button" onClick={handleCopy}>
          {copied ? 'Copied ✓' : 'Copy for client'}
        </button>
      </div>

      <div className="onb-duration-cites">
        {estimate.citations.map((c) => (
          <a key={c} className="onb-duration-cite" href={`/${c}`} target="_blank" rel="noreferrer">
            {c}
          </a>
        ))}
      </div>
    </div>
  );
};

export default OnboardingDurationEstimate;
