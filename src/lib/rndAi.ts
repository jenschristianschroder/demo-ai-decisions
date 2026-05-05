import type { RndScenario } from '../types/rnd';
import type { GeneratedRndData } from '../data/mockRndData';
import { apiPost } from './aiClient';
import { isAiConfigured } from './aiConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GenerateRndDataResult =
  | { valid: true; data: GeneratedRndData }
  | { valid: false; message: string };

export type RndProgressStep =
  | { phase: 'plan'; status: 'running' | 'done' | 'error'; message: string }
  | { phase: 'agent'; agentName: string; index: number; total: number; status: 'running' | 'done' | 'error'; message: string }
  | { phase: 'decision'; status: 'running' | 'done' | 'error'; message: string }
  | { phase: 'complete'; status: 'done'; message: string };

// ---------------------------------------------------------------------------
// Phased generation: concepts → agents → decision
// ---------------------------------------------------------------------------

interface RndPlan {
  scenario: Omit<RndScenario, 'agentOutputs' | 'finalDecision'>;
}

type RndPlanResult =
  | { valid: true; plan: RndPlan }
  | { valid: false; message: string };

interface RndAgentDataResult {
  agentOutputs: RndScenario['agentOutputs'];
}

interface RndDecisionResult {
  finalDecision: RndScenario['finalDecision'];
}

/**
 * Generate R&D demo data in phases:
 *   1. Generate scenario plan (concepts)
 *   2. Generate all agent outputs
 *   3. Generate final decision
 *
 * Calls `onProgress` at each step so the UI can show live updates.
 */
export async function generateRndDataPhased(
  prompt: string,
  onProgress: (step: RndProgressStep) => void,
): Promise<GenerateRndDataResult> {
  if (!isAiConfigured()) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      valid: false,
      message: 'AI backend is not configured — live generation is unavailable in mock mode.',
    };
  }

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

  // --- Step 2: generate agent outputs ---
  const agentNames = [
    'User Insights Agent',
    'Clinical Evidence Agent',
    'Design Concept Agent',
    'Simulation Agent',
    'Lab Test Agent',
    'Human Factors Agent',
    'Regulatory & Risk Agent',
    'Manufacturing & Cost Agent',
    'Sustainability Agent',
  ];

  for (let i = 0; i < agentNames.length; i++) {
    onProgress({
      phase: 'agent',
      agentName: agentNames[i],
      index: i + 1,
      total: agentNames.length,
      status: 'running',
      message: `Running ${agentNames[i]}…`,
    });
  }

  let agentData: RndAgentDataResult;
  try {
    agentData = await apiPost<RndAgentDataResult>('/api/ai/rnd/generate-agents', {
      prompt,
      scenario,
    });

    for (let i = 0; i < agentNames.length; i++) {
      onProgress({
        phase: 'agent',
        agentName: agentNames[i],
        index: i + 1,
        total: agentNames.length,
        status: 'done',
        message: `${agentNames[i]} complete`,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate agent data';
    for (let i = 0; i < agentNames.length; i++) {
      onProgress({
        phase: 'agent',
        agentName: agentNames[i],
        index: i + 1,
        total: agentNames.length,
        status: 'error',
        message: `${agentNames[i]}: ${msg}`,
      });
    }
    return { valid: false, message: msg };
  }

  // --- Step 3: generate final decision ---
  onProgress({ phase: 'decision', status: 'running', message: 'Generating final decision…' });

  let decisionData: RndDecisionResult;
  try {
    decisionData = await apiPost<RndDecisionResult>('/api/ai/rnd/generate-decision', {
      prompt,
      scenario,
      agentOutputs: agentData.agentOutputs,
    });
    onProgress({ phase: 'decision', status: 'done', message: 'Decision complete' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate decision';
    onProgress({ phase: 'decision', status: 'error', message: msg });
    return { valid: false, message: msg };
  }

  onProgress({ phase: 'complete', status: 'done', message: 'All steps completed' });

  return {
    valid: true,
    data: {
      scenario: {
        ...scenario,
        agentOutputs: agentData.agentOutputs,
        finalDecision: decisionData.finalDecision,
      },
    },
  };
}
