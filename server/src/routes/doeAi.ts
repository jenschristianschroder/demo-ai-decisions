/**
 * R&D DoE Report Assistant AI routes.
 *
 * These endpoints back the "R&D DoE Report Assistant" demo with real Azure AI
 * Foundry calls (via the shared `chatCompletion` Managed-Identity client).
 *
 * Design principle — *AI drafts, the scientist stays accountable*:
 *   • The statistics (main effects, interactions, p-values, R²) are computed
 *     deterministically on the client in `src/lib/doeAnalysis.ts`. The model is
 *     NEVER asked to compute or invent numbers — it only writes narrative text
 *     grounded in the values supplied to it.
 *   • Every numeric claim is re-verified in code after drafting, so any model
 *     drift is caught and corrected before the report can be approved.
 *
 * The frontend (`src/lib/mockDoeAi.ts`) falls back to a deterministic mock when
 * the backend is unavailable, so `npm run dev` still works with no credentials.
 */

import { Router } from 'express';
import { chatCompletion } from '../aiClient.js';

export const doeAiRouter = Router();

// ---------------------------------------------------------------------------
// POST /api/ai/doe/draft-sections
// ---------------------------------------------------------------------------

const DRAFT_SECTIONS_SYSTEM_PROMPT = `You are an AI assistant that drafts a Design of Experiments (DoE) report for a medical-device R&D team. You write clear, compliant, scientific prose.

You are given:
- "study": the experiment definition (factors, responses, runs, metadata).
- "analysis": the ALREADY-COMPUTED statistics (main effects, interactions, p-values, R²). These are the ground truth.
- "template": the ordered list of report sections to write, each with an id, title, and guidance.
- "claimSpecs": specific numeric claims you must make, each with an id and the exact computed value (and unit) you MUST use verbatim.

CRITICAL RULES:
- NEVER invent, recompute, or alter any number. Use ONLY the numbers provided in "analysis" and "claimSpecs".
- When a section needs a value covered by a claimSpec, state exactly that value and unit.
- Write one markdown body per template section. Keep the section id and title from the template.
- Be concise and factual. Do not add sections that are not in the template.
- The raw-data run table (the "Appendix (raw data)" section) is inserted deterministically by code. Do NOT author, summarize, abbreviate (e.g. with "..." rows), or re-create that table; if an appendix section is included, write only a brief introductory sentence and no table.

Respond with ONLY valid JSON matching this schema:
{
  "sections": [
    { "id": "<template section id>", "title": "<template section title>", "markdown": "<markdown body>" }
  ],
  "claims": [
    { "id": "<claimSpec id>", "claimedValue": <the numeric value you used> }
  ]
}

The "claims" array MUST echo, for every claimSpec id, the numeric value you actually wrote into the narrative, so it can be fact-checked against the computed value.`;

interface DraftSectionsBody {
  study: Record<string, unknown>;
  analysis: Record<string, unknown>;
  template: unknown;
  claimSpecs: unknown;
}

