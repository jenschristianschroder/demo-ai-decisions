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

// ---------------------------------------------------------------------------
// POST /api/ai/generate-demo-data
// ---------------------------------------------------------------------------

const GENERATE_DEMO_DATA_SYSTEM_PROMPT = `You are an AI assistant that generates realistic demo data for an Account Development Planning (ADP) application.

Today's date: ${new Date().toISOString().split('T')[0]}

Given a natural-language description of a business, industry, or use case, generate a COMPLETE, self-consistent dataset.
If the user's prompt is not meaningful for generating account planning data (e.g. it is a question, gibberish, or an unrelated request), respond with:
{ "valid": false, "message": "<short explanation why the prompt is not suitable>" }

Otherwise respond with:
{
  "valid": true,
  "data": {
    "accounts": [ ... ],
    "stakeholders": [ ... ],
    "interactions": [ ... ],
    "signals": [ ... ],
    "initiatives": [ ... ],
    "nudges": [ ... ],
    "accountPlans": [ ... ]
  }
}

Generate 4–6 accounts, each with:
- 2–3 stakeholders
- 2–3 interactions
- 1–3 signals
- 1–2 initiatives (each with 2–3 actions)
- 2–3 nudges
- 1 account plan

ALL cross-references MUST be internally consistent:
- Signal.sourceInteractionId must reference a real Interaction.id for the same account
- Interaction.extractedSignalIds must reference real Signal.id values for the same account
- Initiative.linkedSignalIds must reference real Signal.id values for the same account
- Nudge.targetId must reference a real account ID, initiative ID, or action ID
- AccountPlan.linkedInitiativeIds must reference real Initiative.id values for the same account
- Action.initiativeId must match the parent Initiative.id

Vary account health (some at risk < 50, some thriving > 75), signal severity distribution, and initiative statuses to make the dashboard visually interesting.
Name accounts, stakeholders, and initiatives in a way that is unmistakably from the user's described industry/business domain.

### TypeScript interfaces (follow these EXACTLY):

AdpAccount: { id: string, name: string, industry: string, region: string, revenueTier: "Tier 1"|"Tier 2"|"Tier 3", kam: string, healthScore: number (0-100), healthTrend: "improving"|"stable"|"declining", lastUpdated: string (ISO 8601), signalCount: number, overdueActions: number }

Stakeholder: { id: string, accountId: string, name: string, role: string, sentiment: "positive"|"neutral"|"negative", influenceLevel: "high"|"medium"|"low", lastContactDate: string (YYYY-MM-DD), email: string }

Interaction: { id: string, accountId: string, type: "meeting"|"email"|"call"|"survey", date: string (YYYY-MM-DD), summary: string, rawNotes: string (detailed paragraph), participants: string[], extractedSignalIds: string[] }

Signal: { id: string, accountId: string, category: "risk"|"opportunity"|"gap"|"sentiment-shift", severity: "high"|"medium"|"low", sourceInteractionId: string, description: string, status: "new"|"acknowledged"|"actioned"|"dismissed", createdAt: string (ISO 8601) }

Initiative: { id: string, accountId: string, title: string, description: string, linkedSignalIds: string[], owner: string, status: "proposed"|"in-progress"|"completed"|"stalled", priority: "high"|"medium"|"low", dueDate: string (YYYY-MM-DD), progressPercent: number (0-100), createdAt: string (ISO 8601), actions: Action[] }

Action: { id: string, initiativeId: string, description: string, owner: string, dueDate: string (YYYY-MM-DD), status: "pending"|"done"|"overdue" }

Nudge: { id: string, accountId: string, message: string, type: "reminder"|"stale-data"|"follow-up"|"missing-info", targetType: "account"|"initiative"|"action", targetId: string, createdAt: string (ISO 8601), dismissed: false }

AccountPlan: { id: string, accountId: string, vision: string, objectives: string[], swotSummary: { strengths: string[], weaknesses: string[], opportunities: string[], threats: string[] }, linkedInitiativeIds: string[], completenessPercent: number (0-100), sections: PlanSection[] }

PlanSection: { name: string, status: "complete"|"partial"|"missing"|"stale", lastUpdated: string (YYYY-MM-DD), guidance: string }

Use IDs with clear prefixes: accounts use kebab-case slugs, stakeholders "STK-001" etc., interactions "INT-001", signals "SIG-001", initiatives "INIT-001", actions "ACT-001", nudges "NDG-001", plans "PLAN-001".

Respond with ONLY valid JSON — no markdown, no commentary.`;

