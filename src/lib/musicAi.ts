// ---------------------------------------------------------------------------
// Music Intelligence Graph — Azure AI Foundry via backend SSE
//
// Calls the backend /api/ai/music/run-agents-sse endpoint which runs 5 agent
// stages sequentially using Azure AI Foundry LLM calls. Progress is streamed
// back via Server-Sent Events.
// ---------------------------------------------------------------------------

import type {
  MusicProgressStep,
  MusicAgentOutputs,
  MusicQueryResult,
  MusicRecommendation,
  MusicCatalogInsight,
} from '../types/music';

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
  'query-parse': 'Analyzing natural-language query…',
  'graph-traversal': 'Traversing knowledge graph relationships…',
  'semantic-search': 'Searching semantic embeddings for related entities…',
  'recommendation': 'Generating graph-backed recommendations…',
  'explanation': 'Building relationship path explanations…',
};

// ---------------------------------------------------------------------------
// Main workflow orchestrator
// ---------------------------------------------------------------------------

export async function runMusicWorkflow(
  query: string,
  queryType: string,
  filters: Record<string, string | number | undefined>,
  onProgress: (step: MusicProgressStep) => void,
): Promise<MusicAgentOutputs> {
  // Initialize all phases as pending
  const phases = ['query-parse', 'graph-traversal', 'semantic-search', 'recommendation', 'explanation'];
  for (const phase of phases) {
    onProgress({ phase: phase as MusicProgressStep['phase'], status: 'pending', message: '' });
  }

  let finalOutputs: Record<string, unknown> = {};
  let sseError: string | null = null;

  await consumeSSE(
    '/api/ai/music/run-agents-sse',
    {
      query,
      queryType,
      filters,
    },
    (event) => {
      if (event.type === 'agent-start' && event.phase) {
        onProgress({
          phase: event.phase as MusicProgressStep['phase'],
          status: 'running',
          message: PHASE_RUNNING_MESSAGES[event.phase] ?? event.message ?? 'Processing…',
        });
      } else if (event.type === 'agent-done' && event.phase) {
        onProgress({
          phase: event.phase as MusicProgressStep['phase'],
          status: 'done',
          message: event.message ?? `${event.phase} complete`,
          reasoning: event.reasoning,
        });
      } else if (event.type === 'agent-error' && event.phase) {
        onProgress({
          phase: event.phase as MusicProgressStep['phase'],
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
  onProgress({ phase: 'complete', status: 'done', message: 'All agents complete. Music intelligence results ready.' });

  // Map outputs to typed structure with safe defaults
  return {
    queryResult: (finalOutputs.queryResult ?? {}) as MusicQueryResult,
    recommendations: (finalOutputs.recommendations ?? []) as MusicRecommendation[],
    catalogInsights: (finalOutputs.catalogInsights ?? []) as MusicCatalogInsight[],
    graphStats: (finalOutputs.graphStats ?? {
      totalNodes: 0,
      totalEdges: 0,
      artistCount: 0,
      recordingCount: 0,
      releaseCount: 0,
      workCount: 0,
      labelCount: 0,
    }) as MusicAgentOutputs['graphStats'],
  };
}
