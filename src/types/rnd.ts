// ---------------------------------------------------------------------------
// R&D Concept Selection — Type definitions
// ---------------------------------------------------------------------------

export type ConceptId = string;

export type RatingLevel = 'High' | 'Medium-high' | 'Medium' | 'Medium-low' | 'Low';

export type ConfidenceLevel = 'High' | 'Medium-high' | 'Medium' | 'Medium-low' | 'Low';

export type RecommendationAction = 'advance' | 'backup' | 'deprioritize' | 'kill';

// ---------------------------------------------------------------------------
// Concepts
// ---------------------------------------------------------------------------

export interface RndConcept {
  id: ConceptId;
  name: string;
  label: string;          // e.g. "Concept A"
  description: string;
  hypothesis: string;
}

// ---------------------------------------------------------------------------
// Agent outputs
// ---------------------------------------------------------------------------

export interface UserInsightsFinding {
  factor: string;
  finding: string;
}

export interface UserInsightsOutput {
  agentName: 'User Insights Agent';
  findings: UserInsightsFinding[];
  implication: string;
}

export interface ClinicalEvidenceFinding {
  factor: string;
  finding: string;
}

export interface ClinicalEvidenceOutput {
  agentName: 'Clinical Evidence Agent';
  findings: ClinicalEvidenceFinding[];
  implication: string;
}

export interface DesignConceptEntry {
  conceptId: ConceptId;
  coreHypothesis: string;
}

export interface DesignConceptOutput {
  agentName: 'Design Concept Agent';
  entries: DesignConceptEntry[];
}

export interface SimulationEntry {
  conceptId: ConceptId;
  predictedLeakageReduction: string;
  confidence: ConfidenceLevel;
  keyConcern: string;
}

export interface SimulationOutput {
  agentName: 'Simulation Agent';
  entries: SimulationEntry[];
}

export interface LabTestEntry {
  conceptId: ConceptId;
  adhesion: RatingLevel;
  flexibility: RatingLevel;
  leakageResistance: RatingLevel;
  wearTimeStability: RatingLevel;
}

export interface LabTestFailureMode {
  conceptId: ConceptId;
  description: string;
}

export interface LabTestOutput {
  agentName: 'Lab Test Agent';
  entries: LabTestEntry[];
  failureModes: LabTestFailureMode[];
}

export interface HumanFactorsEntry {
  conceptId: ConceptId;
  easeOfUse: RatingLevel;
  useErrorRisk: RatingLevel;
  userConfidence: RatingLevel;
}

export interface HumanFactorsOutput {
  agentName: 'Human Factors Agent';
  entries: HumanFactorsEntry[];
  keyInsight: string;
}

export interface RegulatoryRiskEntry {
  conceptId: ConceptId;
  safetyRisk: RatingLevel;
  claimsRisk: RatingLevel;
  documentationBurden: RatingLevel;
}

export interface RegulatoryRiskOutput {
  agentName: 'Regulatory & Risk Agent';
  entries: RegulatoryRiskEntry[];
  keyInsight: string;
}

export interface ManufacturingCostEntry {
  conceptId: ConceptId;
  manufacturability: RatingLevel;
  estimatedCostImpact: RatingLevel;
  scaleUpRisk: RatingLevel;
}

export interface ManufacturingCostOutput {
  agentName: 'Manufacturing & Cost Agent';
  entries: ManufacturingCostEntry[];
  keyInsight: string;
}

export interface SustainabilityEntry {
  conceptId: ConceptId;
  materialFootprint: RatingLevel;
  packagingImpact: RatingLevel;
  sustainabilityRisk: RatingLevel;
}

export interface SustainabilityOutput {
  agentName: 'Sustainability Agent';
  entries: SustainabilityEntry[];
}

// ---------------------------------------------------------------------------
// Decision criteria & scoring
// ---------------------------------------------------------------------------

export interface DecisionCriterion {
  name: string;
  weight: number; // 0–100, sum should be 100
}

export interface ConceptScore {
  conceptId: ConceptId;
  scores: Record<string, number>; // criterion name → score (1–10)
  weightedScore: number;
}

// ---------------------------------------------------------------------------
// Decision package
// ---------------------------------------------------------------------------

export interface DecisionPackage {
  recommendedAction: string;
  evidenceSummary: string;
  keyAssumptions: string[];
  risksToMonitor: string[];
  nextExperiments: string[];
  killCriteria: string[];
}

export interface FinalDecisionOutput {
  agentName: 'Decision Agent';
  criteria: DecisionCriterion[];
  scores: ConceptScore[];
  recommendation: RecommendationAction;
  recommendedConceptId: ConceptId;
  rationale: string;
  decisionPackage: DecisionPackage;
  conceptActions: { conceptId: ConceptId; action: RecommendationAction; reason: string }[];
}

// ---------------------------------------------------------------------------
// Scenario (top-level container)
// ---------------------------------------------------------------------------

export interface RndScenario {
  id: string;
  title: string;
  businessQuestion: string;
  context: string;
  concepts: RndConcept[];
  agentOutputs: {
    userInsights: UserInsightsOutput;
    clinicalEvidence: ClinicalEvidenceOutput;
    designConcept: DesignConceptOutput;
    simulation: SimulationOutput;
    labTest: LabTestOutput;
    humanFactors: HumanFactorsOutput;
    regulatoryRisk: RegulatoryRiskOutput;
    manufacturingCost: ManufacturingCostOutput;
    sustainability: SustainabilityOutput;
  };
  finalDecision: FinalDecisionOutput;
}

// ---------------------------------------------------------------------------
// Dashboard summary
// ---------------------------------------------------------------------------

export interface RndDashboardSummary {
  totalConcepts: number;
  agentsCompleted: number;
  totalAgents: number;
  recommendedConcept: string;
  weightedScoreRange: { min: number; max: number };
}
