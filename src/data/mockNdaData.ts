import type { NdaScenario, NdaTemplateSummary, NdaIntakeData } from '../types/nda';

// ---------------------------------------------------------------------------
// Template Catalog
// ---------------------------------------------------------------------------

export const NDA_TEMPLATE_CATALOG: NdaTemplateSummary[] = [
  {
    id: 'mutual-general',
    name: 'Mutual NDA — General Commercial',
    type: 'mutual',
    description: 'Standard mutual NDA for general commercial discussions such as partnership exploration, joint ventures, or co-marketing.',
    typicalUseCases: ['Partnership exploration', 'Joint ventures', 'Co-marketing agreements', 'Distribution discussions'],
    keyClauses: ['Mutual confidentiality', 'Standard exclusions', 'Residuals clause', 'Equitable relief'],
    defaultTermRange: '1–3 years',
    defaultJurisdictions: ['New York, NY'],
  },
  {
    id: 'mutual-technology',
    name: 'Mutual NDA — Technology & IP',
    type: 'mutual',
    description: 'Mutual NDA with enhanced IP protections for technology partnerships involving source code, APIs, algorithms, or technical data.',
    typicalUseCases: ['Technology partnerships', 'API integrations', 'Joint development', 'Technical evaluations'],
    keyClauses: ['IP ownership', 'No reverse engineering', 'Security requirements', 'Restricted residuals', 'Indemnification'],
    defaultTermRange: '2–5 years',
    defaultJurisdictions: ['San Francisco, CA'],
  },
  {
    id: 'mutual-financial',
    name: 'Mutual NDA — Financial / M&A',
    type: 'mutual',
    description: 'Mutual NDA for financial due diligence, M&A, or investment discussions with standstill and MNPI compliance.',
    typicalUseCases: ['M&A discussions', 'Investment due diligence', 'Private equity evaluations', 'Strategic acquisitions'],
    keyClauses: ['Standstill provision', 'MNPI handling', 'No residuals', 'Securities law compliance', 'Indemnification'],
    defaultTermRange: '2–3 years',
    defaultJurisdictions: ['Wilmington, DE'],
  },
  {
    id: 'one-way-vendor',
    name: 'One-Way NDA — Vendor / Supplier',
    type: 'one-way',
    description: 'One-way NDA for sharing confidential information with vendors or suppliers during procurement or service delivery.',
    typicalUseCases: ['Vendor procurement', 'RFP processes', 'Service provider onboarding', 'Implementation projects'],
    keyClauses: ['Subcontractor restriction', 'Audit rights', 'Data handling', 'Indemnification'],
    defaultTermRange: '1–3 years',
    defaultJurisdictions: ['New York, NY'],
  },
  {
    id: 'one-way-employee',
    name: 'One-Way NDA — Employee / Contractor',
    type: 'one-way',
    description: 'One-way NDA for employees, contractors, or consultants being onboarded to a project or team.',
    typicalUseCases: ['Employee onboarding', 'Contractor engagement', 'Consultant access', 'Project team expansion'],
    keyClauses: ['Indefinite trade secret protection', 'Invention assignment reference', 'Non-solicitation reference', 'Broad information scope'],
    defaultTermRange: 'Indefinite (trade secrets) + 3 years (other)',
    defaultJurisdictions: ['New York, NY'],
  },
  {
    id: 'one-way-recruitment',
    name: 'One-Way NDA — Recruitment',
    type: 'one-way',
    description: 'Lightweight one-way NDA for the interview and recruitment process. Short term, no non-compete implications.',
    typicalUseCases: ['Job interviews', 'Technical assessments', 'Executive recruitment', 'Campus recruiting'],
    keyClauses: ['Limited scope', 'No employment obligation', 'No non-compete', 'Short term'],
    defaultTermRange: '6 months – 1 year',
    defaultJurisdictions: ['New York, NY'],
  },
];

// ---------------------------------------------------------------------------
// Default intake scenario
// ---------------------------------------------------------------------------

export const DEFAULT_INTAKE: NdaIntakeData = {
  counterpartyName: 'Acme Corp',
  purpose: 'Exploring a technology partnership to co-develop API integrations. Need to share API specifications, architecture diagrams, and proprietary algorithms.',
  ndaTypePreference: 'not-sure',
  scope: 'API specifications, system architecture documents, proprietary algorithms, and integration roadmaps',
  termMonths: null,
  jurisdiction: '',
  businessUnit: 'Engineering',
  requesterRole: 'VP of Engineering',
  selectedTemplateId: null,
};

// ---------------------------------------------------------------------------
// Scenario state management (same pattern as mockContractData.ts)
// ---------------------------------------------------------------------------

export interface GeneratedNdaData {
  scenario: NdaScenario;
}

const ORIGINAL_SCENARIO: NdaScenario = {
  id: 'nda-acme-tech-2026',
  title: 'NDA — Acme Corp Technology Partnership',
  description: 'AI-assisted NDA template selection and generation for a technology partnership discussion.',
  status: 'intake',
  intakeData: DEFAULT_INTAKE,
  progressSteps: [],
};

let currentScenario: NdaScenario = structuredClone(ORIGINAL_SCENARIO);

export function setNdaData(data: GeneratedNdaData): void {
  currentScenario = data.scenario;
}

export function resetNdaData(): void {
  currentScenario = structuredClone(ORIGINAL_SCENARIO);
}

export function getNdaScenario(): NdaScenario {
  return currentScenario;
}

export function updateNdaScenario(updater: (s: NdaScenario) => NdaScenario): void {
  currentScenario = updater(currentScenario);
}
