/**
 * Contract Review Agent Orchestration routes.
 *
 * Runs 6 contract review agents sequentially via Azure AI Foundry,
 * streaming progress to the frontend via SSE.
 *
 * Agent pipeline:
 *   1. Document Parse — parse contract metadata
 *   2. Clause Extraction — extract and categorize clauses
 *   3. Playbook Comparison — compare clauses against playbook
 *   4. Risk Assessment — assess risk levels for deviations
 *   5. Redline Generation — generate track-change suggestions
 *   6. Recommendation — synthesize actionable recommendations
 */

import { Router, type Request, type Response } from 'express';
import { chatCompletion } from '../aiClient.js';

export const contractAgentsRouter = Router();

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const today = () => new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// SSE helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Agent system prompts
// ---------------------------------------------------------------------------

function documentParseSystemPrompt(): string {
  return `You are the Contract Document Parse Agent — an expert at analyzing legal contracts and extracting structured metadata.

Today's date: ${today()}

ROLE: Parse the provided contract document and extract all key metadata including title, parties, contract type, dates, governing law, language, total number of clauses, and a brief summary.

REASONING INSTRUCTIONS:
1. Identify the contract title and type (e.g., SaaS Agreement, NDA, MSA, SOW)
2. Extract all parties involved with their roles
3. Find effective date, expiration date, and any renewal terms
4. Determine governing law and jurisdiction
5. Identify the language of the contract
6. Count the total number of clauses/sections
7. Provide a concise summary of the contract's purpose and scope

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "title": "<contract title>",
  "parties": [{"name": "<party name>", "role": "<role e.g. Provider, Client>"}],
  "contractType": "<type of contract>",
  "effectiveDate": "<effective date>",
  "expirationDate": "<expiration or term end date>",
  "governingLaw": "<governing law/jurisdiction>",
  "language": "<document language>",
  "totalClauses": <number of clauses>,
  "summary": "<2-3 sentence summary of the contract>",
  "reasoning": "<your detailed reasoning about how you analyzed the document>"
}

No markdown, no commentary outside the JSON.`;
}

function clauseExtractionSystemPrompt(): string {
  return `You are the Clause Extraction Agent — an expert at identifying, extracting, and categorizing all clauses from legal contracts.

Today's date: ${today()}

ROLE: Extract all clauses from the contract document, categorize each by type, and provide a brief summary of each clause's content.

CATEGORIES: liability, indemnification, termination, payment, confidentiality, force-majeure, dispute-resolution, data-protection, intellectual-property, warranty, insurance, compliance, other

REASONING INSTRUCTIONS:
1. Identify each distinct clause or section in the contract
2. Assign a sequential clause ID
3. Determine the category that best fits each clause
4. Extract the full text of each clause
5. Provide a brief summary of what each clause covers
6. Note any sub-clauses or cross-references

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "clauses": [
    {
      "clauseId": "<e.g. CL-001>",
      "title": "<clause title or heading>",
      "category": "<category from list above>",
      "text": "<full clause text>",
      "section": "<section number or heading reference, e.g. Section 3.1>",
      "hasDefinitions": <true if clause contains defined terms, false otherwise>,
      "relatedClauses": ["<IDs of related or cross-referenced clauses, empty array if none>"],
      "summary": "<brief summary of the clause>"
    }
  ],
  "reasoning": "<your detailed reasoning about extraction methodology>"
}

No markdown, no commentary outside the JSON.`;
}

function playbookComparisonSystemPrompt(): string {
  return `You are the Playbook Comparison Agent — an expert at comparing contract clauses against organizational legal playbook standard terms to identify deviations.

Today's date: ${today()}

ROLE: Compare each extracted clause against the legal playbook standard terms. Identify any deviations from the playbook, categorize the deviation type, and explain the significance.

DEVIATION TYPES: missing, weaker, stronger, different, non-standard, compliant

REASONING INSTRUCTIONS:
1. For each clause, find the corresponding playbook standard term
2. Compare the contract language against the playbook language
3. Identify the type of deviation (if any)
4. Assess whether the deviation favors our organization or the counterparty
5. Flag clauses that are missing from the contract but required by the playbook
6. Note any non-standard clauses not covered by the playbook

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "deviations": [
    {
      "clauseId": "<related clause ID>",
      "clauseTitle": "<clause title>",
      "category": "<clause category>",
      "deviationType": "<deviation type from list above>",
      "playbookStandard": "<what the playbook says>",
      "contractLanguage": "<what the contract says>",
      "significance": "<explanation of why this deviation matters>"
    }
  ],
  "reasoning": "<your detailed reasoning about the comparison process>"
}

No markdown, no commentary outside the JSON.`;
}

