import React, { useState } from 'react';
import type { Anomaly, AnomalyStatus } from '../../types/finance';
import { regenerateDraftEmail } from '../../lib/mockAi';

interface FollowUpAssistantProps {
  anomaly: Anomaly;
  initialDraft: string;
  onStatusChange: (anomalyId: string, newStatus: AnomalyStatus, note?: string) => void;
}

const FollowUpAssistant: React.FC<FollowUpAssistantProps> = ({ anomaly, initialDraft, onStatusChange }) => {
  const [draft, setDraft] = useState(initialDraft);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(anomaly.status === 'Pending Subsidiary Response');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    const newDraft = await regenerateDraftEmail(anomaly, draft);
    setDraft(newDraft);
    setRegenerating(false);
  };

  const handleMarkAsSent = () => {
    setSent(true);
    onStatusChange(anomaly.id, 'Pending Subsidiary Response', 'Follow-up email sent to subsidiary controller');
  };

  const handleMarkInReview = () => {
    onStatusChange(anomaly.id, 'In Review');
  };

  const handleResolve = () => {
    onStatusChange(anomaly.id, 'Resolved', 'Anomaly resolved by Group Finance');
  };

  const handleEscalate = () => {
    onStatusChange(anomaly.id, 'Escalated', 'Escalated for senior review');
  };

  return (
    <div className="followup-assistant output-area">
      <div className="followup-section">
        <div className="followup-header">
          <h4 className="followup-title">Draft Follow-Up Email</h4>
          <div className="followup-actions">
            <button className="followup-btn" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <button className="followup-btn" onClick={handleRegenerate} disabled={regenerating}>
              {regenerating ? 'Regenerating…' : 'Regenerate'}
            </button>
            {!sent && (
              <button className="followup-btn followup-btn--primary" onClick={handleMarkAsSent}>
                Mark as Sent
              </button>
            )}
            {sent && (
              <span className="followup-sent-badge">✓ Sent</span>
            )}
          </div>
        </div>
        <textarea
          className="followup-draft"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={12}
        />
      </div>

      <div className="followup-section">
        <h4 className="followup-title">Anomaly Actions</h4>
        <div className="action-buttons">
          <button
            className="action-btn action-btn--pending"
            onClick={handleMarkInReview}
            disabled={anomaly.status === 'In Review'}
          >
            Mark In Review
          </button>
          <button
            className="action-btn action-btn--resolve"
            onClick={handleResolve}
            disabled={anomaly.status === 'Resolved'}
          >
            Resolve
          </button>
          <button
            className="action-btn action-btn--escalate"
            onClick={handleEscalate}
            disabled={anomaly.status === 'Escalated'}
          >
            Escalate
          </button>
        </div>
        <div className="current-status">
          Current status: <strong>{anomaly.status}</strong>
        </div>
      </div>
    </div>
  );
};

export default FollowUpAssistant;
