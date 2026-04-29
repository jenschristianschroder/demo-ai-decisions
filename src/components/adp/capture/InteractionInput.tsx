import React, { useState } from 'react';
import type { InteractionType } from '../../../types/adp';
import { getSampleMeetingNotes } from '../../../data/mockAdpData';

const INTERACTION_TYPES: { value: InteractionType; label: string }[] = [
  { value: 'meeting', label: '📅 Meeting' },
  { value: 'call', label: '📞 Call' },
  { value: 'email', label: '📧 Email' },
  { value: 'survey', label: '📋 Survey' },
];

interface InteractionInputProps {
  onExtract: (type: InteractionType, rawText: string) => void;
}

const InteractionInput: React.FC<InteractionInputProps> = ({ onExtract }) => {
  const [type, setType] = useState<InteractionType>('meeting');
  const [text, setText] = useState('');

  return (
    <div className="adp-capture-input-card">
      <h3 className="adp-capture-section-title">Interaction Type</h3>
      <div className="adp-capture-type-group">
        {INTERACTION_TYPES.map((t) => (
          <button
            key={t.value}
            className={`adp-capture-type-btn ${type === t.value ? 'adp-capture-type-btn-active' : ''}`}
            onClick={() => setType(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <h3 className="adp-capture-section-title">Interaction Notes</h3>
      <textarea
        className="adp-capture-textarea"
        placeholder="Paste meeting notes, call transcript, email thread, or survey responses here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="adp-capture-input-actions">
        <button
          className="adp-capture-btn-secondary"
          onClick={() => setText(getSampleMeetingNotes())}
        >
          Load Sample Notes
        </button>
        <button
          className="adp-capture-btn-primary"
          disabled={!text.trim()}
          onClick={() => onExtract(type, text)}
        >
          Extract Insights
        </button>
      </div>
    </div>
  );
};

export default InteractionInput;
