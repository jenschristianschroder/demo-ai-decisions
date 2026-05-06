/**
 * RFP Agent Orchestration routes.
 *
 * Runs 8 RFP response agents sequentially via Azure AI Foundry,
 * streaming progress to the frontend via SSE.
 *
 * Agent pipeline:
 *   1. Intake — parse RFP metadata
 *   2. Requirement Extraction — identify and categorize requirements
 *   3. Knowledge Retrieval — match requirements to approved answers
 *   4. Drafting — draft responses using matched knowledge
 *   5. SME Routing — identify questions for subject matter experts
 *   6. Risk Review — scan for contractual/compliance risks
 *   7. Compliance — build compliance matrix
 *   8. Response Assembly — assemble final response package
 */

import { Router, type Request, type Response } from 'express';
import { chatCompletion } from '../aiClient.js';

export const rfpAgentsRouter = Router();

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

function intakeSystemPrompt(): string {
  return `You are the RFP Intake Agent — an expert at analyzing Request for Proposal documents and extracting structured metadata.

Today's date: ${today()}

ROLE: Parse the provided RFP document and extract all key metadata including buyer information, submission requirements, evaluation criteria, and key dates.

REASONING INSTRUCTIONS:
1. Identify the issuing organization and RFP title
2. Extract submission details (deadline, method, contact)
3. Find evaluation criteria and their weights
4. Identify key dates and milestones
5. Count requirements and categorize them
6. Note any open questions or ambiguities

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "buyerName": "<organization issuing the RFP>",
  "rfpTitle": "<title of the RFP>",
  "rfpNumber": "<RFP reference number>",
  "deadline": "<submission deadline>",
  "submissionMethod": "<how to submit>",
  "contactPerson": "<contact name>",
  "contactEmail": "<contact email>",
  "requiredAttachments": ["<attachment 1>", "<attachment 2>"],
  "evaluationCriteria": [{"criteria": "<name>", "weight": "<percentage>"}],
  "keyDates": [{"milestone": "<milestone>", "date": "<date>"}],
  "summary": "<2-3 sentence summary of the RFP>",
  "openQuestions": ["<any ambiguities or missing info>"],
  "reasoning": "<your detailed reasoning about how you analyzed the document>"
}

No markdown, no commentary outside the JSON.`;
}

function requirementExtractionSystemPrompt(): string {
  return `You are the Requirement Extraction Agent — an expert at identifying, categorizing, and structuring requirements from RFP documents.

Today's date: ${today()}

ROLE: Extract all requirements from the RFP document, categorize them, and assess their properties.

REASONING INSTRUCTIONS:
1. Identify all requirements (look for REQ- prefixed items or enumerated requirements)
2. Determine which section each requirement belongs to
3. Categorize each by type (Product, Security, Privacy, Data Integration, Implementation, Support, Legal, Pricing, Accessibility, Reporting, Data Residency, Vendor References)
4. Determine if mandatory or optional
5. Assess risk level based on category and complexity
6. Assign a default owner based on category

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "requirements": [
    {
      "requirementId": "<e.g. REQ-SEC-001>",
      "sourceSection": "<section title where found>",
      "requirementText": "<full requirement text>",
      "category": "<category name>",
      "mandatory": true,
      "owner": "<default owner/team>",
      "riskLevel": "low|medium|high|critical",
      "status": "identified"
    }
  ],
  "reasoning": "<your detailed reasoning about extraction methodology>"
}

No markdown, no commentary outside the JSON.`;
}

function knowledgeRetrievalSystemPrompt(): string {
  return `You are the Knowledge Retrieval Agent — an expert at matching RFP requirements against an organization's approved answer library and knowledge base to find relevant response material.

Today's date: ${today()}

ROLE: For each requirement, search the provided approved answer library and knowledge base files to find the best matching content. Assess confidence in each match.

REASONING INSTRUCTIONS:
1. For each requirement, search the approved answer library by category and keyword relevance
2. Search knowledge base files for supplementary information
3. Assess confidence: high (direct approved answer), medium (related content), low (tangential), none (no match)
4. Flag staleness warnings if content may be outdated
5. Identify gaps where no matching content exists

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "matches": [
    {
      "requirementId": "<requirement ID>",
      "matchedSources": ["<source file or answer ID>"],
      "recommendedAnswerMaterial": "<best matching content snippet>",
      "confidence": "high|medium|low|none",
      "stalenessWarning": "<optional warning if content may be outdated>",
      "missingInformation": "<optional note about what's missing>"
    }
  ],
  "reasoning": "<your detailed reasoning about the matching process>"
}

No markdown, no commentary outside the JSON.`;
}

