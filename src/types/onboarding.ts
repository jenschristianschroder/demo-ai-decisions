// ---------------------------------------------------------------------------
// Onboarding Intelligence — types
// ---------------------------------------------------------------------------

// Revenue band — one of four coarse classifications.
export type RevenueBand = 'low' | 'medium' | 'high' | 'strategic';

// Canonical onboarding steps (see sample-data/onboarding/onboarding-process.md).
export type OnboardingStepId =
  | 'intake'
  | 'kyc'
  | 'aml'
  | 'tech-integration'
  | 'signatory-verification'
  | 'product-configuration'
  | 'go-live';

export type OnboardingCaseStatus = 'queued' | 'in-progress' | 'blocked' | 'live';

export type ClientType =
  | 'remittance-provider'
  | 'consumer-wallet'
  | 'mid-size-psp'
  | 'regional-acquirer'
  | 'cross-border-specialist'
  | 'treasury-platform'
  | 'broker-dealer'
  | 'marketplace-psp'
  | 'other';

export type UrgencyLevel = 'low' | 'normal' | 'high';

// What the analyst captures at intake.
export interface ProspectIntake {
  clientName: string;
  clientType: ClientType;
  headquarters: string;
  corridors: string[]; // e.g. ['EU → UK', 'intra-SEPA']
  productMix: string[]; // e.g. ['SEPA Instant', 'card acquiring', 'nested payments']
  declaredMonthlyVolumeEur: number;
  publicRegistryNotes: string;
  urgency: UrgencyLevel;
  urgencyReason?: string;
}

// Output of the Revenue Estimation Agent.
export interface RevenueEstimate {
  band: RevenueBand;
  confidenceScore: number; // 0..1
  rationale: string; // one paragraph, plain language
  signals: string[]; // bullet-style signals the agent used
  comparableClientIds: string[]; // references into client-profiles.md
  citations: string[]; // sample-data references
}

// Manual override recorded by the team lead.
export interface RevenueOverride {
  band: RevenueBand;
  justification: string;
  overriddenBy: string;
  overriddenAt: string; // ISO timestamp
}

// Output of the Duration Agent (case mode).
export interface CaseDurationEstimate {
  expectedGoLiveStart: string; // ISO date
  expectedGoLiveEnd: string; // ISO date
  confidence: 'low' | 'medium' | 'high';
  currentBottleneckStep: OnboardingStepId;
  bottleneckOwner: string;
  historicWaitForStepDays: { medianDays: number; p90Days: number };
  rationale: string;
  clientSafeSummary: string;
  citations: string[];
}

// Output of the Duration Agent (portfolio mode).
export interface PortfolioInsight {
  id: string;
  headline: string;
  metric: string; // e.g. "AML median wait"
  magnitude: string; // e.g. "2.4×"
  affectedSegment: string;
  sourceCases: string[]; // case ids
  evidence: string;
  citations: string[];
}

export interface StepCycleTime {
  step: OnboardingStepId;
  medianDays: number;
  p90Days: number;
  inFlight: number;
}

// A case in the analyst queue.
export interface OnboardingCase {
  id: string;
  intake: ProspectIntake;
  status: OnboardingCaseStatus;
  currentStep: OnboardingStepId;
  owner: string;
  enteredCurrentStepOn: string; // ISO date
  revenueEstimate?: RevenueEstimate;
  revenueOverride?: RevenueOverride;
  durationEstimate?: CaseDurationEstimate;
  pinnedToTop?: boolean;
  manualRankPosition?: number; // optional override of priority sort
}

// Priority score = revenue band weight × urgency weight.
export const REVENUE_BAND_WEIGHT: Record<RevenueBand, number> = {
  low: 1,
  medium: 2,
  high: 3,
  strategic: 4,
};

export const URGENCY_WEIGHT: Record<UrgencyLevel, number> = {
  low: 1,
  normal: 2,
  high: 3,
};

// ---------------------------------------------------------------------------
// Client portal (Use Case 3)
// ---------------------------------------------------------------------------

export interface ChatCitation {
  sourcePath: string; // e.g. 'sample-data/onboarding/product-and-onboarding-faq.md'
  sectionAnchor: string; // human-readable heading
  excerpt: string;
}

export interface ChatHandoff {
  contactName: string;
  contactRole: string;
  reason: string;
}

export interface ClientChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatCitation[];
  handoff?: ChatHandoff;
  timestamp: string; // ISO
}

export interface ClientCaseState {
  caseId: string;
  clientName: string;
  currentStep: OnboardingStepId;
  stepStatus: string;
  openItems: string[];
  completedSteps: { step: OnboardingStepId; completedOn: string }[];
  publicNote: string;
  expectedGoLiveWindow: string;
}

// ---------------------------------------------------------------------------
// Agent progress (mirrors NdaProgressStep shape)
// ---------------------------------------------------------------------------

export type OnboardingAgentPhase =
  | 'revenue-estimation'
  | 'duration-case'
  | 'duration-portfolio'
  | 'client-chat';

export interface OnboardingProgressStep {
  phase: OnboardingAgentPhase;
  status: 'pending' | 'running' | 'done' | 'error';
  message: string;
  reasoning?: string;
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

export interface OnboardingAuditEntry {
  timestamp: string;
  agent: string;
  phase: OnboardingAgentPhase | 'override';
  action: string;
  detail: string;
  citations?: string[];
}
