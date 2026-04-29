import React from 'react';
import type { AccountPlan } from '../../../types/adp';

interface PlanCompletenessPanelProps {
  plan: AccountPlan;
}

const sectionStatusColors: Record<string, string> = {
  complete: '#15803d',
  partial: '#d97706',
  stale: '#ea580c',
  missing: '#b91c1c',
};

const PlanCompletenessPanel: React.FC<PlanCompletenessPanelProps> = ({ plan }) => {
  const pct = plan.completenessPercent;
  // CSS ring via conic-gradient
  const ringStyle: React.CSSProperties = {
    background: `conic-gradient(#0f766e ${pct * 3.6}deg, #e5e7eb ${pct * 3.6}deg)`,
  };

  return (
    <div className="adp-detail-plan">
      {/* Overall completeness */}
      <div className="adp-detail-plan-overview">
        <div className="adp-detail-plan-ring" style={ringStyle}>
          <span className="adp-detail-plan-ring-value">{pct}%</span>
        </div>
        <span className="adp-detail-plan-ring-label">Overall Plan Completeness</span>
      </div>

      {/* Section list */}
      <div className="adp-detail-plan-sections">
        <h4>Sections</h4>
        {plan.sections.map((sec, i) => (
          <div key={i} className="adp-detail-plan-section-row">
            <div className="adp-detail-plan-section-top">
              <span className="adp-detail-plan-section-name">{sec.name}</span>
              <span
                className="adp-detail-section-status-badge"
                style={{ background: sectionStatusColors[sec.status] }}
              >
                {sec.status}
              </span>
              <span className="adp-detail-plan-section-date">
                Updated {new Date(sec.lastUpdated).toLocaleDateString()}
              </span>
            </div>
            <p className="adp-detail-plan-section-guidance">{sec.guidance}</p>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {plan.sections.length > 0 && (
        <div className="adp-detail-plan-recs">
          <h4>Recommendations</h4>
          <ul>
            {/* Use guidance from incomplete sections as recommendations */}
            {plan.sections
              .filter((s) => s.status !== 'complete')
              .map((s, i) => (
                <li key={i}>{s.guidance}</li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlanCompletenessPanel;
