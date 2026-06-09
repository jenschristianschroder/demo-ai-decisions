import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getDoeStudies,
  getDoeStudy,
  getPrimaryDoeStudy,
} from '../data/mockDoeData';
import { getDoeTemplate } from '../data/doeTemplate';
import { getDoeDefinitionOfGood } from '../data/doeDefinitionOfGood';
import { getDoePriorReports } from '../data/doePriorReports';
import type { DoeStudy } from '../types/doe';
import './DoeDataScreen.css';

const goalLabel = (goal: string): string => {
  switch (goal) {
    case 'maximize': return 'Maximize';
    case 'minimize': return 'Minimize';
    case 'target': return 'Hit target';
    default: return goal;
  }
};

/** Trigger a client-side download of a text blob. */
const downloadFile = (filename: string, content: string, mime: string): void => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** Escape a value for safe inclusion in a CSV cell. */
const csvCell = (value: string | number): string => {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

/** Serialize the runs of a study to CSV using factor + response definitions for headers. */
const buildRunsCsv = (study: DoeStudy): string => {
  const factorHeaders = study.factors.map((f) => `${f.id} (${f.name}, ${f.unit})`);
  const responseHeaders = study.responses.map((r) => `${r.label} (${r.unit})`);
  const header = ['run', 'type', ...factorHeaders, ...responseHeaders];
  const rows = study.runs.map((r) => {
    const type = r.isCenterPoint ? 'center' : r.replicateOf ? `replicate of ${r.replicateOf}` : 'factorial';
    const factorValues = study.factors.map((f) => (r as unknown as Record<string, number>)[f.id]);
    const responseValues = study.responses.map((resp) => (r as unknown as Record<string, number>)[resp.id]);
    return [r.run, type, ...factorValues, ...responseValues];
  });
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
};

const DoeDataScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const studies = getDoeStudies();
  const study = useMemo<DoeStudy>(
    () => (id ? getDoeStudy(id) : undefined) ?? getPrimaryDoeStudy(),
    [id],
  );

  const template = getDoeTemplate();
  const definitionOfGood = getDoeDefinitionOfGood();
  const priorReports = getDoePriorReports();

  const handleSelect = (studyId: string) => {
    navigate(`/doe/data/${studyId}`);
  };

  const handleDownloadCsv = () => {
    downloadFile(`${study.id}-runs.csv`, buildRunsCsv(study), 'text/csv;charset=utf-8');
  };

  const handleDownloadJson = () => {
    downloadFile(`${study.id}.json`, JSON.stringify(study, null, 2), 'application/json');
  };

  const centerPoints = study.runs.filter((r) => r.isCenterPoint).length;
  const replicates = study.runs.filter((r) => r.replicateOf).length;

  return (
    <div className="doe-data-root">
      <header className="doe-data-header">
        <div className="doe-data-header-inner">
          <div className="doe-breadcrumb">
            <button className="doe-breadcrumb-link" onClick={() => navigate('/doe')}>Home</button>
            <span className="doe-breadcrumb-sep">›</span>
            <button className="doe-breadcrumb-link" onClick={() => navigate('/doe/dashboard')}>Studies</button>
            <span className="doe-breadcrumb-sep">›</span>
            <span className="doe-breadcrumb-current">Demo data</span>
          </div>
          <h1 className="doe-data-title">Demo data — what the scientist provides</h1>
          <p className="doe-data-subtitle">
            This is the raw experiment data fed into the DoE Report Assistant before any AI runs.
            All values are <strong>synthetic / sample data</strong> for demonstration only.
          </p>
        </div>
      </header>

      <main className="doe-data-main">
        {/* Study selector */}
        <section className="doe-card">
          <div className="doe-card-head">
            <h2 className="doe-card-title">Select a study</h2>
            <span className="doe-card-sub">{studies.length} studies in the demo programme</span>
          </div>
          <div className="doe-data-selector">
            {studies.map((s) => (
              <button
                key={s.id}
                className={`doe-data-study-pill${s.id === study.id ? ' doe-data-study-pill--active' : ''}`}
                onClick={() => handleSelect(s.id)}
              >
                <span className="doe-data-pill-id">{s.id}</span>
                <span className="doe-data-pill-name">{s.product}</span>
                <span className="doe-data-pill-meta">
                  {s.factors.length} factors · {s.runs.length || '—'} runs
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Study context */}
        <section className="doe-card doe-meta-card">
          <div className="doe-meta-top">
            <div>
              <h2 className="doe-data-study-title">{study.product}</h2>
              <div className="doe-data-study-subid">
                {study.id} · {study.project} · {study.date} · {study.designControlRef}
              </div>
            </div>
            <span className="doe-badge doe-badge-ready">{study.status}</span>
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
              <div className="doe-meta-label">Background</div>
              <div className="doe-meta-value">{study.background}</div>
            </div>
            <div className="doe-meta-item">
              <div className="doe-meta-label">Design</div>
              <div className="doe-meta-value">{study.designType}</div>
            </div>
          </div>
        </section>

        {/* Factors */}
        <section className="doe-card">
          <div className="doe-card-head">
            <h2 className="doe-card-title">Factors</h2>
            <span className="doe-card-sub">Controllable inputs and their levels</span>
          </div>
          <div className="doe-data-table-wrap">
            <table className="doe-data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Unit</th>
                  <th className="doe-text-right">Low</th>
                  <th className="doe-text-right">Center</th>
                  <th className="doe-text-right">High</th>
                </tr>
              </thead>
              <tbody>
                {study.factors.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.id}</strong></td>
                    <td>{f.name}</td>
                    <td>{f.unit}</td>
                    <td className="doe-text-right">{f.low}</td>
                    <td className="doe-text-right">{f.center}</td>
                    <td className="doe-text-right">{f.high}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Responses */}
        <section className="doe-card">
          <div className="doe-card-head">
            <h2 className="doe-card-title">Responses</h2>
            <span className="doe-card-sub">Measured outputs and acceptance goals</span>
          </div>
          <div className="doe-data-table-wrap">
            <table className="doe-data-table">
              <thead>
                <tr>
                  <th>Response</th>
                  <th>Unit</th>
                  <th>Goal</th>
                  <th className="doe-text-right">Target</th>
                  <th>Direction</th>
                </tr>
              </thead>
              <tbody>
                {study.responses.map((r) => (
                  <tr key={r.id}>
                    <td>{r.label}</td>
                    <td>{r.unit}</td>
                    <td>{goalLabel(r.goal)}</td>
                    <td className="doe-text-right">{r.target ?? '—'}</td>
                    <td className="doe-text-secondary">{r.direction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Runs */}
        <section className="doe-card">
          <div className="doe-card-head">
            <div>
              <h2 className="doe-card-title">Experiment runs</h2>
              <span className="doe-card-sub">
                {study.runs.length || '—'} runs · {centerPoints} center points · {replicates} replicates ·
                {' '}(C) center point · (R) replicate
              </span>
            </div>
            {study.runs.length > 0 && (
              <div className="doe-data-actions">
                <button className="doe-data-download-btn" onClick={handleDownloadCsv}>⬇ CSV</button>
                <button className="doe-data-download-btn" onClick={handleDownloadJson}>⬇ JSON</button>
              </div>
            )}
          </div>
          {study.runs.length > 0 ? (
            <div className="doe-data-table-wrap">
              <table className="doe-data-table">
                <thead>
                  <tr>
                    <th>Run</th>
                    {study.factors.map((f) => (
                      <th key={f.id} className="doe-text-right">{f.id} ({f.unit})</th>
                    ))}
                    {study.responses.map((r) => (
                      <th key={r.id} className="doe-text-right">{r.label} ({r.unit})</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {study.runs.map((r) => (
                    <tr key={r.run} className={r.isCenterPoint ? 'doe-row-center' : r.replicateOf ? 'doe-row-rep' : ''}>
                      <td>{r.run}{r.isCenterPoint ? ' (C)' : r.replicateOf ? ' (R)' : ''}</td>
                      {study.factors.map((f) => (
                        <td key={f.id} className="doe-text-right">
                          {(r as unknown as Record<string, number>)[f.id]}
                        </td>
                      ))}
                      {study.responses.map((resp) => (
                        <td key={resp.id} className="doe-text-right">
                          {(r as unknown as Record<string, number>)[resp.id]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="doe-data-empty">
              This illustrative study has no run-level data loaded in the demo. Select
              {' '}<strong>DOE-2026-ADH-014</strong> to see the full walkthrough dataset.
            </p>
          )}
        </section>

        {/* Reference inputs the AI is grounded in */}
        <section className="doe-card">
          <div className="doe-card-head">
            <h2 className="doe-card-title">Reference inputs (what the AI is grounded in)</h2>
            <span className="doe-card-sub">Shared across all studies — template, quality bar, and prior reports</span>
          </div>

          <h3 className="doe-data-ref-title">Report template — {template.length} sections</h3>
          <div className="doe-data-table-wrap">
            <table className="doe-data-table">
              <thead>
                <tr><th>#</th><th>Section</th><th>Guidance</th></tr>
              </thead>
              <tbody>
                {template.map((t, i) => (
                  <tr key={t.id}>
                    <td>{i + 1}</td>
                    <td>{t.title}</td>
                    <td className="doe-text-secondary doe-data-cell-wrap">{t.guidance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="doe-data-ref-title">Definition of Good — {definitionOfGood.length} checks</h3>
          <ul className="doe-data-checklist">
            {definitionOfGood.map((c) => (
              <li key={c.id}>{c.label}</li>
            ))}
          </ul>

          <h3 className="doe-data-ref-title">Prior reports — {priorReports.length} references</h3>
          <div className="doe-data-prior-list">
            {priorReports.map((p) => (
              <div key={p.id} className="doe-data-prior-card">
                <div className="doe-data-prior-head">
                  <span className="doe-data-prior-id">{p.id}</span>
                  <span className="doe-data-prior-year">{p.year}</span>
                </div>
                <div className="doe-data-prior-title">{p.title}</div>
                <p className="doe-data-prior-summary">{p.summary}</p>
                <p className="doe-data-prior-takeaway"><strong>Takeaway:</strong> {p.takeaway}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="doe-data-footer-actions">
          <button className="doe-data-cta" onClick={() => navigate(`/doe/experiment/${study.id}`)}>
            Open Report Assistant for this study →
          </button>
        </div>
      </main>
    </div>
  );
};

export default DoeDataScreen;
