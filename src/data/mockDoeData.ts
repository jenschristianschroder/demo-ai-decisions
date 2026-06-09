import type { DoeStudy } from '../types/doe';

// ---------------------------------------------------------------------------
// MOCK DoE STUDIES — SYNTHETIC / SAMPLE DATA (demonstration only).
//
// This mirrors the style of src/data/mockFinancialData.ts: plain TypeScript
// literals, no backend. The primary study (DOE-2026-ADH-014) is the main
// walkthrough; the others populate the dashboard.
//
// The run values were generated from a known underlying effect structure so
// the statistics in src/lib/doeAnalysis.ts are MEANINGFUL and REAL:
//   - A (hydrocolloid content) strongly increases wear time and peel adhesion
//   - B (coating thickness) raises moisture absorption (a sweet-spot factor)
//   - C (cure temperature) has a smaller effect
//   - a clear A×B interaction is present
//   - small noise + one full replicate + 3 center points make replicate
//     variance (and thus significance) computable.
// ---------------------------------------------------------------------------

export const primaryStudy: DoeStudy = {
  id: 'DOE-2026-ADH-014',
  product: 'Next-generation ostomy baseplate — adhesive formulation',
  objective:
    'Optimize the baseplate adhesive to maximize wear time and seal integrity while minimizing skin stripping, to reduce night-time leakage.',
  hypothesis:
    'Higher hydrocolloid content and moderate coating thickness improve wear time and leakage resistance without increasing skin trauma.',
  background:
    'Night-time leakage is a leading driver of ostomy-care dissatisfaction and unplanned baseplate changes. Prior Gen-2 work (DOE-2025-ADH-009) identified coating thickness around 1.0 mm as a likely optimum but did not co-vary hydrocolloid content or cure temperature. This Gen-3 study screens all three factors together to find a robust operating window.',
  author: 'R&D Scientist (demo)',
  project: 'Baseplate Gen-3',
  date: '2026-06',
  designControlRef: 'DV-Gen3-ADH',
  designType: '2³ full factorial + 3 center points + 1 replicate (19 runs)',
  status: 'Ready for review',
  reportReadiness: 92,
  topFactor: 'Hydrocolloid content',
  factors: [
    { id: 'A', name: 'Hydrocolloid content', unit: '%', low: 30, high: 45, center: 37.5 },
    { id: 'B', name: 'Coating thickness', unit: 'mm', low: 0.8, high: 1.2, center: 1.0 },
    { id: 'C', name: 'Cure temperature', unit: '°C', low: 120, high: 150, center: 135 },
  ],
  responses: [
    { id: 'peelAdhesion_N_per_cm', label: 'Peel adhesion', unit: 'N/cm', goal: 'maximize', target: 2.5, direction: 'higher is better (target ≥ 2.5)' },
    { id: 'wearTime_hours', label: 'Wear time', unit: 'h', goal: 'maximize', direction: 'higher is better' },
    { id: 'moistureAbsorption_pct', label: 'Moisture absorption', unit: '%', goal: 'target', target: 7, direction: 'moderate is best (too high = swelling)' },
    { id: 'skinStripping_score', label: 'Skin stripping', unit: 'score 1–5', goal: 'minimize', direction: 'lower is better' },
    { id: 'leakageEvent', label: 'Leakage event', unit: '0/1', goal: 'minimize', direction: 'fewer is better' },
  ],
  runs: [
    { run: 1, A: 30, B: 0.8, C: 120, isCenterPoint: false, peelAdhesion_N_per_cm: 1.95, wearTime_hours: 90, moistureAbsorption_pct: 4.8, skinStripping_score: 2, leakageEvent: 1 },
    { run: 2, A: 45, B: 0.8, C: 120, isCenterPoint: false, peelAdhesion_N_per_cm: 2.54, wearTime_hours: 131, moistureAbsorption_pct: 5.2, skinStripping_score: 3, leakageEvent: 0 },
    { run: 3, A: 30, B: 1.2, C: 120, isCenterPoint: false, peelAdhesion_N_per_cm: 1.9, wearTime_hours: 86, moistureAbsorption_pct: 7.6, skinStripping_score: 2, leakageEvent: 1 },
    { run: 4, A: 45, B: 1.2, C: 120, isCenterPoint: false, peelAdhesion_N_per_cm: 2.79, wearTime_hours: 152, moistureAbsorption_pct: 8.7, skinStripping_score: 3, leakageEvent: 0 },
    { run: 5, A: 30, B: 0.8, C: 150, isCenterPoint: false, peelAdhesion_N_per_cm: 2.04, wearTime_hours: 96, moistureAbsorption_pct: 5.6, skinStripping_score: 2, leakageEvent: 1 },
    { run: 6, A: 45, B: 0.8, C: 150, isCenterPoint: false, peelAdhesion_N_per_cm: 2.64, wearTime_hours: 138, moistureAbsorption_pct: 6.1, skinStripping_score: 3, leakageEvent: 0 },
    { run: 7, A: 30, B: 1.2, C: 150, isCenterPoint: false, peelAdhesion_N_per_cm: 1.99, wearTime_hours: 92, moistureAbsorption_pct: 8.6, skinStripping_score: 3, leakageEvent: 1 },
    { run: 8, A: 45, B: 1.2, C: 150, isCenterPoint: false, peelAdhesion_N_per_cm: 2.85, wearTime_hours: 158, moistureAbsorption_pct: 9.5, skinStripping_score: 4, leakageEvent: 0 },
    { run: 9, A: 30, B: 0.8, C: 120, isCenterPoint: false, replicateOf: 1, peelAdhesion_N_per_cm: 1.9, wearTime_hours: 88, moistureAbsorption_pct: 4.6, skinStripping_score: 2, leakageEvent: 1 },
    { run: 10, A: 45, B: 0.8, C: 120, isCenterPoint: false, replicateOf: 2, peelAdhesion_N_per_cm: 2.63, wearTime_hours: 135, moistureAbsorption_pct: 4.9, skinStripping_score: 3, leakageEvent: 0 },
    { run: 11, A: 30, B: 1.2, C: 120, isCenterPoint: false, replicateOf: 3, peelAdhesion_N_per_cm: 1.85, wearTime_hours: 84, moistureAbsorption_pct: 7.8, skinStripping_score: 3, leakageEvent: 1 },
    { run: 12, A: 45, B: 1.2, C: 120, isCenterPoint: false, replicateOf: 4, peelAdhesion_N_per_cm: 2.84, wearTime_hours: 154, moistureAbsorption_pct: 8.8, skinStripping_score: 4, leakageEvent: 0 },
    { run: 13, A: 30, B: 0.8, C: 150, isCenterPoint: false, replicateOf: 5, peelAdhesion_N_per_cm: 1.96, wearTime_hours: 94, moistureAbsorption_pct: 5.5, skinStripping_score: 2, leakageEvent: 1 },
    { run: 14, A: 45, B: 0.8, C: 150, isCenterPoint: false, replicateOf: 6, peelAdhesion_N_per_cm: 2.69, wearTime_hours: 140, moistureAbsorption_pct: 5.9, skinStripping_score: 3, leakageEvent: 0 },
    { run: 15, A: 30, B: 1.2, C: 150, isCenterPoint: false, replicateOf: 7, peelAdhesion_N_per_cm: 1.94, wearTime_hours: 90, moistureAbsorption_pct: 8.7, skinStripping_score: 2, leakageEvent: 1 },
    { run: 16, A: 45, B: 1.2, C: 150, isCenterPoint: false, replicateOf: 8, peelAdhesion_N_per_cm: 2.94, wearTime_hours: 160, moistureAbsorption_pct: 9.7, skinStripping_score: 3, leakageEvent: 0 },
    { run: 17, A: 37.5, B: 1, C: 135, isCenterPoint: true, peelAdhesion_N_per_cm: 2.36, wearTime_hours: 119, moistureAbsorption_pct: 7.1, skinStripping_score: 3, leakageEvent: 0 },
    { run: 18, A: 37.5, B: 1, C: 135, isCenterPoint: true, peelAdhesion_N_per_cm: 2.31, wearTime_hours: 117, moistureAbsorption_pct: 6.9, skinStripping_score: 2, leakageEvent: 0 },
    { run: 19, A: 37.5, B: 1, C: 135, isCenterPoint: true, peelAdhesion_N_per_cm: 2.35, wearTime_hours: 119, moistureAbsorption_pct: 7, skinStripping_score: 3, leakageEvent: 0 },
  ],
};

