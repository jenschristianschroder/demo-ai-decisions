/**
 * R&D Decision AI routes.
 *
 * Provides endpoints for generating R&D concept-selection scenarios,
 * agent analyses, and final decisions.
 */

import { Router } from 'express';
import { chatCompletion } from '../aiClient.js';

export const rndAiRouter = Router();

// ---------------------------------------------------------------------------
// POST /api/ai/rnd/generate-plan
// ---------------------------------------------------------------------------

const RND_PLAN_SYSTEM_PROMPT = `You are an AI assistant that generates a plan for an R&D concept-selection scenario.

Today's date: ${new Date().toISOString().split('T')[0]}

Given a natural-language description of an R&D decision, generate a scenario plan with 2–4 product concepts to evaluate.
If the user's prompt is not meaningful for an R&D concept-selection scenario, respond with:
{ "valid": false, "message": "<short explanation>" }

Otherwise respond with:
{
  "valid": true,
  "plan": {
    "scenario": {
      "id": "<kebab-case slug>",
      "title": "<scenario title>",
      "businessQuestion": "<the key decision question>",
      "context": "<1-2 sentence context>",
      "concepts": [
        {
          "id": "<kebab-case slug e.g. concept-a>",
          "name": "<short name>",
          "label": "<e.g. Concept A>",
          "description": "<one sentence description>",
          "hypothesis": "<core hypothesis>"
        }
      ]
    }
  }
}

Name concepts with labels like "Concept A", "Concept B", etc.
Name them in a way that is clearly from the user's described domain.

Respond with ONLY valid JSON — no markdown, no commentary.`;

