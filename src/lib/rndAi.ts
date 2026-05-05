import type { RndScenario } from '../types/rnd';
import type { GeneratedRndData } from '../data/mockRndData';
import { apiPost } from './aiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GenerateRndDataResult =
  | { valid: true; data: GeneratedRndData }
  | { valid: false; message: string };

export type RndProgressStep =
  | { phase: 'plan'; status: 'running' | 'done' | 'error'; message: string }
  | { phase: 'agent'; agentName: string; agentKey: string; wave: number; index: number; total: number; status: 'running' | 'done' | 'error'; message: string }
  | { phase: 'decision'; step?: string; status: 'running' | 'done' | 'error'; message: string }
  | { phase: 'complete'; status: 'done'; message: string };

// ---------------------------------------------------------------------------
// Phased generation: concepts → agents (SSE) → decision (SSE)
// ---------------------------------------------------------------------------

interface RndPlan {
  scenario: Omit<RndScenario, 'agentOutputs' | 'finalDecision'>;
}

type RndPlanResult =
  | { valid: true; plan: RndPlan }
  | { valid: false; message: string };

// Agent key → display name mapping
const AGENT_NAMES: Record<string, string> = {
  userInsights: 'User Insights Agent',
  clinicalEvidence: 'Clinical Evidence Agent',
  designConcept: 'Design Concept Agent',
  simulation: 'Simulation Agent',
  labTest: 'Lab Test Agent',
  humanFactors: 'Human Factors Agent',
  regulatoryRisk: 'Regulatory & Risk Agent',
  manufacturingCost: 'Manufacturing & Cost Agent',
  sustainability: 'Sustainability Agent',
};

const ALL_AGENT_KEYS = Object.keys(AGENT_NAMES);

// ---------------------------------------------------------------------------
// SSE helpers
// ---------------------------------------------------------------------------

interface SSEAgentEvent {
  type: 'agent-start' | 'agent-done' | 'agent-error' | 'wave-done' | 'all-done' | 'error';
  agentKey?: string;
  agentName?: string;
  wave?: number;
  data?: unknown;
  error?: string;
}

interface SSEDecisionEvent {
  type: 'decision-step' | 'decision-complete' | 'error';
  data?: {
    step?: string;
    status?: string;
    finalDecision?: RndScenario['finalDecision'];
  };
  error?: string;
}