function riskAssessmentSystemPrompt(): string {
  return `You are the Risk Assessment Agent — an expert at evaluating legal and commercial risks in contract deviations and clauses.

Today's date: ${today()}

ROLE: Assess risk levels for each deviation and clause considering potential financial impact, legal exposure, operational disruption, and likelihood of occurrence.

RISK LEVELS: low, medium, high, critical
LIKELIHOOD: unlikely, possible, likely, almost-certain

REASONING INSTRUCTIONS:
1. For each deviation, assess the potential impact if the risk materializes
2. Determine the likelihood of the risk occurring
3. Consider financial, legal, operational, and reputational dimensions
4. Calculate an overall risk level based on impact × likelihood
5. Identify any compounding risks where multiple deviations interact
6. Prioritize risks that require immediate attention

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "risks": [
    {
      "riskId": "<e.g. RISK-001>",
      "clauseId": "<related clause ID>",
      "clauseTitle": "<clause title>",
      "riskLevel": "<low|medium|high|critical>",
      "likelihood": "<unlikely|possible|likely|almost-certain>",
      "impact": "<description of potential impact>",
      "financialExposure": "<estimated financial exposure or 'unquantified'>",
      "mitigationAvailable": true,
      "notes": "<additional context>"
    }
  ],
  "reasoning": "<your detailed reasoning about risk assessment methodology>"
}

No markdown, no commentary outside the JSON.`;
}

function redlineGenerationSystemPrompt(): string {
  return `You are the Redline Generation Agent — an expert at generating specific track-change suggestions for contract negotiations based on identified deviations and risks.

Today's date: ${today()}

ROLE: Generate specific redline suggestions (track changes) for each deviation and risk item, using playbook-approved language where available. Each suggestion should be actionable and ready for inclusion in a markup document.

TYPES: addition, deletion, modification, comment
PRIORITY: required, recommended, optional

REASONING INSTRUCTIONS:
1. For each deviation, draft specific language changes using playbook standards
2. For high/critical risks, propose required modifications
3. For medium risks, propose recommended changes
4. For low risks, propose optional improvements or comments
5. Ensure suggested language is legally precise and professionally worded
6. Include context for why each change is needed

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "redlines": [
    {
      "redlineId": "<e.g. RL-001>",
      "clauseId": "<related clause ID>",
      "clauseTitle": "<clause title>",
      "type": "<addition|deletion|modification|comment>",
      "priority": "<required|recommended|optional>",
      "originalText": "<current contract text (if modification/deletion)>",
      "suggestedText": "<proposed new text (if addition/modification)>",
      "rationale": "<why this change is needed>"
    }
  ],
  "reasoning": "<your detailed reasoning about redline generation decisions>"
}

No markdown, no commentary outside the JSON.`;
}

function recommendationSystemPrompt(): string {
  return `You are the Recommendation Agent — an expert at synthesizing contract review findings into clear, actionable recommendations for the legal team.

Today's date: ${today()}

ROLE: Synthesize all findings from document parsing, clause extraction, playbook comparison, risk assessment, and redline generation into prioritized, actionable recommendations for the legal team.

CATEGORIES: negotiate, accept, reject, escalate, add-clause
PRIORITY: high, medium, low

REASONING INSTRUCTIONS:
1. Review all prior analysis outputs holistically
2. Group related findings into coherent recommendations
3. Prioritize recommendations by risk level and business impact
4. For each recommendation, specify clear next steps
5. Identify items that require escalation to senior leadership
6. Provide an overall contract risk posture assessment

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "recommendations": [
    {
      "recommendationId": "<e.g. REC-001>",
      "category": "<negotiate|accept|reject|escalate|add-clause>",
      "priority": "<high|medium|low>",
      "title": "<brief recommendation title>",
      "description": "<detailed recommendation description>",
      "relatedClauses": ["<clause IDs>"],
      "relatedRisks": ["<risk IDs>"],
      "nextSteps": ["<specific action items>"]
    }
  ],
  "reasoning": "<your detailed reasoning about recommendation synthesis>"
}

No markdown, no commentary outside the JSON.`;
}

// ---------------------------------------------------------------------------
// Agent definitions
// ---------------------------------------------------------------------------

interface AgentDef {
  phase: string;
  name: string;
  systemPrompt: () => string;
  buildUserContent: (context: OrchestrationContext) => string;
  maxTokens?: number;
}

interface OrchestrationContext {
  contractText: string;
  playbookText: string;
  clauseLibraryText: string;
  // Accumulated outputs from prior agents
  priorOutputs: Record<string, unknown>;
}