rndAiRouter.post('/generate-plan', async (req, res) => {
  try {
    const { prompt } = req.body as { prompt: string };
    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    const result = await chatCompletion(
      [
        { role: 'system', content: RND_PLAN_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      0.7,
      4096,
    );

    res.json(result);
  } catch (err) {
    console.error('rnd/generate-plan error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/rnd/generate-agents
// ---------------------------------------------------------------------------

const RND_AGENTS_SYSTEM_PROMPT = `You are an AI assistant that generates detailed agent analysis outputs for an R&D concept-selection scenario.

Today's date: ${new Date().toISOString().split('T')[0]}

You will be given a scenario with concepts. Generate outputs for ALL 9 agents.

Respond with ONLY valid JSON matching this structure:
{
  "agentOutputs": {
    "userInsights": {
      "agentName": "User Insights Agent",
      "findings": [{ "factor": "<name>", "finding": "<detail>" }],
      "implication": "<summary implication>"
    },
    "clinicalEvidence": {
      "agentName": "Clinical Evidence Agent",
      "findings": [{ "factor": "<name>", "finding": "<detail>" }],
      "implication": "<summary>"
    },
    "designConcept": {
      "agentName": "Design Concept Agent",
      "entries": [{ "conceptId": "<id>", "coreHypothesis": "<text>" }]
    },
    "simulation": {
      "agentName": "Simulation Agent",
      "entries": [{ "conceptId": "<id>", "predictedLeakageReduction": "<e.g. 22%>", "confidence": "High|Medium-high|Medium|Medium-low|Low", "keyConcern": "<text>" }]
    },
    "labTest": {
      "agentName": "Lab Test Agent",
      "entries": [{ "conceptId": "<id>", "adhesion": "<rating>", "flexibility": "<rating>", "leakageResistance": "<rating>", "wearTimeStability": "<rating>" }],
      "failureModes": [{ "conceptId": "<id>", "description": "<text>" }]
    },
    "humanFactors": {
      "agentName": "Human Factors Agent",
      "entries": [{ "conceptId": "<id>", "easeOfUse": "<rating>", "useErrorRisk": "<rating>", "userConfidence": "<rating>" }],
      "keyInsight": "<text>"
    },
    "regulatoryRisk": {
      "agentName": "Regulatory & Risk Agent",
      "entries": [{ "conceptId": "<id>", "safetyRisk": "<rating>", "claimsRisk": "<rating>", "documentationBurden": "<rating>" }],
      "keyInsight": "<text>"
    },
    "manufacturingCost": {
      "agentName": "Manufacturing & Cost Agent",
      "entries": [{ "conceptId": "<id>", "manufacturability": "<rating>", "estimatedCostImpact": "<rating>", "scaleUpRisk": "<rating>" }],
      "keyInsight": "<text>"
    },
    "sustainability": {
      "agentName": "Sustainability Agent",
      "entries": [{ "conceptId": "<id>", "materialFootprint": "<rating>", "packagingImpact": "<rating>", "sustainabilityRisk": "<rating>" }]
    }
  }
}

Rating values: "High", "Medium-high", "Medium", "Medium-low", "Low"
Each agent must have an entry for EVERY concept in the scenario.
Make the data realistic, varied, and domain-appropriate.
Adapt field names (like "leakageResistance", "predictedLeakageReduction") to match the domain if needed, but keep the JSON keys the same.

Respond with ONLY valid JSON — no markdown, no commentary.`;

rndAiRouter.post('/generate-agents', async (req, res) => {
  try {
    const { prompt, scenario } = req.body as { prompt: string; scenario: unknown };
    if (!prompt || !scenario) {
      res.status(400).json({ error: 'prompt and scenario are required' });
      return;
    }

    const result = await chatCompletion(
      [
        { role: 'system', content: RND_AGENTS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Original context: ${prompt}\n\nScenario:\n${JSON.stringify(scenario, null, 2)}`,
        },
      ],
      0.7,
      8192,
    );

    res.json(result);
  } catch (err) {
    console.error('rnd/generate-agents error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/rnd/generate-decision
// ---------------------------------------------------------------------------

const RND_DECISION_SYSTEM_PROMPT = `You are an AI assistant that produces the final decision output for an R&D concept-selection scenario.

Today's date: ${new Date().toISOString().split('T')[0]}

Given a scenario, its concepts, and all 9 agent outputs, produce a weighted decision model and a decision package.

Respond with ONLY valid JSON matching this structure:
{
  "finalDecision": {
    "agentName": "Decision Agent",
    "criteria": [
      { "name": "<criterion>", "weight": <0-100> }
    ],
    "scores": [
      {
        "conceptId": "<id>",
        "scores": { "<criterion>": <1-10> },
        "weightedScore": <number>
      }
    ],
    "recommendation": "advance|backup|deprioritize|kill",
    "recommendedConceptId": "<id of best concept>",
    "rationale": "<2-3 sentence rationale>",
    "decisionPackage": {
      "recommendedAction": "<e.g. Move Concept B into next-phase prototyping>",
      "evidenceSummary": "<1-2 sentences>",
      "keyAssumptions": ["<assumption>"],
      "risksToMonitor": ["<risk>"],
      "nextExperiments": ["<experiment>"],
      "killCriteria": ["<criterion>"]
    },
    "conceptActions": [
      { "conceptId": "<id>", "action": "advance|backup|deprioritize|kill", "reason": "<reason>" }
    ]
  }
}

Use 5-8 criteria with weights that sum to 100.
Score each concept 1-10 on each criterion.
The weightedScore should be the correctly calculated weighted average.
Generate 3-5 items for keyAssumptions, risksToMonitor, nextExperiments, and killCriteria.
Exactly one concept should be "advance", others "backup" or "deprioritize".

Respond with ONLY valid JSON — no markdown, no commentary.`;

rndAiRouter.post('/generate-decision', async (req, res) => {
  try {
    const { prompt, scenario, agentOutputs } = req.body as {
      prompt: string;
      scenario: unknown;
      agentOutputs: unknown;
    };
    if (!prompt || !scenario || !agentOutputs) {
      res.status(400).json({ error: 'prompt, scenario, and agentOutputs are required' });
      return;
    }

    const result = await chatCompletion(
      [
        { role: 'system', content: RND_DECISION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Original context: ${prompt}\n\nScenario:\n${JSON.stringify(scenario, null, 2)}\n\nAgent Outputs:\n${JSON.stringify(agentOutputs, null, 2)}`,
        },
      ],
      0.5,
      8192,
    );

    res.json(result);
  } catch (err) {
    console.error('rnd/generate-decision error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});
