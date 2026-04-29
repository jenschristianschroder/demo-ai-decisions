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
  maxTokens?: number,
): Promise<T> {
  const endpoint = process.env.AZURE_AI_ENDPOINT;
  const deploymentName = process.env.AZURE_AI_DEPLOYMENT || DEFAULT_DEPLOYMENT;
  const apiVersion = process.env.AZURE_AI_API_VERSION || '2024-12-01-preview';

  if (!endpoint) {
    throw new Error(
      'AZURE_AI_ENDPOINT environment variable is not set.',
    );
  }

  // Normalise: ensure the endpoint has a scheme so fetch can parse it.
  const normalisedEndpoint =
    /^https?:\/\//i.test(endpoint) ? endpoint : `https://${endpoint}`;
  const baseUrl = normalisedEndpoint.replace(/\/+$/, '');
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
      ...(maxTokens != null && { max_tokens: maxTokens }),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Azure AI Foundry request failed (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string };
      finish_reason?: string;
    }>;
  };

  const choice = data.choices?.[0];
  if (choice?.finish_reason === 'length') {
    throw new Error(
      'AI response was truncated due to token limits. Try a simpler prompt.',
    );
  }

  const content: string = choice?.message?.content ?? '{}';

  return JSON.parse(content) as T;
}
