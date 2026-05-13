/**
 * Azure OpenAI embeddings client using Managed Identity authentication.
 *
 * Mirrors the bearer-token pattern in `aiClient.ts` so embedding calls
 * share the same auth path (System Assigned MI in Azure, az/VS Code
 * credentials locally) and do not require any API keys.
 *
 * Environment variables:
 *   AZURE_AI_ENDPOINT             — Azure OpenAI endpoint (same as chat)
 *   AZURE_AI_EMBEDDING_DEPLOYMENT — deployment name of the embedding
 *                                   model (defaults to text-embedding-3-small,
 *                                   which produces 1536-dim vectors and
 *                                   matches the `vector(1536)` columns
 *                                   defined in initSchema.sql).
 *   AZURE_AI_API_VERSION          — optional API version override.
 */

import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();

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

export const DEFAULT_EMBEDDING_DEPLOYMENT = 'text-embedding-3-small';

/** Dimension of the configured embedding model. Must match the
 *  `vector(N)` columns in `server/src/db/initSchema.sql`. */
export const EMBEDDING_DIM = 1536;

interface EmbeddingResponse {
  data?: Array<{ embedding: number[]; index: number }>;
  error?: { message?: string };
}

/**
 * Generate embeddings for a batch of input strings using Azure OpenAI.
 *
 * Returns vectors in the same order as the inputs. Throws on HTTP errors
 * so callers can decide whether to retry / skip.
 */
export async function embedBatch(inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return [];

  const endpoint = process.env.AZURE_AI_ENDPOINT;
  const deploymentName =
    process.env.AZURE_AI_EMBEDDING_DEPLOYMENT || DEFAULT_EMBEDDING_DEPLOYMENT;
  const apiVersion = process.env.AZURE_AI_API_VERSION || '2024-12-01-preview';

  if (!endpoint) {
    throw new Error('AZURE_AI_ENDPOINT environment variable is not set.');
  }

  const normalisedEndpoint = /^https?:\/\//i.test(endpoint)
    ? endpoint
    : `https://${endpoint}`;
  const baseUrl = normalisedEndpoint.replace(/\/+$/, '');
  const url = `${baseUrl}/openai/deployments/${encodeURIComponent(deploymentName)}/embeddings?api-version=${apiVersion}`;

  const token = await getAccessToken();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    // Pass `dimensions` so deployments of `text-embedding-3-large` (default
    // 3072 dims) return vectors that match the `vector(1536)` DB columns.
    // The parameter is supported by `text-embedding-3-small` (where it is a
    // no-op at 1536) and `text-embedding-3-large`.
    body: JSON.stringify({ input: inputs, dimensions: EMBEDDING_DIM }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Azure OpenAI embeddings request failed (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as EmbeddingResponse;
  if (!data.data || data.data.length !== inputs.length) {
    throw new Error(
      `Azure OpenAI embeddings response had ${data.data?.length ?? 0} vectors, expected ${inputs.length}.`,
    );
  }
  // The API returns items in `index` order, but sort defensively.
  return data.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/** Convenience helper for single-input embeddings. */
export async function embedOne(input: string): Promise<number[]> {
  const vectors = await embedBatch([input]);
  if (vectors.length === 0 || !vectors[0]) {
    throw new Error('Azure OpenAI embeddings returned no vector for single input.');
  }
  return vectors[0];
}

/**
 * Format a number array as a pgvector text literal: `[0.123,0.456,...]`.
 * pgvector accepts this format on input for `vector(N)` columns and
 * function arguments cast via `::vector`.
 */
export function toPgVector(values: number[]): string {
  return `[${values.join(',')}]`;
}
