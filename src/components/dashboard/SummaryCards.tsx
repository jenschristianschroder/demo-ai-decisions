import React from 'react';
import type { DashboardSummary } from '../../types/finance';

interface SummaryCardsProps {
  summary: DashboardSummary;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const cards = [
    { label: 'Submitted Entities', value: `${summary.submittedEntities}/12`, sub: `${summary.lateEntities} late`, highlight: false },
    { label: 'High-Risk Anomalies', value: String(summary.highRiskAnomalies), sub: 'Require immediate review', highlight: true },
    { label: 'Intercompany Breaks', value: String(summary.intercompanyBreaks), sub: 'Elimination mismatches', highlight: true },
    { label: 'Weak Commentary', value: String(summary.weakCommentaryItems), sub: 'Items needing explanation', highlight: false },
    { label: 'Late Submissions', value: String(summary.lateEntities), sub: 'Past close deadline', highlight: summary.lateEntities > 0 },
    { label: 'Time Saved (est.)', value: `${summary.estimatedReviewTimeSaved}h`, sub: 'vs manual review', highlight: false },
  ];

  return (
    <div className="summary-cards">
      {cards.map((card) => (
        <div key={card.label} className={`summary-card${card.highlight ? ' summary-card--alert' : ''}`}>
          <div className="summary-card-value">{card.value}</div>
          <div className="summary-card-label">{card.label}</div>
          <div className="summary-card-sub">{card.sub}</div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
