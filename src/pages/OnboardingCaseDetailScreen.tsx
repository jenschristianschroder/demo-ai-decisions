import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  appendAuditEntry,
  bandFor,
  getAuditTrail,
  getCaseById,
  updateCase,
} from '../data/mockOnboardingData';
import {
  loadClientProfiles,
  loadOnboardingProcess,
  loadRevenueBandingRubric,
  loadStepTimings,
} from '../lib/onboardingDataLoader';
import {
  runOnboardingDurationForCase,
  runOnboardingRevenueEstimate,
} from '../lib/onboardingAi';
import type {
  OnboardingCase,
  OnboardingProgressStep,
  RevenueBand,
} from '../types/onboarding';
import OnboardingRevenueBandBadge from '../components/onboarding/OnboardingRevenueBandBadge';
import OnboardingSignalDrilldown from '../components/onboarding/OnboardingSignalDrilldown';
import OnboardingDurationEstimate from '../components/onboarding/OnboardingDurationEstimate';
import OnboardingBottleneckCard from '../components/onboarding/OnboardingBottleneckCard';
import OnboardingAgentTimeline from '../components/onboarding/OnboardingAgentTimeline';
import './OnboardingCaseDetailScreen.css';

type TabId = 'signals' | 'duration' | 'override' | 'audit';

const TABS: { id: TabId; label: string }[] = [
  { id: 'signals', label: 'Estimate & signals' },
  { id: 'duration', label: 'Duration & bottleneck' },
  { id: 'override', label: 'Override' },
  { id: 'audit', label: 'Audit trail' },
];

const BAND_OPTIONS: RevenueBand[] = ['low', 'medium', 'high', 'strategic'];