doeAiRouter.post('/draft-sections', async (req, res) => {
  try {
    const { study, analysis, template, claimSpecs } = req.body as DraftSectionsBody;
    if (!study || !analysis || !template) {
      res.status(400).json({ error: 'study, analysis, and template are required' });
      return;
    }

    const result = await chatCompletion(
      [
        { role: 'system', content: DRAFT_SECTIONS_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            'Draft the DoE report sections grounded ONLY in the supplied analysis and claimSpecs.\n\n' +
            `study:\n${JSON.stringify(study)}\n\n` +
            `analysis:\n${JSON.stringify(analysis)}\n\n` +
            `template:\n${JSON.stringify(template)}\n\n` +
            `claimSpecs:\n${JSON.stringify(claimSpecs ?? [])}`,
        },
      ],
      0.4,
      4096,
    );

    res.json(result);
  } catch (err) {
    console.error('doe/draft-sections error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/doe/correct-claims
// ---------------------------------------------------------------------------

const CORRECT_CLAIMS_SYSTEM_PROMPT = `You are an AI assistant that corrects numeric claims in a DoE report. Each claim has the originally-written text, the (wrong) claimed value, and the correct computed value with its unit.

Rewrite each claim's sentence so it states the CORRECT computed value, keeping the wording natural and otherwise unchanged. Do not alter any other facts.

Respond with ONLY valid JSON:
{
  "corrections": [
    { "id": "<claim id>", "correctedText": "<the rewritten sentence using the computed value>" }
  ]
}`;

doeAiRouter.post('/correct-claims', async (req, res) => {
  try {
    const { claims } = req.body as { claims: unknown };
    if (!Array.isArray(claims)) {
      res.status(400).json({ error: 'claims (array) is required' });
      return;
    }
    if (claims.length === 0) {
      res.json({ corrections: [] });
      return;
    }

    const result = await chatCompletion(
      [
        { role: 'system', content: CORRECT_CLAIMS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Correct these flagged numeric claims:\n\n${JSON.stringify(claims, null, 2)}`,
        },
      ],
      0.2,
      2048,
    );

    res.json(result);
  } catch (err) {
    console.error('doe/correct-claims error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/doe/check-completeness
// ---------------------------------------------------------------------------

const CHECK_COMPLETENESS_SYSTEM_PROMPT = `You are an AI assistant that checks a draft DoE report against a "Definition of Good" completeness checklist for medical-device R&D documentation.

You are given:
- "sections": the drafted report sections (id, title, markdown).
- "checklist": the checklist items, each with an id, label, and the sectionIds it is checked against.

For each checklist item, decide whether the draft satisfies it and write a short note. An item is satisfied only if the referenced sections exist, are non-empty, and actually address the item's requirement. Be a strict but fair reviewer; surface concrete gaps.

Respond with ONLY valid JSON:
{
  "results": [
    { "id": "<checklist item id>", "satisfied": <true|false>, "note": "<short reviewer note>" }
  ]
}`;

doeAiRouter.post('/check-completeness', async (req, res) => {
  try {
    const { sections, checklist } = req.body as { sections: unknown; checklist: unknown };
    if (!Array.isArray(sections) || !Array.isArray(checklist)) {
      res.status(400).json({ error: 'sections and checklist (arrays) are required' });
      return;
    }

    const result = await chatCompletion(
      [
        { role: 'system', content: CHECK_COMPLETENESS_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            'Check the draft against the checklist.\n\n' +
            `sections:\n${JSON.stringify(sections)}\n\n` +
            `checklist:\n${JSON.stringify(checklist)}`,
        },
      ],
      0.2,
      2048,
    );

    res.json(result);
  } catch (err) {
    console.error('doe/check-completeness error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/doe/rank-knowledge
// ---------------------------------------------------------------------------

const RANK_KNOWLEDGE_SYSTEM_PROMPT = `You are an AI assistant that surfaces relevant prior experiments for a new DoE study, acting like a semantic retrieval/ranking step over an R&D knowledge base.

You are given:
- "study": metadata about the current study (factors, responses, objective).
- "corpus": prior-experiment summaries, each with an id, title, summary, takeaway, and tags.

Rank the most relevant prior experiments (return up to 3, most relevant first). For each, give a relevance score between 0 and 1, the matched tags, and a one-sentence reason explaining the relevance to the current study.

Respond with ONLY valid JSON:
{
  "hits": [
    { "id": "<corpus item id>", "relevance": <0..1>, "matchedTags": ["<tag>", ...], "reason": "<why it is relevant>" }
  ]
}`;

doeAiRouter.post('/rank-knowledge', async (req, res) => {
  try {
    const { study, corpus } = req.body as { study: unknown; corpus: unknown };
    if (!study || !Array.isArray(corpus)) {
      res.status(400).json({ error: 'study and corpus (array) are required' });
      return;
    }

    const result = await chatCompletion(
      [
        { role: 'system', content: RANK_KNOWLEDGE_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            'Rank the most relevant prior experiments for this study.\n\n' +
            `study:\n${JSON.stringify(study)}\n\n` +
            `corpus:\n${JSON.stringify(corpus)}`,
        },
      ],
      0.3,
      2048,
    );

    res.json(result);
  } catch (err) {
    console.error('doe/rank-knowledge error:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: 'AI request failed', details: message });
  }
});
