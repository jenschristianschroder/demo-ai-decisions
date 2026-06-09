import type { DoeChecklistItem } from '../types/doe';

// ---------------------------------------------------------------------------
// "Definition of Good" — completeness checklist used by the Completeness step
// to check a draft DoE report against R&D documentation standards.
// SAMPLE checklist for the demo.
// ---------------------------------------------------------------------------

export const doeDefinitionOfGood: DoeChecklistItem[] = [
  { id: 'dog-objective', label: 'Objective and hypothesis are clearly stated', sectionIds: ['objective'] },
  { id: 'dog-factors', label: 'All factors and their levels are documented', sectionIds: ['design'] },
  { id: 'dog-responses', label: 'All responses and acceptance targets are defined', sectionIds: ['design', 'methods'] },
  { id: 'dog-design', label: 'Design type, runs, replicates, and center points are described', sectionIds: ['design'] },
  { id: 'dog-results', label: 'Results table includes every run (with replicates and center points)', sectionIds: ['results'] },
  { id: 'dog-significance', label: 'Significant effects are reported with p-values', sectionIds: ['statistics'] },
  { id: 'dog-interactions', label: 'Two-factor interactions are evaluated', sectionIds: ['statistics'] },
  { id: 'dog-modelfit', label: 'Model fit (R²) is reported', sectionIds: ['statistics'] },
  { id: 'dog-conclusions', label: 'Conclusions trace directly to the data', sectionIds: ['conclusions', 'discussion'] },
  { id: 'dog-recommendations', label: 'Recommendations are actionable with specific settings', sectionIds: ['recommendations'] },
  { id: 'dog-rawdata', label: 'Raw data is appended', sectionIds: ['appendix'] },
];

export function getDoeDefinitionOfGood(): DoeChecklistItem[] {
  return doeDefinitionOfGood;
}
