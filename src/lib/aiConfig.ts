/**
 * AI configuration helpers.
 *
 * The backend handles all Azure AI Foundry authentication via Managed Identity.
 * The frontend only needs to know whether the backend API is available.
 */

/**
 * Returns `true` when the backend AI API should be used.
 *
 * Set `VITE_AI_BACKEND_ENABLED=true` (or omit — defaults to `true`) to route
 * AI calls through the Express backend.  Set to `"false"` to fall back to
 * hardcoded mock data (useful for local development without a backend).
 */
export function isAiConfigured(): boolean {
  const flag = import.meta.env.VITE_AI_BACKEND_ENABLED as string | undefined;
  // Default to true — when served by the Express backend the API is available.
  return flag !== 'false';
}
