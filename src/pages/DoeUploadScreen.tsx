import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPrimaryDoeStudy } from '../data/mockDoeData';
import './DoeUploadScreen.css';

interface DoeUploadResult {
  runsValidated: number;
  factorsDetected: number;
  responsesDetected: number;
  centerPoints: number;
  replicates: number;
}

const ACCEPTED_EXTENSIONS = ['.csv', '.json', '.xlsx'];

const DoeUploadScreen: React.FC = () => {
  const navigate = useNavigate();
  const study = getPrimaryDoeStudy();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<DoeUploadResult | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const isValidFile = (file: File): boolean =>
    ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const valid = Array.from(files).filter(isValidFile);
    if (valid.length > 0) setSelectedFiles(valid);
  };

  const handleProcess = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setResult({
        runsValidated: study.runs.length,
        factorsDetected: study.factors.length,
        responsesDetected: study.responses.length,
        centerPoints: study.runs.filter((r) => r.isCenterPoint).length,
        replicates: study.runs.filter((r) => r.replicateOf).length,
      });
    }, 1800);
  };

  return (
    <div className="doe-upload-root">
      <header className="doe-upload-header">
        <div className="doe-upload-header-inner">
          <div className="doe-breadcrumb">
            <button className="doe-breadcrumb-link" onClick={() => navigate('/doe')}>Home</button>
            <span className="doe-breadcrumb-sep">›</span>
            <button className="doe-breadcrumb-link" onClick={() => navigate('/doe/dashboard')}>Studies</button>
            <span className="doe-breadcrumb-sep">›</span>
            <span className="doe-breadcrumb-current">Upload Dataset</span>
          </div>
          <h1 className="doe-upload-title">Upload Experiment Dataset</h1>
        </div>
      </header>

      <main className="doe-upload-main">
        <div className="doe-upload-card">
          <div
            className={`doe-drop-zone${dragging ? ' doe-drop-zone--active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="doe-drop-input"
              accept=".csv,.json,.xlsx"
              multiple
              onChange={(e) => { handleFiles(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            />
            <div className="doe-drop-icon">🧪</div>
            {selectedFiles.length > 0 ? (
              <>
                <div className="doe-drop-title">
                  {selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files selected`}
                </div>
                <div className="doe-drop-subtitle">Click or drop to replace</div>
              </>
            ) : (
              <>
                <div className="doe-drop-title">Drag &amp; drop a DoE dataset here</div>
                <div className="doe-drop-subtitle">CSV, JSON, or Excel with one row per run (factor settings + responses)</div>
                <div className="doe-drop-hint">Or continue with the sample dataset already loaded (DOE-2026-ADH-014)</div>
                <button
                  type="button"
                  className="doe-drop-preview-link"
                  onClick={(e) => { e.stopPropagation(); navigate(`/doe/data/${study.id}`); }}
                >
                  Preview this dataset →
                </button>
              </>
            )}
          </div>

          <div className="doe-upload-info">
            <div className="doe-upload-info-item">
              <span className="doe-upload-info-label">Expected schema</span>
              <span className="doe-upload-info-value">run, A, B, C, peel, wear, moisture, skinStripping, leakage</span>
            </div>
            <div className="doe-upload-info-item">
              <span className="doe-upload-info-label">Design</span>
              <span className="doe-upload-info-value">{study.designType}</span>
            </div>
          </div>

          <p className="doe-upload-note">
            This is a mock upload. No file is sent anywhere — the demo always analyzes the synthetic sample dataset.
          </p>

          {!result && (
            <button className="doe-upload-process" onClick={handleProcess} disabled={processing}>
              {processing ? (<span className="doe-processing"><span className="doe-processing-spinner" /> Validating…</span>) : 'Validate &amp; Analyze Dataset'}
            </button>
          )}

          {result && (
            <div className="doe-upload-results">
              <div className="doe-results-header">
                <span className="doe-results-icon">✅</span>
                <span className="doe-results-title">Dataset validated</span>
              </div>
              <div className="doe-results-grid">
                <div className="doe-result-item"><div className="doe-result-value">{result.runsValidated}</div><div className="doe-result-label">Runs</div></div>
                <div className="doe-result-item"><div className="doe-result-value">{result.factorsDetected}</div><div className="doe-result-label">Factors</div></div>
                <div className="doe-result-item"><div className="doe-result-value">{result.responsesDetected}</div><div className="doe-result-label">Responses</div></div>
                <div className="doe-result-item"><div className="doe-result-value">{result.centerPoints}</div><div className="doe-result-label">Center pts</div></div>
                <div className="doe-result-item"><div className="doe-result-value">{result.replicates}</div><div className="doe-result-label">Replicates</div></div>
              </div>
              <button className="doe-upload-process" onClick={() => navigate(`/doe/experiment/${study.id}`)}>
                Open Report Assistant
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoeUploadScreen;
