/**
 * Azure AI Foundry client using Managed Identity authentication.
 *
 * Uses @azure/identity DefaultAzureCredential which supports:
 * - System Assigned Managed Identity (in Azure)
 * - Azure CLI / VS Code credentials (local development)
 */

import { DefaultAzureCredential } from '@azure/identity';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const credential = new DefaultAzureCredential();

// Cache token to avoid fetching on every request
let cachedToken: { token: string; expiresOn: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresOn - now > 60_000) {
    return cachedToken.token;
  }

  const tokenResponse = await credential.getToken(
    'https://cognitiveservices.azure.com/.default',
  );

  cachedToken = {
    token: tokenResponse.token,
    expiresOn: tokenResponse.expiresOnTimestamp,
  };

  return tokenResponse.token;
}

export const DEFAULT_DEPLOYMENT = 'gpt-4o';

/**
 * Send a chat completion request to Azure AI Foundry using bearer token
 * authentication (Managed Identity) and return the parsed JSON from the
 * first choice.
 */
export async function chatCompletion<T>(
  messages: ChatMessage[],
  temperature = 0.3,
): Promise<T> {
  const endpoint = process.env.AZURE_AI_ENDPOINT;
  const deploymentName = process.env.AZURE_AI_DEPLOYMENT || DEFAULT_DEPLOYMENT;
  const apiVersion = process.env.AZURE_AI_API_VERSION || '2024-12-01-preview';

  if (!endpoint) {
    throw new Error(
      'AZURE_AI_ENDPOINT environment variable is not set.',
    );
  }

  const baseUrl = endpoint.replace(/\/+$/, '');
  const url = `${baseUrl}/openai/deployments/${encodeURIComponent(deploymentName)}/chat/completions?api-version=${apiVersion}`;

  const token = await getAccessToken();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content: string = data.choices?.[0]?.message?.content ?? '{}';

  return JSON.parse(content) as T;
}