const AGENTS: AgentDef[] = [
  {
    phase: 'document-parse',
    name: 'Document Parse Agent',
    systemPrompt: documentParseSystemPrompt,
    buildUserContent: (ctx) =>
      `Analyze the following contract document and extract all metadata:\n\n${ctx.contractText}`,
  },
  {
    phase: 'clause-extraction',
    name: 'Clause Extraction Agent',
    systemPrompt: clauseExtractionSystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      let content = `Extract all clauses from this contract document:\n\n${ctx.contractText}`;
      if (ctx.clauseLibraryText) {
        content += `\n\nClause Library Reference:\n${ctx.clauseLibraryText}`;
      }
      return content;
    },
  },
  {
    phase: 'playbook-comparison',
    name: 'Playbook Comparison Agent',
    systemPrompt: playbookComparisonSystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      const clauses = ctx.priorOutputs.clauses;
      let content = `Compare the following extracted clauses against the legal playbook:\n\nExtracted Clauses:\n${JSON.stringify(clauses, null, 2)}`;
      if (ctx.playbookText) {
        content += `\n\nLegal Playbook Standard Terms:\n${ctx.playbookText}`;
      }
      return content;
    },
  },
  {
    phase: 'risk-assessment',
    name: 'Risk Assessment Agent',
    systemPrompt: riskAssessmentSystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      const clauses = ctx.priorOutputs.clauses;
      const deviations = ctx.priorOutputs.deviations;
      let content = `Assess risks for the following clauses and deviations:\n\nClauses:\n${JSON.stringify(clauses, null, 2)}\n\nDeviations:\n${JSON.stringify(deviations, null, 2)}`;
      if (ctx.playbookText) {
        content += `\n\nLegal Playbook Standard Terms:\n${ctx.playbookText}`;
      }
      return content;
    },
  },
  {
    phase: 'redline-generation',
    name: 'Redline Generation Agent',
    systemPrompt: redlineGenerationSystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      const clauses = ctx.priorOutputs.clauses;
      const deviations = ctx.priorOutputs.deviations;
      const risks = ctx.priorOutputs.risks;
      let content = `Generate redline suggestions based on the following:\n\nClauses:\n${JSON.stringify(clauses, null, 2)}\n\nDeviations:\n${JSON.stringify(deviations, null, 2)}\n\nRisks:\n${JSON.stringify(risks, null, 2)}`;
      if (ctx.playbookText) {
        content += `\n\nLegal Playbook Standard Terms:\n${ctx.playbookText}`;
      }
      if (ctx.clauseLibraryText) {
        content += `\n\nClause Library Reference:\n${ctx.clauseLibraryText}`;
      }
      return content;
    },
  },
  {
    phase: 'recommendation',
    name: 'Recommendation Agent',
    systemPrompt: recommendationSystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      const { documentSummary, clauses, deviations, risks, redlines } = ctx.priorOutputs;
      return `Synthesize all findings into actionable recommendations:\n\nDocument Summary:\n${JSON.stringify(documentSummary, null, 2)}\n\nClauses:\n${JSON.stringify(clauses, null, 2)}\n\nDeviations:\n${JSON.stringify(deviations, null, 2)}\n\nRisks:\n${JSON.stringify(risks, null, 2)}\n\nRedlines:\n${JSON.stringify(redlines, null, 2)}`;
    },
  },
];

// ---------------------------------------------------------------------------
// Map raw LLM output to structured agent outputs
// ---------------------------------------------------------------------------

