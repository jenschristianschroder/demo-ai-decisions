import type { DoePriorReport } from '../types/doe';

// ---------------------------------------------------------------------------
// Prior-experiment corpus — short summaries surfaced by the Knowledge step.
// SAMPLE data for the demo; in production this would be retrieved from an R&D
// knowledge base via Azure AI Search (semantic + keyword ranking).
// ---------------------------------------------------------------------------

export const doePriorReports: DoePriorReport[] = [
  {
    id: 'DOE-2025-ADH-009',
    title: 'Coating thickness vs. wear time (Gen-2 adhesive)',
    year: 2025,
    summary:
      'Single-factor study varying coating thickness from 0.6–1.4 mm at fixed hydrocolloid content. Wear time peaked around 1.0 mm; thicker coatings increased moisture absorption and swelling.',
    takeaway: '1.0 mm coating thickness is a robust optimum; avoid thickness > 1.2 mm.',
    tags: ['adhesive', 'coating thickness', 'wear time', 'moisture'],
  },
  {
    id: 'DOE-2025-SEAL-003',
    title: 'Barrier-ring profile and leakage under movement',
    year: 2025,
    summary:
      'Screening study on barrier-ring tack and profile height for a sealing accessory. Higher tack reduced leakage events but raised removal-related skin stripping scores.',
    takeaway: 'Tack drives leakage resistance but trades off against skin stripping — balance both.',
    tags: ['sealing', 'leakage', 'skin stripping', 'tack'],
  },
  {
    id: 'HF-2025-USE-017',
    title: 'Human-factors handling study — baseplate application',
    year: 2025,
    summary:
      'Formative usability study of baseplate application and removal. Users associated firmer adhesives with confidence in seal but reported concern about skin trauma on removal.',
    takeaway: 'Communicate skin-friendliness alongside any adhesion increase to preserve user trust.',
    tags: ['human factors', 'usability', 'skin stripping', 'baseplate'],
  },
];

export function getDoePriorReports(): DoePriorReport[] {
  return doePriorReports;
}
