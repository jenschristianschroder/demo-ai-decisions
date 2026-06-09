import type { DoeTemplateSection } from '../types/doe';

// ---------------------------------------------------------------------------
// DoE report template — the 11 standard section headings with one-line
// guidance each. SAMPLE template for the demo; in production this would live in
// an R&D document-control system and be grounded via Azure AI Search.
// ---------------------------------------------------------------------------

export const doeTemplate: DoeTemplateSection[] = [
  { id: 'header', title: 'Header & metadata', guidance: 'Study ID, product, author, project, date, design-control reference, and status.' },
  { id: 'objective', title: 'Objective & hypothesis', guidance: 'State the experiment objective and the testable hypothesis in one or two sentences.' },
  { id: 'background', title: 'Background', guidance: 'Summarize prior work, the problem being solved, and why this study is needed.' },
  { id: 'design', title: 'Experimental design', guidance: 'Describe the design type, factors with levels, responses, runs, replicates, and randomization.' },
  { id: 'methods', title: 'Materials & methods', guidance: 'List materials, equipment, test methods, and measurement procedures used.' },
  { id: 'results', title: 'Results table', guidance: 'Present the measured responses for every run, including center points and replicates.' },
  { id: 'statistics', title: 'Statistical analysis', guidance: 'Report main effects, interactions, p-values, and model fit from the analysis step.' },
  { id: 'discussion', title: 'Discussion', guidance: 'Interpret the effects, relate them to the hypothesis, and note limitations.' },
  { id: 'conclusions', title: 'Conclusions', guidance: 'State the conclusions that trace directly to the data and analysis.' },
  { id: 'recommendations', title: 'Recommendations & next steps', guidance: 'Give actionable settings and the recommended next experiments or confirmation runs.' },
  { id: 'appendix', title: 'Appendix (raw data)', guidance: 'Append the full raw run data and any supporting detail.' },
];

export function getDoeTemplate(): DoeTemplateSection[] {
  return doeTemplate;
}