// --- Secondary studies (dashboard rows only) ------------------------------

const sealingStudy: DoeStudy = {
  id: 'DOE-2026-SEAL-006',
  product: 'Sealing accessory — barrier ring leakage study',
  objective:
    'Reduce peristomal leakage by tuning barrier-ring tack and profile height under active-movement conditions.',
  hypothesis:
    'Higher tack and a taller convex profile reduce leakage but may raise removal-related skin stripping.',
  background:
    'Follow-up to field complaints on accessory ring lift during exercise. Screening design over tack, profile height, and ring diameter.',
  author: 'R&D Scientist (demo)',
  project: 'Accessory Seal',
  date: '2026-05',
  designControlRef: 'DV-Acc-SEAL',
  designType: '2³ full factorial + 2 center points (10 runs)',
  status: 'Analysis complete',
  reportReadiness: 64,
  topFactor: 'Ring tack',
  factors: [
    { id: 'A', name: 'Ring tack', unit: 'N', low: 4, high: 8, center: 6 },
    { id: 'B', name: 'Profile height', unit: 'mm', low: 2, high: 4, center: 3 },
    { id: 'C', name: 'Ring diameter', unit: 'mm', low: 20, high: 30, center: 25 },
  ],
  responses: [
    { id: 'leakageEvent', label: 'Leakage event', unit: '0/1', goal: 'minimize', direction: 'fewer is better' },
    { id: 'skinStripping_score', label: 'Skin stripping', unit: 'score 1–5', goal: 'minimize', direction: 'lower is better' },
  ],
  runs: [],
};

