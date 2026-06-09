import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDoeStudy } from '../data/mockDoeData';
import {
  runDoePipeline,
  buildReportMarkdown,
  formatP,
  DOE_PIPELINE_STEPS,
  type DoePipelineStep,
  type DoeReport,
} from '../lib/mockDoeAi';
import type { DoeStudy } from '../types/doe';
import {
  MainEffectBarChart,
  ParetoChart,
  InteractionPlot,
  type InteractionDatum,
} from '../components/charts/DoeCharts';
import './DoeExperimentScreen.css';
import { buildReportPdf, collectChartImages } from '../lib/doePdf';

interface AuditItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
}

const round = (v: number, dp: number) => {
  const f = Math.pow(10, dp);
  return Math.round(v * f) / f;
};

/** Mean of the lead response across factorial runs at each (f1, f2) coded level. */
function computeInteractionData(
  study: DoeStudy,
  responseId: string,
  f1: string,
  f2: string,
): { data: InteractionDatum[]; seriesKeys: string[] } {
  const factor1 = study.factors.find((f) => f.id === f1)!;
  const factor2 = study.factors.find((f) => f.id === f2)!;
  const factorial = study.runs.filter((r) => !r.isCenterPoint);

  const meanAt = (v1: number, v2: number): number => {
    const sel = factorial.filter(
      (r) => (r as unknown as Record<string, number>)[f1] === v1 &&
        (r as unknown as Record<string, number>)[f2] === v2,
    );
    if (sel.length === 0) return 0;
    return round(
      sel.reduce((s, r) => s + (r as unknown as Record<string, number>)[responseId], 0) / sel.length,
      1,
    );
  };

  const lowKey = `${factor2.name} = ${factor2.low}${factor2.unit}`;
  const highKey = `${factor2.name} = ${factor2.high}${factor2.unit}`;

  const data: InteractionDatum[] = [
    {
      level: `${factor1.name} ${factor1.low}${factor1.unit}`,
      [lowKey]: meanAt(factor1.low, factor2.low),
      [highKey]: meanAt(factor1.low, factor2.high),
    },
    {
      level: `${factor1.name} ${factor1.high}${factor1.unit}`,
      [lowKey]: meanAt(factor1.high, factor2.low),
      [highKey]: meanAt(factor1.high, factor2.high),
    },
  ];
  return { data, seriesKeys: [lowKey, highKey] };
}

const DoeExperimentScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const study = id ? getDoeStudy(id) : undefined;

  const [steps, setSteps] = useState<DoePipelineStep[]>(
    DOE_PIPELINE_STEPS.map((s) => ({ ...s, status: 'pending' })),
  );
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<DoeReport | null>(null);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [approved, setApproved] = useState(false);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);

  const addAudit = (action: string, actor = 'DoE Report Assistant') => {
    setAudit((prev) => [
      ...prev,
      { id: `AUD-${Date.now()}-${prev.length}`, timestamp: new Date().toISOString(), actor, action },
    ]);
  };

  const handleRun = async () => {
    if (!study) return;
    setRunning(true);
    setReport(null);
    setEdited({});
    setApproved(false);
    setAudit([]);
    const result = await runDoePipeline(study, (s) => setSteps(s));
    setReport(result);
    setRunning(false);
    const flagged = result.claims.filter((c) => c.status === 'flagged').length;
    addAudit(`Pipeline run — ${result.sections.length} sections drafted from analysis.`);
    addAudit(`Fact-check — ${result.claims.length} claims checked, ${flagged} flagged and corrected.`);
    addAudit(`Completeness — readiness ${result.readinessScore}%.`);
  };

  const handleApprove = () => {
    setApproved(true);
    addAudit('Report reviewed and approved.', 'R&D Scientist (demo)');
  };

  const handleDownload = () => {
    if (!study || !report) return;
    const merged: DoeReport = {
      ...report,
      sections: report.sections.map((s) => ({ ...s, markdown: edited[s.id] ?? s.markdown })),
    };
    const md = buildReportMarkdown(study, merged);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${study.id}-DoE-report.md`;
    a.click();
    URL.revokeObjectURL(url);
    addAudit('Report downloaded (Markdown).', 'R&D Scientist (demo)');
  };

  const handleDownloadPdf = async () => {
    if (!study || !report) return;
    setGeneratingPdf(true);
    try {
      const merged: DoeReport = {
        ...report,
        sections: report.sections.map((s) => ({ ...s, markdown: edited[s.id] ?? s.markdown })),
      };
      const wrappers = chartsRef.current
        ? Array.from(chartsRef.current.querySelectorAll<HTMLElement>('.chart-wrapper'))
        : [];
      const charts = await collectChartImages(
        wrappers.map((el) => {
          const title = el.querySelector('.chart-title')?.textContent ?? '';
          return { title, el };
        }),
      );
      const doc = buildReportPdf(study, merged, charts);
      doc.save(`${study.id}-DoE-report.pdf`);
      addAudit('Report downloaded (PDF).', 'R&D Scientist (demo)');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const leadResponse = report
    ? report.analysis.responses.find((r) => r.responseId === report.analysis.leadResponseId)
    : undefined;

  const mainEffectData = useMemo(() => {
    if (!leadResponse) return [];
    return leadResponse.effects
      .filter((e) => e.type === 'main')
      .map((e) => ({ factor: e.label.split(' ')[0] + ` (${e.name})`, magnitude: round(e.absEffect, 1), significant: e.significant }));
  }, [leadResponse]);

  const paretoData = useMemo(() => {
    if (!leadResponse) return [];
    return leadResponse.effects.map((e) => ({
      term: e.name,
      magnitude: round(e.absEffect, 1),
      significant: e.significant,
    }));
  }, [leadResponse]);

  const interaction = useMemo(() => {
    if (!study || !leadResponse || study.runs.length === 0) return null;
    const strongest = leadResponse.effects.find((e) => e.type === 'interaction' && e.significant)
      ?? leadResponse.effects.find((e) => e.type === 'interaction');
    if (!strongest || strongest.factorIds.length !== 2) return null;
    const [f1, f2] = strongest.factorIds;
    return { ...computeInteractionData(study, leadResponse.responseId, f1, f2), label: strongest.label };
  }, [study, leadResponse]);

  if (!study) {
    return (
      <div className="doe-exp-not-found">
        <p>Study not found.</p>
        <button className="doe-btn-secondary" onClick={() => navigate('/doe/dashboard')}>Back to Studies</button>
      </div>
    );
  }

  const hasData = study.runs.length > 0;

  return (
    <div className="doe-exp-root">
      <header className="doe-exp-header">
        <div className="doe-exp-header-inner">
          <div className="doe-breadcrumb">
            <button className="doe-breadcrumb-link" onClick={() => navigate('/doe')}>Home</button>
            <span className="doe-breadcrumb-sep">›</span>
            <button className="doe-breadcrumb-link" onClick={() => navigate('/doe/dashboard')}>Studies</button>
            <span className="doe-breadcrumb-sep">›</span>
            <span className="doe-breadcrumb-current">{study.id}</span>
          </div>
        </div>
      </header>

      <div className="doe-exp-banner">
        ⚠️ AI-generated draft — requires scientist review and approval. All data is synthetic / sample data.
      </div>

      <main className="doe-exp-main">
        {/* Study metadata */}
        <section className="doe-card doe-meta-card">
          <div className="doe-meta-top">
            <div>
              <h1 className="doe-exp-title">{study.product}</h1>
              <div className="doe-exp-subid">{study.id} · {study.project} · {study.date} · {study.designControlRef}</div>
            </div>
            <span className="doe-badge doe-badge-ready">{approved ? 'Approved' : study.status}</span>
          </div>
          <div className="doe-meta-grid">
            <div className="doe-meta-item">
              <div className="doe-meta-label">Objective</div>
              <div className="doe-meta-value">{study.objective}</div>
            </div>
            <div className="doe-meta-item">
              <div className="doe-meta-label">Hypothesis</div>
              <div className="doe-meta-value">{study.hypothesis}</div>
            </div>
            <div className="doe-meta-item">
              <div className="doe-meta-label">Design</div>
              <div className="doe-meta-value">{study.designType}</div>
            </div>
          </div>
          <div className="doe-factor-chips">
            {study.factors.map((f) => (
              <span key={f.id} className="doe-chip">
                <strong>{f.id}</strong> {f.name}: {f.low}–{f.high} {f.unit}
              </span>
            ))}
          </div>
        </section>

        {/* Pipeline */}
        <section className="doe-card">
          <div className="doe-card-head">
            <h2 className="doe-card-title">AI pipeline</h2>
            {hasData && (
              <button className="doe-btn-primary" onClick={handleRun} disabled={running}>
                {running ? (<><span className="doe-spinner" /> Running…</>) : report ? 'Re-run pipeline' : '▶ Run AI pipeline'}
              </button>
            )}
          </div>
          {!hasData && (
            <p className="doe-empty-note">
              This study's dataset is not loaded in the demo. Open <strong>DOE-2026-ADH-014</strong> for the full walkthrough.
            </p>
          )}
          {hasData && (
            <div className="doe-pipeline">
              {steps.map((s, i) => (
                <div key={s.key} className={`doe-pipe-step doe-pipe-${s.status}`}>
                  <span className="doe-pipe-icon">
                    {s.status === 'running' && <span className="doe-spinner-sm" />}
                    {s.status === 'done' && '✓'}
                    {s.status === 'pending' && (i + 1)}
                    {s.status === 'error' && '✗'}
                  </span>
                  <div className="doe-pipe-text">
                    <div className="doe-pipe-name">{s.name}</div>
                    <div className="doe-pipe-desc">{s.detail ?? s.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {report && leadResponse && (
          <>
            {/* Charts */}
            <section className="doe-card">
              <div className="doe-card-head">
                <h2 className="doe-card-title">Effects — {leadResponse.responseLabel}</h2>
                <span className="doe-card-sub">Significant effects in black</span>
              </div>
              <div className="doe-charts-grid" ref={chartsRef}>
                <MainEffectBarChart data={mainEffectData} unit={leadResponse.unit} title="Main-effect magnitudes" className="doe-pdf-chart" />
                <ParetoChart data={paretoData} unit={leadResponse.unit} title="Pareto of factors & interactions" className="doe-pdf-chart" />
                {interaction && (
                  <InteractionPlot
                    data={interaction.data}
                    seriesKeys={interaction.seriesKeys}
                    unit={leadResponse.unit}
                    title={`Interaction: ${interaction.label}`}
                    className="doe-pdf-chart"
                  />
                )}
              </div>
            </section>

            {/* Data table */}
            <section className="doe-card">
              <div className="doe-card-head">
                <h2 className="doe-card-title">Experiment data</h2>
                <span className="doe-card-sub">{study.runs.length} runs · (C) center point · (R) replicate</span>
              </div>
              <div className="doe-data-table-wrap">
                <table className="doe-data-table">
                  <thead>
                    <tr>
                      <th>Run</th>
                      {study.factors.map((f) => <th key={f.id}>{f.id} ({f.unit})</th>)}
                      <th>Peel</th><th>Wear</th><th>Moisture</th><th>Skin</th><th>Leak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {study.runs.map((r) => (
                      <tr key={r.run} className={r.isCenterPoint ? 'doe-row-center' : r.replicateOf ? 'doe-row-rep' : ''}>
                        <td>{r.run}{r.isCenterPoint ? ' (C)' : r.replicateOf ? ' (R)' : ''}</td>
                        <td>{r.A}</td><td>{r.B}</td><td>{r.C}</td>
                        <td>{r.peelAdhesion_N_per_cm}</td>
                        <td>{r.wearTime_hours}</td>
                        <td>{r.moistureAbsorption_pct}</td>
                        <td>{r.skinStripping_score}</td>
                        <td>{r.leakageEvent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Statistics summary */}
            <section className="doe-card">
              <div className="doe-card-head">
                <h2 className="doe-card-title">Statistical analysis</h2>
                <span className="doe-card-sub">Effect = mean(High) − mean(Low), coded units</span>
              </div>
              {report.analysis.responses.map((resp) => (
                <div key={resp.responseId} className="doe-stat-block">
                  <div className="doe-stat-head">
                    {resp.responseLabel} <span className="doe-stat-meta">· {resp.method} · R² {round(resp.rSquared, 3)}{resp.errorDf ? ` · df ${resp.errorDf}` : ''}</span>
                  </div>
                  <table className="doe-stat-table">
                    <thead>
                      <tr><th>Term</th><th>Type</th><th className="doe-text-right">Effect</th><th className="doe-text-right">p-value</th><th>Sig.</th></tr>
                    </thead>
                    <tbody>
                      {resp.effects.map((e) => (
                        <tr key={e.name} className={e.significant ? 'doe-sig-row' : ''}>
                          <td><strong>{e.name}</strong></td>
                          <td className="doe-text-secondary">{e.type}</td>
                          <td className="doe-text-right">{round(e.effect, 2)}</td>
                          <td className="doe-text-right">{formatP(e.pValue)}</td>
                          <td>{e.significant ? <span className="doe-sig-yes">●</span> : <span className="doe-sig-no">○</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>

            {/* Fact-check */}
            <section className="doe-card">
              <div className="doe-card-head">
                <h2 className="doe-card-title">Grounding / fact-check</h2>
                <span className="doe-card-sub">
                  {report.claims.filter((c) => c.status === 'verified').length} verified ·
                  {' '}{report.claims.filter((c) => c.status === 'flagged').length} flagged &amp; corrected
                </span>
              </div>
              <div className="doe-claims">
                {report.claims.map((c) => (
                  <div key={c.id} className={`doe-claim doe-claim-${c.status}`}>
                    <span className="doe-claim-flag">{c.status === 'verified' ? '✓ Verified' : '✗ Flagged'}</span>
                    <div className="doe-claim-body">
                      <div className="doe-claim-metric">{c.metric}</div>
                      <div className="doe-claim-text">
                        Claimed <strong>{c.claimedValue}{c.unit ? ` ${c.unit}` : ''}</strong>,
                        computed <strong>{c.computedValue}{c.unit ? ` ${c.unit}` : ''}</strong>.
                      </div>
                      {c.status === 'flagged' && c.correctedText && (
                        <div className="doe-claim-correction">↳ Corrected to: “{c.correctedText}”</div>
                      )}
                      <div className="doe-claim-source">Source: {c.source}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Report */}
            <section className="doe-card">
              <div className="doe-card-head">
                <h2 className="doe-card-title">Generated report</h2>
                <div className="doe-card-actions">
                  <button className="doe-btn-secondary" onClick={() => setEditing((v) => !v)}>
                    {editing ? 'Done editing' : '✎ Edit'}
                  </button>
                  <button className="doe-btn-secondary" onClick={handleDownload}>⬇ Download report (Markdown)</button>
                  <button className="doe-btn-secondary" onClick={handleDownloadPdf} disabled={generatingPdf}>
                    {generatingPdf ? (<><span className="doe-spinner" /> Generating…</>) : '⬇ Download report (PDF)'}
                  </button>
                  <button className="doe-btn-primary" onClick={handleApprove} disabled={approved}>
                    {approved ? '✓ Approved' : 'Approve'}
                  </button>
                </div>
              </div>
              {report.sections.map((s, i) => (
                <div key={s.id} className="doe-report-section">
                  <h3 className="doe-report-section-title">{i + 1}. {s.title}</h3>
                  {editing ? (
                    <textarea
                      className="doe-report-edit"
                      value={edited[s.id] ?? s.markdown}
                      onChange={(e) => setEdited((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      rows={Math.min(14, Math.max(3, (edited[s.id] ?? s.markdown).split('\n').length + 1))}
                    />
                  ) : (
                    <pre className="doe-report-md">{edited[s.id] ?? s.markdown}</pre>
                  )}
                </div>
              ))}
            </section>

            {/* Completeness */}
            <section className="doe-card">
              <div className="doe-card-head">
                <h2 className="doe-card-title">Completeness — Definition of Good</h2>
                <span className="doe-card-sub">Readiness {report.readinessScore}%</span>
              </div>
              <ul className="doe-checklist">
                {report.completeness.map((c) => (
                  <li key={c.item.id} className={c.satisfied ? 'doe-check-ok' : 'doe-check-gap'}>
                    <span className="doe-check-icon">{c.satisfied ? '✓' : '!'}</span>
                    <div>
                      <div className="doe-check-label">{c.item.label}</div>
                      <div className="doe-check-note">{c.note}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Knowledge */}
            <section className="doe-card">
              <div className="doe-card-head">
                <h2 className="doe-card-title">Knowledge — relevant prior experiments</h2>
              </div>
              <div className="doe-knowledge">
                {report.knowledge.map((k) => (
                  <div key={k.report.id} className="doe-know-item">
                    <div className="doe-know-head">
                      <span className="doe-know-id">{k.report.id}</span>
                      <span className="doe-know-rel">{Math.round(k.relevance * 100)}% match</span>
                    </div>
                    <div className="doe-know-title">{k.report.title} ({k.report.year})</div>
                    <div className="doe-know-summary">{k.report.summary}</div>
                    <div className="doe-know-takeaway">→ {k.report.takeaway}</div>
                    <div className="doe-know-reason">{k.reason}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Audit trail */}
            <section className="doe-card">
              <div className="doe-card-head">
                <h2 className="doe-card-title">Audit trail</h2>
              </div>
              <ul className="doe-audit">
                {audit.map((a) => (
                  <li key={a.id} className="doe-audit-item">
                    <span className="doe-audit-time">{new Date(a.timestamp).toLocaleTimeString()}</span>
                    <span className="doe-audit-actor">{a.actor}</span>
                    <span className="doe-audit-action">{a.action}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default DoeExperimentScreen;
