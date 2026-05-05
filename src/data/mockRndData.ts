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
    'The R&D team is developing a new ostomy baseplate to reduce night-time leakage and skin irritation. Three concepts have been proposed. Internal user research shows that body movement during sleep is the primary driver of night-time leakage (reported by 68% of users), especially among users with higher BMI or abdominal creases. Clinical studies of body-conforming medical devices demonstrate 40-55% reduction in leakage events compared to rigid alternatives. The team prioritizes solutions that address root causes of leakage, have strong clinical backing, and maintain ease of use for patients.',
  concepts: [
    {
      id: 'concept-a',
      name: 'Adhesive Formulation',
      label: 'Concept A',
      description: 'New adhesive formulation for longer wear time. Improves bond strength but does not change the rigid baseplate geometry. Lab tests show strong adhesion on flat surfaces but edge-lifting occurs during lateral body movement.',
      hypothesis: 'Better adhesion may extend wear time on static surfaces, but may not address the geometric mismatch that causes leakage during body movement at night',
    },
    {
      id: 'concept-b',
      name: 'Flexible Geometry',
      label: 'Concept B',
      description: 'Flexible baseplate geometry using a body-conforming elastomer that adapts to abdominal contours during movement. Preliminary lab results show high flexibility, high leakage resistance, and maintained seal integrity across 48-hour wear cycles. Uses single-piece design for easy application.',
      hypothesis: 'A body-conforming flexible baseplate will significantly reduce night-time leakage by maintaining seal integrity during sleep movement — directly addressing the root cause identified in user research',
    },
    {
      id: 'concept-c',
      name: 'Sealing Accessory',
      label: 'Concept C',
      description: 'Add-on sealing ring accessory for high-risk users. Requires multi-step application process and adds a secondary component. Early usability testing shows 30% misalignment rate during self-application.',
      hypothesis: 'An additional sealing component may help some high-risk users, but the added complexity and multi-component design increases use-error risk and limits the addressable user population',
    },
  ],
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
  const hasResults = !!currentScenario.finalDecision;
  const scores = currentScenario.finalDecision?.scores ?? [];
  const recommended = currentScenario.finalDecision
    ? currentScenario.concepts.find(
        (c) => c.id === currentScenario.finalDecision!.recommendedConceptId,
      )
    : undefined;
  return {
    totalConcepts: currentScenario.concepts.length,
    agentsCompleted: hasResults ? 9 : 0,
    totalAgents: 9,
    recommendedConcept: recommended?.name ?? '—',
    weightedScoreRange: scores.length > 0
      ? {
          min: Math.min(...scores.map((s) => s.weightedScore)),
          max: Math.max(...scores.map((s) => s.weightedScore)),
        }
      : { min: 0, max: 0 },
  };
}