aiRouter.post('/generate-demo-data', async (req, res) => {
  try {
    const { prompt } = req.body as { prompt: string };
    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    const result = await chatCompletion(
      [
        { role: 'system', content: GENERATE_DEMO_DATA_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      0.7,
      16384,
    );

    res.json(result);
  } catch (err) {
    console.error('generate-demo-data error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/generate-demo-plan
// ---------------------------------------------------------------------------

const GENERATE_DEMO_PLAN_SYSTEM_PROMPT = `You are an AI assistant that generates a plan for realistic demo data for an Account Development Planning (ADP) application.

Today's date: ${new Date().toISOString().split('T')[0]}

Given a natural-language description of a business, industry, or use case, generate a PLAN consisting of 4–6 accounts.
If the user's prompt is not meaningful for generating account planning data (e.g. it is a question, gibberish, or an unrelated request), respond with:
{ "valid": false, "message": "<short explanation why the prompt is not suitable>" }

Otherwise respond with:
{
  "valid": true,
  "plan": {
    "accounts": [
      {
        "id": "<kebab-case slug>",
        "name": "<company name>",
        "industry": "<industry>",
        "region": "<region>",
        "revenueTier": "Tier 1"|"Tier 2"|"Tier 3",
        "kam": "<key account manager name>",
        "healthScore": <0-100>,
        "healthTrend": "improving"|"stable"|"declining",
        "signalCount": <number>,
        "overdueActions": <number>
      }
    ]
  }
}

Vary account health (some at risk < 50, some thriving > 75) to make the dashboard visually interesting.
Name accounts in a way that is unmistakably from the user's described industry/business domain.
Use 2–3 different KAM names across the accounts.
Use IDs as kebab-case slugs (e.g. "acme-pharma", "globex-logistics").

Respond with ONLY valid JSON — no markdown, no commentary.`;

aiRouter.post('/generate-demo-plan', async (req, res) => {
  try {
    const { prompt } = req.body as { prompt: string };
    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    const result = await chatCompletion(
      [
        { role: 'system', content: GENERATE_DEMO_PLAN_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      0.7,
      4096,
    );

    res.json(result);
  } catch (err) {
    console.error('generate-demo-plan error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/generate-account-data
// ---------------------------------------------------------------------------

const GENERATE_ACCOUNT_DATA_SYSTEM_PROMPT = `You are an AI assistant that generates realistic demo data for a SINGLE account in an Account Development Planning (ADP) application.

Today's date: ${new Date().toISOString().split('T')[0]}

You will be given an account object and the original user prompt describing the business/industry context.
Generate a COMPLETE dataset for this single account including:
- 2–3 stakeholders
- 2–3 interactions (with detailed rawNotes paragraphs)
- 1–3 signals
- 1–2 initiatives (each with 2–3 actions)
- 2–3 nudges
- 1 account plan (with vision, objectives, SWOT, and 4–6 plan sections)

ALL cross-references MUST be internally consistent:
- Signal.sourceInteractionId must reference a real Interaction.id for this account
- Interaction.extractedSignalIds must reference real Signal.id values for this account
- Initiative.linkedSignalIds must reference real Signal.id values for this account
- Nudge.targetId must reference a real account ID, initiative ID, or action ID
- AccountPlan.linkedInitiativeIds must reference real Initiative.id values for this account
- Action.initiativeId must match the parent Initiative.id
- All accountId fields must match the provided account ID

Vary signal severity distribution and initiative statuses.

### TypeScript interfaces (follow these EXACTLY):

Stakeholder: { id: string, accountId: string, name: string, role: string, sentiment: "positive"|"neutral"|"negative", influenceLevel: "high"|"medium"|"low", lastContactDate: string (YYYY-MM-DD), email: string }

Interaction: { id: string, accountId: string, type: "meeting"|"email"|"call"|"survey", date: string (YYYY-MM-DD), summary: string, rawNotes: string (detailed paragraph), participants: string[], extractedSignalIds: string[] }

Signal: { id: string, accountId: string, category: "risk"|"opportunity"|"gap"|"sentiment-shift", severity: "high"|"medium"|"low", sourceInteractionId: string, description: string, status: "new"|"acknowledged"|"actioned"|"dismissed", createdAt: string (ISO 8601) }

Initiative: { id: string, accountId: string, title: string, description: string, linkedSignalIds: string[], owner: string, status: "proposed"|"in-progress"|"completed"|"stalled", priority: "high"|"medium"|"low", dueDate: string (YYYY-MM-DD), progressPercent: number (0-100), createdAt: string (ISO 8601), actions: Action[] }

Action: { id: string, initiativeId: string, description: string, owner: string, dueDate: string (YYYY-MM-DD), status: "pending"|"done"|"overdue" }

Nudge: { id: string, accountId: string, message: string, type: "reminder"|"stale-data"|"follow-up"|"missing-info", targetType: "account"|"initiative"|"action", targetId: string, createdAt: string (ISO 8601), dismissed: false }

AccountPlan: { id: string, accountId: string, vision: string, objectives: string[], swotSummary: { strengths: string[], weaknesses: string[], opportunities: string[], threats: string[] }, linkedInitiativeIds: string[], completenessPercent: number (0-100), sections: PlanSection[] }

PlanSection: { name: string, status: "complete"|"partial"|"missing"|"stale", lastUpdated: string (YYYY-MM-DD), guidance: string }

Use IDs with clear prefixes and include account-specific numbering to avoid collisions across accounts. For example, for account index 2: STK-2-001, INT-2-001, SIG-2-001, INIT-2-001, ACT-2-001, NDG-2-001, PLAN-2-001.

Respond with ONLY valid JSON matching this structure — no markdown, no commentary:
{
  "stakeholders": [...],
  "interactions": [...],
  "signals": [...],
  "initiatives": [...],
  "nudges": [...],
  "accountPlan": { ... }
}`;

aiRouter.post('/generate-account-data', async (req, res) => {
  try {
    const { prompt, account, accountIndex } = req.body as {
      prompt: string;
      account: Record<string, unknown>;
      accountIndex: number;
    };
    if (!prompt || !account) {
      res.status(400).json({ error: 'prompt and account are required' });
      return;
    }

    const userMessage = `Original business context: ${prompt}

Account to generate data for (index ${accountIndex ?? 0}):
${JSON.stringify(account, null, 2)}

Generate a complete dataset for this account. Use ID prefix number ${accountIndex ?? 0} to avoid collisions (e.g. STK-${accountIndex ?? 0}-001).`;

    const result = await chatCompletion(
      [
        { role: 'system', content: GENERATE_ACCOUNT_DATA_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      0.7,
      8192,
    );

    res.json(result);
  } catch (err) {
    console.error('generate-account-data error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/draft-followup
// ---------------------------------------------------------------------------

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
