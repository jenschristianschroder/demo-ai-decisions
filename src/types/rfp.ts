// ---------------------------------------------------------------------------
// RFP Response Demo — Type definitions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Progress tracking (follows RndProgressStep pattern)
// ---------------------------------------------------------------------------

export type RfpAgentPhase =
  | 'intake'
  | 'requirements'
  | 'knowledge'
  | 'drafting'
  | 'sme-routing'
  | 'risk-review'
  | 'compliance'
  | 'assembly'
  | 'complete';

export interface RfpProgressStep {
  phase: RfpAgentPhase;
  status: 'pending' | 'running' | 'done' | 'error';
  message: string;
  reasoning?: string;
}

// ---------------------------------------------------------------------------
// RFP File info
// ---------------------------------------------------------------------------

export interface RfpFileInfo {
  name: string;
  type: 'rfp' | 'questionnaire' | 'pricing-template';
  format: string; // md, pdf, docx, xlsx
  status: 'parsed' | 'placeholder' | 'error';
  warning?: string;
  extractedText?: string;
}

// ---------------------------------------------------------------------------
// Agent 1: Intake Summary
// ---------------------------------------------------------------------------

export interface RfpIntakeSummary {
  buyerName: string;
  rfpTitle: string;
  rfpNumber: string;
  deadline: string;
  submissionMethod: string;
  contactPerson: string;
  contactEmail: string;
  requiredAttachments: string[];
  evaluationCriteria: { criteria: string; weight: string }[];
  keyDates: { milestone: string; date: string }[];
  summary: string;
  openQuestions: string[];
  reasoning?: string;
}

// ---------------------------------------------------------------------------
// Agent 2: Requirement
// ---------------------------------------------------------------------------

export type RequirementStatus =
  | 'identified'
  | 'in-progress'
  | 'drafted'
  | 'reviewed'
  | 'complete'
  | 'needs-sme';

export interface RfpRequirement {
  requirementId: string;
  sourceSection: string;
  requirementText: string;
  category: string;
  mandatory: boolean;
  owner: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: RequirementStatus;
}

// ---------------------------------------------------------------------------
// Agent 3: Knowledge Match
// ---------------------------------------------------------------------------

export interface KnowledgeMatch {
  requirementId: string;
  matchedSources: string[];
  recommendedAnswerMaterial: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  stalenessWarning?: string;
  missingInformation?: string;
}

// ---------------------------------------------------------------------------
// Agent 4: Draft Answer
// ---------------------------------------------------------------------------

export interface DraftAnswer {
  requirementId: string;
  draftAnswer: string;
  sourceFiles: string[];
  confidence: 'high' | 'medium' | 'low';
  needsSmeReview: boolean;
  reviewReason?: string;
}

// ---------------------------------------------------------------------------
// Agent 5: SME Question
// ---------------------------------------------------------------------------

export type SmeQuestionStatus = 'pending' | 'sent' | 'answered' | 'overdue';

export interface SmeQuestion {
  questionId: string;
  requirementId: string;
  assignedTo: string;
  function: string;
  question: string;
  neededBy: string;
  status: SmeQuestionStatus;
}

// ---------------------------------------------------------------------------
// Agent 6: Risk Item
// ---------------------------------------------------------------------------

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RiskStatus = 'identified' | 'mitigated' | 'accepted' | 'escalated';

export interface RiskItem {
  riskId: string;
  requirementId: string;
  riskArea: string;
  severity: RiskSeverity;
  trigger: string;
  reason: string;
  recommendedAction: string;
  requiredApprover: string;
  status: RiskStatus;
}

// ---------------------------------------------------------------------------
// Agent 7: Compliance Row
// ---------------------------------------------------------------------------

export type ComplianceResponseStatus =
  | 'compliant'
  | 'partial'
  | 'non-compliant'
  | 'pending'
  | 'needs-review';

export interface ComplianceRow {
  requirementId: string;
  requirement: string;
  category: string;
  mandatory: boolean;
  owner: string;
  responseStatus: ComplianceResponseStatus;
  risk: 'low' | 'medium' | 'high' | 'critical';
  evidence: string;
  nextAction: string;
}

// ---------------------------------------------------------------------------
// Agent 8: Response Assembly
// ---------------------------------------------------------------------------

export interface ResponseAssembly {
  executiveSummary: string;
  responseSections: { section: string; content: string }[];
  assumptions: string[];
  openItems: string[];
  approvalNeeded: string[];
  submissionChecklist: { item: string; status: string; owner: string }[];
}

// ---------------------------------------------------------------------------
// Container for all agent outputs
// ---------------------------------------------------------------------------

export interface RfpAgentOutputs {
  intake: RfpIntakeSummary;
  requirements: RfpRequirement[];
  knowledgeMatches: KnowledgeMatch[];
  draftAnswers: DraftAnswer[];
  smeQuestions: SmeQuestion[];
  risks: RiskItem[];
  compliance: ComplianceRow[];
  assembly: ResponseAssembly;
}

// ---------------------------------------------------------------------------
// Top-level scenario
// ---------------------------------------------------------------------------

export interface RfpScenario {
  id: string;
  title: string;
  description: string;
  files: RfpFileInfo[];
  agentOutputs?: RfpAgentOutputs;
  progressSteps: RfpProgressStep[];
}

// ---------------------------------------------------------------------------
// CSV data types (parsed from sample-data/data/)
// ---------------------------------------------------------------------------

export interface ApprovedAnswer {
  id: string;
  category: string;
  questionPattern: string;
  approvedAnswer: string;
  evidenceSource: string;
  lastReviewed: string;
  owner: string;
  approvalStatus: string;
}

export interface SmeEntry {
  name: string;
  function: string;
  email: string;
  expertise: string;
  approvalAuthority: string;
  responseSlaHours: number;
}

export interface RiskRule {
  id: string;
  riskArea: string;
  triggerPattern: string;
  severity: RiskSeverity;
  reason: string;
  recommendedAction: string;
  requiredApprover: string;
}

export interface RequirementCategory {
  category: string;
  description: string;
  defaultOwner: string;
  defaultRiskLevel: string;
}

export interface SubmissionChecklistItem {
  item: string;
  description: string;
  required: boolean;
  owner: string;
  defaultStatus: string;
}

export interface WinLossEntry {
  opportunity: string;
  buyerIndustry: string;
  dealSize: string;
  competitors: string;
  outcome: string;
  winLossReason: string;
  reusableLearning: string;
}

// ---------------------------------------------------------------------------
// Loaded demo data container
// ---------------------------------------------------------------------------

export interface RfpDemoData {
  approvedAnswers: ApprovedAnswer[];
  smeDirectory: SmeEntry[];
  riskRules: RiskRule[];
  requirementCategories: RequirementCategory[];
  submissionChecklist: SubmissionChecklistItem[];
  winLossHistory: WinLossEntry[];
  knowledgeFiles: { filename: string; content: string }[];
  historicalRfps: { filename: string; content: string }[];
}
