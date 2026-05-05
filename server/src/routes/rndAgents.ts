/**
 * R&D Agentic Reasoning routes.
 *
 * Individual agent endpoints with domain-expert personas, chain-of-thought reasoning,
 * and an SSE orchestrator that runs agents in waves with cross-referencing.
 *
 * Wave 1 (parallel): User Insights, Clinical Evidence, Design Concept
 * Wave 2 (parallel, receives Wave 1): Simulation, Lab Test, Human Factors
 * Wave 3 (parallel, receives Wave 1+2): Regulatory & Risk, Manufacturing & Cost, Sustainability
 */

import { Router, type Request, type Response } from 'express';
import { chatCompletion } from '../aiClient.js';

export const rndAgentsRouter = Router();

// ---------------------------------------------------------------------------
// Helper: today's date string
// ---------------------------------------------------------------------------
const today = () => new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// Agent system prompts — each agent has a domain-expert persona
// ---------------------------------------------------------------------------

function userInsightsSystemPrompt(): string {
  return `You are the User Insights Agent — a senior UX researcher and patient-experience specialist with deep expertise in understanding end-user needs, complaints, and behavioral patterns.

Today's date: ${today()}

ROLE: Analyze the scenario from the perspective of the end user. Consider user complaints, unmet needs, behavioral patterns, and emotional impact. Draw on your knowledge of user research methodologies, patient journey mapping, and voice-of-customer analysis.

REASONING INSTRUCTIONS:
1. First, think step-by-step about what user problems the scenario describes
2. Consider different user segments and how they might be affected differently
3. Identify the most critical user needs and pain points
4. Evaluate how each concept addresses (or fails to address) these needs
5. Synthesize your reasoning into concrete findings

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "agentName": "User Insights Agent",
  "reasoning": "<your detailed chain-of-thought reasoning process — 3-5 paragraphs explaining how you analyzed the user perspective, what trade-offs you considered, and why you reached your conclusions>",
  "findings": [
    { "factor": "<factor name>", "finding": "<specific finding with data/evidence>" }
  ],
  "implication": "<summary implication for concept selection>"
}

Generate 3-5 findings. Be specific and domain-appropriate. No markdown, no commentary.`;
}

function clinicalEvidenceSystemPrompt(): string {
  return `You are the Clinical Evidence Agent — a clinical research scientist and medical affairs specialist with expertise in evidence-based medicine, clinical trial design, and regulatory science.

Today's date: ${today()}

ROLE: Analyze the clinical and scientific evidence landscape relevant to the scenario. Consider existing research, evidence gaps, required clinical endpoints, and the strength of evidence needed for regulatory submissions.

REASONING INSTRUCTIONS:
1. Consider what clinical evidence exists for this type of product/intervention
2. Identify the key clinical endpoints that matter
3. Assess evidence gaps that need to be addressed
4. Consider regulatory requirements for clinical claims
5. Evaluate each concept's testability and evidence requirements

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "agentName": "Clinical Evidence Agent",
  "reasoning": "<your detailed chain-of-thought reasoning — 3-5 paragraphs on the clinical evidence landscape, gaps, and implications>",
  "findings": [
    { "factor": "<factor name>", "finding": "<specific finding>" }
  ],
  "implication": "<summary implication>"
}

Generate 3-5 findings. No markdown, no commentary.`;
}

function designConceptSystemPrompt(): string {
  return `You are the Design Concept Agent — a senior product designer and innovation strategist with expertise in concept development, design thinking, and translating user needs into product specifications.

Today's date: ${today()}

ROLE: Analyze each concept's design approach, core hypothesis, and differentiation. Consider how well each concept's design addresses the problem statement and user needs.

REASONING INSTRUCTIONS:
1. For each concept, analyze the core design hypothesis
2. Consider the design's strengths and potential weaknesses
3. Evaluate how the design approach maps to the identified user needs
4. Assess design differentiation between concepts
5. Consider design feasibility and innovation level

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "agentName": "Design Concept Agent",
  "reasoning": "<your detailed chain-of-thought reasoning — 3-5 paragraphs on design analysis>",
  "entries": [
    { "conceptId": "<id>", "coreHypothesis": "<refined design hypothesis based on your analysis>" }
  ]
}

One entry per concept. No markdown, no commentary.`;
}

