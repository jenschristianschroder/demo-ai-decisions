/**
 * NDA Agent Orchestration routes.
 *
 * Two SSE endpoints:
 *   1. POST /nda/recommend-template-sse — Template Recommendation Agent (stage 1)
 *   2. POST /nda/run-workflow-sse — Full pipeline stages 2–7
 *
 * Agent pipeline:
 *   1. Template Recommendation — recommend best template for intake
 *   2. Template Selection — confirm template and load text
 *   3. Draft Generation — fill template with intake data
 *   4. Redline Assessment — classify counterparty redline changes
 *   5. Playbook Validation — validate draft against playbook
 *   6. Approval Routing — determine tier and approver
 *   7. Signature Dispatch — prepare dispatch and audit trail
 */

import { Router, type Request, type Response } from 'express';
import { chatCompletion } from '../aiClient.js';

export const ndaAgentsRouter = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const today = () => new Date().toISOString().split('T')[0];

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

function templateRecommendationPrompt(): string {
  return `You are the NDA Template Recommendation Agent — an expert at selecting the most appropriate NDA template for a given business scenario.

Today's date: ${today()}

ROLE: Analyze the intake data and template catalog to recommend the best NDA template. Consider the purpose of disclosure, counterparty type, nature of the confidential information, jurisdiction needs, and term expectations.

IMPORTANT: You may ONLY recommend templates that exist in the provided catalog. Do not invent templates.

REASONING INSTRUCTIONS:
1. Identify the nature of the relationship (partner, vendor, employee, candidate)
2. Determine if the disclosure is mutual or one-way
3. Assess the type of information being shared (general, technical, financial)
4. Consider jurisdiction and term requirements
5. Match against the catalog entries
6. If confidence < 0.8, generate clarifying questions that would help narrow the selection

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "recommendedTemplateId": "<template ID from catalog>",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<detailed explanation of why this template is the best fit>",
  "alternatives": [
    {"templateId": "<alt template ID>", "reason": "<why this could also work>"}
  ],
  "clarifyingQuestions": ["<question to increase confidence, if confidence < 0.8>"]
}

No markdown, no commentary outside the JSON.`;
}

function templateSelectionPrompt(): string {
  return `You are the NDA Template Selection Agent — you confirm and prepare the selected NDA template.

Today's date: ${today()}

ROLE: Confirm the template selection, extract key metadata from the template, and prepare it for draft generation.

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "templateId": "<confirmed template ID>",
  "templateName": "<template name>",
  "templateVersion": "<version from template header>",
  "keyClauses": ["<list of key clause titles>"],
  "defaultTerm": "<default term from template>",
  "defaultJurisdiction": "<default jurisdiction>",
  "reasoning": "<confirmation reasoning>"
}

No markdown, no commentary outside the JSON.`;
}

function draftGenerationPrompt(): string {
  return `You are the NDA Draft Generation Agent — an expert at filling NDA templates with specific party and deal details.

Today's date: ${today()}

ROLE: Generate a complete NDA document by filling the selected template with the provided intake data. Replace all placeholder fields with actual values.

INSTRUCTIONS:
1. Replace [Party A Name], [Party B Name] with actual party names
2. Replace [Effective Date] with today's date
3. Replace [Description of Purpose] with the stated purpose
4. Fill in term, jurisdiction, and governing law from intake data or template defaults
5. Preserve all legal language and clause structure from the template

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "title": "<NDA title>",
  "templateId": "<template used>",
  "templateVersion": "<version>",
  "content": "<full NDA text with placeholders filled>",
  "parties": [{"name": "<party name>", "role": "<role>"}],
  "effectiveDate": "<date>",
  "term": "<term description>",
  "governingLaw": "<governing law>",
  "summary": "<2-3 sentence summary>",
  "reasoning": "<draft generation reasoning>"
}

No markdown, no commentary outside the JSON.`;
}

