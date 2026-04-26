import React, { useEffect, useState } from 'react';
import type { Anomaly, AnomalyStatus, AiResponse } from '../../types/finance';
import { generateAnomalyExplanation } from '../../lib/mockAi';
import FollowUpAssistant from './FollowUpAssistant';
import AuditTrail from '../audit/AuditTrail';

interface AnomalyPanelProps {
  anomaly: Anomaly;
  onStatusChange: (anomalyId: string, newStatus: AnomalyStatus, note?: string) => void;
  onClose: () => void;
}

const severityStyle: Record<string, { bg: string; color: string; border: string }> = {
  High: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
  Medium: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  Low: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
};

const AnomalyPanel: React.FC<AnomalyPanelProps> = ({ anomaly, onStatusChange, onClose }) => {
  const [aiResponse, setAiResponse] = useState<AiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'details' | 'followup' | 'audit'>('details');

  useEffect(() => {
    setAiResponse(null);
    setLoading(true);
    setTab('details');
    generateAnomalyExplanation(anomaly).then(res => {
      setAiResponse(res);
      setLoading(false);
    });
  }, [anomaly.id]);

  const sev = severityStyle[anomaly.severity];

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency + ' ';
    if (Math.abs(amount) >= 1000000) return `${symbol}${(amount / 1000000).toFixed(2)}m`;
    return `${symbol}${(amount / 1000).toFixed(0)}k`;
  };

  return (
    <div className="anomaly-panel">
      <div className="panel-header">
        <div className="panel-header-top">
          <div className="panel-title-group">
            <span
              className="panel-severity"
              style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}
            >
              {anomaly.severity}
            </span>
            <span className="panel-account">{anomaly.accountId} · {anomaly.accountName}</span>
          </div>
          <button className="panel-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="panel-finding">{anomaly.finding}</div>
        <div className="panel-tabs">
          <button className={`panel-tab${tab === 'details' ? ' panel-tab--active' : ''}`} onClick={() => setTab('details')}>
            Details
          </button>
          <button className={`panel-tab${tab === 'followup' ? ' panel-tab--active' : ''}`} onClick={() => setTab('followup')}>
            Follow-Up
          </button>
          <button className={`panel-tab${tab === 'audit' ? ' panel-tab--active' : ''}`} onClick={() => setTab('audit')}>
            Audit Trail
          </button>
        </div>
      </div>

      <div className="panel-body">
        {tab === 'details' && (
          <div className="panel-details">
            {loading && (
              <div className="panel-loading">
                <div className="loading-spinner" />
                <span>Generating AI explanation…</span>
              </div>
            )}
            {!loading && aiResponse && (
              <>
                <section className="panel-section">
                  <h4 className="panel-section-title">Explanation</h4>
                  <p className="panel-section-text">{aiResponse.explanation}</p>
                </section>

                <section className="panel-section">
                  <h4 className="panel-section-title">Evidence</h4>
                  <ul className="evidence-list">
                    {aiResponse.evidenceList.map((item, i) => (
                      <li key={i} className="evidence-item">{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="panel-section">
                  <h4 className="panel-section-title">Possible Causes</h4>
                  <ul className="causes-list">
                    {aiResponse.possibleCauses.map((cause, i) => (
                      <li key={i} className="causes-item">{cause}</li>
                    ))}
                  </ul>
                </section>

                <section className="panel-section">
                  <h4 className="panel-section-title">Recommended Follow-Up</h4>
                  <p className="panel-section-text">{aiResponse.recommendedFollowUp}</p>
                </section>

                <section className="panel-section">
                  <h4 className="panel-section-title">Key Metrics</h4>
                  <div className="metrics-grid">
                    <div className="metric-item">
                      <div className="metric-label">Actual</div>
                      <div className="metric-value">{formatAmount(anomaly.actual, anomaly.currency)}</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-label">Benchmark</div>
                      <div className="metric-value">{formatAmount(anomaly.benchmark, anomaly.currency)}</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-label">Variance</div>
                      <div className={`metric-value ${anomaly.varianceAmount > 0 ? 'metric-positive' : 'metric-negative'}`}>
                        {anomaly.varianceAmount > 0 ? '+' : ''}{formatAmount(anomaly.varianceAmount, anomaly.currency)}
                      </div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-label">Variance %</div>
                      <div className={`metric-value ${anomaly.variancePercent > 0 ? 'metric-positive' : 'metric-negative'}`}>
                        {anomaly.variancePercent > 0 ? '+' : ''}{(anomaly.variancePercent * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-label">Materiality</div>
                      <div className="metric-value">{anomaly.materialityImpact}</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-label">Commentary</div>
                      <div className={`metric-value commentary-quality-${anomaly.commentaryQuality.toLowerCase()}`}>
                        {anomaly.commentaryQuality}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="panel-confidence">
                  <span className="confidence-label">AI Confidence</span>
                  <div className="confidence-bar-bg">
                    <div className="confidence-bar-fill" style={{ width: `${aiResponse.confidenceLevel * 100}%` }} />
                  </div>
                  <span className="confidence-pct">{(aiResponse.confidenceLevel * 100).toFixed(0)}%</span>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'followup' && aiResponse && (
          <FollowUpAssistant
            anomaly={anomaly}
            initialDraft={aiResponse.draftEmail}
            onStatusChange={onStatusChange}
          />
        )}

        {tab === 'audit' && (
          <AuditTrail events={anomaly.auditTrail} />
        )}
      </div>
    </div>
  );
};

export default AnomalyPanel;
