import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EntityHeader from '../components/entity/EntityHeader';
import AnomalyQueue from '../components/anomalies/AnomalyQueue';
import AnomalyPanel from '../components/anomalies/AnomalyPanel';
import { TrendLineChart, TrendBarChart } from '../components/charts/TrendChart';
import { getEntity, getAnomaliesForEntity, de01MarketingTrend } from '../data/mockFinancialData';
import type { Anomaly, AnomalySeverity, AnomalyStatus, AnomalyCategory } from '../types/finance';
import './EntityDetailScreen.css';

const EntityDetailScreen: React.FC = () => {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();

  const entity = entityId ? getEntity(entityId) : undefined;
  const initialAnomalies = entityId ? getAnomaliesForEntity(entityId) : [];

  const [anomalies, setAnomalies] = useState<Anomaly[]>(initialAnomalies);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(
    initialAnomalies.length > 0 ? initialAnomalies[0] : null
  );
  const [severityFilter, setSeverityFilter] = useState<AnomalySeverity | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<AnomalyStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<AnomalyCategory | 'All'>('All');
  const [showCharts, setShowCharts] = useState(entityId === 'DE01');

  if (!entity) {
    return (
      <div className="entity-not-found">
        <p>Entity not found.</p>
    <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  const handleStatusChange = (anomalyId: string, newStatus: AnomalyStatus, note?: string) => {
    setAnomalies(prev => prev.map(a => {
      if (a.id !== anomalyId) return a;
      const newEvent = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'Status changed',
        actor: 'Group Finance',
        previousStatus: a.status,
        newStatus,
        note,
      };
      return { ...a, status: newStatus, auditTrail: [...a.auditTrail, newEvent] };
    }));
    setSelectedAnomaly(prev => {
      if (!prev || prev.id !== anomalyId) return prev;
      return { ...prev, status: newStatus };
    });
  };

  const handleSelectAnomaly = (anomaly: Anomaly) => {
    const current = anomalies.find(a => a.id === anomaly.id) || anomaly;
    setSelectedAnomaly(current);
  };

  const trendData = entityId === 'DE01' ? de01MarketingTrend : [];

  return (
    <div className="entity-root">
      <header className="entity-header-bar">
        <div className="entity-header-inner">
          <div className="breadcrumb">
            <button className="breadcrumb-link" onClick={() => navigate('/finance-anomaly-demo')}>Home</button>
            <span className="breadcrumb-sep">›</span>
            <button className="breadcrumb-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">{entity.code}</span>
          </div>
        </div>
      </header>

      <div className="entity-body">
        <div className="entity-body-inner">
          <EntityHeader entity={entity} />

          {entityId === 'DE01' && (
            <div className="charts-toggle-row">
              <button
                className={`charts-toggle-btn${showCharts ? ' active' : ''}`}
                onClick={() => setShowCharts(v => !v)}
              >
                {showCharts ? 'Hide Trend Charts' : 'Show Trend Charts'}
              </button>
            </div>
          )}

          {showCharts && trendData.length > 0 && (
            <div className="charts-section">
              <TrendLineChart data={trendData} currency={entity.currency} title="DE01 · Marketing Expense (620500) — 12-Month Trend" />
              <TrendBarChart data={trendData.slice(-6)} currency={entity.currency} title="Last 6 Months: Actual vs Budget" />
            </div>
          )}

          <div className="entity-content">
            <div className="entity-left-panel">
              <div className="panel-section-label">
                Anomaly Queue ({anomalies.length})
              </div>
              <AnomalyQueue
                anomalies={anomalies}
                selectedId={selectedAnomaly?.id ?? null}
                onSelect={handleSelectAnomaly}
                severityFilter={severityFilter}
                statusFilter={statusFilter}
                categoryFilter={categoryFilter}
                onSeverityFilter={setSeverityFilter}
                onStatusFilter={setStatusFilter}
                onCategoryFilter={setCategoryFilter}
              />
            </div>

            <div className="entity-right-panel">
              {selectedAnomaly ? (
                <AnomalyPanel
                  anomaly={anomalies.find(a => a.id === selectedAnomaly.id) || selectedAnomaly}
                  onStatusChange={handleStatusChange}
                  onClose={() => setSelectedAnomaly(null)}
                />
              ) : (
                <div className="no-anomaly-selected">
                  <div className="no-anomaly-icon">🔍</div>
                  <div className="no-anomaly-text">Select an anomaly from the queue to review details</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityDetailScreen;
