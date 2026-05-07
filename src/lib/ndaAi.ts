// ---------------------------------------------------------------------------
// NDA Agent Orchestration — Azure AI Foundry via backend SSE
//
// Two entry points:
// 1. runNdaTemplateRecommendation — standalone template recommendation
// 2. runNdaWorkflow — full pipeline (stages 2–7) after template confirmed
// ---------------------------------------------------------------------------

import type {
  NdaProgressStep,
  NdaAgentOutputs,
  NdaIntakeData,
  NdaTemplateRecommendation,
  NdaTemplateId,
} from '../types/nda';

// ---------------------------------------------------------------------------
// SSE consumer (same pattern as contractAi.ts)
// ---------------------------------------------------------------------------

interface SSEEvent {
  type: 'agent-start' | 'agent-done' | 'agent-error' | 'all-done' | 'error';
  phase?: string;
  message?: string;
  reasoning?: string;
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
  'template-recommendation': 'Analyzing intake data and recommending best NDA template…',
  'template-selection': 'Confirming template selection and loading template…',
  'draft-generation': 'Generating NDA draft from selected template…',
  'redline-assessment': 'Assessing counterparty redline changes against playbook…',
  'playbook-validation': 'Validating draft against NDA playbook standards…',
  'approval-routing': 'Determining approval tier and routing…',
  'signature-dispatch': 'Preparing signature dispatch and audit trail…',
};

// ---------------------------------------------------------------------------
// Template Recommendation (standalone — stage 1 only)
// ---------------------------------------------------------------------------

export async function runNdaTemplateRecommendation(
  intakeData: NdaIntakeData,
  catalogText: string,
  onProgress: (step: NdaProgressStep) => void,
): Promise<NdaTemplateRecommendation> {
  let recommendation: NdaTemplateRecommendation | null = null;
  let sseError: string | null = null;

  await consumeSSE(
    '/api/ai/nda/recommend-template-sse',
    { intakeData, catalogText },
    (event) => {
      if (event.type === 'agent-start') {
        onProgress({
          phase: 'template-recommendation',
          status: 'running',
          message: PHASE_RUNNING_MESSAGES['template-recommendation'],
        });
      } else if (event.type === 'agent-done' && event.data) {
        recommendation = event.data as NdaTemplateRecommendation;
        onProgress({
          phase: 'template-recommendation',
          status: 'done',
          message: 'Template recommendation ready',
          reasoning: event.reasoning,
        });
      } else if (event.type === 'agent-error') {
        onProgress({
          phase: 'template-recommendation',
          status: 'error',
          message: event.error ?? 'Recommendation failed',
        });
      } else if (event.type === 'error') {
        sseError = event.error ?? 'Recommendation failed';
      }
    },
  );

  if (sseError) throw new Error(sseError);
  if (!recommendation) throw new Error('No recommendation received');

  return recommendation;
}

// ---------------------------------------------------------------------------
// Full workflow (stages 2–7)
// ---------------------------------------------------------------------------

export async function runNdaWorkflow(
  intakeData: NdaIntakeData,
  templateId: NdaTemplateId,
  templateText: string,
  playbookText: string,
  escalationRulesText: string,
  counterpartyRedlineText: string,
  onProgress: (step: NdaProgressStep) => void,
): Promise<NdaAgentOutputs> {
  let finalOutputs: Record<string, unknown> = {};
  let sseError: string | null = null;

  await consumeSSE(
    '/api/ai/nda/run-workflow-sse',
    {
      intakeData,
      templateId,
      templateText,
      playbookText,
      escalationRulesText,
      counterpartyRedlineText,
    },
    (event) => {
      if (event.type === 'agent-start' && event.phase) {
        onProgress({
          phase: event.phase as NdaProgressStep['phase'],
          status: 'running',
          message: PHASE_RUNNING_MESSAGES[event.phase] ?? event.message ?? 'Processing…',
        });
      } else if (event.type === 'agent-done' && event.phase) {
        onProgress({
          phase: event.phase as NdaProgressStep['phase'],
          status: 'done',
          message: event.message ?? `${event.phase} complete`,
          reasoning: event.reasoning,
        });
      } else if (event.type === 'agent-error' && event.phase) {
        onProgress({
          phase: event.phase as NdaProgressStep['phase'],
          status: 'error',
          message: event.error ?? `${event.phase} failed`,
        });
      } else if (event.type === 'all-done' && event.data) {
        finalOutputs = event.data as Record<string, unknown>;
      } else if (event.type === 'error') {
        sseError = event.error ?? 'Workflow failed';
      }
    },
  );

  if (sseError) throw new Error(sseError);

  onProgress({ phase: 'complete', status: 'done', message: 'All agents complete. NDA ready.' });

  return {
    draft: finalOutputs.draft as NdaAgentOutputs['draft'],
    redlineAssessment: finalOutputs.redlineAssessment as NdaAgentOutputs['redlineAssessment'],
    playbookValidation: finalOutputs.playbookValidation as NdaAgentOutputs['playbookValidation'],
    approval: finalOutputs.approval as NdaAgentOutputs['approval'],
    signatureDispatch: finalOutputs.signatureDispatch as NdaAgentOutputs['signatureDispatch'],
    versionHistory: finalOutputs.versionHistory as NdaAgentOutputs['versionHistory'],
    auditTrail: finalOutputs.auditTrail as NdaAgentOutputs['auditTrail'],
  };
}