function redlineAssessmentPrompt(): string {
  return `You are the NDA Redline Assessment Agent — an expert at analyzing counterparty-proposed changes to NDAs and classifying each change against the legal playbook.

Today's date: ${today()}

ROLE: Review each change in the counterparty's redlined NDA, classify it (accept/reject/negotiate/escalate), assess severity, and provide a suggested response.

CLASSIFICATIONS:
- accept: Change is within acceptable playbook ranges
- reject: Change weakens protections beyond acceptable limits
- negotiate: Change is outside preferred range but negotiable
- escalate: Change triggers escalation rules (needs senior review)

SEVERITY: low, medium, high, critical

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "redlineItems": [
    {
      "clauseId": "<e.g. CL-001>",
      "clauseTitle": "<clause name>",
      "originalText": "<our original text>",
      "counterpartyText": "<their proposed text>",
      "classification": "<accept|reject|negotiate|escalate>",
      "severity": "<low|medium|high|critical>",
      "rationale": "<why this classification>",
      "suggestedResponse": "<recommended response or counter-proposal>",
      "playbookReference": "<relevant playbook section>"
    }
  ],
  "reasoning": "<overall assessment reasoning>"
}

No markdown, no commentary outside the JSON.`;
}

function playbookValidationPrompt(): string {
  return `You are the NDA Playbook Validation Agent — an expert at validating NDA drafts against organizational playbook standards.

Today's date: ${today()}

ROLE: Validate the current NDA draft against the playbook clause-by-clause. Check term ranges, jurisdiction, scope, indemnification, residuals, and all other playbook-defined standards.

IMPORTANT DATA CONSISTENCY RULES:
- If "compliant" is false, at LEAST ONE finding MUST have status "non-compliant" or "warning". Never mark all findings "compliant" while setting overall compliance to false.
- If ALL findings are "compliant", then "compliant" MUST be true.
- The "compliant" field should be false when ANY finding is "non-compliant".

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "compliant": <true|false>,
  "findings": [
    {
      "clause": "<clause name>",
      "status": "<compliant|warning|non-compliant>",
      "detail": "<description of finding>"
    }
  ],
  "reasoning": "<overall validation reasoning>"
}

No markdown, no commentary outside the JSON.`;
}

function approvalRoutingPrompt(): string {
  return `You are the NDA Approval Routing Agent — an expert at determining the correct approval tier and routing for NDA execution.

Today's date: ${today()}

ROLE: Based on the validated NDA, escalation rules, and any redline findings, determine the correct approval tier (1/2/3), identify the approver, and list the triggers that determined the tier.

TIERS:
- tier-1: Auto-approve (Legal Coordinator) — standard templates, no modifications
- tier-2: Legal Counsel Review — redline modifications, non-preferred jurisdiction, etc.
- tier-3: Senior Leadership / CLO — non-compete clauses, unlimited liability, etc.

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "tier": "<tier-1|tier-2|tier-3>",
  "approver": "<approver name/role>",
  "approverRole": "<role title>",
  "decision": "<approved|conditionally-approved|escalated|rejected>",
  "conditions": ["<conditions for approval, if any>"],
  "reasoning": "<detailed reasoning for tier assignment>",
  "sla": "<SLA for review>",
  "triggers": ["<list of escalation triggers that fired>"]
}

No markdown, no commentary outside the JSON.`;
}

function signatureDispatchPrompt(): string {
  return `You are the NDA Signature Dispatch Agent — you prepare the final NDA for signature and create the audit trail.

Today's date: ${today()}

ROLE: Prepare the approved NDA for signature dispatch. Generate the version history, audit trail, and dispatch summary.

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "signatureDispatch": {
    "status": "<ready|pending-approval|blocked>",
    "dispatchMethod": "<e.g. DocuSign, manual>",
    "recipients": [{"name": "<name>", "email": "<email>", "role": "<role>"}],
    "summary": "<dispatch summary>",
    "reasoning": "<dispatch reasoning>"
  },
  "versionHistory": [
    {
      "version": <number>,
      "date": "<date>",
      "action": "<action>",
      "actor": "<actor>",
      "summary": "<summary>",
      "changes": ["<list of changes>"]
    }
  ],
  "auditTrail": [
    {
      "timestamp": "<ISO timestamp>",
      "agent": "<agent name>",
      "phase": "<phase>",
      "action": "<action taken>",
      "detail": "<detail>",
      "citations": ["<references>"]
    }
  ]
}

No markdown, no commentary outside the JSON.`;
}

