import type {
  OnboardingCase,
  OnboardingAuditEntry,
  ClientCaseState,
  ClientChatMessage,
  RevenueBand,
} from '../types/onboarding';
import { REVENUE_BAND_WEIGHT, URGENCY_WEIGHT } from '../types/onboarding';

// ---------------------------------------------------------------------------
// Seed cases — synthetic, fictitious prospects spanning all four bands.
// ---------------------------------------------------------------------------

const ORIGINAL_CASES: OnboardingCase[] = [
  {
    id: 'CASE-NORTHSTAR-2026',
    status: 'in-progress',
    currentStep: 'aml',
    owner: 'Priya Raghavan',
    enteredCurrentStepOn: '2026-05-04',
    intake: {
      clientName: 'Northstar Remit Ltd',
      clientType: 'remittance-provider',
      headquarters: 'London, UK',
      corridors: ['UK → Nigeria', 'EU → Morocco'],
      productMix: ['Consumer remittance'],
      declaredMonthlyVolumeEur: 1_400_000,
      publicRegistryNotes: 'Authorised Payment Institution (FCA), founded 2019',
      urgency: 'normal',
    },
  },
  {
    id: 'CASE-COBALT-2026',
    status: 'in-progress',
    currentStep: 'tech-integration',
    owner: 'Yusuf Eronini',
    enteredCurrentStepOn: '2026-05-12',
    intake: {
      clientName: 'Cobalt PSP GmbH',
      clientType: 'marketplace-psp',
      headquarters: 'Berlin, DE',
      corridors: ['intra-SEPA', 'EU → US', 'EU → UK'],
      productMix: ['Card acquiring', 'SEPA Instant', 'multi-currency settlement', 'nested payments'],
      declaredMonthlyVolumeEur: 12_000_000,
      publicRegistryNotes: 'EMI license (BaFin), serves SaaS marketplaces, founded 2017',
      urgency: 'high',
      urgencyReason: 'Client targeted Q3 marketplace launch, contractually committed.',
    },
  },
  {
    id: 'CASE-MERIDIAN-2026',
    status: 'in-progress',
    currentStep: 'kyc',
    owner: 'Anna Berg',
    enteredCurrentStepOn: '2026-05-18',
    intake: {
      clientName: 'Meridian Treasury Services NV',
      clientType: 'treasury-platform',
      headquarters: 'Amsterdam, NL',
      corridors: ['Global — EU, UK, US, APAC'],
      productMix: ['Embedded finance APIs', 'SEPA Instant', 'card acquiring', 'FX', 'nested payments'],
      declaredMonthlyVolumeEur: 48_000_000,
      publicRegistryNotes: 'Tier-1 treasury platform, regulated EMI, 600+ corporate customers',
      urgency: 'high',
      urgencyReason: 'Strategic logo, board-level commitment to Q3 go-live.',
    },
  },
  {
    id: 'CASE-ZEPHYR-2026',
    status: 'queued',
    currentStep: 'intake',
    owner: '—',
    enteredCurrentStepOn: '2026-05-22',
    intake: {
      clientName: 'Zephyr Wallet Inc.',
      clientType: 'consumer-wallet',
      headquarters: 'Dublin, IE',
      corridors: ['EU → UK', 'EU → US'],
      productMix: ['SEPA Instant', 'low-value FX'],
      declaredMonthlyVolumeEur: 1_800_000,
      publicRegistryNotes: 'EMI license (CBI), founded 2021, consumer fintech',
      urgency: 'low',
    },
  },
  {
    id: 'CASE-ATLAS-2026',
    status: 'blocked',
    currentStep: 'aml',
    owner: 'Priya Raghavan',
    enteredCurrentStepOn: '2026-04-25',
    intake: {
      clientName: 'Atlas Cross-Border AG',
      clientType: 'cross-border-specialist',
      headquarters: 'Zurich, CH',
      corridors: ['EU → APAC', 'EU → US', 'intra-EU'],
      productMix: ['SWIFT', 'FX', 'multi-currency settlement', 'nested payments'],
      declaredMonthlyVolumeEur: 15_000_000,
      publicRegistryNotes: 'FINMA-licensed, downstream PSP customers',
      urgency: 'normal',
    },
  },
  {
    id: 'CASE-ANDES-2026',
    status: 'queued',
    currentStep: 'intake',
    owner: '—',
    enteredCurrentStepOn: '2026-05-23',
    intake: {
      clientName: 'Andes Pay Holdings SpA',
      clientType: 'regional-acquirer',
      headquarters: 'Santiago, CL',
      corridors: ['LATAM → EU', 'LATAM → US'],
      productMix: ['Card acquiring', 'FX', 'settlement-in-currency'],
      declaredMonthlyVolumeEur: 4_500_000,
      publicRegistryNotes: 'CMF-supervised, regional acquirer for LATAM merchants',
      urgency: 'normal',
    },
  },
  {
    id: 'CASE-SOLIS-2026',
    status: 'queued',
    currentStep: 'intake',
    owner: '—',
    enteredCurrentStepOn: '2026-05-24',
    intake: {
      clientName: 'Solis Capital Markets Sàrl',
      clientType: 'broker-dealer',
      headquarters: 'Luxembourg',
      corridors: ['EU → US', 'intra-EU'],
      productMix: ['Settlement only'],
      declaredMonthlyVolumeEur: 600_000,
      publicRegistryNotes: 'CSSF-licensed boutique broker-dealer',
      urgency: 'low',
    },
  },
];

