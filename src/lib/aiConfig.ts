/**
 * Azure AI Foundry configuration.
 *
 * All values are read from Vite environment variables at build time.
 * See `.env.example` for required variables.
 */

export interface AiConfig {
  /** Full URL of the Azure AI Foundry chat completions endpoint. */
  endpoint: string;
  /** API key for the Azure AI Foundry endpoint. */
  apiKey: string;
  /** Deployment / model name (e.g. "gpt-4o"). */
  deploymentName: string;
  /** API version string (default: "2024-12-01-preview"). */
  apiVersion: string;
}

export function getAiConfig(): AiConfig {
  const endpoint = import.meta.env.VITE_AZURE_AI_ENDPOINT as string | undefined;
  const apiKey = import.meta.env.VITE_AZURE_AI_API_KEY as string | undefined;
  const deploymentName = (import.meta.env.VITE_AZURE_AI_DEPLOYMENT as string) || 'gpt-4o';
  const apiVersion =
    (import.meta.env.VITE_AZURE_AI_API_VERSION as string) || '2024-12-01-preview';

  if (!endpoint || !apiKey) {
    throw new Error(
      'Azure AI Foundry is not configured. Set VITE_AZURE_AI_ENDPOINT and VITE_AZURE_AI_API_KEY environment variables.',
    );
  }

  return { endpoint, apiKey, deploymentName, apiVersion };
}

/** Returns `true` when the required env vars are present. */
export function isAiConfigured(): boolean {
  return !!(import.meta.env.VITE_AZURE_AI_ENDPOINT && import.meta.env.VITE_AZURE_AI_API_KEY);
}
