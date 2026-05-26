import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { OnboardingCase } from '../../types/onboarding';
import { bandFor, priorityScore } from '../../data/mockOnboardingData';
import OnboardingRevenueBandBadge from './OnboardingRevenueBandBadge';

interface Props {
  cases: OnboardingCase[];
  loading?: boolean;
  onPinToggle?: (caseId: string) => void;
}

function formatEur(amount: number): string {
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}m`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}k`;
  return `€${amount}`;
}

const urgencyLabel = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
} as const;

const OnboardingCaseQueueTable: React.FC<Props> = ({ cases, loading, onPinToggle }) => {
  const navigate = useNavigate();

  return (
    <div className="onb-queue-table-wrap">
      <table className="onb-queue-table">
        <thead>
          <tr>
            <th></th>
            <th>Prospect</th>
            <th>Type</th>
            <th>Declared volume</th>
            <th>Corridors</th>
            <th>Revenue band</th>
            <th>Urgency</th>
            <th>Priority</th>
            <th>Owner</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => {
            const band = bandFor(c);
            const overridden = !!c.revenueOverride;
            const conf = c.revenueEstimate?.confidenceScore;
            return (
              <tr
                key={c.id}
                className={`onb-queue-row${c.pinnedToTop ? ' onb-queue-row--pinned' : ''}`}
                onClick={() => navigate(`/onboarding/case/${c.id}`)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/onboarding/case/${c.id}`);
                }}
                role="button"
              >
                <td className="onb-queue-pin-cell">
                  <button
                    className={`onb-queue-pin-btn${c.pinnedToTop ? ' onb-queue-pin-btn--on' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPinToggle?.(c.id);
                    }}
                    title={c.pinnedToTop ? 'Unpin' : 'Pin to top (override)'}
                    type="button"
                  >
                    {c.pinnedToTop ? '★' : '☆'}
                  </button>
                </td>
                <td className="onb-queue-name">{c.intake.clientName}</td>
                <td>{c.intake.clientType.replace(/-/g, ' ')}</td>
                <td>{formatEur(c.intake.declaredMonthlyVolumeEur)} / mo</td>
                <td className="onb-queue-corridors">
                  {c.intake.corridors.join(', ')}
                </td>
                <td>
                  {band ? (
                    <OnboardingRevenueBandBadge
                      band={band}
                      confidence={overridden ? undefined : conf}
                      overridden={overridden}
                    />
                  ) : loading ? (
                    <span className="onb-queue-loading">…</span>
                  ) : (
                    <span className="onb-queue-loading">—</span>
                  )}
                </td>
                <td>
                  <span className={`onb-urgency-pill onb-urgency-pill--${c.intake.urgency}`}>
                    {urgencyLabel[c.intake.urgency]}
                  </span>
                </td>
                <td className="onb-queue-priority">{priorityScore(c)}</td>
                <td>{c.owner}</td>
                <td className="onb-queue-arrow">›</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {cases.length === 0 && (
        <div className="onb-queue-empty">No cases in the queue.</div>
      )}
    </div>
  );
};

export default OnboardingCaseQueueTable;