let cases: OnboardingCase[] = structuredClone(ORIGINAL_CASES);
let auditTrail: OnboardingAuditEntry[] = [];

// ---------------------------------------------------------------------------
// Cases CRUD-ish helpers
// ---------------------------------------------------------------------------

export function getAllCases(): OnboardingCase[] {
  return cases;
}

export function getCaseById(id: string): OnboardingCase | undefined {
  return cases.find((c) => c.id === id);
}

export function updateCase(id: string, updater: (c: OnboardingCase) => OnboardingCase): void {
  cases = cases.map((c) => (c.id === id ? updater(c) : c));
}

export function addCase(c: OnboardingCase): void {
  cases = [c, ...cases];
}

export function resetOnboardingData(): void {
  cases = structuredClone(ORIGINAL_CASES);
  auditTrail = [];
}

// ---------------------------------------------------------------------------
// Priority scoring
// ---------------------------------------------------------------------------

export function bandFor(c: OnboardingCase): RevenueBand | null {
  return c.revenueOverride?.band ?? c.revenueEstimate?.band ?? null;
}

export function priorityScore(c: OnboardingCase): number {
  const band = bandFor(c);
  const bandWeight = band ? REVENUE_BAND_WEIGHT[band] : 0;
  const urgencyWeight = URGENCY_WEIGHT[c.intake.urgency];
  // Pinned cases always win
  const pinBonus = c.pinnedToTop ? 100 : 0;
  return pinBonus + bandWeight * urgencyWeight;
}

export function sortCasesByPriority(list: OnboardingCase[]): OnboardingCase[] {
  return [...list].sort((a, b) => {
    if (a.manualRankPosition != null && b.manualRankPosition != null) {
      return a.manualRankPosition - b.manualRankPosition;
    }
    return priorityScore(b) - priorityScore(a);
  });
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

export function getAuditTrail(): OnboardingAuditEntry[] {
  return auditTrail;
}

export function appendAuditEntry(entry: OnboardingAuditEntry): void {
  auditTrail = [...auditTrail, entry];
}

// ---------------------------------------------------------------------------
// Client portal state (Use Case 3)
// ---------------------------------------------------------------------------

let chatLog: ClientChatMessage[] = [];

export function getChatLog(): ClientChatMessage[] {
  return chatLog;
}

export function appendChatMessage(msg: ClientChatMessage): void {
  chatLog = [...chatLog, msg];
}

export function resetChatLog(): void {
  chatLog = [];
}

// The active client case state is loaded from sample-data at runtime; this is
// a fallback used if the loader fails (e.g., offline).
export const FALLBACK_CLIENT_CASE_STATE: ClientCaseState = {
  caseId: 'CASE-NORTHSTAR-2026',
  clientName: 'Northstar Remit Ltd',
  currentStep: 'aml',
  stepStatus: 'in-review',
  openItems: [
    'Submit proof-of-address for signatory M. Okafor',
    'Confirm intended go-live month for UK → Nigeria corridor',
  ],
  completedSteps: [
    { step: 'intake', completedOn: '2026-04-22' },
    { step: 'kyc', completedOn: '2026-04-30' },
  ],
  publicNote: 'KYC complete, AML in review — typical wait at this step is 3–5 business days.',
  expectedGoLiveWindow: '18–24 June 2026',
};
