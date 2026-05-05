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
      reasoning: 'I started by analyzing the complaint data landscape for ostomy baseplates. Night-time leakage is a well-documented issue in stoma care, affecting quality of life significantly. Looking at typical complaint patterns, I considered frequency distribution, severity mapping, and user segmentation. The 28% complaint frequency for night-time leakage aligns with published literature on ostomy complications. I then mapped each concept against the primary user pain points — movement during sleep causes baseplate lifting, adhesive fatigue over extended wear, and improper application by less experienced users. Concept B directly addresses the root cause (movement-induced leakage) while Concept A treats a symptom (adhesive strength) and Concept C adds complexity that may burden the very users who need help most.',
      findings: [
        { factor: 'Frequency', finding: 'Night-time leakage appears in 28% of relevant complaints' },
        { factor: 'Severity', finding: 'Strong link to anxiety, sleep disruption, and reduced confidence' },
        { factor: 'Segment', finding: 'Highest among new ostomy users and users with uneven body contours' },
      ],
      implication: 'Prioritize concepts that improve fit and leakage prevention during movement',
    },

    clinicalEvidence: {
      agentName: 'Clinical Evidence Agent',
      reasoning: 'I reviewed the clinical evidence landscape for ostomy baseplate performance. Peristomal skin complications are the most common clinical concern, with leakage being a primary contributing factor. The evidence base for night-time specific performance is limited — most studies evaluate overall wear time and skin condition without isolating sleep-related variables. This creates an evidence gap that any concept must address. I assessed each concept against the standard clinical endpoints: leakage frequency, wear time, skin condition (DET score), and quality of life (Stoma-QOL). All three concepts are testable, but they require different study designs — Concept C in particular needs a training component in the protocol.',
      findings: [
        { factor: 'Clinical relevance', finding: 'Leakage can contribute to peristomal skin complications' },
        { factor: 'Suggested endpoints', finding: 'Leakage frequency, wear time, skin condition, quality of life' },
        { factor: 'Evidence gap', finding: 'Need stronger evidence in night-time use conditions' },
      ],
      implication: 'Concepts must be testable against leakage and skin endpoints',
    },

    designConcept: {
      agentName: 'Design Concept Agent',
      reasoning: 'I analyzed the three design approaches against the problem statement. Concept A takes a materials-science approach — reformulating adhesive chemistry to increase peel strength and wear time. This is incremental innovation with predictable outcomes. Concept B takes a structural-engineering approach — redesigning the baseplate geometry to flex with body movement, maintaining seal integrity. This is more innovative and addresses the root cause of night-time leakage (body movement during sleep). Concept C takes an accessories approach — adding a secondary sealing layer for high-risk users. While this could work for specific segments, it adds application complexity. Each concept has a distinct design philosophy: materials optimization vs. structural innovation vs. modular augmentation.',
      entries: [
        { conceptId: 'concept-a', coreHypothesis: 'Better adhesion will reduce leakage and improve wear time' },
        { conceptId: 'concept-b', coreHypothesis: 'Better fit during movement will reduce leakage at night' },
        { conceptId: 'concept-c', coreHypothesis: 'Extra protection will help high-risk users but may add complexity' },
      ],
    },

    simulation: {
      agentName: 'Simulation Agent',
      reasoning: 'I modeled each concept using finite element analysis of baseplate-skin interface under simulated night-time movement conditions. For Concept A, the stronger adhesive shows only 12% leakage reduction because the fundamental problem is not adhesion strength but the inability of a rigid system to accommodate body contour changes during sleep. For Concept B, the flexible geometry shows 22% reduction with medium-high confidence — the geometry allows the baseplate to deform with the body, maintaining seal integrity. However, this is highly sensitive to manufacturing tolerances in the flex zones. For Concept C, the add-on seal shows 18% reduction but confidence is only medium because the simulation assumes correct application, which user insights suggest is problematic. I cross-referenced with the user insights findings about body contours to weight the movement simulation parameters.',
      entries: [
        { conceptId: 'concept-a', predictedLeakageReduction: '12%', confidence: 'Medium', keyConcern: 'May increase skin irritation on removal' },
        { conceptId: 'concept-b', predictedLeakageReduction: '22%', confidence: 'Medium-high', keyConcern: 'Performance depends on geometry tolerance' },
        { conceptId: 'concept-c', predictedLeakageReduction: '18%', confidence: 'Medium', keyConcern: 'Works well only if applied correctly' },
      ],
    },

    labTest: {
      agentName: 'Lab Test Agent',
      reasoning: 'I evaluated each concept against standard bench testing protocols for ostomy baseplates: adhesion (peel force testing), flexibility (dynamic flex testing), leakage resistance (hydrostatic pressure testing), and wear-time stability (accelerated aging). Concept A scores highest on adhesion and wear-time stability as expected from the reformulated adhesive, but only medium on flexibility and leakage resistance — stronger adhesion does not translate to better leak prevention under movement. Concept B shows the best overall profile with high flexibility and leakage resistance, confirming the simulation predictions. The key concern is that manufacturing tolerance of the flex zones must be tight to maintain consistent performance. Concept C shows high leakage resistance in controlled conditions but medium-to-low on other dimensions — and critically, the failure mode analysis reveals sensitivity to application errors, confirming the human factors concern.',
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
      reasoning: 'I assessed each concept through the lens of formative usability testing and use-error risk analysis (per IEC 62366-1). Concept A requires no change in user behavior — same application process, just a different adhesive — so ease of use is high and use-error risk is low. However, user confidence is only medium because users may not perceive a difference. Concept B also maintains familiar application patterns but with a noticeably different feel that could build confidence. The flexible geometry is intuitive — users can feel it conforming to their body. Concept C introduces a two-step application process that is prone to errors, especially for new ostomy users who are already learning basic pouch management. The user insights data showing highest leakage complaints among new users makes this particularly concerning — the users who need the most help are least equipped to handle the added complexity.',
      entries: [
        { conceptId: 'concept-a', easeOfUse: 'High', useErrorRisk: 'Low', userConfidence: 'Medium' },
        { conceptId: 'concept-b', easeOfUse: 'High', useErrorRisk: 'Low', userConfidence: 'High' },
        { conceptId: 'concept-c', easeOfUse: 'Medium-low', useErrorRisk: 'High', userConfidence: 'Medium' },
      ],
      keyInsight: 'Concept C may perform well in the lab but fails more often when users apply it incorrectly.',
    },

    regulatoryRisk: {
      agentName: 'Regulatory & Risk Agent',
      reasoning: 'I assessed each concept against EU MDR 2017/745 and FDA 510(k) requirements for Class IIa medical devices. Concept A involves a new adhesive formulation which triggers biocompatibility testing (ISO 10993) and potentially a new 510(k) if the adhesive chemistry is substantially different. Safety risk is medium — the higher peel force identified in lab testing could cause skin damage on removal. Concept B involves a geometry change which is generally within the scope of existing design change processes, with lower regulatory burden. Safety risk is medium-low as the flex zones are passive mechanical elements. Concept C introduces a separate accessory that may require its own regulatory classification and labeling. The high use-error risk from human factors analysis directly translates to elevated safety risk. Additionally, making leakage-reduction claims for Concept C would require robust clinical evidence that the current evidence base does not support.',
      entries: [
        { conceptId: 'concept-a', safetyRisk: 'Medium', claimsRisk: 'Medium', documentationBurden: 'Medium' },
        { conceptId: 'concept-b', safetyRisk: 'Medium-low', claimsRisk: 'Medium', documentationBurden: 'Medium' },
        { conceptId: 'concept-c', safetyRisk: 'Medium-high', claimsRisk: 'High', documentationBurden: 'High' },
      ],
      keyInsight: 'Concept C may require more training, clearer instructions, and stronger evidence before making leakage-reduction claims.',
    },

    manufacturingCost: {
      agentName: 'Manufacturing & Cost Agent',
      reasoning: 'I analyzed each concept from a production engineering perspective, considering current manufacturing capabilities, tooling requirements, material costs, and scale-up feasibility. Concept A requires a new adhesive formulation which means qualifying new raw materials, adjusting coating processes, and potentially modifying curing parameters. This is feasible but involves medium manufacturing risk. Concept B requires new baseplate molds with flex-zone geometry — the tooling investment is moderate and the process is compatible with existing thermoforming lines. The key risk is maintaining tight tolerances in the flex zones at high production volumes, but this is manageable with process controls. Concept C is actually the simplest to manufacture since the sealing accessory uses standard materials and can be produced on existing lines. However, the overall system cost increases because it is a separate SKU requiring separate packaging, inventory management, and distribution.',
      entries: [
        { conceptId: 'concept-a', manufacturability: 'Medium', estimatedCostImpact: 'Medium', scaleUpRisk: 'Medium' },
        { conceptId: 'concept-b', manufacturability: 'Medium-high', estimatedCostImpact: 'Medium-low', scaleUpRisk: 'Medium-low' },
        { conceptId: 'concept-c', manufacturability: 'High', estimatedCostImpact: 'Low', scaleUpRisk: 'Low' },
      ],
      keyInsight: 'Concept B is not the cheapest, but it has a good balance between performance and scalability.',
    },

    sustainability: {
      agentName: 'Sustainability Agent',
      reasoning: 'I evaluated each concept against sustainability criteria including material footprint (raw material consumption, recyclability), packaging impact (packaging volume and materials), and overall sustainability risk (regulatory exposure, consumer perception, ESG reporting). Concept A uses a reformulated adhesive that may involve new chemical compounds with uncertain environmental profiles — medium footprint. Concept B uses standard materials in a new geometry, which has a lower environmental footprint and is compatible with existing recycling streams. The flex zones do not add significant material volume. Concept C introduces an additional component which increases overall material consumption, requires separate packaging, and adds to the product waste stream. From a sustainability reporting perspective, Concept C has the highest risk due to the additional packaging and material waste.',
      entries: [
        { conceptId: 'concept-a', materialFootprint: 'Medium', packagingImpact: 'Low', sustainabilityRisk: 'Medium' },
        { conceptId: 'concept-b', materialFootprint: 'Medium-low', packagingImpact: 'Low', sustainabilityRisk: 'Low' },
        { conceptId: 'concept-c', materialFootprint: 'Medium-high', packagingImpact: 'Medium', sustainabilityRisk: 'Medium-high' },
      ],
    },
  },

  finalDecision: {
    agentName: 'Decision Agent',
    reasoning: 'After synthesizing all nine agent outputs, I identified a clear pattern: Concept B consistently outperforms across the most critical dimensions. The synthesis revealed strong agreement between user insights, simulation, lab test, and human factors agents that body-fit flexibility is the root-cause solution. The key tension was between Concept B\'s higher manufacturing complexity and Concept C\'s simpler production — but this is resolved by the human factors and regulatory data showing Concept C\'s usability and compliance risks outweigh its manufacturing advantage. I weighted the criteria to reflect the strategic priority: user value (25%) and technical performance (20%) are highest because this is fundamentally a user-facing product improvement. The devil\'s advocate challenge raised valid concerns about Concept B\'s manufacturing tolerance sensitivity, which I addressed by adding manufacturing tolerance validation to the next experiments and kill criteria.',
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
    devilsAdvocateChallenge: {
      challengedConceptId: 'concept-b',
      challenge: 'While Concept B scores highest overall, there are legitimate concerns about advancing it as the primary concept. The simulation agent\'s prediction of 22% leakage reduction carries only "Medium-high" confidence — not "High" — because performance is highly dependent on manufacturing geometry tolerances. The manufacturing agent noted that flex-zone tolerances must be tight, and the lab test agent confirmed that performance varies with geometry precision. If manufacturing cannot consistently hold these tolerances at scale, the real-world performance could be significantly lower than the simulated 22%. Furthermore, Concept A\'s adhesive approach is more proven and predictable, with higher certainty in outcomes even if the ceiling is lower. Sometimes the safer bet with a 12% guaranteed improvement is better than a 22% improvement that may or may not materialize at production scale.',
      counterArguments: [
        'Manufacturing tolerance concerns are valid but manageable with modern process controls and can be validated before full-scale commitment',
        'Concept A only addresses adhesion strength, not the root cause of night-time leakage (body movement), limiting its long-term potential',
        'The 12% vs 22% leakage reduction difference is clinically meaningful and worth the additional manufacturing investment',
        'Concept B\'s user confidence rating of "High" from human factors suggests users can perceive and trust the benefit, supporting stronger market positioning',
      ],
      resolution: 'The challenge about manufacturing tolerances is valid and has been incorporated by adding "Manufacturing tolerance achievable at production scale" as a kill criterion and "Validate geometry tolerance at pilot production scale" as a next experiment. However, the weight of evidence across all nine agents supports Concept B as the strongest candidate. The root-cause approach to leakage prevention through flexible geometry is more fundamentally sound than symptom-level adhesive improvements.',
    },
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
