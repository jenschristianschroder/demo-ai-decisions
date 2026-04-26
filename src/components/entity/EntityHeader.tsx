import React from 'react';
import type { Entity } from '../../types/finance';

interface EntityHeaderProps {
  entity: Entity;
}

const EntityHeader: React.FC<EntityHeaderProps> = ({ entity }) => {
  const riskColor = entity.riskScore >= 70 ? '#b91c1c' : entity.riskScore >= 40 ? '#d97706' : '#15803d';

  return (
    <div className="entity-header">
      <div className="entity-header-left">
        <div className="entity-header-code">{entity.code}</div>
        <div className="entity-header-name">{entity.name}</div>
        <div className="entity-header-meta">
          <span>{entity.country}</span>
          <span className="meta-sep">·</span>
          <span>{entity.region}</span>
          <span className="meta-sep">·</span>
          <span>{entity.currency}</span>
        </div>
        <div className="entity-controller">
          <span className="controller-label">Controller:</span>
          <span className="controller-name">{entity.controllerName}</span>
          <a href={`mailto:${entity.controllerEmail}`} className="controller-email">{entity.controllerEmail}</a>
        </div>
      </div>
      <div className="entity-header-right">
        <div className="risk-score-display">
          <div className="risk-score-circle" style={{ borderColor: riskColor }}>
            <span className="risk-score-number" style={{ color: riskColor }}>{entity.riskScore}</span>
            <span className="risk-score-label">Risk</span>
          </div>
        </div>
        <div className="entity-stats">
          <div className="entity-stat">
            <span className="stat-value stat-high">{entity.highRiskAnomalies}</span>
            <span className="stat-label">High</span>
          </div>
          <div className="entity-stat">
            <span className="stat-value stat-medium">{entity.mediumRiskAnomalies}</span>
            <span className="stat-label">Medium</span>
          </div>
          <div className="entity-stat">
            <span className="stat-value">{entity.intercompanyBreaks}</span>
            <span className="stat-label">IC Breaks</span>
          </div>
          <div className="entity-stat">
            <span className="stat-value">{entity.weakCommentaryCount}</span>
            <span className="stat-label">Weak Commentary</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityHeader;