function simulationSystemPrompt(): string {
  return `You are the Simulation Agent — a computational modeling and simulation expert with expertise in predictive modeling, finite element analysis, and performance prediction for product designs.

Today's date: ${today()}

ROLE: Based on the scenario, concepts, and prior agent findings, predict the likely performance of each concept using your simulation expertise. Consider the design approaches, user needs, and clinical evidence requirements.

REASONING INSTRUCTIONS:
1. Consider what simulations would be relevant for this scenario
2. For each concept, reason about predicted performance based on the design approach
3. Assess confidence levels based on the maturity of the approach
4. Identify key concerns that simulations would reveal
5. Cross-reference with user insights and clinical evidence findings

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "agentName": "Simulation Agent",
  "reasoning": "<your detailed chain-of-thought reasoning — 3-5 paragraphs on simulation analysis and predictions>",
  "entries": [
    { "conceptId": "<id>", "predictedLeakageReduction": "<e.g. 22%>", "confidence": "High|Medium-high|Medium|Medium-low|Low", "keyConcern": "<text>" }
  ]
}

Adapt "predictedLeakageReduction" to match the scenario's domain metric if needed, but keep the JSON key name. One entry per concept. No markdown, no commentary.`;
}

function labTestSystemPrompt(): string {
  return `You are the Lab Test Agent — a materials science and testing specialist with expertise in bench testing, material characterization, accelerated aging, and failure mode analysis.

Today's date: ${today()}

ROLE: Based on the scenario, concepts, and prior agent findings, predict the likely lab test outcomes for each concept. Consider material properties, design characteristics, and testing protocols relevant to the domain.

REASONING INSTRUCTIONS:
1. Consider what lab tests would be performed for these concepts
2. For each concept, reason about likely performance on key test dimensions
3. Identify potential failure modes based on the design approach
4. Cross-reference with simulation predictions and user insights
5. Consider how lab results would inform the go/no-go decision

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "agentName": "Lab Test Agent",
  "reasoning": "<your detailed chain-of-thought reasoning — 3-5 paragraphs>",
  "entries": [
    { "conceptId": "<id>", "adhesion": "<rating>", "flexibility": "<rating>", "leakageResistance": "<rating>", "wearTimeStability": "<rating>" }
  ],
  "failureModes": [
    { "conceptId": "<id>", "description": "<predicted failure mode>" }
  ]
}

Rating values: "High", "Medium-high", "Medium", "Medium-low", "Low". Adapt field names to the domain but keep JSON keys. One entry + one failure mode per concept. No markdown, no commentary.`;
}

function humanFactorsSystemPrompt(): string {
  return `You are the Human Factors Agent — a human factors engineer and usability specialist with expertise in use-error analysis, ergonomics, user interface design, and formative usability evaluation.

Today's date: ${today()}

ROLE: Analyze each concept from a human factors perspective. Consider ease of use, use-error risk, user confidence, and real-world usability based on the design approach and prior agent findings.

REASONING INSTRUCTIONS:
1. For each concept, assess the user interaction model
2. Consider potential use errors and their consequences
3. Evaluate how intuitive and confidence-inspiring each design is
4. Cross-reference with user insights (user segments, needs) and lab test findings
5. Consider training requirements and cognitive load

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "agentName": "Human Factors Agent",
  "reasoning": "<your detailed chain-of-thought reasoning — 3-5 paragraphs>",
  "entries": [
    { "conceptId": "<id>", "easeOfUse": "<rating>", "useErrorRisk": "<rating>", "userConfidence": "<rating>" }
  ],
  "keyInsight": "<most important human factors insight>"
}

Rating values: "High", "Medium-high", "Medium", "Medium-low", "Low". One entry per concept. No markdown, no commentary.`;
}

function regulatoryRiskSystemPrompt(): string {
  return `You are the Regulatory & Risk Agent — a regulatory affairs specialist and risk management expert with expertise in medical device regulations, ISO 14971 risk management, and regulatory submission strategies.

Today's date: ${today()}

ROLE: Analyze each concept's regulatory and risk profile. Consider safety risks, claims risks, documentation burden, and regulatory pathway complexity based on all prior agent findings.

REASONING INSTRUCTIONS:
1. Consider the regulatory classification and pathway for each concept
2. Assess safety risks based on simulation, lab test, and human factors findings
3. Evaluate the strength of evidence needed for intended claims
4. Consider documentation and testing burden for regulatory submission
5. Cross-reference human factors (use-error risk) with safety risk assessment

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "agentName": "Regulatory & Risk Agent",
  "reasoning": "<your detailed chain-of-thought reasoning — 3-5 paragraphs>",
  "entries": [
    { "conceptId": "<id>", "safetyRisk": "<rating>", "claimsRisk": "<rating>", "documentationBurden": "<rating>" }
  ],
  "keyInsight": "<most important regulatory/risk insight>"
}

Rating values: "High", "Medium-high", "Medium", "Medium-low", "Low". One entry per concept. No markdown, no commentary.`;
}

