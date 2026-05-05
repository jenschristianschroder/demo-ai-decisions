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
