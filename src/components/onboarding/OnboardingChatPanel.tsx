import React, { useState, useRef, useEffect } from 'react';
import type {
  ChatCitation,
  ClientCaseState,
  ClientChatMessage,
} from '../../types/onboarding';

const STEP_LABEL: Record<string, string> = {
  intake: 'Intake',
  kyc: 'KYC',
  aml: 'AML review',
  'tech-integration': 'Technical integration',
  'signatory-verification': 'Signatory verification',
  'product-configuration': 'Product configuration',
  'go-live': 'Go-live',
};

interface Props {
  caseState: ClientCaseState;
  messages: ClientChatMessage[];
  sending: boolean;
  onSend: (text: string) => void;
  onOpenCitation: (citation: ChatCitation) => void;
}

const OnboardingChatPanel: React.FC<Props> = ({ caseState, messages, sending, onSend, onOpenCitation }) => {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setDraft('');
  };

  return (
    <div className="onb-chat-panel">
      <div className="onb-chat-status">
        <div className="onb-chat-status-left">
          <span className="onb-chat-status-label">Case</span>
          <span className="onb-chat-status-value">{caseState.clientName}</span>
        </div>
        <div className="onb-chat-status-pill">
          <span className="onb-chat-status-dot" aria-hidden="true" />
          {STEP_LABEL[caseState.currentStep] ?? caseState.currentStep}: {caseState.publicNote}
        </div>
      </div>

      <div className="onb-chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="onb-chat-empty">
            Ask any question about your onboarding case, documentation requirements, product configuration, or process status.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`onb-chat-msg onb-chat-msg--${m.role}`}
          >
            <div className="onb-chat-msg-body">{m.content}</div>
            {m.role === 'assistant' && m.citations && m.citations.length > 0 && (
              <div className="onb-chat-citations">
                {m.citations.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="onb-chat-citation-chip"
                    onClick={() => onOpenCitation(c)}
                    title={c.sectionAnchor}
                  >
                    [{idx + 1}]
                  </button>
                ))}
              </div>
            )}
            {m.role === 'assistant' && m.handoff && (
              <div className="onb-chat-handoff">
                <div className="onb-chat-handoff-h">Routing to a human contact</div>
                <div className="onb-chat-handoff-body">
                  <strong>{m.handoff.contactName}</strong> — {m.handoff.contactRole}
                </div>
                <div className="onb-chat-handoff-reason">{m.handoff.reason}</div>
                <div className="onb-chat-handoff-note">
                  The conversation context above will be attached automatically.
                </div>
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="onb-chat-msg onb-chat-msg--assistant onb-chat-msg--pending">
            <div className="onb-chat-msg-body">Thinking…</div>
          </div>
        )}
      </div>

      <form className="onb-chat-input" onSubmit={handleSubmit}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question — e.g. 'What documents do I still need to submit?'"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          disabled={sending}
        />
        <button type="submit" disabled={sending || draft.trim().length === 0}>
          Send
        </button>
      </form>
    </div>
  );
};

export default OnboardingChatPanel;
