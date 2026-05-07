/**
 * Contract Demo Data Loader
 *
 * Loads markdown files from the sample-data/contract directory.
 * Files are served as static assets and fetched at runtime.
 */

import type { ContractFileInfo } from '../types/contract';

// ---------------------------------------------------------------------------
// File fetching helpers
// ---------------------------------------------------------------------------

async function fetchTextSafe(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      return null;
    }
    return response.text();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Contract file definitions
// ---------------------------------------------------------------------------

const CONTRACT_FILES: { name: string; type: ContractFileInfo['type']; format: string; path: string }[] = [
  { name: 'vendor-service-agreement.md', type: 'contract', format: 'md', path: '/sample-data/contract/vendor-service-agreement.md' },
  { name: 'standard-terms-playbook.md', type: 'playbook', format: 'md', path: '/sample-data/contract/standard-terms-playbook.md' },
  { name: 'clause-library.md', type: 'template', format: 'md', path: '/sample-data/contract/clause-library.md' },
];

// ---------------------------------------------------------------------------
// Contract file ingestion
// ---------------------------------------------------------------------------

export async function ingestContractFiles(): Promise<ContractFileInfo[]> {
  const results: ContractFileInfo[] = [];

  for (const file of CONTRACT_FILES) {
    const text = await fetchTextSafe(file.path);
    if (text) {
      results.push({
        name: file.name,
        type: file.type,
        format: file.format,
        status: 'parsed',
        extractedText: text,
      });
    } else {
      results.push({
        name: file.name,
        type: file.type,
        format: file.format,
        status: 'error',
        warning: `Could not load ${file.name}`,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Load playbook and clause library data
// ---------------------------------------------------------------------------

export async function loadContractPlaybookData(): Promise<{ playbookText: string; clauseLibraryText: string }> {
  const [playbookText, clauseLibraryText] = await Promise.all([
    fetchTextSafe('/sample-data/contract/standard-terms-playbook.md'),
    fetchTextSafe('/sample-data/contract/clause-library.md'),
  ]);

  return {
    playbookText: playbookText ?? '',
    clauseLibraryText: clauseLibraryText ?? '',
  };
}
