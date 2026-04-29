/**
 * Frontend API client.
 *
 * All AI calls are proxied through the Express backend which authenticates
 * with Azure AI Foundry via System Assigned Managed Identity.  The frontend
 * never handles credentials.
 */

/**
 * POST to a backend `/api/ai/*` endpoint and return the parsed JSON response.
 */
export async function apiPost<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API request failed (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as T;
}
