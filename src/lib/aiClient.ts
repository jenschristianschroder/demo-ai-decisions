/**
 * Thin wrapper around the Azure AI Foundry chat completions REST API.
 *
 * This avoids pulling in a heavy SDK and keeps the bundle lean — all we need
 * is a single POST to the `/chat/completions` endpoint with JSON mode enabled.
 */

import { getAiConfig } from './aiConfig';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Send a chat completion request to Azure AI Foundry and return the parsed
 * JSON body from the first choice.
 *
 * The caller is responsible for providing a system prompt that instructs the
 * model to respond with valid JSON matching the expected schema.
 */
export async function chatCompletion<T>(
  messages: ChatMessage[],
  temperature = 0.3,
): Promise<T> {
  const config = getAiConfig();

  // Build the URL – support both bare endpoints and full URLs
  const baseUrl = config.endpoint.replace(/\/+$/, '');
  const url = `${baseUrl}/openai/deployments/${encodeURIComponent(config.deploymentName)}/chat/completions?api-version=${config.apiVersion}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.apiKey,
    },
    body: JSON.stringify({
      messages,
      temperature,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Azure AI Foundry request failed (${response.status}): ${errorBody}`,
    );
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? '{}';

  return JSON.parse(content) as T;
}
