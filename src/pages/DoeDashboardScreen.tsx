import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoeStudies } from '../data/mockDoeData';
import type { DoeStudyStatus } from '../types/doe';
import './DoeDashboardScreen.css';

const statusClass = (status: DoeStudyStatus): string => {
  switch (status) {
    case 'Approved': return 'doe-badge-approved';
    case 'Ready for review': return 'doe-badge-ready';
    case 'Analysis complete': return 'doe-badge-analysis';
    default: return 'doe-badge-draft';
  }
};

const readinessColor = (score: number): string => {
  if (score >= 80) return '#15803d';
  if (score >= 55) return '#d97706';
  return '#b91c1c';
};

const DoeDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const studies = getDoeStudies();

  const ready = studies.filter((s) => s.status === 'Ready for review' || s.status === 'Approved').length;
  const avgReadiness = Math.round(
    studies.reduce((sum, s) => sum + s.reportReadiness, 0) / studies.length,
  );

  return (
    <div className="doe-dash-root">
      <header className="doe-dash-header">
        <div className="doe-dash-header-inner">
          <div className="doe-breadcrumb">
            <button className="doe-breadcrumb-link" onClick={() => navigate('/doe')}>Home</button>
            <span className="doe-breadcrumb-sep">›</span>
            <span className="doe-breadcrumb-current">DoE Studies</span>
          </div>
          <div className="doe-dash-title-row">
            <div>
              <h1 className="doe-dash-title">R&amp;D DoE Studies</h1>
              <div className="doe-dash-period">Baseplate Gen-3 programme · synthetic sample data</div>
            </div>
            <button className="doe-btn-header-action" onClick={() => navigate('/doe/upload')}>
              Upload New Dataset
            </button>
          </div>
        </div>
      </header>

      <main className="doe-dash-main">
        <div className="doe-summary-cards">
          <div className="doe-summary-card">
            <div className="doe-summary-card-value">{studies.length}</div>
            <div className="doe-summary-card-label">Studies</div>
            <div className="doe-summary-card-sub">In the programme</div>
          </div>
          <div className="doe-summary-card">
            <div className="doe-summary-card-value">{ready}</div>
            <div className="doe-summary-card-label">Ready / approved</div>
            <div className="doe-summary-card-sub">Reports advanced</div>
          </div>
          <div className="doe-summary-card">
            <div className="doe-summary-card-value">{avgReadiness}%</div>
            <div className="doe-summary-card-label">Avg readiness</div>
            <div className="doe-summary-card-sub">Across studies</div>
          </div>
        </div>

        <div className="doe-section-header">
          <h2 className="doe-section-title">Studies</h2>
          <span className="doe-section-subtitle">Click a study to open the report assistant</span>
        </div>

        <div className="doe-table-wrap">
          <table className="doe-table">
            <thead>
              <tr>
                <th>Study</th>
                <th>Status</th>
                <th className="doe-text-right">Factors</th>
                <th className="doe-text-right">Runs</th>
                <th>Top factor</th>
                <th className="doe-text-right">Report readiness</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {studies.map((s) => (
                <tr
                  key={s.id}
                  className="doe-row"
                  onClick={() => navigate(`/doe/experiment/${s.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/doe/experiment/${s.id}`); } }}
                >
                  <td>
                    <div className="doe-study-cell">
                      <span className="doe-study-id">{s.id}</span>
                      <span className="doe-study-name">{s.product}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`doe-badge ${statusClass(s.status)}`}>{s.status}</span>
                  </td>
                  <td className="doe-text-right">{s.factors.length}</td>
                  <td className="doe-text-right">{s.runs.length || '—'}</td>
                  <td className="doe-text-secondary">{s.topFactor}</td>
                  <td className="doe-text-right">
                    <div className="doe-readiness-cell">
                      <div className="doe-readiness-bar-bg">
                        <div
                          className="doe-readiness-bar-fill"
                          style={{ width: `${s.reportReadiness}%`, background: readinessColor(s.reportReadiness) }}
                        />
                      </div>
                      <span className="doe-readiness-num">{s.reportReadiness}%</span>
                    </div>
                  </td>
                  <td className="doe-text-right">
                    <button
                      className="doe-view-data-btn"
                      onClick={(e) => { e.stopPropagation(); navigate(`/doe/data/${s.id}`); }}
                    >
                      View data
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="doe-dash-note">
          The primary walkthrough is <strong>DOE-2026-ADH-014</strong>. Other studies are illustrative
          dashboard rows. All data is synthetic / sample data for demonstration only.
        </p>
      </main>
    </div>
  );
};

export default DoeDashboardScreen;