function mapAgentOutput(phase: string, raw: Record<string, unknown>): unknown {
  switch (phase) {
    case 'document-parse': {
      // The AI prompt returns "title" but the frontend type expects "contractTitle"
      const doc = { ...raw };
      if ('title' in doc && !('contractTitle' in doc)) {
        doc.contractTitle = doc.title;
        delete doc.title;
      }
      return doc;
    }
    case 'clause-extraction':
      return (raw as { clauses?: unknown[] }).clauses ?? [];
    case 'playbook-comparison': {
      // AI returns playbookStandard/significance/category but frontend expects
      // playbookLanguage/explanation/severity
      const deviations = (raw as { deviations?: Record<string, unknown>[] }).deviations ?? [];
      return deviations.map((d) => ({
        clauseId: d.clauseId ?? '',
        deviationType: d.deviationType ?? 'different',
        contractLanguage: d.contractLanguage ?? '',
        playbookLanguage: d.playbookStandard ?? d.playbookLanguage ?? '',
        explanation: d.significance ?? d.explanation ?? '',
        severity: d.severity ?? 'medium',
      }));
    }
    case 'risk-assessment': {
      // AI returns impact/notes/clauseTitle but frontend expects
      // potentialImpact/description/category/recommendedAction/status
      const risks = (raw as { risks?: Record<string, unknown>[] }).risks ?? [];
      return risks.map((r) => ({
        riskId: r.riskId ?? '',
        clauseId: r.clauseId ?? '',
        category: r.category ?? r.clauseTitle ?? '',
        riskLevel: r.riskLevel ?? 'medium',
        description: r.description ?? r.notes ?? '',
        potentialImpact: r.potentialImpact ?? r.impact ?? '',
        likelihood: r.likelihood ?? 'possible',
        recommendedAction: r.recommendedAction ?? '',
        alternativeClause: r.alternativeClause,
        status: r.status ?? 'identified',
      }));
    }
    case 'redline-generation': {
      // AI returns clauseTitle but frontend expects source
      const redlines = (raw as { redlines?: Record<string, unknown>[] }).redlines ?? [];
      return redlines.map((r) => ({
        redlineId: r.redlineId ?? '',
        clauseId: r.clauseId ?? '',
        type: r.type ?? 'modification',
        originalText: r.originalText ?? '',
        suggestedText: r.suggestedText ?? '',
        rationale: r.rationale ?? '',
        source: r.source ?? (r.clauseTitle ? `Clause: ${r.clauseTitle}` : ''),
        priority: r.priority ?? 'recommended',
      }));
    }
    case 'recommendation': {
      // AI returns relatedClauses/nextSteps but frontend expects
      // affectedClauses/assignedTo/playbookReference
      const recs = (raw as { recommendations?: Record<string, unknown>[] }).recommendations ?? [];
      return recs.map((r) => ({
        recommendationId: r.recommendationId ?? '',
        category: r.category ?? 'negotiate',
        title: r.title ?? '',
        description: r.description ?? '',
        affectedClauses: r.affectedClauses ?? r.relatedClauses ?? [],
        priority: r.priority ?? 'medium',
        assignedTo: r.assignedTo ?? 'Legal Team',
        playbookReference: r.playbookReference ?? '',
      }));
    }
    default:
      return raw;
  }
}

// Phase to output key mapping
const PHASE_TO_KEY: Record<string, string> = {
  'document-parse': 'documentSummary',
  'clause-extraction': 'clauses',
  'playbook-comparison': 'deviations',
  'risk-assessment': 'risks',
  'redline-generation': 'redlines',
  'recommendation': 'recommendations',
};

// ---------------------------------------------------------------------------
// SSE Orchestrator — runs 6 agents sequentially
// ---------------------------------------------------------------------------

contractAgentsRouter.post('/contract/run-agents-sse', async (req: Request, res: Response) => {
  try {
    const {
      contractText,
      playbookText,
      clauseLibraryText,
    } = req.body as {
      contractText: string;
      playbookText?: string;
      clauseLibraryText?: string;
    };

    if (!contractText) {
      res.status(400).json({ error: 'contractText is required' });
      return;
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const context: OrchestrationContext = {
      contractText,
      playbookText: playbookText ?? '',
      clauseLibraryText: clauseLibraryText ?? '',
      priorOutputs: {},
    };

    // Run agents sequentially — each builds on prior outputs
    for (const agent of AGENTS) {
      sendSSE(res, {
        type: 'agent-start',
        phase: agent.phase,
        message: `Running ${agent.name}…`,
      });

      try {
        const userContent = agent.buildUserContent(context);
        const result = await chatCompletion<Record<string, unknown>>(
          [
            { role: 'system', content: agent.systemPrompt() },
            { role: 'user', content: userContent },
          ],
          0.3,
          agent.maxTokens ?? 4096,
        );

        // Extract reasoning before mapping
        const reasoning = (result as Record<string, unknown>).reasoning as string | undefined;

        // Map and store the output
        const mapped = mapAgentOutput(agent.phase, result);
        const outputKey = PHASE_TO_KEY[agent.phase] ?? agent.phase;
        context.priorOutputs[outputKey] = mapped;

        sendSSE(res, {
          type: 'agent-done',
          phase: agent.phase,
          message: `${agent.name} complete`,
          reasoning,
          data: mapped,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Agent failed';
        sendSSE(res, {
          type: 'agent-error',
          phase: agent.phase,
          message: `${agent.name} failed`,
          error: message,
        });
        // Continue with remaining agents even if one fails
      }
    }

    // Send final combined result
    sendSSE(res, {
      type: 'all-done',
      data: context.priorOutputs,
    });
    res.end();
  } catch (err) {
    console.error('contract/run-agents-sse error:', err);
    const message = err instanceof Error ? err.message : 'Orchestrator failed';
    if (res.headersSent) {
      sendSSE(res, { type: 'error', error: message });
      res.end();
    } else {
      res.status(502).json({ error: 'AI request failed', details: message });
    }
  }
});
