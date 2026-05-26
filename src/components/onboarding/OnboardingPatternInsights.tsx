import React from 'react';
import type { PortfolioInsight } from '../../types/onboarding';

interface Props {
  insights: PortfolioInsight[];
  loading?: boolean;
  onSelectInsight?: (insight: PortfolioInsight) => void;
}

const OnboardingPatternInsights: React.FC<Props> = ({ insights, loading, onSelectInsight }) => {
  if (loading) {
    return <div className="onb-insights-empty">Scanning the portfolio for patterns…</div>;
  }
  if (insights.length === 0) {
    return <div className="onb-insights-empty">No insights yet. Run the Portfolio agent.</div>;
  }

  return (
    <ul className="onb-insights-list">
      {insights.map((ins) => (
        <li
          key={ins.id}
          className="onb-insight-card"
          onClick={() => onSelectInsight?.(ins)}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSelectInsight?.(ins);
          }}
        >
          <div className="onb-insight-headline">
            <span className="onb-insight-magnitude">{ins.magnitude}</span>
            <span className="onb-insight-h-text">{ins.headline}</span>
          </div>
          <div className="onb-insight-meta">
            <span>
              <strong>Metric:</strong> {ins.metric}
            </span>
            <span>
              <strong>Segment:</strong> {ins.affectedSegment}
            </span>
          </div>
          <p className="onb-insight-evidence">{ins.evidence}</p>
          <div className="onb-insight-cases">
            {ins.sourceCases.map((id) => (
              <span key={id} className="onb-insight-case-chip">
                {id}
              </span>
            ))}
          </div>
          {ins.citations.length > 0 && (
            <div className="onb-insight-cites">
              {ins.citations.map((c) => (
                <a
                  key={c}
                  className="onb-insight-cite"
                  href={`/${c}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {c}
                </a>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default OnboardingPatternInsights;