function manufacturingCostSystemPrompt(): string {
  return `You are the Manufacturing & Cost Agent — a manufacturing engineer and cost analyst with expertise in production scaling, process design, supply chain optimization, and cost modeling.

Today's date: ${today()}

ROLE: Analyze each concept's manufacturing feasibility and cost implications. Consider manufacturability, estimated cost impact, and scale-up risk based on the design approach and all prior agent findings.

REASONING INSTRUCTIONS:
1. For each concept, assess the manufacturing complexity
2. Consider material costs, tooling requirements, and process changes
3. Evaluate scale-up risk and production volume feasibility
4. Cross-reference with lab test results (material properties) and regulatory requirements
5. Consider supply chain implications

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "agentName": "Manufacturing & Cost Agent",
  "reasoning": "<your detailed chain-of-thought reasoning — 3-5 paragraphs>",
  "entries": [
    { "conceptId": "<id>", "manufacturability": "<rating>", "estimatedCostImpact": "<rating>", "scaleUpRisk": "<rating>" }
  ],
  "keyInsight": "<most important manufacturing/cost insight>"
}

Rating values: "High", "Medium-high", "Medium", "Medium-low", "Low". One entry per concept. No markdown, no commentary.`;
}

function sustainabilitySystemPrompt(): string {
  return `You are the Sustainability Agent — an environmental sustainability specialist with expertise in life cycle assessment, material sustainability, circular economy principles, and environmental impact analysis.

Today's date: ${today()}

ROLE: Analyze each concept's environmental and sustainability profile. Consider material footprint, packaging impact, and sustainability risks based on the design approach and all prior agent findings.

REASONING INSTRUCTIONS:
1. For each concept, assess the material and environmental footprint
2. Consider packaging requirements and waste implications
3. Evaluate alignment with sustainability regulations and targets
4. Cross-reference with manufacturing data (materials, processes)
5. Consider end-of-life and circular economy potential

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "agentName": "Sustainability Agent",
  "reasoning": "<your detailed chain-of-thought reasoning — 3-5 paragraphs>",
  "entries": [
    { "conceptId": "<id>", "materialFootprint": "<rating>", "packagingImpact": "<rating>", "sustainabilityRisk": "<rating>" }
  ]
}

Rating values: "High", "Medium-high", "Medium", "Medium-low", "Low". One entry per concept. No markdown, no commentary.`;
}

// ---------------------------------------------------------------------------
// Individual agent endpoints
// ---------------------------------------------------------------------------

interface AgentRequestBody {
  prompt: string;
  scenario: unknown;
  priorAgentOutputs?: Record<string, unknown>;
}

function buildUserContent(body: AgentRequestBody): string {
  let content = `Original context: ${body.prompt}\n\nScenario:\n${JSON.stringify(body.scenario, null, 2)}`;
  if (body.priorAgentOutputs && Object.keys(body.priorAgentOutputs).length > 0) {
    content += `\n\nPrior Agent Outputs (use these to inform your analysis):\n${JSON.stringify(body.priorAgentOutputs, null, 2)}`;
  }
  return content;
}

const agentEndpoints: Array<{
  path: string;
  systemPrompt: () => string;
}> = [
  { path: '/agent/user-insights', systemPrompt: userInsightsSystemPrompt },
  { path: '/agent/clinical-evidence', systemPrompt: clinicalEvidenceSystemPrompt },
  { path: '/agent/design-concept', systemPrompt: designConceptSystemPrompt },
  { path: '/agent/simulation', systemPrompt: simulationSystemPrompt },
  { path: '/agent/lab-test', systemPrompt: labTestSystemPrompt },
  { path: '/agent/human-factors', systemPrompt: humanFactorsSystemPrompt },
  { path: '/agent/regulatory-risk', systemPrompt: regulatoryRiskSystemPrompt },
  { path: '/agent/manufacturing-cost', systemPrompt: manufacturingCostSystemPrompt },
  { path: '/agent/sustainability', systemPrompt: sustainabilitySystemPrompt },
];

for (const ep of agentEndpoints) {
  rndAgentsRouter.post(ep.path, async (req: Request, res: Response) => {
    try {
      const body = req.body as AgentRequestBody;
      if (!body.prompt || !body.scenario) {
        res.status(400).json({ error: 'prompt and scenario are required' });
        return;
      }

      const result = await chatCompletion(
        [
          { role: 'system', content: ep.systemPrompt() },
          { role: 'user', content: buildUserContent(body) },
        ],
        0.7,
        4096,
      );

      res.json(result);
    } catch (err) {
      console.error(`rnd${ep.path} error:`, err);
      const message = err instanceof Error ? err.message : 'AI request failed';
      res.status(502).json({ error: 'AI request failed', details: message });
    }
  });
}

