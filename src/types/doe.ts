// ---------------------------------------------------------------------------
// Types for the "R&D DoE Report Assistant" demo.
//
// All data is SYNTHETIC / SAMPLE DATA for demonstration only. It models an
// AI-augmented Design of Experiments (DoE) reporting workflow for a medical
// device R&D team (Coloplast-style context). See src/data/mockDoeData.ts.
// ---------------------------------------------------------------------------

export type DoeStudyStatus =
  | 'Draft'
  | 'Analysis complete'
  | 'Ready for review'
  | 'Approved';

/** A controllable experiment factor with its low / high (and center) levels. */
export interface DoeFactor {
  id: string;   // single-letter design code, e.g. 'A'
  name: string; // e.g. 'Hydrocolloid content'
  unit: string; // e.g. '%'
  low: number;
  high: number;
  center: number;
}

export type ResponseGoal = 'maximize' | 'minimize' | 'target';

/** A measured response (output) of the experiment. */
export interface DoeResponse {
  id: string;    // matches the key used on DoeRun, e.g. 'wearTime_hours'
  label: string; // human readable, e.g. 'Wear time'
  unit: string;
  goal: ResponseGoal;
  target?: number;
  direction: string; // short note, e.g. 'higher is better'
}

/**
 * A single experimental run. Factor columns (A/B/C) hold the ACTUAL factor
 * value used (not coded units); the analysis engine codes them on the fly.
 */
export interface DoeRun {
  run: number;
  A: number;
  B: number;
  C: number;
  isCenterPoint: boolean;
  replicateOf?: number;
  peelAdhesion_N_per_cm: number;
  wearTime_hours: number;
  moistureAbsorption_pct: number;
  skinStripping_score: number;
  leakageEvent: number; // 0 / 1
}

export interface DoeStudy {
  id: string;
  product: string;
  objective: string;
  hypothesis: string;
  background: string;
  author: string;
  project: string;
  date: string;
  designControlRef: string;
  designType: string;
  status: DoeStudyStatus;
  reportReadiness: number; // 0-100
  topFactor: string;
  factors: DoeFactor[];
  responses: DoeResponse[];
  runs: DoeRun[];
}

/** One section heading + guidance from the report template. */
export interface DoeTemplateSection {
  id: string;
  title: string;
  guidance: string;
}

/** One item in the "Definition of Good" completeness checklist. */
export interface DoeChecklistItem {
  id: string;
  label: string;
  /** Which template section(s) this item is checked against. */
  sectionIds: string[];
}

/** A short summary of a prior experiment, used by the Knowledge step. */
export interface DoePriorReport {
  id: string;
  title: string;
  year: number;
  summary: string;
  takeaway: string;
  tags: string[];
}
