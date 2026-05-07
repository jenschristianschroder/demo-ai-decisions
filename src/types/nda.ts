// ---------------------------------------------------------------------------
// NDA Automation Types
// ---------------------------------------------------------------------------

// Template identification
export type NdaTemplateId =
  | 'mutual-general'
  | 'mutual-technology'
  | 'mutual-financial'
  | 'one-way-vendor'
  | 'one-way-employee'
  | 'one-way-recruitment';

export type NdaTemplateType = 'mutual' | 'one-way';

// Template catalog entry
export interface NdaTemplateSummary {
  id: NdaTemplateId;
  name: string;
  type: NdaTemplateType;
  description: string;
  typicalUseCases: string[];
  keyClauses: string[];
  defaultTermRange: string;
  defaultJurisdictions: string[];
}

// AI template recommendation
export interface NdaTemplateRecommendation {
  recommendedTemplateId: NdaTemplateId;
  confidence: number; // 0–1
  reasoning: string;
  alternatives: { templateId: NdaTemplateId; reason: string }[];
  clarifyingQuestions: string[];
}

// Intake form data
export interface NdaIntakeData {
  counterpartyName: string;
  purpose: string;
  ndaTypePreference: 'mutual' | 'one-way' | 'not-sure';
  scope: string;
  termMonths: number | null;
  jurisdiction: string;
  businessUnit: string;
  requesterRole: string;
  selectedTemplateId: NdaTemplateId | null;
}

// Agent progress tracking
export type NdaAgentPhase =
  | 'template-recommendation'
  | 'template-selection'
  | 'draft-generation'
  | 'redline-assessment'
  | 'playbook-validation'
  | 'approval-routing'
  | 'signature-dispatch'
  | 'complete';

export interface NdaProgressStep {
  phase: NdaAgentPhase;
  status: 'pending' | 'running' | 'done' | 'error';
  message: string;
  reasoning?: string;
}

// NDA status
export type NdaStatus =
  | 'intake'
  | 'template-selected'
  | 'draft-generated'
  | 'redline-reviewed'
  | 'validated'
  | 'approved'
  | 'dispatched'
  | 'signed';

// Draft document
export interface NdaDraft {
  title: string;
  templateId: NdaTemplateId;
  templateVersion: string;
  content: string;
  parties: { name: string; role: string }[];
  effectiveDate: string;
  term: string;
  governingLaw: string;
  summary: string;
  reasoning?: string;
}

// Redline assessment
export type RedlineClassification = 'accept' | 'reject' | 'negotiate' | 'escalate';

export interface NdaRedlineItem {
  clauseId: string;
  clauseTitle: string;
  originalText: string;
  counterpartyText: string;
  classification: RedlineClassification;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rationale: string;
  suggestedResponse: string;
  playbookReference?: string;
}

// Approval
export type ApprovalTier = 'tier-1' | 'tier-2' | 'tier-3';

export interface ApprovalDecision {
  tier: ApprovalTier;
  approver: string;
  approverRole: string;
  decision: 'approved' | 'conditionally-approved' | 'escalated' | 'rejected';
  conditions: string[];
  reasoning: string;
  sla: string;
  triggers: string[];
}

// Version history
export interface NdaVersionEntry {
  version: number;
  date: string;
  action: string;
  actor: string;
  summary: string;
  changes?: string[];
}

// Audit trail entry
export interface NdaAuditEntry {
  timestamp: string;
  agent: string;
  phase: NdaAgentPhase;
  action: string;
  detail: string;
  citations?: string[];
}

// Container for all agent outputs
export interface NdaAgentOutputs {
  templateRecommendation?: NdaTemplateRecommendation;
  draft?: NdaDraft;
  redlineAssessment?: NdaRedlineItem[];
  playbookValidation?: {
    compliant: boolean;
    findings: { clause: string; status: string; detail: string }[];
    reasoning?: string;
  };
  approval?: ApprovalDecision;
  signatureDispatch?: {
    status: string;
    dispatchMethod: string;
    recipients: { name: string; email: string; role: string }[];
    summary: string;
    reasoning?: string;
  };
  versionHistory?: NdaVersionEntry[];
  auditTrail?: NdaAuditEntry[];
}

// Top-level scenario
export interface NdaScenario {
  id: string;
  title: string;
  description: string;
  status: NdaStatus;
  intakeData: NdaIntakeData;
  agentOutputs?: NdaAgentOutputs;
  progressSteps: NdaProgressStep[];
}
