import React from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingLandingScreen.css';

interface Persona {
  id: string;
  label: string;
  who: string;
  description: string;
  route: string;
  cta: string;
}

const PERSONAS: Persona[] = [
  {
    id: 'analyst',
    label: 'Onboarding Analyst',
    who: 'Internal — works the case queue',
    description:
      'See your work queue ranked by estimated value × urgency, with a revenue band, confidence and rationale on every case. The team lead can override any ranking.',
    route: '/onboarding/queue',
    cta: 'Open work queue',
  },
  {
    id: 'head-of-onboarding',
    label: 'Head of Onboarding',
    who: 'Internal — portfolio view',
    description:
      'See aggregate cycle time by step, median wait per handoff, and patterns the agent has noticed across in-flight cases — for example, "nested payments are 2.4× slower in AML".',
    route: '/onboarding/portfolio',
    cta: 'Open portfolio dashboard',
  },
  {
    id: 'client',
    label: 'Client Onboarding Lead',
    who: 'External — client-facing portal',
    description:
      'Chat with the bounded onboarding assistant. It grounds every answer in our public documentation and your own case state, and hands off to a named human for anything that needs judgement.',
    route: '/onboarding/portal',
    cta: 'Open client portal',
  },
];

const OnboardingLandingScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="onb-landing-root">
      <div className="onb-landing-shell">
        <button className="onb-landing-back" onClick={() => navigate('/features')}>
          ‹ All demos
        </button>

        <header className="onb-landing-header">
          <div className="onb-landing-badge">Contoso Payments Inc.</div>
          <h1 className="onb-landing-title">Onboarding Intelligence</h1>
          <p className="onb-landing-subtitle">
            Three bounded AI agents help an onboarding team rank cases by value, give credible go-live
            estimates, and answer common client questions — without ever taking irreversible action.
            A human is always in the loop.
          </p>
        </header>

        <section className="onb-landing-agents">
          <h2 className="onb-landing-h2">The three agents</h2>
          <div className="onb-landing-agent-grid">
            <div className="onb-landing-agent">
              <div className="onb-landing-agent-num">1</div>
              <h3>Revenue Estimation &amp; Case Prioritization</h3>
              <p>
                Reads intake data, finds historical comparables, and assigns a Low / Medium / High /
                Strategic band with a confidence score and rationale. Ranks the queue but never
                commits — the team lead overrides freely.
              </p>
            </div>
            <div className="onb-landing-agent">
              <div className="onb-landing-agent-num">2</div>
              <h3>Onboarding Duration &amp; Bottleneck Analysis</h3>
              <p>
                Estimates a go-live window per case and surfaces the current bottleneck step. In
                portfolio mode, it flags structural patterns across in-flight cases.
              </p>
            </div>
            <div className="onb-landing-agent">
              <div className="onb-landing-agent-num">3</div>
              <h3>Client-Facing Guidance &amp; Support</h3>
              <p>
                Bounded chat assistant for the client portal. Grounded in public docs and the
                client's own case state, with citations on every answer and clean handoff to named
                humans when out-of-scope.
              </p>
            </div>
          </div>
        </section>

        <section className="onb-landing-personas">
          <h2 className="onb-landing-h2">Try a persona</h2>
          <div className="onb-landing-persona-grid">
            {PERSONAS.map((p) => (
              <div key={p.id} className="onb-landing-persona-card">
                <div className="onb-landing-persona-who">{p.who}</div>
                <h3 className="onb-landing-persona-label">{p.label}</h3>
                <p className="onb-landing-persona-desc">{p.description}</p>
                <button
                  className="onb-landing-persona-cta"
                  onClick={() => navigate(p.route)}
                  type="button"
                >
                  {p.cta} →
                </button>
              </div>
            ))}
          </div>
        </section>

        <footer className="onb-landing-footer">
          <strong>Bounded-agent guardrails:</strong> agents only recommend — humans decide. No agent
          can change case state, approve, sign off, or make pricing or commercial decisions. Every
          estimate or answer carries citations into <code>sample-data/onboarding/</code>.
        </footer>
      </div>
    </div>
  );
};

export default OnboardingLandingScreen;
