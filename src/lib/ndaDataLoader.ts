/**
 * NDA Demo Data Loader
 *
 * Loads markdown files from the sample-data/nda directory.
 * Files are served as static assets and fetched at runtime.
 */

import type { NdaTemplateId } from '../types/nda';

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
// Template file map
// ---------------------------------------------------------------------------

const TEMPLATE_FILES: Record<NdaTemplateId, string> = {
  'mutual-general': '/sample-data/nda/mutual-nda-general.md',
  'mutual-technology': '/sample-data/nda/mutual-nda-technology.md',
  'mutual-financial': '/sample-data/nda/mutual-nda-financial.md',
  'one-way-vendor': '/sample-data/nda/one-way-nda-vendor.md',
  'one-way-employee': '/sample-data/nda/one-way-nda-employee.md',
  'one-way-recruitment': '/sample-data/nda/one-way-nda-recruitment.md',
};

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

export async function loadTemplateCatalog(): Promise<string> {
  return (await fetchTextSafe('/sample-data/nda/nda-template-catalog.md')) ?? '';
}

export async function loadTemplateById(templateId: NdaTemplateId): Promise<string> {
  const path = TEMPLATE_FILES[templateId];
  if (!path) return '';
  return (await fetchTextSafe(path)) ?? '';
}

export async function loadNdaPlaybookData(): Promise<{ playbookText: string; escalationRulesText: string }> {
  const [playbookText, escalationRulesText] = await Promise.all([
    fetchTextSafe('/sample-data/nda/nda-playbook.md'),
    fetchTextSafe('/sample-data/nda/nda-escalation-rules.md'),
  ]);

  return {
    playbookText: playbookText ?? '',
    escalationRulesText: escalationRulesText ?? '',
  };
}

export async function loadCounterpartyRedline(): Promise<string> {
  return (await fetchTextSafe('/sample-data/nda/sample-counterparty-redline.md')) ?? '';
}
