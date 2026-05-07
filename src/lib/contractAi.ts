// ---------------------------------------------------------------------------
// Contract Agent Orchestration — Azure AI Foundry via backend SSE
//
// Calls the backend /api/ai/contract/run-agents-sse endpoint which runs 6
// agent stages sequentially using Azure AI Foundry LLM calls. Progress is
// streamed back via Server-Sent Events.
// ---------------------------------------------------------------------------

import type {
  ContractProgressStep,
  ContractAgentOutputs,
  ContractDocumentSummary,
  ExtractedClause,
  PlaybookDeviation,
  ContractRisk,
  RedlineItem,
  ContractRecommendation,
} from '../types/contract';

// ---------------------------------------------------------------------------
// SSE consumer (same pattern as rfpAi.ts)
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
  'document-parse': 'Parsing contract document structure and metadata…',
  'clause-extraction': 'Extracting and categorizing contract clauses…',
  'playbook-comparison': 'Comparing clauses against legal playbook standards…',
  'risk-assessment': 'Assessing risk levels and potential impacts…',
  'redline-generation': 'Generating redline suggestions and track changes…',
  'recommendation': 'Formulating recommendations and next steps…',
};

// ---------------------------------------------------------------------------
// Main workflow orchestrator
// ---------------------------------------------------------------------------

export async function runContractWorkflow(
  contractText: string,
  playbookText: string,
  clauseLibraryText: string,
  onProgress: (step: ContractProgressStep) => void,
): Promise<ContractAgentOutputs> {
  // Initialize all phases as pending
  const phases = ['document-parse', 'clause-extraction', 'playbook-comparison', 'risk-assessment', 'redline-generation', 'recommendation'];
  for (const phase of phases) {
    onProgress({ phase: phase as ContractProgressStep['phase'], status: 'pending', message: '' });
  }

  let finalOutputs: Record<string, unknown> = {};
  let sseError: string | null = null;

  await consumeSSE(
    '/api/ai/contract/run-agents-sse',
    {
      contractText,
      playbookText,
      clauseLibraryText,
    },
    (event) => {
      if (event.type === 'agent-start' && event.phase) {
        onProgress({
          phase: event.phase as ContractProgressStep['phase'],
          status: 'running',
          message: PHASE_RUNNING_MESSAGES[event.phase] ?? event.message ?? 'Processing…',
        });
      } else if (event.type === 'agent-done' && event.phase) {
        onProgress({
          phase: event.phase as ContractProgressStep['phase'],
          status: 'done',
          message: event.message ?? `${event.phase} complete`,
          reasoning: event.reasoning,
        });
      } else if (event.type === 'agent-error' && event.phase) {
        onProgress({
          phase: event.phase as ContractProgressStep['phase'],
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
  onProgress({ phase: 'complete', status: 'done', message: 'All agents complete. Contract review ready.' });

  // Map outputs to typed structure with safe defaults
  return {
    documentSummary: (finalOutputs.documentSummary ?? {}) as ContractDocumentSummary,
    clauses: (finalOutputs.clauses ?? []) as ExtractedClause[],
    deviations: (finalOutputs.deviations ?? []) as PlaybookDeviation[],
    risks: (finalOutputs.risks ?? []) as ContractRisk[],
    redlines: (finalOutputs.redlines ?? []) as RedlineItem[],
    recommendations: (finalOutputs.recommendations ?? []) as ContractRecommendation[],
  };
}
