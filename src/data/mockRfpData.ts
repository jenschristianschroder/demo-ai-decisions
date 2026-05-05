import type { RfpScenario } from '../types/rfp';

// ---------------------------------------------------------------------------
// GeneratedRfpData — used by setRfpData / resetRfpData
// ---------------------------------------------------------------------------

export interface GeneratedRfpData {
  scenario: RfpScenario;
}

// ---------------------------------------------------------------------------
// Default scenario
// ---------------------------------------------------------------------------

const ORIGINAL_SCENARIO: RfpScenario = {
  id: 'acme-rfp-2026',
  title: 'Acme Public Services - Enterprise Analytics RFP',
  description: 'RFP response for Acme Public Services enterprise analytics and reporting platform procurement.',
  files: [],
  progressSteps: [],
};

// ---------------------------------------------------------------------------
// Mutable state (allows AI-generated data to replace defaults)
// ---------------------------------------------------------------------------

let currentScenario: RfpScenario = structuredClone(ORIGINAL_SCENARIO);

export function setRfpData(data: GeneratedRfpData): void {
  currentScenario = data.scenario;
}

export function resetRfpData(): void {
  currentScenario = structuredClone(ORIGINAL_SCENARIO);
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

export function getRfpScenario(): RfpScenario {
  return currentScenario;
}

export function updateRfpScenario(updater: (s: RfpScenario) => RfpScenario): void {
  currentScenario = updater(currentScenario);
}
