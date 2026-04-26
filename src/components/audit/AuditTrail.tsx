import React from 'react';
import type { AuditEvent } from '../../types/finance';

interface AuditTrailProps {
  events: AuditEvent[];
}

const AuditTrail: React.FC<AuditTrailProps> = ({ events }) => {
  const sorted = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="audit-trail">
      <div className="audit-list">
        {sorted.map((event) => (
          <div key={event.id} className="audit-item">
            <div className="audit-dot" />
            <div className="audit-content">
              <div className="audit-header-row">
                <span className="audit-action">{event.action}</span>
                <span className="audit-time">{formatDate(event.timestamp)}</span>
              </div>
              <div className="audit-actor">by {event.actor}</div>
              {event.previousStatus && event.newStatus && (
                <div className="audit-status-change">
                  <span className="status-prev">{event.previousStatus}</span>
                  <span className="status-arrow">→</span>
                  <span className="status-next">{event.newStatus}</span>
                </div>
              )}
              {event.note && <div className="audit-note">{event.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditTrail;