// ---------------------------------------------------------------------------
// Agent definitions for workflow pipeline
// ---------------------------------------------------------------------------

interface AgentDef {
  phase: string;
  name: string;
  systemPrompt: () => string;
  buildUserContent: (context: WorkflowContext) => string;
  maxTokens?: number;
  conditional?: (context: WorkflowContext) => boolean;
}

interface WorkflowContext {
  intakeData: Record<string, unknown>;
  templateId: string;
  templateText: string;
  playbookText: string;
  escalationRulesText: string;
  counterpartyRedlineText: string;
  priorOutputs: Record<string, unknown>;
}

const WORKFLOW_AGENTS: AgentDef[] = [
  {
    phase: 'template-selection',
    name: 'Template Selection Agent',
    systemPrompt: templateSelectionPrompt,
    buildUserContent: (ctx) =>
      `Confirm the selection of template "${ctx.templateId}" for this NDA.\n\nIntake Data:\n${JSON.stringify(ctx.intakeData, null, 2)}\n\nTemplate Text:\n${ctx.templateText}`,
  },
  {
    phase: 'draft-generation',
    name: 'Draft Generation Agent',
    systemPrompt: draftGenerationPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      const selection = ctx.priorOutputs.templateSelection;
      return `Generate the NDA draft using the confirmed template.\n\nTemplate Selection:\n${JSON.stringify(selection, null, 2)}\n\nIntake Data:\n${JSON.stringify(ctx.intakeData, null, 2)}\n\nTemplate Text:\n${ctx.templateText}`;
    },
  },
  {
    phase: 'redline-assessment',
    name: 'Redline Assessment Agent',
    systemPrompt: redlineAssessmentPrompt,
    maxTokens: 16384,
    conditional: (ctx) => !!ctx.counterpartyRedlineText,
    buildUserContent: (ctx) => {
      const draft = ctx.priorOutputs.draft;
      return `Assess the counterparty's redline changes against our draft and playbook.\n\nOur Draft:\n${JSON.stringify(draft, null, 2)}\n\nCounterparty Redline:\n${ctx.counterpartyRedlineText}\n\nPlaybook:\n${ctx.playbookText}`;
    },
  },
  {
    phase: 'playbook-validation',
    name: 'Playbook Validation Agent',
    systemPrompt: playbookValidationPrompt,
    buildUserContent: (ctx) => {
      const draft = ctx.priorOutputs.draft;
      return `Validate this NDA draft against the playbook standards.\n\nDraft:\n${JSON.stringify(draft, null, 2)}\n\nPlaybook:\n${ctx.playbookText}`;
    },
  },
  {
    phase: 'approval-routing',
    name: 'Approval Routing Agent',
    systemPrompt: approvalRoutingPrompt,
    buildUserContent: (ctx) => {
      const draft = ctx.priorOutputs.draft;
      const validation = ctx.priorOutputs.playbookValidation;
      const redlines = ctx.priorOutputs.redlineAssessment;
      return `Determine the approval routing for this NDA.\n\nDraft:\n${JSON.stringify(draft, null, 2)}\n\nPlaybook Validation:\n${JSON.stringify(validation, null, 2)}\n\nRedline Assessment:\n${JSON.stringify(redlines, null, 2)}\n\nEscalation Rules:\n${ctx.escalationRulesText}`;
    },
  },
  {
    phase: 'signature-dispatch',
    name: 'Signature Dispatch Agent',
    systemPrompt: signatureDispatchPrompt,
    maxTokens: 8192,
    buildUserContent: (ctx) => {
      const { draft, playbookValidation, approval, redlineAssessment } = ctx.priorOutputs;
      return `Prepare the final NDA for signature dispatch and generate audit trail.\n\nIntake Data:\n${JSON.stringify(ctx.intakeData, null, 2)}\n\nDraft:\n${JSON.stringify(draft, null, 2)}\n\nPlaybook Validation:\n${JSON.stringify(playbookValidation, null, 2)}\n\nApproval:\n${JSON.stringify(approval, null, 2)}\n\nRedline Assessment:\n${JSON.stringify(redlineAssessment, null, 2)}`;
    },
  },
];

