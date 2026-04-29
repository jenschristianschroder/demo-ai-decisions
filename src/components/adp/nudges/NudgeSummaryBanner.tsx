import React from 'react';
import { Link } from 'react-router-dom';

interface NudgeSummaryBannerProps {
  count: number;
}

const NudgeSummaryBanner: React.FC<NudgeSummaryBannerProps> = ({ count }) => {
  if (count === 0) return null;

  return (
    <div className="adp-nudge-banner">
      <span className="adp-nudge-banner-text">
        🔔 You have <strong>{count}</strong> active nudge{count !== 1 ? 's' : ''} requiring attention
      </span>
      <Link className="adp-nudge-banner-link" to="/adp/nudges">
        View All →
      </Link>
    </div>
  );
};

export default NudgeSummaryBanner;
