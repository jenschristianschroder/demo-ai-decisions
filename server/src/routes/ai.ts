/**
 * AI API routes.
 *
 * Each endpoint accepts a JSON body with the parameters needed for the AI
 * function and returns the model's JSON response.
 */

import { Router } from 'express';
import { chatCompletion } from '../aiClient.js';

export const aiRouter = Router();

// ---------------------------------------------------------------------------
// POST /api/ai/extract-signals
// ---------------------------------------------------------------------------

const EXTRACT_SYSTEM_PROMPT = `You are an AI assistant for key account managers. Analyze the raw interaction notes provided by the user and extract structured data.

Respond with a JSON object matching this schema:
{
  "signals": [
    {
      "id": "<unique string e.g. SIG-NEW-001>",
      "accountId": "contoso-mfg",
      "category": "risk" | "opportunity" | "gap" | "sentiment-shift",
      "severity": "high" | "medium" | "low",
      "sourceInteractionId": "INT-005",
      "description": "<concise description>",
      "status": "new",
      "createdAt": "<ISO 8601 timestamp>"
    }
  ],
  "stakeholderUpdates": [
    {
      "stakeholderId": "<string>",
      "field": "<field that changed>",
      "oldValue": "<previous value>",
      "newValue": "<new value>"
    }
  ],
  "suggestedActions": [
    {
      "description": "<action description>",
      "owner": "<suggested owner>"
    }
  ]
}

Guidelines:
- Extract ALL meaningful signals from the text.
- Classify each signal into exactly one category.
- Severity should reflect business impact: high = revenue/relationship at risk, medium = notable change, low = informational.
- Suggest concrete, actionable next steps.
- Use the current timestamp for createdAt.`;

aiRouter.post('/extract-signals', async (req, res) => {
  try {
    const { rawText } = req.body as { rawText: string };
    if (!rawText) {
      res.status(400).json({ error: 'rawText is required' });
      return;
    }

    const result = await chatCompletion([
      { role: 'system', content: EXTRACT_SYSTEM_PROMPT },
      { role: 'user', content: rawText },
    ]);

    res.json(result);
  } catch (err) {
    console.error('extract-signals error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/generate-insights
// ---------------------------------------------------------------------------

const INSIGHTS_SYSTEM_PROMPT = `You are an AI assistant for key account managers. Given an account ID and its context, generate cross-signal insights.

Respond with a JSON object:
{
  "insights": [
    {
      "id": "<unique string e.g. INS-001>",
      "title": "<short title>",
      "description": "<detailed analysis>",
      "severity": "high" | "medium" | "low",
      "linkedSignalIds": ["<signal ids>"],
      "suggestedAction": "<recommended action>"
    }
  ]
}

Generate 2-4 insights that connect multiple signals to reveal patterns and recommend actions.`;

aiRouter.post('/generate-insights', async (req, res) => {
  try {
    const { accountId } = req.body as { accountId: string };
    if (!accountId) {
      res.status(400).json({ error: 'accountId is required' });
      return;
    }

    const result = await chatCompletion([
      { role: 'system', content: INSIGHTS_SYSTEM_PROMPT },
      { role: 'user', content: `Generate insights for account: ${accountId}` },
    ]);

    res.json(result);
  } catch (err) {
    console.error('generate-insights error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/suggest-actions
// ---------------------------------------------------------------------------

const ACTIONS_SYSTEM_PROMPT = `You are an AI assistant for key account managers. Given a signal ID, suggest concrete actions.

Respond with a JSON object:
{
  "actions": [
    {
      "description": "<action description>",
      "owner": "<suggested owner>",
      "priority": "high" | "medium" | "low",
      "dueDate": "<YYYY-MM-DD>"
    }
  ]
}

Generate 2-4 specific, actionable recommendations with realistic due dates within the next 30 days.`;

aiRouter.post('/suggest-actions', async (req, res) => {
  try {
    const { signalId } = req.body as { signalId: string };
    if (!signalId) {
      res.status(400).json({ error: 'signalId is required' });
      return;
    }

    const result = await chatCompletion<{
      actions: Array<{ description: string; owner: string; priority: string; dueDate: string }>;
    }>([
      { role: 'system', content: ACTIONS_SYSTEM_PROMPT },
      { role: 'user', content: `Suggest actions for signal: ${signalId}` },
    ]);

    res.json(result);
  } catch (err) {
    console.error('suggest-actions error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/assess-plan
// ---------------------------------------------------------------------------

const PLAN_SYSTEM_PROMPT = `You are an AI assistant for key account managers. Assess the completeness of an account plan.

Respond with a JSON object:
{
  "overallPercent": <number 0-100>,
  "sections": [
    {
      "name": "<section name>",
      "status": "complete" | "partial" | "missing" | "stale",
      "guidance": "<specific guidance>"
    }
  ],
  "recommendations": ["<recommendation>"]
}

Evaluate these standard sections: Executive Summary, Stakeholder Map, Competitive Landscape, Financial Projections, SWOT Analysis, Initiative Roadmap.`;

aiRouter.post('/assess-plan', async (req, res) => {
  try {
    const { accountId } = req.body as { accountId: string };
    if (!accountId) {
      res.status(400).json({ error: 'accountId is required' });
      return;
    }

    const result = await chatCompletion([
      { role: 'system', content: PLAN_SYSTEM_PROMPT },
      { role: 'user', content: `Assess plan completeness for account: ${accountId}` },
    ]);

    res.json(result);
  } catch (err) {
    console.error('assess-plan error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/generate-nudges
// ---------------------------------------------------------------------------

const NUDGES_SYSTEM_PROMPT = `You are an AI assistant for key account managers. Generate context-aware nudges for an account.

Respond with a JSON object:
{
  "nudges": [
    {
      "message": "<actionable nudge message>",
      "type": "reminder" | "stale-data" | "follow-up" | "missing-info",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Generate 2-4 nudges that help the account manager stay proactive. Focus on time-sensitive items first.`;

aiRouter.post('/generate-nudges', async (req, res) => {
  try {
    const { accountId } = req.body as { accountId: string };
    if (!accountId) {
      res.status(400).json({ error: 'accountId is required' });
      return;
    }

    const result = await chatCompletion<{
      nudges: Array<{ message: string; type: string; priority: string }>;
    }>([
      { role: 'system', content: NUDGES_SYSTEM_PROMPT },
      { role: 'user', content: `Generate nudges for account: ${accountId}` },
    ]);

    res.json(result);
  } catch (err) {
    console.error('generate-nudges error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/draft-followup
// ---------------------------------------------------------------------------

const FOLLOWUP_SYSTEM_PROMPT = `You are an AI assistant for key account managers. Draft a professional follow-up email based on a past interaction.

Respond with a JSON object:
{
  "subject": "<email subject>",
  "body": "<full email body with proper formatting>",
  "recipients": ["<email addresses>"]
}

Guidelines:
- Use a professional but warm tone.
- Reference specific topics discussed.
- Include clear next steps or asks.
- Keep the email concise (under 200 words).`;

aiRouter.post('/draft-followup', async (req, res) => {
  try {
    const { interactionId } = req.body as { interactionId: string };
    if (!interactionId) {
      res.status(400).json({ error: 'interactionId is required' });
      return;
    }

    const result = await chatCompletion([
      { role: 'system', content: FOLLOWUP_SYSTEM_PROMPT },
      { role: 'user', content: `Draft a follow-up email for interaction: ${interactionId}` },
    ]);

    res.json(result);
  } catch (err) {
    console.error('draft-followup error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});
