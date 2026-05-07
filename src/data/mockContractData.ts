import type { ContractScenario } from '../types/contract';

export interface GeneratedContractData {
  scenario: ContractScenario;
}

const ORIGINAL_SCENARIO: ContractScenario = {
  id: 'vendor-service-agreement-2026',
  title: 'Global Logistics Vendor Service Agreement Review',
  description: 'AI-assisted review of a third-party vendor service agreement against the legal department playbook.',
  files: [],
  progressSteps: [],
};

let currentScenario: ContractScenario = structuredClone(ORIGINAL_SCENARIO);

export function setContractData(data: GeneratedContractData): void {
  currentScenario = data.scenario;
}

export function resetContractData(): void {
  currentScenario = structuredClone(ORIGINAL_SCENARIO);
}

export function getContractScenario(): ContractScenario {
  return currentScenario;
}

export function updateContractScenario(updater: (s: ContractScenario) => ContractScenario): void {
  currentScenario = updater(currentScenario);
}
