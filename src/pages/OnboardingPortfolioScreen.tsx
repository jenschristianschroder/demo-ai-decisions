import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCases } from '../data/mockOnboardingData';
import {
  loadOnboardingProcess,
  loadStepTimings,
  type StepTimingsDoc,
} from '../lib/onboardingDataLoader';
import { runOnboardingPortfolioInsights } from '../lib/onboardingAi';
import type {
  OnboardingStepId,
  PortfolioInsight,
  StepCycleTime,
} from '../types/onboarding';
import OnboardingPortfolioCycleTime from '../components/onboarding/OnboardingPortfolioCycleTime';
import OnboardingPatternInsights from '../components/onboarding/OnboardingPatternInsights';
import './OnboardingPortfolioScreen.css';

const STEP_ORDER: OnboardingStepId[] = [
  'intake',
  'kyc',
  'aml',
  'tech-integration',
  'signatory-verification',
  'product-configuration',
  'go-live',
];

function buildStepCycleData(timings: StepTimingsDoc | null): StepCycleTime[] {
  if (!timings) return [];
  const cases = getAllCases();
  return STEP_ORDER.map((step) => {
    const base = timings.baseline[step];
    return {
      step,
      medianDays: base?.medianDays ?? 0,
      p90Days: base?.p90Days ?? 0,
      inFlight: cases.filter((c) => c.currentStep === step).length,
    };
  });
}

const OnboardingPortfolioScreen: React.FC = () => {
  const navigate = useNavigate();
  const [timings, setTimings] = useState<StepTimingsDoc | null>(null);
  const [insights, setInsights] = useState<PortfolioInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cases = getAllCases();

  const kpis = useMemo(() => {
    const inFlight = cases.filter((c) => c.status !== 'live').length;
    const blocked = cases.filter((c) => c.status === 'blocked').length;
    const endToEndMedian = timings?.endToEndMedianDays ?? null;
    const upcomingGoLives = cases.filter((c) => {
      const w = c.durationEstimate?.expectedGoLiveStart;
      if (!w) return false;
      const start = new Date(w).getTime();
      const now = Date.now();
      return start - now < 30 * 24 * 3600_000 && start - now > -30 * 24 * 3600_000;
    }).length;
    return { inFlight, blocked, endToEndMedian, upcomingGoLives };
  }, [cases, timings]);

  useEffect(() => {
    void (async () => {
      const t = await loadStepTimings();
      setTimings(t);
    })();
  }, []);

  const runInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const [processText, stepTimings] = await Promise.all([
        loadOnboardingProcess(),
        loadStepTimings(),
      ]);
      if (!stepTimings) throw new Error('Step timings unavailable');
      const snapshots = cases.map((c) => ({
        id: c.id,
        currentStep: c.currentStep,
        status: c.status,
        enteredCurrentStepOn: c.enteredCurrentStepOn,
        productMix: c.intake.productMix,
        corridors: c.intake.corridors,
        clientType: c.intake.clientType,
      }));
      const result = await runOnboardingPortfolioInsights(
        snapshots,
        processText,
        stepTimings,
      );
      setInsights(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Portfolio analysis failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const stepData = buildStepCycleData(timings);

  const handleInsightClick = (ins: PortfolioInsight) => {
    if (ins.sourceCases.length === 1) {
      navigate(`/onboarding/case/${ins.sourceCases[0]}`);
    } else {
      // Multi-case insight — go to queue (could filter in a future iteration).
      navigate('/onboarding/queue');
    }
  };

  return (
    <div className="onb-portfolio-root">
      <header className="onb-portfolio-header">
        <div className="onb-portfolio-header-inner">
          <div className="onb-portfolio-breadcrumb">
            <button className="onb-portfolio-link" onClick={() => navigate('/features')}>
              Demos
            </button>
            <span className="onb-portfolio-sep">›</span>
            <button className="onb-portfolio-link" onClick={() => navigate('/onboarding')}>
              Onboarding Intelligence
            </button>
            <span className="onb-portfolio-sep">›</span>
            <span className="onb-portfolio-current">Head of Onboarding</span>
          </div>
          <div className="onb-portfolio-title-row">
            <div>
              <h1 className="onb-portfolio-title">Portfolio dashboard</h1>
              <p className="onb-portfolio-subtitle">
                Aggregate cycle time, structural bottlenecks, and patterns surfaced by the Duration
                & Bottleneck Agent. The agent surfaces and explains — it never reassigns work.
              </p>
            </div>
            <div className="onb-portfolio-actions">
              <button
                className="onb-portfolio-btn"
                onClick={runInsights}
                disabled={loading}
                type="button"
              >
                {loading ? 'Scanning…' : 'Run portfolio analysis'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="onb-portfolio-main">
        <section className="onb-portfolio-kpis">
          <div className="onb-portfolio-kpi">
            <span className="onb-portfolio-kpi-label">In flight</span>
            <span className="onb-portfolio-kpi-value">{kpis.inFlight}</span>
          </div>
          <div className="onb-portfolio-kpi">
            <span className="onb-portfolio-kpi-label">Blocked</span>
            <span className="onb-portfolio-kpi-value">{kpis.blocked}</span>
          </div>
          <div className="onb-portfolio-kpi">
            <span className="onb-portfolio-kpi-label">End-to-end median</span>
            <span className="onb-portfolio-kpi-value">
              {kpis.endToEndMedian != null ? `${kpis.endToEndMedian} d` : '—'}
            </span>
          </div>
          <div className="onb-portfolio-kpi">
            <span className="onb-portfolio-kpi-label">Go-lives in next 30 days</span>
            <span className="onb-portfolio-kpi-value">{kpis.upcomingGoLives}</span>
          </div>
        </section>

        {error && <div className="onb-portfolio-error">{error}</div>}

        <section className="onb-portfolio-cycle-section">
          <OnboardingPortfolioCycleTime data={stepData} />
        </section>

        <section className="onb-portfolio-insights-section">
          <h2 className="onb-portfolio-h2">Agent-surfaced patterns</h2>
          <OnboardingPatternInsights
            insights={insights}
            loading={loading}
            onSelectInsight={handleInsightClick}
          />
        </section>
      </main>
    </div>
  );
};

export default OnboardingPortfolioScreen;
