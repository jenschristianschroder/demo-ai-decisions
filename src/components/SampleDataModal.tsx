import React, { useEffect, useState } from 'react';
import './SampleDataModal.css';

interface SampleDataModalProps {
  fileName: string;
  label: string;
  onClose: () => void;
}

function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split('\n')
    .map((line) => line.split(','));
}

const SampleDataModal: React.FC<SampleDataModalProps> = ({ fileName, label, onClose }) => {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/${fileName}`)
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.text();
      })
      .then((text) => setRows(parseCsv(text)))
      .catch(() => setError(true));
  }, [fileName]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const headers = rows?.[0] ?? [];
  const dataRows = rows?.slice(1) ?? [];

  return (
    <div className="sdm-overlay" onClick={handleOverlayClick}>
      <div className="sdm-dialog" role="dialog" aria-label={`Preview ${label}`}>
        <div className="sdm-header">
          <div>
            <div className="sdm-title">{label}</div>
            <div className="sdm-subtitle">{fileName}</div>
          </div>
          <div className="sdm-header-actions">
            <a
              className="sdm-btn sdm-btn-download"
              href={`/${fileName}`}
              download={fileName}
            >
              ⬇ Download
            </a>
            <button className="sdm-btn sdm-btn-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="sdm-body">
          {error && <div className="sdm-error">Unable to load file.</div>}
          {!error && !rows && <div className="sdm-loading">Loading…</div>}
          {rows && (
            <div className="sdm-table-wrap">
              <table className="sdm-table">
                <thead>
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SampleDataModal;
