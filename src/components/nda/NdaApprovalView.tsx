import React from 'react';
import type { ApprovalDecision } from '../../types/nda';

interface Props {
  approval: ApprovalDecision;
}

const TIER_LABELS: Record<string, string> = {
  'tier-1': 'Tier 1 — Auto-Approve',
  'tier-2': 'Tier 2 — Legal Counsel',
  'tier-3': 'Tier 3 — Senior Leadership',
};

const NdaApprovalView: React.FC<Props> = ({ approval }) => {
  return (
    <div className="nda-approval-root">
      <h3 className="nda-approval-title">Approval Routing</h3>

      <div className="nda-approval-grid">
        <div className="nda-approval-field">
          <span className="nda-approval-label">Tier</span>
          <span className={`nda-approval-tier-badge nda-approval-tier--${approval.tier}`}>
            {TIER_LABELS[approval.tier] ?? approval.tier}
          </span>
        </div>
        <div className="nda-approval-field">
          <span className="nda-approval-label">Approver</span>
          <span className="nda-approval-value">{approval.approver}</span>
        </div>
        <div className="nda-approval-field">
          <span className="nda-approval-label">Role</span>
          <span className="nda-approval-value">{approval.approverRole}</span>
        </div>
        <div className="nda-approval-field">
          <span className="nda-approval-label">Decision</span>
          <span className={`nda-approval-decision-badge nda-approval-decision--${approval.decision}`}>
            {approval.decision}
          </span>
        </div>
        <div className="nda-approval-field">
          <span className="nda-approval-label">SLA</span>
          <span className="nda-approval-value">{approval.sla}</span>
        </div>
      </div>

      {approval.conditions.length > 0 && (
        <>
          <h4 className="nda-approval-section-title">Conditions</h4>
          <ul className="nda-approval-list">
            {approval.conditions.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </>
      )}

      {approval.triggers.length > 0 && (
        <>
          <h4 className="nda-approval-section-title">Escalation Triggers</h4>
          <ul className="nda-approval-list">
            {approval.triggers.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </>
      )}

      <div className="nda-approval-reasoning">
        <span className="nda-approval-reasoning-label">Agent Reasoning:</span> {approval.reasoning}
      </div>
    </div>
  );
};

export default NdaApprovalView;
