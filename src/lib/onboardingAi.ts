// ---------------------------------------------------------------------------
// Onboarding Agent Orchestration — Azure AI Foundry via backend SSE.
//
// Three bounded agents:
//  1. runOnboardingRevenueEstimate     — Use Case 1
//  2. runOnboardingDurationForCase     — Use Case 2 (per-case mode)
//     runOnboardingPortfolioInsights   — Use Case 2 (portfolio mode)
//  3. runOnboardingClientChat          — Use Case 3
// ---------------------------------------------------------------------------

import type {
  CaseDurationEstimate,
  ClientChatMessage,
  OnboardingProgressStep,
  PortfolioInsight,
  ProspectIntake,
  RevenueEstimate,
} from '../types/onboarding';

interface SSEEvent {
  type: 'agent-start' | 'agent-done' | 'agent-error' | 'all-done' | 'error';
  phase?: string;
  message?: string;
  reasoning?: string;
  data?: unknown;
  error?: string;
}

function consumeSSE(
  url: string,
  body: object,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            reject(new Error(`API request failed (${response.status}): ${text}`));
          });
        }
        const reader = response.body?.getReader();
        if (!reader) {
          reject(new Error('Response body is not readable'));
          return;
        }
        const decoder = new TextDecoder();
        let buffer = '';
        function processStream(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              resolve();
              return;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const eventData = JSON.parse(line.slice(6)) as SSEEvent;
                  onEvent(eventData);
                } catch {
                  // skip malformed
                }
              }
            }
            return processStream();
          });
        }
        processStream().catch(reject);
      })
      .catch(reject);
  });
}

// ---------------------------------------------------------------------------
// Use Case 1 — Revenue Estimation
// ---------------------------------------------------------------------------

export async function runOnboardingRevenueEstimate(
  intake: ProspectIntake,
  comparablesText: string,
  rubricText: string,
  onProgress?: (step: OnboardingProgressStep) => void,
): Promise<RevenueEstimate> {
  let result: RevenueEstimate | null = null;
  let sseError: string | null = null;

  await consumeSSE(
    '/api/ai/onboarding/estimate-revenue-sse',
    { intake, comparablesText, rubricText },
    (event) => {
      if (event.type === 'agent-start') {
        onProgress?.({
          phase: 'revenue-estimation',
          status: 'running',
          message: 'Estimating revenue band and ranking the case…',
        });
      } else if (event.type === 'agent-done' && event.data) {
        result = event.data as RevenueEstimate;
        onProgress?.({
          phase: 'revenue-estimation',
          status: 'done',
          message: 'Revenue estimate ready',
          reasoning: event.reasoning,
        });
      } else if (event.type === 'agent-error') {
        sseError = event.error ?? 'Revenue estimation failed';
        onProgress?.({
          phase: 'revenue-estimation',
          status: 'error',
          message: sseError,
        });
      } else if (event.type === 'error') {
        sseError = event.error ?? 'Revenue estimation failed';
      }
    },
  );

  if (sseError) throw new Error(sseError);
  if (!result) throw new Error('No revenue estimate received');
  return result;
}

// ---------------------------------------------------------------------------
// Use Case 2 — Duration & Bottleneck (case mode)
// ---------------------------------------------------------------------------

export async function runOnboardingDurationForCase(
  caseSnapshot: object,
  processText: string,
  stepTimings: object,
  onProgress?: (step: OnboardingProgressStep) => void,
): Promise<CaseDurationEstimate> {
  let result: CaseDurationEstimate | null = null;
  let sseError: string | null = null;

  await consumeSSE(
    '/api/ai/onboarding/duration-case-sse',
    { caseSnapshot, processText, stepTimings },
    (event) => {
      if (event.type === 'agent-start') {
        onProgress?.({
          phase: 'duration-case',
          status: 'running',
          message: 'Estimating go-live window and current bottleneck…',
        });
      } else if (event.type === 'agent-done' && event.data) {
        result = event.data as CaseDurationEstimate;
        onProgress?.({
          phase: 'duration-case',
          status: 'done',
          message: 'Duration estimate ready',
          reasoning: event.reasoning,
        });
      } else if (event.type === 'agent-error') {
        sseError = event.error ?? 'Duration estimation failed';
        onProgress?.({
          phase: 'duration-case',
          status: 'error',
          message: sseError,
        });
      } else if (event.type === 'error') {
        sseError = event.error ?? 'Duration estimation failed';
      }
    },
  );

  if (sseError) throw new Error(sseError);
  if (!result) throw new Error('No duration estimate received');
  return result;
}

// ---------------------------------------------------------------------------
// Use Case 2 — Portfolio insights
// ---------------------------------------------------------------------------

export async function runOnboardingPortfolioInsights(
  caseSnapshots: object[],
  processText: string,
  stepTimings: object,
  onProgress?: (step: OnboardingProgressStep) => void,
): Promise<PortfolioInsight[]> {
  let result: PortfolioInsight[] = [];
  let sseError: string | null = null;

  await consumeSSE(
    '/api/ai/onboarding/duration-portfolio-sse',
    { caseSnapshots, processText, stepTimings },
    (event) => {
      if (event.type === 'agent-start') {
        onProgress?.({
          phase: 'duration-portfolio',
          status: 'running',
          message: 'Scanning the portfolio for bottleneck patterns…',
        });
      } else if (event.type === 'agent-done' && event.data) {
        const data = event.data as { insights?: PortfolioInsight[] };
        result = data.insights ?? [];
        onProgress?.({
          phase: 'duration-portfolio',
          status: 'done',
          message: 'Portfolio insights ready',
          reasoning: event.reasoning,
        });
      } else if (event.type === 'agent-error') {
        sseError = event.error ?? 'Portfolio analysis failed';
        onProgress?.({
          phase: 'duration-portfolio',
          status: 'error',
          message: sseError,
        });
      } else if (event.type === 'error') {
        sseError = event.error ?? 'Portfolio analysis failed';
      }
    },
  );

  if (sseError) throw new Error(sseError);
  return result;
}

// ---------------------------------------------------------------------------
// Use Case 3 — Client Chat
// ---------------------------------------------------------------------------

export interface ClientChatInput {
  userMessage: string;
  caseState: object;
  faqText: string;
  processText: string;
  escalationContactsText: string;
  history: ClientChatMessage[];
}

export async function runOnboardingClientChat(
  input: ClientChatInput,
  onProgress?: (step: OnboardingProgressStep) => void,
): Promise<ClientChatMessage> {
  let result: ClientChatMessage | null = null;
  let sseError: string | null = null;

  await consumeSSE(
    '/api/ai/onboarding/client-chat-sse',
    input,
    (event) => {
      if (event.type === 'agent-start') {
        onProgress?.({
          phase: 'client-chat',
          status: 'running',
          message: 'Drafting a grounded answer for the client…',
        });
      } else if (event.type === 'agent-done' && event.data) {
        result = event.data as ClientChatMessage;
        onProgress?.({
          phase: 'client-chat',
          status: 'done',
          message: 'Client response ready',
          reasoning: event.reasoning,
        });
      } else if (event.type === 'agent-error') {
        sseError = event.error ?? 'Client chat failed';
        onProgress?.({
          phase: 'client-chat',
          status: 'error',
          message: sseError,
        });
      } else if (event.type === 'error') {
        sseError = event.error ?? 'Client chat failed';
      }
    },
  );

  if (sseError) throw new Error(sseError);
  if (!result) throw new Error('No assistant response received');
  return result;
}