const OnboardingCaseDetailScreen: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [caseRecord, setCaseRecord] = useState<OnboardingCase | undefined>(() =>
    caseId ? getCaseById(caseId) : undefined,
  );
  const [activeTab, setActiveTab] = useState<TabId>('signals');
  const [steps, setSteps] = useState<OnboardingProgressStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<null | 'revenue' | 'duration'>(null);
  const [overrideBand, setOverrideBand] = useState<RevenueBand | ''>('');
  const [overrideJustification, setOverrideJustification] = useState('');

  const refresh = () => {
    if (caseId) setCaseRecord(getCaseById(caseId));
  };

  // Auto-run revenue estimate on mount if missing
  useEffect(() => {
    const run = async () => {
      if (!caseRecord || caseRecord.revenueEstimate) return;
      setRunning('revenue');
      try {
        const [comparablesText, rubricText] = await Promise.all([
          loadClientProfiles(),
          loadRevenueBandingRubric(),
        ]);
        setSteps((prev) => [
          ...prev,
          {
            phase: 'revenue-estimation',
            status: 'running',
            message: 'Estimating revenue band…',
          },
        ]);
        const result = await runOnboardingRevenueEstimate(
          caseRecord.intake,
          comparablesText,
          rubricText,
        );
        updateCase(caseRecord.id, (c) => ({ ...c, revenueEstimate: result }));
        appendAuditEntry({
          timestamp: new Date().toISOString(),
          agent: 'Revenue Estimation Agent',
          phase: 'revenue-estimation',
          action: `Estimated band "${result.band}" (${(result.confidenceScore * 100).toFixed(0)}%)`,
          detail: result.rationale,
          citations: result.citations,
        });
        setSteps((prev) => [
          ...prev,
          {
            phase: 'revenue-estimation',
            status: 'done',
            message: `Estimated ${result.band}`,
          },
        ]);
        refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Estimation failed';
        setError(message);
      } finally {
        setRunning(null);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunDuration = async () => {
    if (!caseRecord) return;
    setRunning('duration');
    setError(null);
    try {
      const [processText, stepTimings] = await Promise.all([
        loadOnboardingProcess(),
        loadStepTimings(),
      ]);
      if (!stepTimings) throw new Error('Step timings unavailable');
      setSteps((prev) => [
        ...prev,
        {
          phase: 'duration-case',
          status: 'running',
          message: 'Estimating go-live window and bottleneck…',
        },
      ]);
      const result = await runOnboardingDurationForCase(
        {
          id: caseRecord.id,
          status: caseRecord.status,
          currentStep: caseRecord.currentStep,
          enteredCurrentStepOn: caseRecord.enteredCurrentStepOn,
          owner: caseRecord.owner,
          intake: caseRecord.intake,
        },
        processText,
        stepTimings,
      );
      updateCase(caseRecord.id, (c) => ({ ...c, durationEstimate: result }));
      appendAuditEntry({
        timestamp: new Date().toISOString(),
        agent: 'Duration & Bottleneck Agent',
        phase: 'duration-case',
        action: `Estimated go-live ${result.expectedGoLiveStart} → ${result.expectedGoLiveEnd}`,
        detail: result.rationale,
        citations: result.citations,
      });
      setSteps((prev) => [
        ...prev,
        {
          phase: 'duration-case',
          status: 'done',
          message: `Estimated go-live window: ${result.expectedGoLiveStart} → ${result.expectedGoLiveEnd}`,
        },
      ]);
      refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Duration estimation failed';
      setError(message);
    } finally {
      setRunning(null);
    }
  };

  const handleSubmitOverride = () => {
    if (!caseRecord || !overrideBand || !overrideJustification.trim()) return;
    const override = {
      band: overrideBand,
      justification: overrideJustification.trim(),
      overriddenBy: 'Team Lead',
      overriddenAt: new Date().toISOString(),
    };
    updateCase(caseRecord.id, (c) => ({ ...c, revenueOverride: override }));
    appendAuditEntry({
      timestamp: override.overriddenAt,
      agent: 'Team Lead',
      phase: 'override',
      action: `Manual override: band set to ${overrideBand}`,
      detail: override.justification,
    });
    setOverrideBand('');
    setOverrideJustification('');
    refresh();
  };

  const audit = useMemo(() => getAuditTrail().filter((e) => {
    // Show only audit entries that mention this case or are global. We tag by detail / action.
    return caseRecord ? (e.detail + ' ' + e.action).includes(caseRecord.intake.clientName) || !caseRecord : true;
  }), [caseRecord]);

  if (!caseRecord) {
    return (
      <div className="onb-case-root">
        <div className="onb-case-missing">
          Case not found.{' '}
          <button className="onb-case-link" onClick={() => navigate('/onboarding/queue')}>
            Back to queue
          </button>
        </div>
      </div>
    );
  }

  const currentBand = bandFor(caseRecord);
  const overridden = !!caseRecord.revenueOverride;

  return (
    <div className="onb-case-root">
      <header className="onb-case-header">
        <div className="onb-case-header-inner">
          <div className="onb-case-breadcrumb">
            <button className="onb-case-link" onClick={() => navigate('/features')}>
              Demos
            </button>
            <span className="onb-case-sep">›</span>
            <button className="onb-case-link" onClick={() => navigate('/onboarding')}>
              Onboarding Intelligence
            </button>
            <span className="onb-case-sep">›</span>
            <button className="onb-case-link" onClick={() => navigate('/onboarding/queue')}>
              Queue
            </button>
            <span className="onb-case-sep">›</span>
            <span className="onb-case-current">{caseRecord.intake.clientName}</span>
          </div>

          <div className="onb-case-title-row">
            <div>
              <h1 className="onb-case-title">{caseRecord.intake.clientName}</h1>
              <div className="onb-case-subtitle">
                {caseRecord.intake.clientType.replace(/-/g, ' ')} · {caseRecord.intake.headquarters} ·{' '}
                Step: <strong>{caseRecord.currentStep}</strong>
              </div>
            </div>
            <div className="onb-case-band-block">
              {currentBand ? (
                <OnboardingRevenueBandBadge
                  band={currentBand}
                  confidence={overridden ? undefined : caseRecord.revenueEstimate?.confidenceScore}
                  overridden={overridden}
                />
              ) : (
                <span className="onb-case-loading">No band yet</span>
              )}
              <div className="onb-case-guardrail">Agent recommends — human decides</div>
            </div>
          </div>
        </div>

        <nav className="onb-case-tab-bar">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`onb-case-tab${activeTab === t.id ? ' onb-case-tab--active' : ''}`}
              onClick={() => setActiveTab(t.id)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="onb-case-main">
        {error && <div className="onb-case-error">{error}</div>}

        {activeTab === 'signals' && (
          <OnboardingSignalDrilldown caseRecord={caseRecord} />
        )}

        {activeTab === 'duration' && (
          <div className="onb-case-duration-tab">
            <div className="onb-case-duration-actions">
              <button
                className="onb-case-btn"
                onClick={handleRunDuration}
                disabled={running === 'duration'}
                type="button"
              >
                {running === 'duration'
                  ? 'Estimating…'
                  : caseRecord.durationEstimate
                    ? 'Re-run estimate'
                    : 'Run Duration & Bottleneck Agent'}
              </button>
            </div>
            <OnboardingBottleneckCard estimate={caseRecord.durationEstimate} />
            <OnboardingDurationEstimate estimate={caseRecord.durationEstimate} />
          </div>
        )}

        {activeTab === 'override' && (
          <div className="onb-case-override">
            <h2 className="onb-case-h2">Manual override</h2>
            <p className="onb-case-override-intro">
              The team lead can set a different revenue band with a justification. The override is
              captured in the audit trail and used for queue ranking from now on.
            </p>
            <label className="onb-case-field">
              <span className="onb-case-field-label">New band</span>
              <select
                className="onb-case-input"
                value={overrideBand}
                onChange={(e) => setOverrideBand(e.target.value as RevenueBand)}
              >
                <option value="">— select —</option>
                {BAND_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
            <label className="onb-case-field">
              <span className="onb-case-field-label">Justification (required)</span>
              <textarea
                className="onb-case-input"
                rows={3}
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
                placeholder="Why is the team lead overriding the agent's band?"
              />
            </label>
            <button
              className="onb-case-btn"
              onClick={handleSubmitOverride}
              disabled={!overrideBand || !overrideJustification.trim()}
              type="button"
            >
              Apply override
            </button>
            {overridden && caseRecord.revenueOverride && (
              <div className="onb-case-override-current">
                <strong>Current override:</strong> {caseRecord.revenueOverride.band} —{' '}
                {caseRecord.revenueOverride.justification}{' '}
                <em>
                  ({caseRecord.revenueOverride.overriddenBy},{' '}
                  {new Date(caseRecord.revenueOverride.overriddenAt).toLocaleString()})
                </em>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="onb-case-audit">
            <h2 className="onb-case-h2">Audit trail</h2>
            {audit.length === 0 ? (
              <div className="onb-case-empty">No agent activity recorded yet.</div>
            ) : (
              <ol className="onb-case-audit-list">
                {audit.map((entry, i) => (
                  <li key={i} className="onb-case-audit-entry">
                    <div className="onb-case-audit-ts">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    <div className="onb-case-audit-agent">
                      {entry.agent} — <em>{entry.phase}</em>
                    </div>
                    <div className="onb-case-audit-action">{entry.action}</div>
                    <div className="onb-case-audit-detail">{entry.detail}</div>
                    {entry.citations && entry.citations.length > 0 && (
                      <div className="onb-case-audit-cites">
                        {entry.citations.map((c) => (
                          <a key={c} href={`/${c}`} target="_blank" rel="noreferrer">
                            {c}
                          </a>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {steps.length > 0 && (
          <section className="onb-case-timeline-section">
            <h2 className="onb-case-h2">Agent activity (this session)</h2>
            <OnboardingAgentTimeline steps={steps} />
          </section>
        )}
      </main>
    </div>
  );
};

export default OnboardingCaseDetailScreen;