const cureStudy: DoeStudy = {
  id: 'DOE-2026-CURE-011',
  product: 'Adhesive coating — cure-temperature robustness study',
  objective:
    'Characterize the cure-temperature window that holds peel adhesion within spec across line-speed variation.',
  hypothesis:
    'Cure temperature interacts with line speed; a mid-range temperature gives the most robust adhesion.',
  background:
    'Process-robustness study to support manufacturing transfer of the Gen-3 adhesive.',
  author: 'R&D Scientist (demo)',
  project: 'Baseplate Gen-3',
  date: '2026-04',
  designControlRef: 'DV-Gen3-CURE',
  designType: '3-level response surface (face-centered, 13 runs)',
  status: 'Draft',
  reportReadiness: 38,
  topFactor: 'Cure temperature',
  factors: [
    { id: 'A', name: 'Cure temperature', unit: '°C', low: 120, high: 150, center: 135 },
    { id: 'B', name: 'Line speed', unit: 'm/min', low: 8, high: 16, center: 12 },
  ],
  responses: [
    { id: 'peelAdhesion_N_per_cm', label: 'Peel adhesion', unit: 'N/cm', goal: 'maximize', target: 2.5, direction: 'higher is better (target ≥ 2.5)' },
  ],
  runs: [],
};

export const doeStudies: DoeStudy[] = [primaryStudy, sealingStudy, cureStudy];

export function getDoeStudies(): DoeStudy[] {
  return doeStudies;
}

export function getDoeStudy(id: string): DoeStudy | undefined {
  return doeStudies.find((s) => s.id === id);
}

export function getPrimaryDoeStudy(): DoeStudy {
  return primaryStudy;
}
