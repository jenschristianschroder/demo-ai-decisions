/**
 * Onboarding Intelligence agent orchestration routes.
 *
 * Four SSE endpoints powering three bounded agents:
 *
 *   POST /onboarding/estimate-revenue-sse        — Use Case 1
 *   POST /onboarding/duration-case-sse           — Use Case 2 (per case)
 *   POST /onboarding/duration-portfolio-sse      — Use Case 2 (portfolio)
 *   POST /onboarding/client-chat-sse             — Use Case 3
 *
 * All agents follow the bounded-agent pattern: read context → reason →
 * produce a recommendation or answer. They never mutate case state and
 * never take irreversible action.
 */

import { Router, type Request, type Response } from 'express';
import { chatCompletion } from '../aiClient.js';

export const onboardingAgentsRouter = Router();

interface SSEEvent {
  type: 'agent-start' | 'agent-done' | 'agent-error' | 'all-done' | 'error';
  phase?: string;
  message?: string;
  reasoning?: string;
  data?: unknown;
  error?: string;
}

function sendSSE(res: Response, event: SSEEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function startSSE(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

// ---------------------------------------------------------------------------
// Use Case 1 — Revenue Estimation & Case Prioritization Agent
// ---------------------------------------------------------------------------

function revenueEstimationPrompt(): string {
  return `You are the Revenue Estimation & Case Prioritization Agent for Contoso Payments Inc.

ROLE
You read an onboarding intake submission and estimate the prospect's likely
revenue contribution over the first 12 months. You produce a revenue band, a
confidence score, and a one-paragraph rationale. You ALSO surface the signals
you used and the comparable historical clients you relied on.

HARD RULES
- You may ONLY output one of these bands: "low", "medium", "high", "strategic".
- You must produce a single paragraph of plain-language rationale that names
  the client type, the corridor(s), the declared volume tier, and the closest
  comparable historical client by id.
- You must cite AT LEAST ONE comparable client from the provided catalog.
- You must NEVER produce pricing, fees, take-rates, or commercial terms.
- You must NEVER reorder or commit to a case being worked first — you only
  estimate. The human team lead makes the final ranking call.
- You must include "citations" referencing the sample-data files you used
  (e.g. "sample-data/onboarding/client-profiles.md",
  "sample-data/onboarding/revenue-banding-rubric.md").

OUTPUT FORMAT — respond with ONLY valid JSON of this shape:
{
  "band": "low|medium|high|strategic",
  "confidenceScore": 0.00,
  "rationale": "<one paragraph>",
  "signals": ["<signal 1>", "<signal 2>", "..."],
  "comparableClientIds": ["CP-EXIST-XXX"],
  "citations": ["sample-data/onboarding/client-profiles.md", "sample-data/onboarding/revenue-banding-rubric.md"]
}

No markdown, no commentary outside the JSON.`;
}

onboardingAgentsRouter.post('/onboarding/estimate-revenue-sse', async (req: Request, res: Response) => {
  try {
    const { intake, comparablesText, rubricText } = req.body as {
      intake: Record<string, unknown>;
      comparablesText: string;
      rubricText: string;
    };

    if (!intake || !comparablesText || !rubricText) {
      res.status(400).json({ error: 'intake, comparablesText and rubricText are required' });
      return;
    }

    startSSE(res);
    sendSSE(res, {
      type: 'agent-start',
      phase: 'revenue-estimation',
      message: 'Running Revenue Estimation Agent…',
    });

    try {
      const result = await chatCompletion<Record<string, unknown>>(
        [
          { role: 'system', content: revenueEstimationPrompt() },
          {
            role: 'user',
            content:
              `Estimate the revenue band for this prospect.\n\n` +
              `Intake:\n${JSON.stringify(intake, null, 2)}\n\n` +
              `Revenue Banding Rubric:\n${rubricText}\n\n` +
              `Historical Client Profiles (comparables):\n${comparablesText}`,
          },
        ],
        0.2,
        2048,
      );

      sendSSE(res, {
        type: 'agent-done',
        phase: 'revenue-estimation',
        message: 'Revenue Estimation Agent complete',
        reasoning: (result as { rationale?: string }).rationale,
        data: result,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Revenue estimation failed';
      sendSSE(res, { type: 'agent-error', phase: 'revenue-estimation', error: message });
    }

    sendSSE(res, { type: 'all-done', data: {} });
    res.end();
  } catch (err) {
    console.error('onboarding/estimate-revenue-sse error:', err);
    const message = err instanceof Error ? err.message : 'Orchestrator failed';
    if (res.headersSent) {
      sendSSE(res, { type: 'error', error: message });
      res.end();
    } else {
      res.status(502).json({ error: 'AI request failed', details: message });
    }
  }
});

// ---------------------------------------------------------------------------
// Use Case 2 — Duration & Bottleneck Agent (per-case mode)
// ---------------------------------------------------------------------------

function durationCasePrompt(): string {
  return `You are the Onboarding Duration & Bottleneck Analysis Agent for Contoso Payments Inc., in PER-CASE mode.

ROLE
You read the current state of a single onboarding case and the historical
step-timing data, then produce a go-live window estimate, the current
bottleneck step, the owner of that step, the historical wait for that step,
and a one-sentence client-safe summary.

HARD RULES
- You never recommend reassigning work or changing case status. You only
  surface information.
- "expectedGoLiveStart" and "expectedGoLiveEnd" must be ISO dates (YYYY-MM-DD)
  that form a credible window — typically 4 to 10 business days wide.
- "confidence" must be one of "low", "medium", "high".
- "currentBottleneckStep" must be one of:
  intake | kyc | aml | tech-integration | signatory-verification | product-configuration | go-live
- "clientSafeSummary" is plain language safe to send to the client. It must
  NOT name internal owners, NOT cite revenue bands, and NOT speculate about
  outcomes.
- "citations" must reference the sample-data files used (e.g.
  "sample-data/onboarding/onboarding-process.md",
  "sample-data/onboarding/step-timings.json").

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "expectedGoLiveStart": "YYYY-MM-DD",
  "expectedGoLiveEnd": "YYYY-MM-DD",
  "confidence": "low|medium|high",
  "currentBottleneckStep": "<step id>",
  "bottleneckOwner": "<owner team>",
  "historicWaitForStepDays": { "medianDays": 0, "p90Days": 0 },
  "rationale": "<internal-facing rationale>",
  "clientSafeSummary": "<one sentence, client-safe>",
  "citations": ["sample-data/onboarding/onboarding-process.md", "sample-data/onboarding/step-timings.json"]
}

No markdown, no commentary outside the JSON.`;
}

onboardingAgentsRouter.post('/onboarding/duration-case-sse', async (req: Request, res: Response) => {
  try {
    const { caseSnapshot, processText, stepTimings } = req.body as {
      caseSnapshot: Record<string, unknown>;
      processText: string;
      stepTimings: Record<string, unknown>;
    };

    if (!caseSnapshot || !processText || !stepTimings) {
      res.status(400).json({ error: 'caseSnapshot, processText and stepTimings are required' });
      return;
    }

    startSSE(res);
    sendSSE(res, {
      type: 'agent-start',
      phase: 'duration-case',
      message: 'Running Duration & Bottleneck Agent (per case)…',
    });

    try {
      const result = await chatCompletion<Record<string, unknown>>(
        [
          { role: 'system', content: durationCasePrompt() },
          {
            role: 'user',
            content:
              `Estimate the expected go-live window and current bottleneck for this case.\n\n` +
              `Today's date: ${new Date().toISOString().split('T')[0]}\n\n` +
              `Case snapshot:\n${JSON.stringify(caseSnapshot, null, 2)}\n\n` +
              `Onboarding process:\n${processText}\n\n` +
              `Step timings:\n${JSON.stringify(stepTimings, null, 2)}`,
          },
        ],
        0.2,
        2048,
      );

      sendSSE(res, {
        type: 'agent-done',
        phase: 'duration-case',
        message: 'Duration Agent complete',
        reasoning: (result as { rationale?: string }).rationale,
        data: result,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Duration estimation failed';
      sendSSE(res, { type: 'agent-error', phase: 'duration-case', error: message });
    }

    sendSSE(res, { type: 'all-done', data: {} });
    res.end();
  } catch (err) {
    console.error('onboarding/duration-case-sse error:', err);
    const message = err instanceof Error ? err.message : 'Orchestrator failed';
    if (res.headersSent) {
      sendSSE(res, { type: 'error', error: message });
      res.end();
    } else {
      res.status(502).json({ error: 'AI request failed', details: message });
    }
  }
});

// ---------------------------------------------------------------------------
// Use Case 2 — Duration & Bottleneck Agent (portfolio mode)
// ---------------------------------------------------------------------------

function durationPortfolioPrompt(): string {
  return `You are the Onboarding Duration & Bottleneck Analysis Agent for Contoso Payments Inc., in PORTFOLIO mode.

ROLE
You read a list of in-flight onboarding cases and the historical step-timing
data, then produce a ranked list of structural insights — patterns worth a
process owner's attention. You DO NOT recommend reassignment, prioritisation
changes, or any action that changes case state.

HARD RULES
- Every insight must reference at least one source case by id, so the head
  of onboarding can drill back to the underlying cases.
- Magnitudes should be expressed as a multiplier vs baseline (e.g. "2.4×")
  or a delta in days. Don't invent precision.
- Limit the response to at most 5 insights — surface the most material ones.
- "citations" must include "sample-data/onboarding/step-timings.json" and
  "sample-data/onboarding/onboarding-process.md".

OUTPUT FORMAT — respond with ONLY valid JSON of this shape:
{
  "insights": [
    {
      "id": "<short id>",
      "headline": "<one-line headline>",
      "metric": "<e.g. AML median wait>",
      "magnitude": "<e.g. 2.4×>",
      "affectedSegment": "<e.g. nested-payments>",
      "sourceCases": ["CASE-XYZ-2026"],
      "evidence": "<short evidence paragraph>",
      "citations": ["sample-data/onboarding/step-timings.json", "sample-data/onboarding/onboarding-process.md"]
    }
  ]
}

No markdown, no commentary outside the JSON.`;
}

onboardingAgentsRouter.post('/onboarding/duration-portfolio-sse', async (req: Request, res: Response) => {
  try {
    const { caseSnapshots, processText, stepTimings } = req.body as {
      caseSnapshots: Record<string, unknown>[];
      processText: string;
      stepTimings: Record<string, unknown>;
    };

    if (!Array.isArray(caseSnapshots) || !processText || !stepTimings) {
      res.status(400).json({ error: 'caseSnapshots, processText and stepTimings are required' });
      return;
    }

    startSSE(res);
    sendSSE(res, {
      type: 'agent-start',
      phase: 'duration-portfolio',
      message: 'Running Duration & Bottleneck Agent (portfolio)…',
    });

    try {
      const result = await chatCompletion<Record<string, unknown>>(
        [
          { role: 'system', content: durationPortfolioPrompt() },
          {
            role: 'user',
            content:
              `Identify the most material structural bottlenecks in this portfolio.\n\n` +
              `In-flight cases (${caseSnapshots.length}):\n${JSON.stringify(caseSnapshots, null, 2)}\n\n` +
              `Onboarding process:\n${processText}\n\n` +
              `Step timings:\n${JSON.stringify(stepTimings, null, 2)}`,
          },
        ],
        0.2,
        3072,
      );

      sendSSE(res, {
        type: 'agent-done',
        phase: 'duration-portfolio',
        message: 'Portfolio Insights ready',
        data: result,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Portfolio analysis failed';
      sendSSE(res, { type: 'agent-error', phase: 'duration-portfolio', error: message });
    }

    sendSSE(res, { type: 'all-done', data: {} });
    res.end();
  } catch (err) {
    console.error('onboarding/duration-portfolio-sse error:', err);
    const message = err instanceof Error ? err.message : 'Orchestrator failed';
    if (res.headersSent) {
      sendSSE(res, { type: 'error', error: message });
      res.end();
    } else {
      res.status(502).json({ error: 'AI request failed', details: message });
    }
  }
});

// ---------------------------------------------------------------------------
// Use Case 3 — Client-Facing Guidance & Support Agent
// ---------------------------------------------------------------------------

function clientChatPrompt(): string {
  return `You are the Client-Facing Guidance & Support Agent for Contoso Payments Inc.
You are talking directly to the client's own onboarding lead through a chat
panel in the onboarding portal. Your tone is plain, calm, and professional.

HARD RULES
- You may ONLY use the provided FAQ / process / case-state context. You must
  NEVER reference or imply knowledge of any other client's data.
- You must NEVER make compliance judgements (KYC outcome, AML risk rating,
  sanctions hit assessment), NEVER verify or reject a signatory, NEVER
  approve or sign off anything, and NEVER change case status.
- You must NEVER quote prices, fees, take-rates, or commercial terms.
- Every factual claim you make MUST be cited. Citations have a sourcePath
  pointing into sample-data/onboarding/, a sectionAnchor (the section
  heading you grounded in), and a short excerpt.
- If the question is outside scope or requires human judgement, return a
  "handoff" block with the matching named contact from the escalation
  contacts list. The conversation context is preserved by the portal.
- If you genuinely don't have grounding for an answer, say so and offer a
  handoff — do not improvise.

ALWAYS RETURN THIS JSON SHAPE:
{
  "content": "<assistant message, plain language>",
  "citations": [
    {
      "sourcePath": "sample-data/onboarding/<file>",
      "sectionAnchor": "<heading text>",
      "excerpt": "<short quoted excerpt>"
    }
  ],
  "handoff": {
    "contactName": "<from escalation contacts>",
    "contactRole": "<role>",
    "reason": "<why this needs a human>"
  } | null
}

No markdown, no commentary outside the JSON. If no handoff is needed, set
"handoff" to null.`;
}

onboardingAgentsRouter.post('/onboarding/client-chat-sse', async (req: Request, res: Response) => {
  try {
    const { userMessage, caseState, faqText, processText, escalationContactsText, history } = req.body as {
      userMessage: string;
      caseState: Record<string, unknown>;
      faqText: string;
      processText: string;
      escalationContactsText: string;
      history?: { role: string; content: string }[];
    };

    if (!userMessage || !caseState || !faqText) {
      res.status(400).json({ error: 'userMessage, caseState and faqText are required' });
      return;
    }

    startSSE(res);
    sendSSE(res, {
      type: 'agent-start',
      phase: 'client-chat',
      message: 'Running Client Guidance Agent…',
    });

    try {
      const historyBlock =
        history && history.length > 0
          ? `\n\nConversation so far:\n${history
              .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
              .join('\n')}`
          : '';

      const userContent =
        `Answer the client's question, grounded in the provided context.\n\n` +
        `Client question: ${userMessage}${historyBlock}\n\n` +
        `Client case state (only this client's data — do not reference any other client):\n${JSON.stringify(caseState, null, 2)}\n\n` +
        `Onboarding FAQ:\n${faqText}\n\n` +
        `Onboarding process:\n${processText}\n\n` +
        `Escalation contacts:\n${escalationContactsText}`;

      const raw = await chatCompletion<Record<string, unknown>>(
        [
          { role: 'system', content: clientChatPrompt() },
          { role: 'user', content: userContent },
        ],
        0.2,
        2048,
      );

      const message = {
        role: 'assistant' as const,
        content: (raw.content as string) ?? '',
        citations: (raw.citations as unknown[]) ?? [],
        handoff: raw.handoff ?? null,
        timestamp: new Date().toISOString(),
      };

      sendSSE(res, {
        type: 'agent-done',
        phase: 'client-chat',
        message: 'Client response ready',
        data: message,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Client chat failed';
      sendSSE(res, { type: 'agent-error', phase: 'client-chat', error: message });
    }

    sendSSE(res, { type: 'all-done', data: {} });
    res.end();
  } catch (err) {
    console.error('onboarding/client-chat-sse error:', err);
    const message = err instanceof Error ? err.message : 'Orchestrator failed';
    if (res.headersSent) {
      sendSSE(res, { type: 'error', error: message });
      res.end();
    } else {
      res.status(502).json({ error: 'AI request failed', details: message });
    }
  }
});