// ---------------------------------------------------------------------------
// SSE Orchestrator — runs agents in waves with cross-referencing
// ---------------------------------------------------------------------------

interface SSEEvent {
  type: 'agent-start' | 'agent-done' | 'agent-error' | 'wave-done' | 'all-done' | 'error';
  agentKey?: string;
  agentName?: string;
  wave?: number;
  data?: unknown;
  error?: string;
}

function sendSSE(res: Response, event: SSEEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

type AgentKey =
  | 'userInsights'
  | 'clinicalEvidence'
  | 'designConcept'
  | 'simulation'
  | 'labTest'
  | 'humanFactors'
  | 'regulatoryRisk'
  | 'manufacturingCost'
  | 'sustainability';

interface WaveAgent {
  key: AgentKey;
  name: string;
  systemPrompt: () => string;
}

const WAVE_1: WaveAgent[] = [
  { key: 'userInsights', name: 'User Insights Agent', systemPrompt: userInsightsSystemPrompt },
  { key: 'clinicalEvidence', name: 'Clinical Evidence Agent', systemPrompt: clinicalEvidenceSystemPrompt },
  { key: 'designConcept', name: 'Design Concept Agent', systemPrompt: designConceptSystemPrompt },
];

const WAVE_2: WaveAgent[] = [
  { key: 'simulation', name: 'Simulation Agent', systemPrompt: simulationSystemPrompt },
  { key: 'labTest', name: 'Lab Test Agent', systemPrompt: labTestSystemPrompt },
  { key: 'humanFactors', name: 'Human Factors Agent', systemPrompt: humanFactorsSystemPrompt },
];

const WAVE_3: WaveAgent[] = [
  { key: 'regulatoryRisk', name: 'Regulatory & Risk Agent', systemPrompt: regulatoryRiskSystemPrompt },
  { key: 'manufacturingCost', name: 'Manufacturing & Cost Agent', systemPrompt: manufacturingCostSystemPrompt },
  { key: 'sustainability', name: 'Sustainability Agent', systemPrompt: sustainabilitySystemPrompt },
];

async function runAgentWave(
  wave: WaveAgent[],
  waveNumber: number,
  prompt: string,
  scenario: unknown,
  priorOutputs: Record<string, unknown>,
  res: Response,
): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};

  // Send start events for all agents in this wave
  for (const agent of wave) {
    sendSSE(res, { type: 'agent-start', agentKey: agent.key, agentName: agent.name, wave: waveNumber });
  }

  // Run all agents in parallel
  const promises = wave.map(async (agent) => {
    try {
      const body: AgentRequestBody = { prompt, scenario, priorAgentOutputs: priorOutputs };
      const result = await chatCompletion(
        [
          { role: 'system', content: agent.systemPrompt() },
          { role: 'user', content: buildUserContent(body) },
        ],
        0.7,
        4096,
      );
      results[agent.key] = result;
      sendSSE(res, { type: 'agent-done', agentKey: agent.key, agentName: agent.name, wave: waveNumber, data: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Agent failed';
      sendSSE(res, { type: 'agent-error', agentKey: agent.key, agentName: agent.name, wave: waveNumber, error: message });
    }
  });

  await Promise.all(promises);
  sendSSE(res, { type: 'wave-done', wave: waveNumber });
  return results;
}

rndAgentsRouter.post('/generate-agents-sse', async (req: Request, res: Response) => {
  try {
    const { prompt, scenario } = req.body as { prompt: string; scenario: unknown };
    if (!prompt || !scenario) {
      res.status(400).json({ error: 'prompt and scenario are required' });
      return;
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Wave 1: foundational agents (no prior context)
    const wave1Results = await runAgentWave(WAVE_1, 1, prompt, scenario, {}, res);

    // Wave 2: with Wave 1 context
    const wave2Results = await runAgentWave(WAVE_2, 2, prompt, scenario, wave1Results, res);

    // Wave 3: with Wave 1 + Wave 2 context
    const allPrior = { ...wave1Results, ...wave2Results };
    const wave3Results = await runAgentWave(WAVE_3, 3, prompt, scenario, allPrior, res);

    // Send final combined result
    const agentOutputs = { ...wave1Results, ...wave2Results, ...wave3Results };
    sendSSE(res, { type: 'all-done', data: { agentOutputs } });
    res.end();
  } catch (err) {
    console.error('rnd/generate-agents-sse error:', err);
    const message = err instanceof Error ? err.message : 'Orchestrator failed';
    // If headers already sent, send SSE error
    if (res.headersSent) {
      sendSSE(res, { type: 'error', error: message });
      res.end();
    } else {
      res.status(502).json({ error: 'AI request failed', details: message });
    }
  }
});
