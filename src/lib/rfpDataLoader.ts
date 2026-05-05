/**
 * RFP Demo Data Loader
 *
 * Loads and parses CSV and markdown files from the sample-data directory.
 * Files are served as static assets and fetched at runtime.
 */

import type {
  ApprovedAnswer,
  SmeEntry,
  RiskRule,
  RequirementCategory,
  SubmissionChecklistItem,
  WinLossEntry,
  RfpDemoData,
  RfpFileInfo,
} from '../types/rfp';

// ---------------------------------------------------------------------------
// CSV Parser (simple, handles our controlled CSV files)
// ---------------------------------------------------------------------------

function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n');
  return lines.map(line => line.split(',').map(cell => cell.trim()));
}

function csvToObjects<T>(text: string, mapper: (row: string[], headers: string[]) => T): T[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).filter(row => row.length === headers.length).map(row => mapper(row, headers));
}

// ---------------------------------------------------------------------------
// Individual CSV parsers
// ---------------------------------------------------------------------------

function parseApprovedAnswers(text: string): ApprovedAnswer[] {
  return csvToObjects(text, (row) => ({
    id: row[0],
    category: row[1],
    questionPattern: row[2],
    approvedAnswer: row[3],
    evidenceSource: row[4],
    lastReviewed: row[5],
    owner: row[6],
    approvalStatus: row[7],
  }));
}

function parseSmeDirectory(text: string): SmeEntry[] {
  return csvToObjects(text, (row) => ({
    name: row[0],
    function: row[1],
    email: row[2],
    expertise: row[3],
    approvalAuthority: row[4],
    responseSlaHours: parseInt(row[5], 10) || 24,
  }));
}

function parseRiskRules(text: string): RiskRule[] {
  return csvToObjects(text, (row) => ({
    id: row[0],
    riskArea: row[1],
    triggerPattern: row[2],
    severity: row[3] as RiskRule['severity'],
    reason: row[4],
    recommendedAction: row[5],
    requiredApprover: row[6],
  }));
}

function parseRequirementCategories(text: string): RequirementCategory[] {
  return csvToObjects(text, (row) => ({
    category: row[0],
    description: row[1],
    defaultOwner: row[2],
    defaultRiskLevel: row[3],
  }));
}

function parseSubmissionChecklist(text: string): SubmissionChecklistItem[] {
  return csvToObjects(text, (row) => ({
    item: row[0],
    description: row[1],
    required: row[2]?.toLowerCase() === 'yes' || row[2]?.toLowerCase() === 'true',
    owner: row[3],
    defaultStatus: row[4],
  }));
}

function parseWinLossHistory(text: string): WinLossEntry[] {
  return csvToObjects(text, (row) => ({
    opportunity: row[0],
    buyerIndustry: row[1],
    dealSize: row[2],
    competitors: row[3],
    outcome: row[4],
    winLossReason: row[5],
    reusableLearning: row[6],
  }));
}

// ---------------------------------------------------------------------------
// File fetching helpers
// ---------------------------------------------------------------------------

async function fetchText(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return response.text();
}

async function fetchTextSafe(path: string): Promise<string | null> {
  try {
    return await fetchText(path);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// RFP File ingestion
// ---------------------------------------------------------------------------

const RFP_FILES: { name: string; type: RfpFileInfo['type']; format: string; path: string }[] = [
  { name: 'acme-public-services-rfp.md', type: 'rfp', format: 'md', path: '/sample-data/rfp/acme-public-services-rfp.md' },
  { name: 'acme-security-questionnaire.md', type: 'questionnaire', format: 'md', path: '/sample-data/rfp/acme-security-questionnaire.md' },
  { name: 'acme-pricing-template.md', type: 'pricing-template', format: 'md', path: '/sample-data/rfp/acme-pricing-template.md' },
];

export async function ingestRfpFiles(): Promise<RfpFileInfo[]> {
  const results: RfpFileInfo[] = [];

  for (const file of RFP_FILES) {
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
// Knowledge and historical RFP files
// ---------------------------------------------------------------------------

const KNOWLEDGE_FILES = [
  'product-overview.md',
  'integrations.md',
  'security-overview.md',
  'privacy-and-compliance.md',
  'implementation-methodology.md',
  'support-and-sla.md',
  'accessibility.md',
  'pricing-packaging.md',
  'legal-playbook.md',
  'competitive-positioning.md',
  'case-studies.md',
];

const HISTORICAL_RFPS = [
  'city-of-lakes-rfp-response.md',
  'metro-health-rfp-response.md',
  'nova-education-rfp-response.md',
];

export async function loadKnowledgeFiles(): Promise<{ filename: string; content: string }[]> {
  const results: { filename: string; content: string }[] = [];
  for (const file of KNOWLEDGE_FILES) {
    const text = await fetchTextSafe(`/sample-data/knowledge/${file}`);
    if (text) {
      results.push({ filename: file, content: text });
    }
  }
  return results;
}

export async function loadHistoricalRfps(): Promise<{ filename: string; content: string }[]> {
  const results: { filename: string; content: string }[] = [];
  for (const file of HISTORICAL_RFPS) {
    const text = await fetchTextSafe(`/sample-data/historical-rfps/${file}`);
    if (text) {
      results.push({ filename: file, content: text });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Load all demo data
// ---------------------------------------------------------------------------

export async function loadRfpDemoData(): Promise<RfpDemoData> {
  const [
    answersText,
    smeText,
    riskText,
    catText,
    checklistText,
    winLossText,
    knowledgeFiles,
    historicalRfps,
  ] = await Promise.all([
    fetchTextSafe('/sample-data/data/approved-answer-library.csv'),
    fetchTextSafe('/sample-data/data/sme-directory.csv'),
    fetchTextSafe('/sample-data/data/risk-rules.csv'),
    fetchTextSafe('/sample-data/data/requirement-categories.csv'),
    fetchTextSafe('/sample-data/data/submission-checklist-template.csv'),
    fetchTextSafe('/sample-data/data/win-loss-history.csv'),
    loadKnowledgeFiles(),
    loadHistoricalRfps(),
  ]);

  return {
    approvedAnswers: answersText ? parseApprovedAnswers(answersText) : [],
    smeDirectory: smeText ? parseSmeDirectory(smeText) : [],
    riskRules: riskText ? parseRiskRules(riskText) : [],
    requirementCategories: catText ? parseRequirementCategories(catText) : [],
    submissionChecklist: checklistText ? parseSubmissionChecklist(checklistText) : [],
    winLossHistory: winLossText ? parseWinLossHistory(winLossText) : [],
    knowledgeFiles,
    historicalRfps,
  };
}
