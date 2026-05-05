/**
 * R&D Decision AI routes.
 *
 * Provides endpoints for generating R&D concept-selection scenarios,
 * agent analyses, and final decisions with multi-step reasoning.
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
// POST /api/ai/rnd/generate-decision (multi-step: synthesis → scoring →
//   devil's advocate → final decision)
// ---------------------------------------------------------------------------

const DECISION_SYNTHESIS_PROMPT = `You are a Decision Synthesis Agent. Analyze all 9 agent outputs and identify:
1. Key agreements across agents
2. Key tensions and trade-offs between agents
3. The strongest and weakest concepts based on the evidence

Respond with ONLY valid JSON:
{
  "synthesis": {
    "agreements": ["<point of agreement>"],
    "tensions": ["<tension or trade-off>"],
    "conceptRankingRationale": "<2-3 sentences explaining the likely ranking based on evidence>"
  }
}

No markdown, no commentary.`;

const DECISION_SCORING_PROMPT = `You are a Decision Scoring Agent. Based on the synthesis of all agent evidence, produce a weighted scoring model.

Use 5-8 criteria with weights that sum to 100.
Score each concept 1-10 on each criterion.
The weightedScore should be the correctly calculated weighted average (sum of score × weight/100).

Respond with ONLY valid JSON:
{
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
  "conceptActions": [
    { "conceptId": "<id>", "action": "advance|backup|deprioritize|kill", "reason": "<reason>" }
  ]
}

Exactly one concept should be "advance", others "backup", "deprioritize", or "kill".
No markdown, no commentary.`;

const DEVILS_ADVOCATE_PROMPT = `You are a Devil's Advocate Agent. Your job is to challenge the recommended concept and stress-test the decision.

Given the recommended concept and the scoring rationale, you must:
1. Identify the strongest counter-arguments against the recommendation
2. Find weaknesses in the evidence supporting it
3. Argue why an alternative concept might actually be better
4. Consider risks that may have been underweighted

Be genuinely challenging — don't just raise token objections. Find real weaknesses.

Respond with ONLY valid JSON:
{
  "challengedConceptId": "<id of the recommended concept>",
  "challenge": "<2-3 paragraph challenge explaining why this recommendation might be wrong>",
  "counterArguments": ["<specific counter-argument>"],
  "alternativeCase": "<which alternative concept might be better and why>"
}

No markdown, no commentary.`;

const FINAL_DECISION_PROMPT = `You are the Final Decision Agent. You have seen:
1. All 9 agent analyses
2. The scoring model and initial recommendation
3. The devil's advocate challenge

Now produce the FINAL decision, incorporating the challenge. Either:
- Defend the original recommendation with stronger evidence
- Modify the recommendation based on valid challenge points
- Change the recommendation entirely if the challenge was compelling

Respond with ONLY valid JSON:
{
  "recommendation": "advance|backup|deprioritize|kill",
  "recommendedConceptId": "<id>",
  "rationale": "<3-4 sentence rationale that explicitly addresses the devil's advocate challenge>",
  "reasoning": "<detailed 3-5 paragraph explanation of your decision process, how you weighed the challenge, and why you reached this conclusion>",
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
  ],
  "challengeResolution": "<1-2 sentences on how you resolved the devil's advocate challenge>"
}

Generate 3-5 items for keyAssumptions, risksToMonitor, nextExperiments, and killCriteria.
No markdown, no commentary.`;

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

    // Use SSE for multi-step decision
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (type: string, data: unknown) => {
      res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    };

    const baseContext = `Original context: ${prompt}\n\nScenario:\n${JSON.stringify(scenario, null, 2)}\n\nAgent Outputs:\n${JSON.stringify(agentOutputs, null, 2)}`;

    // Step 1: Synthesis
    sendEvent('decision-step', { step: 'synthesis', status: 'running' });
    const synthesis = await chatCompletion<{ synthesis: { agreements: string[]; tensions: string[]; conceptRankingRationale: string } }>(
      [
        { role: 'system', content: DECISION_SYNTHESIS_PROMPT },
        { role: 'user', content: baseContext },
      ],
      0.5,
      4096,
    );
    sendEvent('decision-step', { step: 'synthesis', status: 'done', data: synthesis });

    // Step 2: Scoring
    sendEvent('decision-step', { step: 'scoring', status: 'running' });
    const scoring = await chatCompletion<{
      criteria: Array<{ name: string; weight: number }>;
      scores: Array<{ conceptId: string; scores: Record<string, number>; weightedScore: number }>;
      recommendation: string;
      recommendedConceptId: string;
      rationale: string;
      conceptActions: Array<{ conceptId: string; action: string; reason: string }>;
    }>(
      [
        { role: 'system', content: DECISION_SCORING_PROMPT },
        {
          role: 'user',
          content: `${baseContext}\n\nSynthesis:\n${JSON.stringify(synthesis, null, 2)}`,
        },
      ],
      0.5,
      4096,
    );
    sendEvent('decision-step', { step: 'scoring', status: 'done', data: scoring });

    // Step 3: Devil's Advocate
    sendEvent('decision-step', { step: 'devils-advocate', status: 'running' });
    const devilsAdvocate = await chatCompletion<{
      challengedConceptId: string;
      challenge: string;
      counterArguments: string[];
      alternativeCase: string;
    }>(
      [
        { role: 'system', content: DEVILS_ADVOCATE_PROMPT },
        {
          role: 'user',
          content: `${baseContext}\n\nScoring & Recommendation:\n${JSON.stringify(scoring, null, 2)}`,
        },
      ],
      0.7,
      4096,
    );
    sendEvent('decision-step', { step: 'devils-advocate', status: 'done', data: devilsAdvocate });

    // Step 4: Final Decision (incorporating the challenge)
    sendEvent('decision-step', { step: 'final-decision', status: 'running' });
    const finalDecisionRaw = await chatCompletion<{
      recommendation: string;
      recommendedConceptId: string;
      rationale: string;
      reasoning: string;
      decisionPackage: {
        recommendedAction: string;
        evidenceSummary: string;
        keyAssumptions: string[];
        risksToMonitor: string[];
        nextExperiments: string[];
        killCriteria: string[];
      };
      conceptActions: Array<{ conceptId: string; action: string; reason: string }>;
      challengeResolution: string;
    }>(
      [
        { role: 'system', content: FINAL_DECISION_PROMPT },
        {
          role: 'user',
          content: `${baseContext}\n\nSynthesis:\n${JSON.stringify(synthesis, null, 2)}\n\nScoring:\n${JSON.stringify(scoring, null, 2)}\n\nDevil's Advocate Challenge:\n${JSON.stringify(devilsAdvocate, null, 2)}`,
        },
      ],
      0.5,
      8192,
    );

    // Compose final output
    const finalDecision = {
      agentName: 'Decision Agent' as const,
      criteria: scoring.criteria,
      scores: scoring.scores,
      recommendation: finalDecisionRaw.recommendation,
      recommendedConceptId: finalDecisionRaw.recommendedConceptId,
      rationale: finalDecisionRaw.rationale,
      reasoning: finalDecisionRaw.reasoning,
      decisionPackage: finalDecisionRaw.decisionPackage,
      conceptActions: finalDecisionRaw.conceptActions,
      devilsAdvocateChallenge: {
        challengedConceptId: devilsAdvocate.challengedConceptId,
        challenge: devilsAdvocate.challenge,
        counterArguments: devilsAdvocate.counterArguments,
        resolution: finalDecisionRaw.challengeResolution,
      },
    };

    sendEvent('decision-step', { step: 'final-decision', status: 'done', data: finalDecision });
    sendEvent('decision-complete', { finalDecision });
    res.end();
  } catch (err) {
    console.error('rnd/generate-decision error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`);
      res.end();
    } else {
      res.status(502).json({ error: 'AI request failed', details: message });
    }
  }
});