function draftingSystemPrompt(): string {
  return `You are the Response Drafting Agent — an expert at composing professional RFP responses from approved materials and knowledge base content.

Today's date: ${today()}

ROLE: Draft responses for each requirement using the matched knowledge material. Flag items that need SME review.

REASONING INSTRUCTIONS:
1. For requirements with high-confidence matches, draft a polished response using the approved material
2. For medium-confidence matches, draft a response but flag for review
3. For low/no matches, mark as needing SME input
4. Ensure responses are professional, specific, and address the requirement directly
5. Cite source materials used

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "drafts": [
    {
      "requirementId": "<requirement ID>",
      "draftAnswer": "<drafted response text>",
      "sourceFiles": ["<sources used>"],
      "confidence": "high|medium|low",
      "needsSmeReview": true,
      "reviewReason": "<optional reason for SME review>"
    }
  ],
  "reasoning": "<your detailed reasoning about drafting decisions>"
}

No markdown, no commentary outside the JSON.`;
}

function smeRoutingSystemPrompt(): string {
  return `You are the SME Routing Agent — an expert at identifying which subject matter experts should review or provide input on specific RFP requirements.

Today's date: ${today()}

ROLE: For requirements that need SME review, determine which expert to route to based on their function and expertise. Generate specific questions for each SME.

REASONING INSTRUCTIONS:
1. Identify requirements flagged for SME review
2. Match each requirement's category to the appropriate SME from the directory
3. Formulate a specific, actionable question for each SME
4. Calculate needed-by dates based on submission deadline minus response SLA plus buffer
5. Prioritize questions by urgency and risk level

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "questions": [
    {
      "questionId": "<e.g. SME-Q-001>",
      "requirementId": "<requirement ID>",
      "assignedTo": "<SME name>",
      "function": "<SME function/department>",
      "question": "<specific question for the SME>",
      "neededBy": "<date needed by>",
      "status": "pending"
    }
  ],
  "reasoning": "<your detailed reasoning about routing decisions>"
}

No markdown, no commentary outside the JSON.`;
}

function riskReviewSystemPrompt(): string {
  return `You are the Risk Review Agent — an expert at identifying contractual, legal, compliance, and commercial risks in RFP responses.

Today's date: ${today()}

ROLE: Scan all requirements and draft responses for potential risks. Apply risk rules and identify items that need escalation or approval.

REASONING INSTRUCTIONS:
1. Check each requirement and draft response against risk triggers
2. Look for contractual risks (SLAs, penalties, unlimited liability)
3. Identify compliance risks (data residency, privacy regulations)
4. Flag commercial risks (pricing commitments, exclusivity)
5. Assess severity and identify required approvers

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "risks": [
    {
      "riskId": "<e.g. RISK-FOUND-001>",
      "requirementId": "<related requirement ID>",
      "riskArea": "<risk category>",
      "severity": "low|medium|high|critical",
      "trigger": "<what triggered this risk>",
      "reason": "<why this is a risk>",
      "recommendedAction": "<what to do about it>",
      "requiredApprover": "<who needs to approve>",
      "status": "identified"
    }
  ],
  "reasoning": "<your detailed reasoning about risk assessment>"
}

No markdown, no commentary outside the JSON.`;
}

function complianceSystemPrompt(): string {
  return `You are the Compliance Matrix Agent — an expert at assessing the compliance status of each RFP requirement based on the available draft responses, risks, and evidence.

Today's date: ${today()}

ROLE: Build a compliance matrix showing the response status for each requirement, incorporating draft quality, risk findings, and evidence availability.

REASONING INSTRUCTIONS:
1. For each requirement, assess the overall compliance status
2. Consider: draft availability, confidence level, associated risks, SME review needs
3. Determine appropriate status: compliant (approved answer ready), partial (draft exists but incomplete), needs-review (pending SME), pending (no draft), non-compliant (cannot meet)
4. Document evidence and next actions for each

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "compliance": [
    {
      "requirementId": "<requirement ID>",
      "requirement": "<requirement text>",
      "category": "<category>",
      "mandatory": true,
      "owner": "<assigned owner>",
      "responseStatus": "compliant|partial|non-compliant|pending|needs-review",
      "risk": "low|medium|high|critical",
      "evidence": "<what evidence supports this status>",
      "nextAction": "<what needs to happen next>"
    }
  ],
  "reasoning": "<your detailed reasoning about compliance assessment>"
}

No markdown, no commentary outside the JSON.`;
}

