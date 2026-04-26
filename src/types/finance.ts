export type SubmissionStatus = 'Submitted' | 'Late' | 'Pending' | 'Resubmitted';
export type ReviewPriority = 'High' | 'Medium' | 'Low';
export type AnomalySeverity = 'High' | 'Medium' | 'Low';
export type AnomalyStatus = 'New' | 'In Review' | 'Pending Subsidiary Response' | 'Resolved' | 'Escalated';
export type CommentaryQuality = 'Strong' | 'Adequate' | 'Weak' | 'Missing';

export type AnomalyCategory =
  | 'Variance Anomaly'
  | 'Trend Anomaly'
  | 'Peer Anomaly'
  | 'Mapping Anomaly'
  | 'Ratio Anomaly'
  | 'Intercompany Mismatch'
  | 'Commentary Anomaly'
  | 'FX Translation Anomaly';

export interface Entity {
  id: string;
  code: string;
  name: string;
  country: string;
  region: string;
  currency: string;
  controllerName: string;
  controllerEmail: string;
  materialityThreshold: number;
  submissionStatus: SubmissionStatus;
  lastSubmittedAt: string;
  reviewPriority: ReviewPriority;
  riskScore: number;
  highRiskAnomalies: number;
  mediumRiskAnomalies: number;
  weakCommentaryCount: number;
  intercompanyBreaks: number;
}

export interface FinancialSubmission {
  period: string;
  entityId: string;
  accountId: string;
  accountName: string;
  reportingLine: string;
  actual: number;
  budget: number;
  priorMonth: number;
  priorYear: number;
  forecast: number;
  currency: string;
  commentary: string;
  historicalMonthly?: number[];
}

export interface Anomaly {
  id: string;
  entityId: string;
  period: string;
  priority: number;
  severity: AnomalySeverity;
  category: AnomalyCategory;
  accountId: string;
  accountName: string;
  finding: string;
  actual: number;
  benchmark: number;
  varianceAmount: number;
  variancePercent: number;
  materialityImpact: 'Above Materiality' | 'At Materiality' | 'Below Materiality';
  commentary: string;
  commentaryQuality: CommentaryQuality;
  explanation: string;
  possibleCauses: string[];
  recommendedFollowUp: string;
  status: AnomalyStatus;
  detectionMethod: string;
  createdAt: string;
  auditTrail: AuditEvent[];
  currency: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  note?: string;
  previousStatus?: AnomalyStatus;
  newStatus?: AnomalyStatus;
}

export interface DashboardSummary {
  submittedEntities: number;
  lateEntities: number;
  highRiskAnomalies: number;
  intercompanyBreaks: number;
  weakCommentaryItems: number;
  estimatedReviewTimeSaved: number;
}

export interface UploadResult {
  filesValidated: number;
  entitiesProcessed: number;
  anomaliesDetected: number;
  highPriorityAnomalies: number;
  weakCommentaryItems: number;
  intercompanyBreaks: number;
}

export interface AiResponse {
  explanation: string;
  possibleCauses: string[];
  recommendedFollowUp: string;
  draftEmail: string;
  confidenceLevel: number;
  evidenceList: string[];
}
