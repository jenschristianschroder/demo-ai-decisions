import React from 'react';
import type { OnboardingCase } from '../../types/onboarding';

interface Props {
  caseRecord: OnboardingCase;
}

function formatEur(amount: number): string {
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}m`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}k`;
  return `€${amount}`;
}

const OnboardingSignalDrilldown: React.FC<Props> = ({ caseRecord }) => {
  const { intake, revenueEstimate } = caseRecord;

  return (
    <div className="onb-signal-drilldown">
      <section className="onb-signal-section">
        <h3 className="onb-signal-h">Rationale</h3>
        <p className="onb-signal-rationale">
          {revenueEstimate?.rationale ?? 'The Revenue Estimation Agent has not run yet for this case.'}
        </p>
        <div className="onb-signal-guardrail" title="Bounded-agent reminder">
          Agent recommends — human decides.
        </div>
      </section>

      <section className="onb-signal-section">
        <h3 className="onb-signal-h">Signals used</h3>
        <div className="onb-signal-grid">
          <div className="onb-signal-card">
            <span className="onb-signal-card-label">Client type</span>
            <span className="onb-signal-card-value">{intake.clientType.replace(/-/g, ' ')}</span>
          </div>
          <div className="onb-signal-card">
            <span className="onb-signal-card-label">Headquarters</span>
            <span className="onb-signal-card-value">{intake.headquarters}</span>
          </div>
          <div className="onb-signal-card">
            <span className="onb-signal-card-label">Declared monthly volume</span>
            <span className="onb-signal-card-value">{formatEur(intake.declaredMonthlyVolumeEur)}</span>
          </div>
          <div className="onb-signal-card">
            <span className="onb-signal-card-label">Corridors</span>
            <span className="onb-signal-card-value">{intake.corridors.join(', ')}</span>
          </div>
          <div className="onb-signal-card onb-signal-card--wide">
            <span className="onb-signal-card-label">Product mix</span>
            <span className="onb-signal-card-value">{intake.productMix.join(', ')}</span>
          </div>
          <div className="onb-signal-card onb-signal-card--wide">
            <span className="onb-signal-card-label">Public registry notes</span>
            <span className="onb-signal-card-value">{intake.publicRegistryNotes}</span>
          </div>
        </div>
      </section>

      {revenueEstimate && (
        <>
          <section className="onb-signal-section">
            <h3 className="onb-signal-h">Agent's signal list</h3>
            <ul className="onb-signal-bullets">
              {revenueEstimate.signals.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>

          <section className="onb-signal-section">
            <h3 className="onb-signal-h">Comparable historical clients</h3>
            <ul className="onb-signal-bullets">
              {revenueEstimate.comparableClientIds.map((id) => (
                <li key={id}>
                  <a
                    className="onb-signal-link"
                    href="/sample-data/onboarding/client-profiles.md"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {id}
                  </a>{' '}
                  — see <code>client-profiles.md</code>
                </li>
              ))}
            </ul>
          </section>

          <section className="onb-signal-section">
            <h3 className="onb-signal-h">Citations</h3>
            <ul className="onb-signal-cites">
              {revenueEstimate.citations.map((c) => (
                <li key={c}>
                  <a className="onb-signal-link" href={`/${c}`} target="_blank" rel="noreferrer">
                    {c}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
};

export default OnboardingSignalDrilldown;
