import React from 'react';
import type { Anomaly, AnomalySeverity, AnomalyStatus, AnomalyCategory } from '../../types/finance';
import { sortAnomaliesByPriority } from '../../lib/anomalyScoring';

interface AnomalyQueueProps {
  anomalies: Anomaly[];
  selectedId: string | null;
  onSelect: (anomaly: Anomaly) => void;
  severityFilter: AnomalySeverity | 'All';
  statusFilter: AnomalyStatus | 'All';
  categoryFilter: AnomalyCategory | 'All';
  onSeverityFilter: (v: AnomalySeverity | 'All') => void;
  onStatusFilter: (v: AnomalyStatus | 'All') => void;
  onCategoryFilter: (v: AnomalyCategory | 'All') => void;
}

const severityStyle: Record<AnomalySeverity, { bg: string; color: string; border: string }> = {
  High: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
  Medium: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  Low: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
};

const statusStyle: Record<AnomalyStatus, { bg: string; color: string }> = {
  New: { bg: '#f0f0f0', color: '#444444' },
  'In Review': { bg: '#dbeafe', color: '#1e40af' },
  'Pending Subsidiary Response': { bg: '#fef3c7', color: '#92400e' },
  Resolved: { bg: '#dcfce7', color: '#166534' },
  Escalated: { bg: '#f3e8ff', color: '#6b21a8' },
};

const AnomalyQueue: React.FC<AnomalyQueueProps> = ({
  anomalies, selectedId, onSelect,
  severityFilter, statusFilter, categoryFilter,
  onSeverityFilter, onStatusFilter, onCategoryFilter,
}) => {
  const categories = Array.from(new Set(anomalies.map(a => a.category)));
  const filtered = sortAnomaliesByPriority(
    anomalies.filter(a =>
      (severityFilter === 'All' || a.severity === severityFilter) &&
      (statusFilter === 'All' || a.status === statusFilter) &&
      (categoryFilter === 'All' || a.category === categoryFilter)
    )
  );

  return (
    <div className="anomaly-queue">
      <div className="queue-filters">
        <select value={severityFilter} onChange={e => onSeverityFilter(e.target.value as AnomalySeverity | 'All')}>
          <option value="All">All Severities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select value={statusFilter} onChange={e => onStatusFilter(e.target.value as AnomalyStatus | 'All')}>
          <option value="All">All Statuses</option>
          <option value="New">New</option>
          <option value="In Review">In Review</option>
          <option value="Pending Subsidiary Response">Pending Response</option>
          <option value="Resolved">Resolved</option>
          <option value="Escalated">Escalated</option>
        </select>
        <select value={categoryFilter} onChange={e => onCategoryFilter(e.target.value as AnomalyCategory | 'All')}>
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="queue-count">{filtered.length} anomal{filtered.length === 1 ? 'y' : 'ies'}</div>

      <div className="queue-list">
        {filtered.length === 0 && (
          <div className="queue-empty">No anomalies match the selected filters.</div>
        )}
        {filtered.map((anomaly) => {
          const sev = severityStyle[anomaly.severity];
          const sta = statusStyle[anomaly.status];
          return (
            <div
              key={anomaly.id}
              className={`queue-item${selectedId === anomaly.id ? ' queue-item--selected' : ''}`}
              onClick={() => onSelect(anomaly)}
            >
              <div className="queue-item-top">
                <span
                  className="queue-severity"
                  style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}
                >
                  {anomaly.severity}
                </span>
                <span className="queue-account">{anomaly.accountId} · {anomaly.accountName}</span>
                <span
                  className="queue-status"
                  style={{ background: sta.bg, color: sta.color }}
                >
                  {anomaly.status}
                </span>
              </div>
              <div className="queue-finding">{anomaly.finding}</div>
              <div className="queue-meta">
                <span>{anomaly.category}</span>
                <span>·</span>
                <span>{anomaly.period}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnomalyQueue;
