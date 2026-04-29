import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { NudgeType } from '../types/adp';
import { getNudges } from '../data/mockAdpData';
import NudgeCard from '../components/adp/nudges/NudgeCard';
import './AdpNudgeCentreScreen.css';

type FilterKey = 'all' | NudgeType;

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all',          label: 'All' },
  { key: 'reminder',     label: 'Reminders' },
  { key: 'stale-data',   label: 'Stale Data' },
  { key: 'follow-up',    label: 'Follow-Up' },
  { key: 'missing-info', label: 'Missing Info' },
];

const AdpNudgeCentreScreen: React.FC = () => {
  const allNudges = getNudges();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const visibleNudges = useMemo(() => {
    let list = allNudges.filter((n) => !dismissed.has(n.id));
    if (activeFilter !== 'all') {
      list = list.filter((n) => n.type === activeFilter);
    }
    return list;
  }, [allNudges, dismissed, activeFilter]);

  const activeCount = allNudges.filter((n) => !dismissed.has(n.id)).length;

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  return (
    <div className="adp-nudge-root">
      {/* Sticky header */}
      <header className="adp-nudge-header">
        <div className="adp-nudge-header-inner">
          <nav className="adp-nudge-breadcrumb">
            <Link className="adp-nudge-breadcrumb-link" to="/adp/dashboard">
              Home
            </Link>
            <span className="adp-nudge-breadcrumb-sep">›</span>
            <span className="adp-nudge-breadcrumb-current">Nudge Centre</span>
          </nav>
          <h1 className="adp-nudge-title">Nudge Centre</h1>
          <p className="adp-nudge-subtitle">
            {activeCount} active nudge{activeCount !== 1 ? 's' : ''} across all accounts
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="adp-nudge-main">
        {/* Filters */}
        <div className="adp-nudge-filters">
          {filters.map((f) => (
            <button
              key={f.key}
              className={`adp-nudge-filter-btn${activeFilter === f.key ? ' adp-nudge-filter-btn--active' : ''}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Nudge list */}
        {visibleNudges.length > 0 ? (
          <div className="adp-nudge-list">
            {visibleNudges.map((nudge) => (
              <NudgeCard key={nudge.id} nudge={nudge} onDismiss={handleDismiss} />
            ))}
          </div>
        ) : (
          <div className="adp-nudge-empty">
            <div className="adp-nudge-empty-icon">✅</div>
            <p className="adp-nudge-empty-text">
              {activeCount === 0
                ? 'All nudges dismissed — you\u2019re all caught up!'
                : 'No nudges match this filter.'}
            </p>
            <p className="adp-nudge-empty-sub">
              {activeCount === 0
                ? 'New nudges will appear here as they are generated.'
                : 'Try selecting a different category above.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdpNudgeCentreScreen;
