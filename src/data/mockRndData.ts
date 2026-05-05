import type { RndScenario, RndDashboardSummary } from '../types/rnd';

// ---------------------------------------------------------------------------
// GeneratedRndData — used by setRndData / resetRndData
// ---------------------------------------------------------------------------

export interface GeneratedRndData {
  scenario: RndScenario;
}

// ---------------------------------------------------------------------------
// Default scenario
// ---------------------------------------------------------------------------

const ORIGINAL_SCENARIO: RndScenario = {
  id: 'ostomy-baseplate-v1',
  title: 'Next-Generation Ostomy Baseplate',
  businessQuestion:
    'Which product concept should the R&D team advance to the next development phase?',
  context:
    'The R&D team is developing a new ostomy baseplate to reduce night-time leakage and skin irritation. Three concepts have been proposed.',
  concepts: [
    {
      id: 'concept-a',
      name: 'Adhesive Formulation',
      label: 'Concept A',
      description: 'New adhesive formulation for longer wear time',
      hypothesis: 'Better adhesion will reduce leakage and improve wear time',
    },
    {
      id: 'concept-b',
      name: 'Flexible Geometry',
      label: 'Concept B',
      description: 'Flexible baseplate geometry for better body fit',
      hypothesis: 'Better fit during movement will reduce leakage at night',
    },
    {
      id: 'concept-c',
      name: 'Sealing Accessory',
      label: 'Concept C',
      description: 'Add-on sealing accessory for high-risk users',
      hypothesis: 'Extra protection will help high-risk users but may add complexity',
    },
  ],

  agentOutputs: {
    userInsights: {
      agentName: 'User Insights Agent',
      findings: [
        { factor: 'Frequency', finding: 'Night-time leakage appears in 28% of relevant complaints' },
        { factor: 'Severity', finding: 'Strong link to anxiety, sleep disruption, and reduced confidence' },
        { factor: 'Segment', finding: 'Highest among new ostomy users and users with uneven body contours' },
      ],
      implication: 'Prioritize concepts that improve fit and leakage prevention during movement',
    },

    clinicalEvidence: {
      agentName: 'Clinical Evidence Agent',
      findings: [
        { factor: 'Clinical relevance', finding: 'Leakage can contribute to peristomal skin complications' },
        { factor: 'Suggested endpoints', finding: 'Leakage frequency, wear time, skin condition, quality of life' },
        { factor: 'Evidence gap', finding: 'Need stronger evidence in night-time use conditions' },
      ],
      implication: 'Concepts must be testable against leakage and skin endpoints',
    },

    designConcept: {
      agentName: 'Design Concept Agent',
      entries: [
        { conceptId: 'concept-a', coreHypothesis: 'Better adhesion will reduce leakage and improve wear time' },
        { conceptId: 'concept-b', coreHypothesis: 'Better fit during movement will reduce leakage at night' },
        { conceptId: 'concept-c', coreHypothesis: 'Extra protection will help high-risk users but may add complexity' },
      ],
    },

    simulation: {
      agentName: 'Simulation Agent',
      entries: [
        { conceptId: 'concept-a', predictedLeakageReduction: '12%', confidence: 'Medium', keyConcern: 'May increase skin irritation on removal' },
        { conceptId: 'concept-b', predictedLeakageReduction: '22%', confidence: 'Medium-high', keyConcern: 'Performance depends on geometry tolerance' },
        { conceptId: 'concept-c', predictedLeakageReduction: '18%', confidence: 'Medium', keyConcern: 'Works well only if applied correctly' },
      ],
    },

    labTest: {
      agentName: 'Lab Test Agent',
      entries: [
        { conceptId: 'concept-a', adhesion: 'High', flexibility: 'Medium', leakageResistance: 'Medium', wearTimeStability: 'High' },
        { conceptId: 'concept-b', adhesion: 'Medium-high', flexibility: 'High', leakageResistance: 'High', wearTimeStability: 'Medium-high' },
        { conceptId: 'concept-c', adhesion: 'Medium', flexibility: 'Medium', leakageResistance: 'High', wearTimeStability: 'Medium' },
      ],
      failureModes: [
        { conceptId: 'concept-a', description: 'Performs well but has higher peel force' },
        { conceptId: 'concept-b', description: 'Performs consistently across movement conditions' },
        { conceptId: 'concept-c', description: 'Sensitive to application errors' },
      ],
    },

    humanFactors: {
      agentName: 'Human Factors Agent',
      entries: [
        { conceptId: 'concept-a', easeOfUse: 'High', useErrorRisk: 'Low', userConfidence: 'Medium' },
        { conceptId: 'concept-b', easeOfUse: 'High', useErrorRisk: 'Low', userConfidence: 'High' },
        { conceptId: 'concept-c', easeOfUse: 'Medium-low', useErrorRisk: 'High', userConfidence: 'Medium' },
      ],
      keyInsight: 'Concept C may perform well in the lab but fails more often when users apply it incorrectly.',
    },

    regulatoryRisk: {
      agentName: 'Regulatory & Risk Agent',
      entries: [
        { conceptId: 'concept-a', safetyRisk: 'Medium', claimsRisk: 'Medium', documentationBurden: 'Medium' },
        { conceptId: 'concept-b', safetyRisk: 'Low-medium' as 'Medium', claimsRisk: 'Medium', documentationBurden: 'Medium' },
        { conceptId: 'concept-c', safetyRisk: 'Medium-high' as 'Medium', claimsRisk: 'High', documentationBurden: 'High' },
      ],
      keyInsight: 'Concept C may require more training, clearer instructions, and stronger evidence before making leakage-reduction claims.',
    },

    manufacturingCost: {
      agentName: 'Manufacturing & Cost Agent',
      entries: [
        { conceptId: 'concept-a', manufacturability: 'Medium', estimatedCostImpact: 'Medium', scaleUpRisk: 'Medium' },
        { conceptId: 'concept-b', manufacturability: 'Medium-high', estimatedCostImpact: 'Low-medium' as 'Medium', scaleUpRisk: 'Low-medium' as 'Medium' },
        { conceptId: 'concept-c', manufacturability: 'High', estimatedCostImpact: 'Low', scaleUpRisk: 'Low' },
      ],
      keyInsight: 'Concept B is not the cheapest, but it has a good balance between performance and scalability.',
    },

    sustainability: {
      agentName: 'Sustainability Agent',
      entries: [
        { conceptId: 'concept-a', materialFootprint: 'Medium', packagingImpact: 'Low', sustainabilityRisk: 'Medium' },
        { conceptId: 'concept-b', materialFootprint: 'Low-medium' as 'Medium', packagingImpact: 'Low', sustainabilityRisk: 'Low' },
        { conceptId: 'concept-c', materialFootprint: 'Medium-high' as 'Medium', packagingImpact: 'Medium', sustainabilityRisk: 'Medium-high' as 'Medium' },
      ],
    },
  },

  finalDecision: {
    agentName: 'Decision Agent',
    criteria: [
      { name: 'User value', weight: 25 },
      { name: 'Clinical relevance', weight: 15 },
      { name: 'Technical performance', weight: 20 },
      { name: 'Usability', weight: 15 },
      { name: 'Regulatory risk', weight: 10 },
      { name: 'Manufacturability', weight: 10 },
      { name: 'Sustainability', weight: 5 },
    ],
    scores: [
      {
        conceptId: 'concept-a',
        scores: {
          'User value': 7,
          'Clinical relevance': 7,
          'Technical performance': 7,
          'Usability': 8,
          'Regulatory risk': 6,
          'Manufacturability': 6,
          'Sustainability': 6,
        },
        weightedScore: 7.0,
      },
      {
        conceptId: 'concept-b',
        scores: {
          'User value': 9,
          'Clinical relevance': 8,
          'Technical performance': 8,
          'Usability': 9,
          'Regulatory risk': 7,
          'Manufacturability': 7,
          'Sustainability': 8,
        },
        weightedScore: 8.2,
      },
      {
        conceptId: 'concept-c',
        scores: {
          'User value': 8,
          'Clinical relevance': 7,
          'Technical performance': 7,
          'Usability': 5,
          'Regulatory risk': 4,
          'Manufacturability': 8,
          'Sustainability': 5,
        },
        weightedScore: 6.5,
      },
    ],
    recommendation: 'advance',
    recommendedConceptId: 'concept-b',
    rationale:
      'Concept B has the strongest balance of user value, predicted leakage reduction, usability, manufacturability, and sustainability. It directly addresses the likely root cause: poor fit during movement and night-time use. Concept A should remain as a backup or be combined with Concept B later. Concept C should not move forward as the primary concept because usability and claims risk are too high.',
    decisionPackage: {
      recommendedAction: 'Move Concept B into next-phase prototyping and validation.',
      evidenceSummary:
        'Concept B performs best across user needs, simulation, lab data, and usability testing.',
      keyAssumptions: [
        'Better fit will reduce night-time leakage.',
        'Flexible geometry will not compromise wear time.',
        'Users can apply the product correctly without extra training.',
      ],
      risksToMonitor: [
        'Geometry may be harder to manufacture at tight tolerances.',
        'Leakage reduction must be confirmed in real-world use.',
        'Claims require stronger clinical evidence.',
      ],
      nextExperiments: [
        'Run extended wear-time testing.',
        'Test across different body contours and sleeping positions.',
        'Conduct formative usability study with new ostomy users.',
        'Validate leakage reduction under simulated night-time movement.',
        'Assess skin impact after repeated removal.',
      ],
      killCriteria: [
        'Leakage reduction is below target.',
        'Skin irritation increases.',
        'Manufacturing tolerance is not achievable.',
        'Users cannot apply the product reliably.',
        'Evidence does not support intended claims.',
      ],
    },
    conceptActions: [
      { conceptId: 'concept-b', action: 'advance', reason: 'Strongest balance across all criteria' },
      { conceptId: 'concept-a', action: 'backup', reason: 'Solid adhesive approach — consider combining with Concept B later' },
      { conceptId: 'concept-c', action: 'deprioritize', reason: 'Usability and claims risk too high for primary path' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Mutable state (allows AI-generated data to replace defaults)
// ---------------------------------------------------------------------------

let currentScenario: RndScenario = structuredClone(ORIGINAL_SCENARIO);

export function setRndData(data: GeneratedRndData): void {
  currentScenario = data.scenario;
}

export function resetRndData(): void {
  currentScenario = structuredClone(ORIGINAL_SCENARIO);
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

export function getRndScenario(): RndScenario {
  return currentScenario;
}

export function getRndConcept(conceptId: string) {
  return currentScenario.concepts.find((c) => c.id === conceptId);
}

export function getRndDashboardSummary(): RndDashboardSummary {
  const scores = currentScenario.finalDecision.scores;
  const recommended = currentScenario.concepts.find(
    (c) => c.id === currentScenario.finalDecision.recommendedConceptId,
  );
  return {
    totalConcepts: currentScenario.concepts.length,
    agentsCompleted: 9,
    totalAgents: 9,
    recommendedConcept: recommended?.name ?? 'N/A',
    weightedScoreRange: {
      min: Math.min(...scores.map((s) => s.weightedScore)),
      max: Math.max(...scores.map((s) => s.weightedScore)),
    },
  };
}