// Phase to output key mapping
const PHASE_TO_KEY: Record<string, string> = {
  'template-selection': 'templateSelection',
  'draft-generation': 'draft',
  'redline-assessment': 'redlineAssessment',
  'playbook-validation': 'playbookValidation',
  'approval-routing': 'approval',
  'signature-dispatch': 'signatureDispatch',
};

// Map raw LLM output to stored output
function mapAgentOutput(phase: string, raw: Record<string, unknown>): unknown {
  switch (phase) {
    case 'redline-assessment':
      return (raw as { redlineItems?: unknown[] }).redlineItems ?? [];
    case 'signature-dispatch': {
      // This agent returns multiple keys — store the full object
      return raw;
    }
    default:
      return raw;
  }
}

// ---------------------------------------------------------------------------
// SSE Endpoint 1: Template Recommendation (standalone)
// ---------------------------------------------------------------------------

ndaAgentsRouter.post('/nda/recommend-template-sse', async (req: Request, res: Response) => {
  try {
    const { intakeData, catalogText } = req.body as {
      intakeData: Record<string, unknown>;
      catalogText: string;
    };

    if (!intakeData || !catalogText) {
      res.status(400).json({ error: 'intakeData and catalogText are required' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sendSSE(res, { type: 'agent-start', phase: 'template-recommendation', message: 'Running Template Recommendation Agent…' });

    try {
      const result = await chatCompletion<Record<string, unknown>>(
        [
          { role: 'system', content: templateRecommendationPrompt() },
          {
            role: 'user',
            content: `Recommend the best NDA template for this scenario.\n\nIntake Data:\n${JSON.stringify(intakeData, null, 2)}\n\nTemplate Catalog:\n${catalogText}`,
          },
        ],
        0.3,
        4096,
      );

      const reasoning = (result as Record<string, unknown>).reasoning as string | undefined;

      sendSSE(res, {
        type: 'agent-done',
        phase: 'template-recommendation',
        message: 'Template Recommendation Agent complete',
        reasoning,
        data: result,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Recommendation failed';
      sendSSE(res, { type: 'agent-error', phase: 'template-recommendation', error: message });
    }

    sendSSE(res, { type: 'all-done', data: {} });
    res.end();
  } catch (err) {
    console.error('nda/recommend-template-sse error:', err);
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
// SSE Endpoint 2: Single Stage (run one pipeline stage at a time)
// ---------------------------------------------------------------------------

ndaAgentsRouter.post('/nda/run-single-stage-sse', async (req: Request, res: Response) => {
  try {
    const {
      stage,
      intakeData,
      templateId,
      templateText,
      playbookText,
      escalationRulesText,
      counterpartyRedlineText,
      priorOutputs,
    } = req.body as {
      stage: string;
      intakeData: Record<string, unknown>;
      templateId: string;
      templateText?: string;
      playbookText?: string;
      escalationRulesText?: string;
      counterpartyRedlineText?: string;
      priorOutputs?: Record<string, unknown>;
    };

    if (!stage || !intakeData || !templateId) {
      res.status(400).json({ error: 'stage, intakeData, and templateId are required' });
      return;
    }

    const agent = WORKFLOW_AGENTS.find((a) => a.phase === stage);
    if (!agent) {
      res.status(400).json({ error: `Unknown stage: ${stage}` });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const context: WorkflowContext = {
      intakeData,
      templateId,
      templateText: templateText ?? '',
      playbookText: playbookText ?? '',
      escalationRulesText: escalationRulesText ?? '',
      counterpartyRedlineText: counterpartyRedlineText ?? '',
      priorOutputs: priorOutputs ?? {},
    };

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

      const reasoning = (result as Record<string, unknown>).reasoning as string | undefined;
      const mapped = mapAgentOutput(agent.phase, result);
      const outputKey = PHASE_TO_KEY[agent.phase] ?? agent.phase;

      // For signature-dispatch, flatten sub-keys
      let outputData: Record<string, unknown>;
      if (agent.phase === 'signature-dispatch') {
        const sigOutput = mapped as Record<string, unknown>;
        outputData = {};
        if (sigOutput.signatureDispatch) outputData.signatureDispatch = sigOutput.signatureDispatch;
        if (sigOutput.versionHistory) outputData.versionHistory = sigOutput.versionHistory;
        if (sigOutput.auditTrail) outputData.auditTrail = sigOutput.auditTrail;
      } else {
        outputData = { [outputKey]: mapped };
      }

      sendSSE(res, {
        type: 'agent-done',
        phase: agent.phase,
        message: `${agent.name} complete`,
        reasoning,
        data: outputData,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Agent failed';
      sendSSE(res, {
        type: 'agent-error',
        phase: agent.phase,
        message: `${agent.name} failed`,
        error: message,
      });
    }

    res.end();
  } catch (err) {
    console.error('nda/run-single-stage-sse error:', err);
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
// SSE Endpoint 3: Full Workflow (stages 2–7) — runs all at once
// ---------------------------------------------------------------------------

ndaAgentsRouter.post('/nda/run-workflow-sse', async (req: Request, res: Response) => {
  try {
    const {
      intakeData,
      templateId,
      templateText,
      playbookText,
      escalationRulesText,
      counterpartyRedlineText,
    } = req.body as {
      intakeData: Record<string, unknown>;
      templateId: string;
      templateText: string;
      playbookText?: string;
      escalationRulesText?: string;
      counterpartyRedlineText?: string;
    };

    if (!intakeData || !templateId || !templateText) {
      res.status(400).json({ error: 'intakeData, templateId, and templateText are required' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const context: WorkflowContext = {
      intakeData,
      templateId,
      templateText,
      playbookText: playbookText ?? '',
      escalationRulesText: escalationRulesText ?? '',
      counterpartyRedlineText: counterpartyRedlineText ?? '',
      priorOutputs: {},
    };

    for (const agent of WORKFLOW_AGENTS) {
      // Check conditional
      if (agent.conditional && !agent.conditional(context)) {
        sendSSE(res, {
          type: 'agent-done',
          phase: agent.phase,
          message: `${agent.name} skipped (not applicable)`,
        });
        continue;
      }

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

        const reasoning = (result as Record<string, unknown>).reasoning as string | undefined;
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
      }
    }

    // Flatten signature-dispatch output
    const sigOutput = context.priorOutputs.signatureDispatch as Record<string, unknown> | undefined;
    if (sigOutput) {
      if (sigOutput.signatureDispatch) context.priorOutputs.signatureDispatch = sigOutput.signatureDispatch;
      if (sigOutput.versionHistory) context.priorOutputs.versionHistory = sigOutput.versionHistory;
      if (sigOutput.auditTrail) context.priorOutputs.auditTrail = sigOutput.auditTrail;
    }

    sendSSE(res, { type: 'all-done', data: context.priorOutputs });
    res.end();
  } catch (err) {
    console.error('nda/run-workflow-sse error:', err);
    const message = err instanceof Error ? err.message : 'Orchestrator failed';
    if (res.headersSent) {
      sendSSE(res, { type: 'error', error: message });
      res.end();
    } else {
      res.status(502).json({ error: 'AI request failed', details: message });
    }
  }
});
