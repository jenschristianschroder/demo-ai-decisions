import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UploadResult } from '../types/finance';
import SampleDataModal from '../components/SampleDataModal';
import './UploadScreen.css';

const mockResult: UploadResult = {
  filesValidated: 1,
  entitiesProcessed: 12,
  anomaliesDetected: 25,
  highPriorityAnomalies: 5,
  weakCommentaryItems: 7,
  intercompanyBreaks: 2,
};

const UploadScreen: React.FC = () => {
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [previewFile, setPreviewFile] = useState<{ fileName: string; label: string } | null>(null);

  const handleProcess = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setResult(mockResult);
    }, 2200);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  return (
    <div className="upload-root">
      <header className="upload-header">
        <div className="upload-header-inner">
          <div className="breadcrumb">
            <button className="breadcrumb-link" onClick={() => navigate('/finance-anomaly-demo')}>Home</button>
            <span className="breadcrumb-sep">›</span>
            <button className="breadcrumb-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Upload Data</span>
          </div>
          <h1 className="upload-title">Upload Subsidiary Data</h1>
        </div>
      </header>

      <main className="upload-main">
        <div className="upload-card">
          <div
            className={`drop-zone${dragging ? ' drop-zone--active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="drop-icon">📁</div>
            <div className="drop-title">Drag & drop submission files here</div>
            <div className="drop-subtitle">Supports Excel (.xlsx), CSV, or JSON — up to 50MB per file</div>
            <div className="drop-hint">Or use the demo data already loaded for March 2026</div>
          </div>

          <div className="upload-info">
            <div className="upload-info-item">
              <span className="upload-info-label">Expected format</span>
              <span className="upload-info-value">Group Finance Template v3.2</span>
            </div>
            <div className="upload-info-item">
              <span className="upload-info-label">Period</span>
              <span className="upload-info-value">March 2026</span>
            </div>
            <div className="upload-info-item">
              <span className="upload-info-label">Entities in scope</span>
              <span className="upload-info-value">12</span>
            </div>
          </div>

          <div className="template-section">
            <div className="template-header">
              <span className="template-icon">📄</span>
              <div>
                <div className="template-title">Submission Template</div>
                <div className="template-desc">Download the CSV template to see the required column format for uploading data.</div>
              </div>
            </div>
            <a
              className="btn-download"
              href="/submission-template.csv"
              download="submission-template.csv"
            >
              ⬇ Download Template
            </a>
          </div>

          <div className="template-section">
            <div className="template-header">
              <span className="template-icon">📊</span>
              <div>
                <div className="template-title">Sample Datasets</div>
                <div className="template-desc">View or download sample submission files to understand the expected data format.</div>
              </div>
            </div>
            <div className="sample-list">
              <div className="sample-item">
                <span className="sample-name">DE01 — Germany Operations GmbH</span>
                <span className="sample-actions">
                  <button className="sample-link" onClick={() => setPreviewFile({ fileName: 'sample-submission-DE01.csv', label: 'DE01 — Germany Operations GmbH' })}>View</button>
                  <a className="sample-link" href="/sample-submission-DE01.csv" download="sample-submission-DE01.csv">Download</a>
                </span>
              </div>
              <div className="sample-item">
                <span className="sample-name">FR01 — France Operations SAS</span>
                <span className="sample-actions">
                  <button className="sample-link" onClick={() => setPreviewFile({ fileName: 'sample-submission-FR01.csv', label: 'FR01 — France Operations SAS' })}>View</button>
                  <a className="sample-link" href="/sample-submission-FR01.csv" download="sample-submission-FR01.csv">Download</a>
                </span>
              </div>
              <div className="sample-item">
                <span className="sample-name">UK01 — UK Operations Ltd</span>
                <span className="sample-actions">
                  <button className="sample-link" onClick={() => setPreviewFile({ fileName: 'sample-submission-UK01.csv', label: 'UK01 — UK Operations Ltd' })}>View</button>
                  <a className="sample-link" href="/sample-submission-UK01.csv" download="sample-submission-UK01.csv">Download</a>
                </span>
              </div>
            </div>
          </div>

          {!result && (
            <button
              className="btn-process"
              onClick={handleProcess}
              disabled={processing}
            >
              {processing ? (
                <span className="processing-text">
                  <span className="processing-spinner" /> Processing…
                </span>
              ) : (
                'Process Submission Data'
              )}
            </button>
          )}

          {result && (
            <div className="upload-results results-panel">
              <div className="results-header">
                <span className="results-icon">✅</span>
                <span className="results-title">Processing complete</span>
              </div>
              <div className="results-grid">
                <div className="result-item">
                  <div className="result-value">{result.filesValidated}</div>
                  <div className="result-label">Files Validated</div>
                </div>
                <div className="result-item">
                  <div className="result-value">{result.entitiesProcessed}</div>
                  <div className="result-label">Entities Processed</div>
                </div>
                <div className="result-item result-item--alert">
                  <div className="result-value">{result.anomaliesDetected}</div>
                  <div className="result-label">Anomalies Detected</div>
                </div>
                <div className="result-item result-item--high">
                  <div className="result-value">{result.highPriorityAnomalies}</div>
                  <div className="result-label">High Priority</div>
                </div>
                <div className="result-item">
                  <div className="result-value">{result.weakCommentaryItems}</div>
                  <div className="result-label">Weak Commentary</div>
                </div>
                <div className="result-item">
                  <div className="result-value">{result.intercompanyBreaks}</div>
                  <div className="result-label">IC Breaks</div>
                </div>
              </div>
              <button className="btn-process" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>

      {previewFile && (
        <SampleDataModal
          fileName={previewFile.fileName}
          label={previewFile.label}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

export default UploadScreen;
