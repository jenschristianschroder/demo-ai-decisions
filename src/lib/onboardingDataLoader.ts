/**
 * Onboarding Demo Data Loader — fetches markdown / JSON grounding documents
 * from /sample-data/onboarding/ at runtime.
 */

import type { ClientCaseState } from '../types/onboarding';
import { FALLBACK_CLIENT_CASE_STATE } from '../data/mockOnboardingData';

async function fetchTextSafe(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}

async function fetchJsonSafe<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function loadClientProfiles(): Promise<string> {
  return (await fetchTextSafe('/sample-data/onboarding/client-profiles.md')) ?? '';
}

export async function loadRevenueBandingRubric(): Promise<string> {
  return (await fetchTextSafe('/sample-data/onboarding/revenue-banding-rubric.md')) ?? '';
}

export async function loadOnboardingProcess(): Promise<string> {
  return (await fetchTextSafe('/sample-data/onboarding/onboarding-process.md')) ?? '';
}

export interface StepTimingsBaseline {
  medianDays: number;
  p90Days: number;
}

export interface SegmentDeviation {
  segment: string;
  step: string;
  multiplierVsBaseline: number;
  evidence: string[];
}

export interface StepTimingsDoc {
  baseline: Record<string, StepTimingsBaseline>;
  segmentDeviations: SegmentDeviation[];
  endToEndMedianDays: number;
  endToEndP90Days: number;
}

export async function loadStepTimings(): Promise<StepTimingsDoc | null> {
  return await fetchJsonSafe<StepTimingsDoc>('/sample-data/onboarding/step-timings.json');
}

export async function loadOnboardingFaq(): Promise<string> {
  return (await fetchTextSafe('/sample-data/onboarding/product-and-onboarding-faq.md')) ?? '';
}

export async function loadEscalationContacts(): Promise<string> {
  return (await fetchTextSafe('/sample-data/onboarding/escalation-contacts.md')) ?? '';
}

interface ClientCaseStatesDoc {
  activeClientId: string;
  cases: ClientCaseState[];
}

export async function loadActiveClientCaseState(): Promise<ClientCaseState> {
  const doc = await fetchJsonSafe<ClientCaseStatesDoc>(
    '/sample-data/onboarding/client-case-states.json',
  );
  if (!doc) return FALLBACK_CLIENT_CASE_STATE;
  const active = doc.cases.find((c) => c.caseId === doc.activeClientId);
  return active ?? doc.cases[0] ?? FALLBACK_CLIENT_CASE_STATE;
}
