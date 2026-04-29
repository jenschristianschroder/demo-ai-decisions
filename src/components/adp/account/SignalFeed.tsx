import React, { useState } from 'react';
import type { Signal, SignalCategory, SignalStatus } from '../../../types/adp';
import { suggestActions } from '../../../lib/adpAi';

interface SignalFeedProps {
  signals: Signal[];
}

const categoryColors: Record<SignalCategory, string> = {
  risk: '#b91c1c',
  opportunity: '#15803d',
  gap: '#2563eb',
  'sentiment-shift': '#7c3aed',
};

const severityColors: Record<string, string> = {
  high: '#b91c1c',
  medium: '#d97706',
  low: '#6b7280',
};

const SignalFeed: React.FC<SignalFeedProps> = ({ signals }) => {
  const [categoryFilter, setCategoryFilter] = useState<SignalCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SignalStatus | 'all'>('all');
  const [suggestedMap, setSuggestedMap] = useState<
    Record<string, Array<{ description: string; owner: string; priority: string; dueDate: string }>>
  >({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = signals.filter((s) => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const handleSuggest = async (signalId: string) => {
    setLoadingId(signalId);
    const actions = await suggestActions(signalId);
    setSuggestedMap((prev) => ({ ...prev, [signalId]: actions }));
    setLoadingId(null);
  };

  return (
    <div className="adp-detail-signals">
      <div className="adp-detail-signal-filters">
        <select
          className="adp-detail-filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as SignalCategory | 'all')}
        >
          <option value="all">All Categories</option>
          <option value="risk">Risk</option>
          <option value="opportunity">Opportunity</option>
          <option value="gap">Gap</option>
          <option value="sentiment-shift">Sentiment Shift</option>
        </select>
        <select
          className="adp-detail-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SignalStatus | 'all')}
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="actioned">Actioned</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      <div className="adp-detail-signal-list">
        {sorted.length === 0 && (
          <div className="adp-detail-empty">No signals match the selected filters.</div>
        )}
        {sorted.map((signal) => (
          <div key={signal.id} className="adp-detail-signal-card">
            <div className="adp-detail-signal-header">
              <span
                className="adp-detail-category-badge"
                style={{ background: categoryColors[signal.category] }}
              >
                {signal.category}
              </span>
              <span
                className="adp-detail-severity-badge"
                style={{ color: severityColors[signal.severity] }}
              >
                {signal.severity}
              </span>
              <span className="adp-detail-signal-status">{signal.status}</span>
            </div>
            <p className="adp-detail-signal-desc">{signal.description}</p>
            <div className="adp-detail-signal-footer">
              <span className="adp-detail-signal-date">
                {new Date(signal.createdAt).toLocaleDateString()}
              </span>
              <button
                className="adp-detail-suggest-btn"
                disabled={loadingId === signal.id}
                onClick={() => handleSuggest(signal.id)}
              >
                {loadingId === signal.id ? 'Thinking…' : 'Suggest Actions'}
              </button>
            </div>

            {suggestedMap[signal.id] && (
              <div className="adp-detail-suggested-actions">
                <span className="adp-detail-suggested-label">Suggested Actions</span>
                <ul>
                  {suggestedMap[signal.id].map((a, i) => (
                    <li key={i}>
                      <strong>{a.description}</strong>
                      <span className="adp-detail-suggested-meta">
                        {a.owner} · {a.priority} · Due {a.dueDate}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignalFeed;
