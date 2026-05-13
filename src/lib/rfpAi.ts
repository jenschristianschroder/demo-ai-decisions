// ---------------------------------------------------------------------------
// RFP Agent Orchestration — Azure AI Foundry via backend SSE
//
// Calls the backend /api/ai/rfp/run-agents-sse endpoint which runs 8 agent
// stages sequentially using Azure AI Foundry LLM calls. Progress is streamed
// back via Server-Sent Events.
// ---------------------------------------------------------------------------

import type {
  RfpProgressStep,
  RfpAgentOutputs,
  RfpIntakeSummary,
  RfpRequirement,
  KnowledgeMatch,
  DraftAnswer,
  SmeQuestion,
  RiskItem,
  ComplianceRow,
  ResponseAssembly,
  RfpDemoData,
} from '../types/rfp';

// ---------------------------------------------------------------------------
// SSE consumer (same pattern as rndAi.ts)
// ---------------------------------------------------------------------------

interface SSEEvent {
  type: 'agent-start' | 'agent-done' | 'agent-error' | 'all-done' | 'error';
  phase?: string;
  message?: string;
  reasoning?: string;
  input?: string;
  data?: unknown;
  error?: string;
}

function consumeSSE(
  url: string,
  body: Record<string, unknown>,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            reject(new Error(`API request failed (${response.status}): ${text}`));
          });
        }

        const reader = response.body?.getReader();
        if (!reader) {
          reject(new Error('Response body is not readable'));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        function processStream(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              resolve();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const eventData = JSON.parse(line.slice(6)) as SSEEvent;
                  onEvent(eventData);
                } catch {
                  // Skip malformed events
                }
              }
            }

            return processStream();
          });
        }

        processStream().catch(reject);
      })
      .catch(reject);
  });
}

// ---------------------------------------------------------------------------
// Phase display messages
// ---------------------------------------------------------------------------

const PHASE_RUNNING_MESSAGES: Record<string, string> = {
  intake: 'Analyzing RFP document structure and metadata…',
  requirements: 'Extracting and categorizing requirements…',
  knowledge: 'Searching approved answer library and knowledge base…',
  drafting: 'Drafting responses from matched content…',
  'sme-routing': 'Routing questions to subject matter experts…',
  'risk-review': 'Scanning for contractual and compliance risks…',
  compliance: 'Building compliance matrix…',
  assembly: 'Assembling final response package…',
};

// ---------------------------------------------------------------------------
// Serialize demo data for the backend
// ---------------------------------------------------------------------------

function serializeDemoData(demoData: RfpDemoData): Record<string, string> {
  const approvedAnswers = demoData.approvedAnswers
    .map(a => `[${a.id}] Category: ${a.category} | Question: ${a.questionPattern} | Answer: ${a.approvedAnswer} | Status: ${a.approvalStatus}`)
    .join('\n');

  const knowledgeFiles = demoData.knowledgeFiles
    .map(f => `--- ${f.filename} ---\n${f.content}`)
    .join('\n\n');

  const smeDirectory = demoData.smeDirectory
    .map(s => `${s.name} | Function: ${s.function} | Expertise: ${s.expertise} | SLA: ${s.responseSlaHours}h`)
    .join('\n');

  const riskRules = demoData.riskRules
    .map(r => `[${r.id}] Area: ${r.riskArea} | Trigger: ${r.triggerPattern} | Severity: ${r.severity} | Action: ${r.recommendedAction} | Approver: ${r.requiredApprover}`)
    .join('\n');

  const requirementCategories = demoData.requirementCategories
    .map(c => `${c.category} | Owner: ${c.defaultOwner} | Risk: ${c.defaultRiskLevel}`)
    .join('\n');

  const submissionChecklist = demoData.submissionChecklist
    .map(s => `${s.item} | Required: ${s.required} | Owner: ${s.owner} | Status: ${s.defaultStatus}`)
    .join('\n');

  const winLossHistory = demoData.winLossHistory
    .map(w => `${w.opportunity} | Industry: ${w.buyerIndustry} | Outcome: ${w.outcome} | Reason: ${w.winLossReason}`)
    .join('\n');

  return {
    approvedAnswers,
    knowledgeFiles,
    smeDirectory,
    riskRules,
    requirementCategories,
    submissionChecklist,
    winLossHistory,
  };
}

// ---------------------------------------------------------------------------
// Main workflow orchestrator
// ---------------------------------------------------------------------------

export async function runRfpWorkflow(
  rfpText: string,
  demoData: RfpDemoData,
  onProgress: (step: RfpProgressStep) => void,
): Promise<RfpAgentOutputs> {
  const serialized = serializeDemoData(demoData);

  // Initialize all phases as pending
  const phases = ['intake', 'requirements', 'knowledge', 'drafting', 'sme-routing', 'risk-review', 'compliance', 'assembly'];
  for (const phase of phases) {
    onProgress({ phase: phase as RfpProgressStep['phase'], status: 'pending', message: '' });
  }

  let finalOutputs: Record<string, unknown> = {};
  let sseError: string | null = null;

  await consumeSSE(
    '/api/ai/rfp/run-agents-sse',
    {
      rfpText,
      ...serialized,
    },
    (event) => {
      if (event.type === 'agent-start' && event.phase) {
        onProgress({
          phase: event.phase as RfpProgressStep['phase'],
          status: 'running',
          message: PHASE_RUNNING_MESSAGES[event.phase] ?? event.message ?? 'Processing…',
        });
      } else if (event.type === 'agent-done' && event.phase) {
        onProgress({
          phase: event.phase as RfpProgressStep['phase'],
          status: 'done',
          message: event.message ?? `${event.phase} complete`,
          reasoning: event.reasoning,
          input: event.input,
          output: event.data,
        });
      } else if (event.type === 'agent-error' && event.phase) {
        onProgress({
          phase: event.phase as RfpProgressStep['phase'],
          status: 'error',
          message: event.error ?? `${event.phase} failed`,
        });
      } else if (event.type === 'all-done' && event.data) {
        finalOutputs = event.data as Record<string, unknown>;
      } else if (event.type === 'error') {
        sseError = event.error ?? 'Agent orchestration failed';
      }
    },
  );

  if (sseError) {
    throw new Error(sseError);
  }

  // Signal completion
  onProgress({ phase: 'complete', status: 'done', message: 'All agents complete. RFP response ready for review.' });

  // Map outputs to typed structure with safe defaults
  return {
    intake: (finalOutputs.intake ?? {}) as RfpIntakeSummary,
    requirements: (finalOutputs.requirements ?? []) as RfpRequirement[],
    knowledgeMatches: (finalOutputs.knowledgeMatches ?? []) as KnowledgeMatch[],
    draftAnswers: (finalOutputs.draftAnswers ?? []) as DraftAnswer[],
    smeQuestions: (finalOutputs.smeQuestions ?? []) as SmeQuestion[],
    risks: (finalOutputs.risks ?? []) as RiskItem[],
    compliance: (finalOutputs.compliance ?? []) as ComplianceRow[],
    assembly: (finalOutputs.assembly ?? {}) as ResponseAssembly,
  };
}
