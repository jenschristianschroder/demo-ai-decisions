import React from 'react';
import type { RevenueBand } from '../../types/onboarding';

const BAND_LABEL: Record<RevenueBand, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  strategic: 'Strategic',
};

const BAND_COLOR: Record<RevenueBand, { bg: string; fg: string; border: string }> = {
  low: { bg: '#f3f4f6', fg: '#374151', border: '#d1d5db' },
  medium: { bg: '#fef9c3', fg: '#854d0e', border: '#fde68a' },
  high: { bg: '#dbeafe', fg: '#1e40af', border: '#bfdbfe' },
  strategic: { bg: '#dcfce7', fg: '#166534', border: '#bbf7d0' },
};

interface Props {
  band: RevenueBand;
  confidence?: number;
  overridden?: boolean;
}

const OnboardingRevenueBandBadge: React.FC<Props> = ({ band, confidence, overridden }) => {
  const colors = BAND_COLOR[band];
  const confidencePct =
    confidence != null ? `${Math.round(confidence * 100)}%` : null;

  return (
    <span
      className="onb-band-badge"
      style={{
        background: colors.bg,
        color: colors.fg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <span className="onb-band-badge-label">{BAND_LABEL[band]}</span>
      {confidencePct && !overridden && (
        <span className="onb-band-badge-conf" title={`Agent confidence ${confidencePct}`}>
          · {confidencePct}
        </span>
      )}
      {overridden && (
        <span className="onb-band-badge-override" title="Manually overridden by team lead">
          · override
        </span>
      )}
    </span>
  );
};

export default OnboardingRevenueBandBadge;
