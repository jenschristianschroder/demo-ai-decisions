import React, { useState } from 'react';
import type { ExtractionResult } from '../../../types/adp';
import { getStakeholders } from '../../../data/mockAdpData';

const CATEGORY_COLORS: Record<string, string> = {
  risk: '#b91c1c',
  opportunity: '#15803d',
  gap: '#2563eb',
  'sentiment-shift': '#7c3aed',
};

interface ExtractionPreviewProps {
  result: ExtractionResult;
  onSave: () => void;
  onBack: () => void;
}

const ExtractionPreview: React.FC<ExtractionPreviewProps> = ({ result, onSave, onBack }) => {
  const [selectedSignals, setSelectedSignals] = useState<Set<string>>(
    () => new Set(result.signals.map((s) => s.id)),
  );
  const [selectedUpdates, setSelectedUpdates] = useState<Set<number>>(
    () => new Set(result.stakeholderUpdates.map((_, i) => i)),
  );
  const [selectedActions, setSelectedActions] = useState<Set<number>>(
    () => new Set(result.suggestedActions.map((_, i) => i)),
  );

  const toggle = <T,>(set: Set<T>, key: T, setter: React.Dispatch<React.SetStateAction<Set<T>>>) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  const stakeholders = getStakeholders('contoso-mfg');
  const stakeholderName = (id: string) => stakeholders.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="adp-capture-preview">
      {/* Signals */}
      <div className="adp-capture-preview-section">
        <h3 className="adp-capture-section-title">Extracted Signals</h3>
        <div className="adp-capture-checklist">
          {result.signals.map((signal) => (
            <label key={signal.id} className="adp-capture-check-row">
              <input
                type="checkbox"
                checked={selectedSignals.has(signal.id)}
                onChange={() => toggle(selectedSignals, signal.id, setSelectedSignals)}
              />
              <span
                className="adp-capture-category-badge"
                style={{ background: CATEGORY_COLORS[signal.category] }}
              >
                {signal.category}
              </span>
              <span className="adp-capture-severity">{signal.severity}</span>
              <span className="adp-capture-check-desc">{signal.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Stakeholder Updates */}
      {result.stakeholderUpdates.length > 0 && (
        <div className="adp-capture-preview-section">
          <h3 className="adp-capture-section-title">Stakeholder Updates</h3>
          <div className="adp-capture-checklist">
            {result.stakeholderUpdates.map((upd, i) => (
              <label key={i} className="adp-capture-check-row">
                <input
                  type="checkbox"
                  checked={selectedUpdates.has(i)}
                  onChange={() => toggle(selectedUpdates, i, setSelectedUpdates)}
                />
                <span className="adp-capture-check-desc">
                  <strong>{stakeholderName(upd.stakeholderId)}</strong>: {upd.field}{' '}
                  <span className="adp-capture-field-change">
                    {upd.oldValue} → {upd.newValue}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Actions */}
      {result.suggestedActions.length > 0 && (
        <div className="adp-capture-preview-section">
          <h3 className="adp-capture-section-title">Suggested Actions</h3>
          <div className="adp-capture-checklist">
            {result.suggestedActions.map((action, i) => (
              <label key={i} className="adp-capture-check-row">
                <input
                  type="checkbox"
                  checked={selectedActions.has(i)}
                  onChange={() => toggle(selectedActions, i, setSelectedActions)}
                />
                <span className="adp-capture-check-desc">
                  {action.description}
                  <span className="adp-capture-action-owner">Owner: {action.owner}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="adp-capture-preview-actions">
        <button className="adp-capture-btn-secondary" onClick={onBack}>
          ← Back to Input
        </button>
        <button className="adp-capture-btn-primary" onClick={onSave}>
          Save to Account Plan
        </button>
      </div>
    </div>
  );
};

export default ExtractionPreview;