function consumeSSE<T>(
  url: string,
  body: Record<string, unknown>,
  onEvent: (event: T) => void,
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
                  const eventData = JSON.parse(line.slice(6)) as T;
                  onEvent(eventData);
                } catch {
                  // Skip malformed events
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

// Decision step display names
const DECISION_STEP_NAMES: Record<string, string> = {
  synthesis: 'Synthesizing agent findings…',
  scoring: 'Scoring concepts…',
  'devils-advocate': 'Running devil\'s advocate challenge…',
  'final-decision': 'Producing final decision…',
};

/**
 * Generate R&D demo data in phases using SSE:
 *   1. Generate scenario plan (concepts) — POST
 *   2. Generate all agent outputs — SSE with wave-based progress
 *   3. Generate final decision — SSE with multi-step progress
 *
 * Calls `onProgress` at each step so the UI can show live updates.
 */
export async function generateRndDataPhased(
  prompt: string,
  onProgress: (step: RndProgressStep) => void,
): Promise<GenerateRndDataResult> {
  // --- Step 1: generate the plan (scenario + concepts) ---
  onProgress({ phase: 'plan', status: 'running', message: 'Creating R&D scenario plan…' });

  let planResult: RndPlanResult;
  try {
    planResult = await apiPost<RndPlanResult>('/api/ai/rnd/generate-plan', { prompt });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate plan';
    onProgress({ phase: 'plan', status: 'error', message: msg });
    return { valid: false, message: msg };
  }

  if (!planResult.valid) {
    onProgress({ phase: 'plan', status: 'error', message: planResult.message });
    return { valid: false, message: planResult.message };
  }

  const scenario = planResult.plan.scenario;
  onProgress({
    phase: 'plan',
    status: 'done',
    message: `Plan ready — ${scenario.concepts.length} concepts`,
  });

  // --- Step 2: generate agent outputs via SSE ---
  let agentOutputs: Record<string, unknown> = {};
  let agentError: string | null = null;

  try {
    await consumeSSE<SSEAgentEvent>(
      '/api/ai/rnd/generate-agents-sse',
      { prompt, scenario },
      (event) => {
        if (event.type === 'agent-start' && event.agentKey && event.agentName) {
          const idx = ALL_AGENT_KEYS.indexOf(event.agentKey);
          onProgress({
            phase: 'agent',
            agentName: event.agentName,
            agentKey: event.agentKey,
            wave: event.wave || 0,
            index: idx + 1,
            total: ALL_AGENT_KEYS.length,
            status: 'running',
            message: `Running ${event.agentName}…`,
          });
        } else if (event.type === 'agent-done' && event.agentKey && event.agentName) {
          const idx = ALL_AGENT_KEYS.indexOf(event.agentKey);
          onProgress({
            phase: 'agent',
            agentName: event.agentName,
            agentKey: event.agentKey,
            wave: event.wave || 0,
            index: idx + 1,
            total: ALL_AGENT_KEYS.length,
            status: 'done',
            message: `${event.agentName} complete`,
          });
        } else if (event.type === 'agent-error' && event.agentKey && event.agentName) {
          const idx = ALL_AGENT_KEYS.indexOf(event.agentKey);
          onProgress({
            phase: 'agent',
            agentName: event.agentName,
            agentKey: event.agentKey,
            wave: event.wave || 0,
            index: idx + 1,
            total: ALL_AGENT_KEYS.length,
            status: 'error',
            message: `${event.agentName}: ${event.error || 'failed'}`,
          });
        } else if (event.type === 'all-done' && event.data) {
          agentOutputs = (event.data as { agentOutputs: Record<string, unknown> }).agentOutputs;
        } else if (event.type === 'error') {
          agentError = event.error || 'Agent orchestration failed';
        }
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate agent data';
    agentError = msg;
  }

  if (agentError) {
    return { valid: false, message: agentError };
  }

  // --- Step 3: generate final decision via SSE (multi-step) ---
  onProgress({ phase: 'decision', status: 'running', message: 'Starting decision process…' });

  let finalDecision: RndScenario['finalDecision'] | null = null;
  let decisionError: string | null = null;

  try {
    await consumeSSE<SSEDecisionEvent>(
      '/api/ai/rnd/generate-decision',
      { prompt, scenario, agentOutputs },
      (event) => {
        if (event.type === 'decision-step' && event.data) {
          const step = event.data.step || '';
          const status = event.data.status || '';
          const stepName = DECISION_STEP_NAMES[step] || step;
          onProgress({
            phase: 'decision',
            step,
            status: status as 'running' | 'done' | 'error',
            message: status === 'done' ? `${stepName} ✓` : stepName,
          });
        } else if (event.type === 'decision-complete' && event.data?.finalDecision) {
          finalDecision = event.data.finalDecision;
          onProgress({ phase: 'decision', status: 'done', message: 'Decision complete' });
        } else if (event.type === 'error') {
          decisionError = event.error || 'Decision failed';
        }
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate decision';
    decisionError = msg;
  }

  if (decisionError || !finalDecision) {
    const msg = decisionError || 'Decision generation produced no result';
    onProgress({ phase: 'decision', status: 'error', message: msg });
    return { valid: false, message: msg };
  }

  onProgress({ phase: 'complete', status: 'done', message: 'All steps completed' });

  return {
    valid: true,
    data: {
      scenario: {
        ...scenario,
        agentOutputs: agentOutputs as RndScenario['agentOutputs'],
        finalDecision,
      },
    },
  };
}
