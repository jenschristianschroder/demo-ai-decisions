import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  appendChatMessage,
  getChatLog,
  resetChatLog,
} from '../data/mockOnboardingData';
import {
  loadActiveClientCaseState,
  loadEscalationContacts,
  loadOnboardingFaq,
  loadOnboardingProcess,
} from '../lib/onboardingDataLoader';
import { runOnboardingClientChat } from '../lib/onboardingAi';
import type {
  ChatCitation,
  ClientCaseState,
  ClientChatMessage,
} from '../types/onboarding';
import OnboardingChatPanel from '../components/onboarding/OnboardingChatPanel';
import './OnboardingClientPortalScreen.css';

interface ContextBundle {
  caseState: ClientCaseState;
  faqText: string;
  processText: string;
  escalationContactsText: string;
}

const OnboardingClientPortalScreen: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ClientChatMessage[]>(() => getChatLog());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<ContextBundle | null>(null);
  const [drawerCitation, setDrawerCitation] = useState<ChatCitation | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    void (async () => {
      const [caseState, faqText, processText, escalationContactsText] = await Promise.all([
        loadActiveClientCaseState(),
        loadOnboardingFaq(),
        loadOnboardingProcess(),
        loadEscalationContacts(),
      ]);
      setCtx({ caseState, faqText, processText, escalationContactsText });
    })();
  }, []);

  const handleSend = async (text: string) => {
    if (!ctx) return;
    setError(null);
    const userMsg: ClientChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    appendChatMessage(userMsg);
    setMessages(getChatLog());
    setSending(true);

    try {
      const response = await runOnboardingClientChat({
        userMessage: text,
        caseState: ctx.caseState,
        faqText: ctx.faqText,
        processText: ctx.processText,
        escalationContactsText: ctx.escalationContactsText,
        history: getChatLog(),
      });
      appendChatMessage(response);
      setMessages(getChatLog());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Chat request failed';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    resetChatLog();
    setMessages([]);
    setError(null);
  };

  return (
    <div className="onb-portal-root">
      <header className="onb-portal-header">
        <div className="onb-portal-header-inner">
          <div className="onb-portal-breadcrumb">
            <button className="onb-portal-link" onClick={() => navigate('/features')}>
              Demos
            </button>
            <span className="onb-portal-sep">›</span>
            <button className="onb-portal-link" onClick={() => navigate('/onboarding')}>
              Onboarding Intelligence
            </button>
            <span className="onb-portal-sep">›</span>
            <span className="onb-portal-current">Client portal</span>
          </div>
          <div className="onb-portal-title-row">
            <div>
              <h1 className="onb-portal-title">Onboarding portal</h1>
              <p className="onb-portal-subtitle">
                You're signed in as the client. The Client Guidance Agent grounds every answer in
                our public docs and your own case state — and hands off cleanly to a named human
                for anything that needs judgement.
              </p>
            </div>
            <div className="onb-portal-actions">
              <button
                className="onb-portal-btn onb-portal-btn--secondary"
                onClick={() => setShowAudit((v) => !v)}
                type="button"
              >
                {showAudit ? 'Hide audit log' : 'Show audit log'}
              </button>
              <button
                className="onb-portal-btn onb-portal-btn--secondary"
                onClick={handleReset}
                type="button"
              >
                Reset conversation
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="onb-portal-main">
        {error && <div className="onb-portal-error">{error}</div>}

        {!ctx ? (
          <div className="onb-portal-loading">Loading client context…</div>
        ) : (
          <div className="onb-portal-grid">
            <div className="onb-portal-chat-col">
              <OnboardingChatPanel
                caseState={ctx.caseState}
                messages={messages}
                sending={sending}
                onSend={handleSend}
                onOpenCitation={(c) => setDrawerCitation(c)}
              />
            </div>
            <aside className="onb-portal-side">
              <div className="onb-portal-side-card">
                <h3 className="onb-portal-side-h">Your case</h3>
                <div className="onb-portal-side-row">
                  <span className="onb-portal-side-label">Client</span>
                  <span>{ctx.caseState.clientName}</span>
                </div>
                <div className="onb-portal-side-row">
                  <span className="onb-portal-side-label">Current step</span>
                  <span>{ctx.caseState.currentStep}</span>
                </div>
                <div className="onb-portal-side-row">
                  <span className="onb-portal-side-label">Expected go-live</span>
                  <span>{ctx.caseState.expectedGoLiveWindow}</span>
                </div>
                <div className="onb-portal-side-h2">Open items</div>
                <ul className="onb-portal-side-list">
                  {ctx.caseState.openItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="onb-portal-side-card onb-portal-side-card--guard">
                <h3 className="onb-portal-side-h">Bounded assistant</h3>
                <p>
                  The agent cannot approve, sign off, or change case status. It cannot quote prices,
                  verify signatories, or make compliance judgements. All conversations are logged
                  for audit.
                </p>
              </div>
            </aside>
          </div>
        )}

        {showAudit && (
          <section className="onb-portal-audit">
            <h2 className="onb-portal-h2">Conversation audit log</h2>
            {messages.length === 0 ? (
              <div className="onb-portal-empty">No messages yet.</div>
            ) : (
              <ol className="onb-portal-audit-list">
                {messages.map((m, i) => (
                  <li key={i} className={`onb-portal-audit-entry onb-portal-audit-entry--${m.role}`}>
                    <div className="onb-portal-audit-ts">
                      {new Date(m.timestamp).toLocaleString()} · {m.role}
                    </div>
                    <div className="onb-portal-audit-body">{m.content}</div>
                    {m.citations && m.citations.length > 0 && (
                      <div className="onb-portal-audit-cites">
                        {m.citations.map((c, idx) => (
                          <span key={idx} className="onb-portal-audit-cite">
                            [{idx + 1}] {c.sourcePath} — {c.sectionAnchor}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.handoff && (
                      <div className="onb-portal-audit-handoff">
                        Handoff to {m.handoff.contactName} ({m.handoff.contactRole})
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </main>

      {drawerCitation && (
        <div
          className="onb-portal-drawer-backdrop"
          onClick={() => setDrawerCitation(null)}
          role="presentation"
        >
          <aside
            className="onb-portal-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="onb-portal-drawer-h">
              <strong>{drawerCitation.sectionAnchor}</strong>
              <button
                className="onb-portal-drawer-close"
                onClick={() => setDrawerCitation(null)}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="onb-portal-drawer-source">
              <a href={`/${drawerCitation.sourcePath}`} target="_blank" rel="noreferrer">
                {drawerCitation.sourcePath}
              </a>
            </div>
            <blockquote className="onb-portal-drawer-excerpt">
              {drawerCitation.excerpt}
            </blockquote>
          </aside>
        </div>
      )}
    </div>
  );
};

export default OnboardingClientPortalScreen;
