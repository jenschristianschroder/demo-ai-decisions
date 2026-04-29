/**
 * Finance AI API routes.
 *
 * Each endpoint accepts a JSON body with the parameters needed for the AI
 * function and returns the model's JSON response.
 */

import { Router } from 'express';
import { chatCompletion } from '../aiClient.js';

export const financeAiRouter = Router();

// ---------------------------------------------------------------------------
// POST /api/ai/finance/generate-explanation
// ---------------------------------------------------------------------------

const EXPLANATION_SYSTEM_PROMPT = `You are an AI assistant for group finance controllers reviewing subsidiary financial submissions. Given anomaly details, generate a structured explanation.

Respond with a JSON object matching this schema:
{
  "explanation": "<clear explanation of what the anomaly means>",
  "possibleCauses": ["<cause 1>", "<cause 2>", ...],
  "recommendedFollowUp": "<specific follow-up action>",
  "draftEmail": "<professional follow-up email to subsidiary controller>",
  "confidenceLevel": <number between 0 and 1>,
  "evidenceList": ["<evidence item 1>", "<evidence item 2>", ...]
}

Guidelines:
- Explain the anomaly in business terms a finance controller can act on.
- List 2-4 possible causes ordered by likelihood.
- The draft email should be professional, reference specific figures, and request clarification.
- Confidence level should reflect data quality: lower when commentary is missing/weak or detection method is less certain.
- Evidence list should include key financial figures, variance amounts, and relevant context.`;

financeAiRouter.post('/generate-explanation', async (req, res) => {
  try {
    const { anomaly } = req.body as { anomaly: Record<string, unknown> };
    if (!anomaly) {
      res.status(400).json({ error: 'anomaly is required' });
      return;
    }

    const result = await chatCompletion([
      { role: 'system', content: EXPLANATION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this financial anomaly and generate an explanation:\n\n${JSON.stringify(anomaly, null, 2)}`,
      },
    ]);

    res.json(result);
  } catch (err) {
    console.error('generate-explanation error:', err);
    res.status(502).json({ error: 'AI request failed' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/finance/regenerate-email
// ---------------------------------------------------------------------------

const REGENERATE_EMAIL_SYSTEM_PROMPT = `You are an AI assistant for group finance controllers. Given anomaly details, draft a professional follow-up email to the subsidiary controller requesting clarification.

Respond with a JSON object:
{
  "draftEmail": "<full email body>"
}

Guidelines:
- Use a professional but clear tone appropriate for inter-company finance communication.
- Reference specific financial figures (actual, budget, variance).
- Request specific documentation or clarification items.
- Keep the email concise and actionable (under 200 words).
- Vary the structure and emphasis compared to previous drafts.`;

financeAiRouter.post('/regenerate-email', async (req, res) => {
  try {
    const { anomaly } = req.body as { anomaly: Record<string, unknown> };
    if (!anomaly) {
      res.status(400).json({ error: 'anomaly is required' });
      return;
    }

    const result = await chatCompletion<{ draftEmail: string }>([
      { role: 'system', content: REGENERATE_EMAIL_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Draft a follow-up email for this financial anomaly:\n\n${JSON.stringify(anomaly, null, 2)}`,
      },
    ]);

    res.json(result);
  } catch (err) {
    console.error('regenerate-email error:', err);
    res.status(502).json({ error: 'AI request failed' });
  }
});
