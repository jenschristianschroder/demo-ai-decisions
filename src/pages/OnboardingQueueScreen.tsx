import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllCases,
  sortCasesByPriority,
  updateCase,
  appendAuditEntry,
  bandFor,
} from '../data/mockOnboardingData';
import type { OnboardingCase, OnboardingProgressStep } from '../types/onboarding';
import {
  loadClientProfiles,
  loadRevenueBandingRubric,
} from '../lib/onboardingDataLoader';
import { runOnboardingRevenueEstimate } from '../lib/onboardingAi';
import OnboardingCaseQueueTable from '../components/onboarding/OnboardingCaseQueueTable';
import OnboardingAgentTimeline from '../components/onboarding/OnboardingAgentTimeline';
import './OnboardingQueueScreen.css';

const OnboardingQueueScreen: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<OnboardingCase[]>(() => sortCasesByPriority(getAllCases()));
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<OnboardingProgressStep[]>([]);

  const refresh = useCallback(() => {
    setCases(sortCasesByPriority(getAllCases()));
  }, []);

  const pushStep = (s: OnboardingProgressStep) => {
    setSteps((prev) => {
      const next = [...prev];
      const idx = next.findIndex(
        (p) => p.phase === s.phase && p.status === 'running',
      );
      if (idx >= 0 && s.status !== 'running') {
        next[idx] = s;
        return next;
      }
      return [...next, s];
    });
  };

  const estimateForCase = useCallback(async (
    c: OnboardingCase,
    comparablesText: string,
    rubricText: string,
  ) => {
    pushStep({
      phase: 'revenue-estimation',
      status: 'running',
      message: `Estimating revenue band for ${c.intake.clientName}…`,
    });
    try {
      const result = await runOnboardingRevenueEstimate(
        c.intake,
        comparablesText,
        rubricText,
      );
      updateCase(c.id, (prev) => ({ ...prev, revenueEstimate: result }));
      appendAuditEntry({
        timestamp: new Date().toISOString(),
        agent: 'Revenue Estimation Agent',
        phase: 'revenue-estimation',
        action: `Estimated band "${result.band}" with confidence ${(
          result.confidenceScore * 100
        ).toFixed(0)}% for ${c.intake.clientName}`,
        detail: result.rationale,
        citations: result.citations,
      });
      pushStep({
        phase: 'revenue-estimation',
        status: 'done',
        message: `Estimated ${result.band} (${(result.confidenceScore * 100).toFixed(0)}%) for ${c.intake.clientName}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Estimation failed';
      pushStep({
        phase: 'revenue-estimation',
        status: 'error',
        message: `Failed: ${c.intake.clientName} — ${message}`,
      });
    }
  }, []);

  const runEstimatesForMissing = useCallback(async () => {
    setLoadingAll(true);
    setError(null);
    setSteps([]);
    try {
      const [comparablesText, rubricText] = await Promise.all([
        loadClientProfiles(),
        loadRevenueBandingRubric(),
      ]);
      const targets = getAllCases().filter((c) => !c.revenueEstimate);
      // Run sequentially to avoid hammering the backend rate limit.
      for (const c of targets) {
        await estimateForCase(c, comparablesText, rubricText);
        refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run estimates';
      setError(message);
    } finally {
      setLoadingAll(false);
      refresh();
    }
  }, [refresh, estimateForCase]);

  // Auto-run on first mount if no cases have estimates yet.
  useEffect(() => {
    const anyMissing = getAllCases().some((c) => !c.revenueEstimate);
    if (anyMissing) {
      void runEstimatesForMissing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePinToggle = (caseId: string) => {
    updateCase(caseId, (c) => {
      const next = { ...c, pinnedToTop: !c.pinnedToTop };
      appendAuditEntry({
        timestamp: new Date().toISOString(),
        agent: 'Team Lead',
        phase: 'override',
        action: next.pinnedToTop
          ? `Pinned ${c.intake.clientName} to top of queue`
          : `Unpinned ${c.intake.clientName}`,
        detail: 'Manual ranking override',
      });
      return next;
    });
    refresh();
  };

  const bandedCount = cases.filter((c) => bandFor(c) !== null).length;

  return (
    <div className="onb-queue-root">
      <header className="onb-queue-header">
        <div className="onb-queue-header-inner">
          <div className="onb-queue-breadcrumb">
            <button className="onb-queue-link" onClick={() => navigate('/features')}>
              Demos
            </button>
            <span className="onb-queue-sep">›</span>
            <button className="onb-queue-link" onClick={() => navigate('/onboarding')}>
              Onboarding Intelligence
            </button>
            <span className="onb-queue-sep">›</span>
            <span className="onb-queue-current">Analyst queue</span>
          </div>
          <div className="onb-queue-title-row">
            <div>
              <h1 className="onb-queue-title">Analyst work queue</h1>
              <p className="onb-queue-subtitle">
                Ranked by estimated value × urgency. Pin a case to override the ranking — every
                override is captured in the audit trail.
              </p>
            </div>
            <div className="onb-queue-actions">
              <button
                className="onb-queue-btn"
                onClick={runEstimatesForMissing}
                disabled={loadingAll}
                type="button"
              >
                {loadingAll ? 'Estimating…' : 'Refresh missing estimates'}
              </button>
              <button
                className="onb-queue-btn onb-queue-btn--secondary"
                onClick={() => navigate('/onboarding/portfolio')}
                type="button"
              >
                Portfolio view
              </button>
            </div>
          </div>
          <div className="onb-queue-stats">
            <span>
              <strong>{cases.length}</strong> cases in queue
            </span>
            <span>
              <strong>{bandedCount}</strong> with revenue band
            </span>
            <span className="onb-queue-guardrail">Agent recommends — human decides</span>
          </div>
        </div>
      </header>

      <main className="onb-queue-main">
        {error && <div className="onb-queue-error">{error}</div>}
        <OnboardingCaseQueueTable
          cases={cases}
          loading={loadingAll}
          onPinToggle={handlePinToggle}
        />

        {steps.length > 0 && (
          <section className="onb-queue-timeline-section">
            <h2 className="onb-queue-h2">Agent activity</h2>
            <OnboardingAgentTimeline steps={steps} />
          </section>
        )}
      </main>
    </div>
  );
};

export default OnboardingQueueScreen;