function assemblySystemPrompt(): string {
  return `You are the Response Assembly Agent — an expert at synthesizing all agent outputs into a cohesive RFP response package with executive summary, assumptions, and submission checklist.

Today's date: ${today()}

ROLE: Assemble the final response package by synthesizing intake data, requirements, drafts, SME questions, risks, and compliance status into a unified response structure.

REASONING INSTRUCTIONS:
1. Write a professional executive summary covering key strengths and response highlights
2. Organize response sections by category with summaries
3. Document key assumptions
4. List open items that need resolution before submission
5. Identify approvals needed and from whom
6. Prepare submission checklist

OUTPUT FORMAT — respond with ONLY valid JSON:
{
  "executiveSummary": "<professional 3-4 sentence executive summary>",
  "responseSections": [{"section": "<category>", "content": "<section summary>"}],
  "assumptions": ["<assumption 1>", "<assumption 2>"],
  "openItems": ["<open item 1>"],
  "approvalNeeded": ["<approver: reason>"],
  "submissionChecklist": [{"item": "<checklist item>", "status": "<status>", "owner": "<owner>"}],
  "reasoning": "<your detailed reasoning about assembly decisions>"
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
  rfpText: string;
  approvedAnswers: string;
  knowledgeFiles: string;
  smeDirectory: string;
  riskRules: string;
  requirementCategories: string;
  submissionChecklist: string;
  winLossHistory: string;
  // Accumulated outputs from prior agents
  priorOutputs: Record<string, unknown>;
}

const AGENTS: AgentDef[] = [
  {
    phase: 'intake',
    name: 'Intake Agent',
    systemPrompt: intakeSystemPrompt,
    buildUserContent: (ctx) =>
      `Analyze the following RFP document and extract all metadata:\n\n${ctx.rfpText}`,
  },
  {
    phase: 'requirements',
    name: 'Requirement Extraction Agent',
    systemPrompt: requirementExtractionSystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      let content = `Extract all requirements from this RFP document:\n\n${ctx.rfpText}`;
      if (ctx.requirementCategories) {
        content += `\n\nRequirement Categories Reference:\n${ctx.requirementCategories}`;
      }
      return content;
    },
  },
  {
    phase: 'knowledge',
    name: 'Knowledge Retrieval Agent',
    systemPrompt: knowledgeRetrievalSystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      const requirements = ctx.priorOutputs.requirements;
      let content = `Match the following requirements to our knowledge base:\n\nRequirements:\n${JSON.stringify(requirements, null, 2)}`;
      if (ctx.approvedAnswers) {
        content += `\n\nApproved Answer Library:\n${ctx.approvedAnswers}`;
      }
      if (ctx.knowledgeFiles) {
        content += `\n\nKnowledge Base Files:\n${ctx.knowledgeFiles}`;
      }
      return content;
    },
  },
  {
    phase: 'drafting',
    name: 'Drafting Agent',
    systemPrompt: draftingSystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      const requirements = ctx.priorOutputs.requirements;
      const matches = ctx.priorOutputs.knowledgeMatches;
      return `Draft responses for these requirements using the matched knowledge material:\n\nRequirements:\n${JSON.stringify(requirements, null, 2)}\n\nKnowledge Matches:\n${JSON.stringify(matches, null, 2)}`;
    },
  },
  {
    phase: 'sme-routing',
    name: 'SME Routing Agent',
    systemPrompt: smeRoutingSystemPrompt,
    buildUserContent: (ctx) => {
      const requirements = ctx.priorOutputs.requirements;
      const drafts = ctx.priorOutputs.draftAnswers;
      const intake = ctx.priorOutputs.intake;
      let content = `Route SME questions for requirements that need review.\n\nIntake Summary:\n${JSON.stringify(intake, null, 2)}\n\nRequirements:\n${JSON.stringify(requirements, null, 2)}\n\nDraft Answers:\n${JSON.stringify(drafts, null, 2)}`;
      if (ctx.smeDirectory) {
        content += `\n\nSME Directory:\n${ctx.smeDirectory}`;
      }
      return content;
    },
  },
  {
    phase: 'risk-review',
    name: 'Risk Review Agent',
    systemPrompt: riskReviewSystemPrompt,
    buildUserContent: (ctx) => {
      const requirements = ctx.priorOutputs.requirements;
      const drafts = ctx.priorOutputs.draftAnswers;
      let content = `Review these requirements and draft responses for risks:\n\nRequirements:\n${JSON.stringify(requirements, null, 2)}\n\nDraft Answers:\n${JSON.stringify(drafts, null, 2)}`;
      if (ctx.riskRules) {
        content += `\n\nRisk Rules Reference:\n${ctx.riskRules}`;
      }
      return content;
    },
  },
  {
    phase: 'compliance',
    name: 'Compliance Agent',
    systemPrompt: complianceSystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      const requirements = ctx.priorOutputs.requirements;
      const drafts = ctx.priorOutputs.draftAnswers;
      const risks = ctx.priorOutputs.risks;
      return `Build a compliance matrix for these requirements:\n\nRequirements:\n${JSON.stringify(requirements, null, 2)}\n\nDraft Answers:\n${JSON.stringify(drafts, null, 2)}\n\nRisk Items:\n${JSON.stringify(risks, null, 2)}`;
    },
  },
  {
    phase: 'assembly',
    name: 'Response Assembly Agent',
    systemPrompt: assemblySystemPrompt,
    maxTokens: 16384,
    buildUserContent: (ctx) => {
      const { intake, requirements, draftAnswers, smeQuestions, risks, compliance } = ctx.priorOutputs;
      let content = `Assemble the final response package from all agent outputs:\n\nIntake:\n${JSON.stringify(intake, null, 2)}\n\nRequirements:\n${JSON.stringify(requirements, null, 2)}\n\nDraft Answers:\n${JSON.stringify(draftAnswers, null, 2)}\n\nSME Questions:\n${JSON.stringify(smeQuestions, null, 2)}\n\nRisks:\n${JSON.stringify(risks, null, 2)}\n\nCompliance:\n${JSON.stringify(compliance, null, 2)}`;
      if (ctx.submissionChecklist) {
        content += `\n\nSubmission Checklist Template:\n${ctx.submissionChecklist}`;
      }
      return content;
    },
  },
];

// ---------------------------------------------------------------------------
// Map raw LLM output to structured agent outputs
// ---------------------------------------------------------------------------

function mapAgentOutput(phase: string, raw: Record<string, unknown>): unknown {
  switch (phase) {
    case 'intake':
      return raw; // Already matches RfpIntakeSummary
    case 'requirements':
      return (raw as { requirements?: unknown[] }).requirements ?? [];
    case 'knowledge':
      return (raw as { matches?: unknown[] }).matches ?? [];
    case 'drafting':
      return (raw as { drafts?: unknown[] }).drafts ?? [];
    case 'sme-routing':
      return (raw as { questions?: unknown[] }).questions ?? [];
    case 'risk-review':
      return (raw as { risks?: unknown[] }).risks ?? [];
    case 'compliance':
      return (raw as { compliance?: unknown[] }).compliance ?? [];
    case 'assembly': {
      // Remove reasoning from the assembly output
      const assemblyData = { ...raw } as Record<string, unknown>;
      delete assemblyData.reasoning;
      return assemblyData;
    }
    default:
      return raw;
  }
}

// Phase to output key mapping
const PHASE_TO_KEY: Record<string, string> = {
  intake: 'intake',
  requirements: 'requirements',
  knowledge: 'knowledgeMatches',
  drafting: 'draftAnswers',
  'sme-routing': 'smeQuestions',
  'risk-review': 'risks',
  compliance: 'compliance',
  assembly: 'assembly',
};

// ---------------------------------------------------------------------------
// SSE Orchestrator — runs 8 agents sequentially
// ---------------------------------------------------------------------------

rfpAgentsRouter.post('/rfp/run-agents-sse', async (req: Request, res: Response) => {
  try {
    const {
      rfpText,
      approvedAnswers,
      knowledgeFiles,
      smeDirectory,
      riskRules,
      requirementCategories,
      submissionChecklist,
      winLossHistory,
    } = req.body as {
      rfpText: string;
      approvedAnswers?: string;
      knowledgeFiles?: string;
      smeDirectory?: string;
      riskRules?: string;
      requirementCategories?: string;
      submissionChecklist?: string;
      winLossHistory?: string;
    };

    if (!rfpText) {
      res.status(400).json({ error: 'rfpText is required' });
      return;
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const context: OrchestrationContext = {
      rfpText,
      approvedAnswers: approvedAnswers ?? '',
      knowledgeFiles: knowledgeFiles ?? '',
      smeDirectory: smeDirectory ?? '',
      riskRules: riskRules ?? '',
      requirementCategories: requirementCategories ?? '',
      submissionChecklist: submissionChecklist ?? '',
      winLossHistory: winLossHistory ?? '',
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
    console.error('rfp/run-agents-sse error:', err);
    const message = err instanceof Error ? err.message : 'Orchestrator failed';
    if (res.headersSent) {
      sendSSE(res, { type: 'error', error: message });
      res.end();
    } else {
      res.status(502).json({ error: 'AI request failed', details: message });
    }
  }
});
