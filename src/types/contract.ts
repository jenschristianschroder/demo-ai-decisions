// Progress tracking
export type ContractAgentPhase =
  | 'document-parse'
  | 'clause-extraction'
  | 'playbook-comparison'
  | 'risk-assessment'
  | 'redline-generation'
  | 'recommendation'
  | 'complete';

export interface ContractProgressStep {
  phase: ContractAgentPhase;
  status: 'pending' | 'running' | 'done' | 'error';
  message: string;
  reasoning?: string;
}

// Contract file info
export interface ContractFileInfo {
  name: string;
  type: 'contract' | 'playbook' | 'template';
  format: string;
  status: 'parsed' | 'placeholder' | 'error';
  warning?: string;
  extractedText?: string;
}

// Agent 1: Document Parse - metadata extraction
export interface ContractDocumentSummary {
  contractTitle: string;
  parties: { name: string; role: string }[];
  contractType: string;
  effectiveDate: string;
  expirationDate: string;
  governingLaw: string;
  language: string;
  totalClauses: number;
  summary: string;
  reasoning?: string;
}

// Agent 2: Clause Extraction
export type ClauseCategory =
  | 'liability'
  | 'indemnification'
  | 'termination'
  | 'payment'
  | 'confidentiality'
  | 'force-majeure'
  | 'dispute-resolution'
  | 'data-protection'
  | 'intellectual-property'
  | 'warranty'
  | 'insurance'
  | 'compliance'
  | 'other';

export interface ExtractedClause {
  clauseId: string;
  title: string;
  category: ClauseCategory;
  text: string;
  section: string;
  hasDefinitions: boolean;
  relatedClauses: string[];
}

// Agent 3: Playbook Comparison
export type DeviationType = 'missing' | 'weaker' | 'stronger' | 'different' | 'non-standard' | 'compliant';

export interface PlaybookDeviation {
  clauseId: string;
  deviationType: DeviationType;
  contractLanguage: string;
  playbookLanguage: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Agent 4: Risk Assessment
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskStatus = 'identified' | 'mitigated' | 'accepted' | 'escalated';

export interface ContractRisk {
  riskId: string;
  clauseId: string;
  category: string;
  riskLevel: RiskLevel;
  description: string;
  potentialImpact: string;
  likelihood: 'unlikely' | 'possible' | 'likely' | 'almost-certain';
  recommendedAction: string;
  alternativeClause?: string;
  status: RiskStatus;
}

// Agent 5: Redline Generation
export type RedlineType = 'addition' | 'deletion' | 'modification' | 'comment';

export interface RedlineItem {
  redlineId: string;
  clauseId: string;
  type: RedlineType;
  originalText: string;
  suggestedText: string;
  rationale: string;
  source: string; // e.g. "Legal Playbook Section 4.2"
  priority: 'required' | 'recommended' | 'optional';
}

// Agent 6: Recommendations
export interface ContractRecommendation {
  recommendationId: string;
  category: 'negotiate' | 'accept' | 'reject' | 'escalate' | 'add-clause';
  title: string;
  description: string;
  affectedClauses: string[];
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;
  playbookReference?: string;
}

// Container for all agent outputs
export interface ContractAgentOutputs {
  documentSummary: ContractDocumentSummary;
  clauses: ExtractedClause[];
  deviations: PlaybookDeviation[];
  risks: ContractRisk[];
  redlines: RedlineItem[];
  recommendations: ContractRecommendation[];
}

// Top-level scenario
export interface ContractScenario {
  id: string;
  title: string;
  description: string;
  files: ContractFileInfo[];
  agentOutputs?: ContractAgentOutputs;
  progressSteps: ContractProgressStep[];
}
