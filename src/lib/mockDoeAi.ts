import type {
  DoeStudy,
  DoeChecklistItem,
  DoePriorReport,
  DoeRun,
} from '../types/doe';
import {
  computeDoeAnalysis,
  type DoeAnalysisResult,
  type ResponseAnalysis,
  type EffectResult,
} from './doeAnalysis';
import { getDoeTemplate } from '../data/doeTemplate';
import { getDoeDefinitionOfGood } from '../data/doeDefinitionOfGood';
import { getDoePriorReports } from '../data/doePriorReports';

// ===========================================================================
// mockDoeAi.ts — DETERMINISTIC MOCK of the "R&D DoE Report Assistant" AI
// pipeline. It runs entirely in the browser with NO backend and NO Azure
// credentials, so `npm run dev` works out of the box.
//
// Theme: AI drafts, the scientist stays accountable. Every numeric claim is
// grounded in the REAL statistics computed by src/lib/doeAnalysis.ts.
//
// ───────────────────────────────────────────────────────────────────────────
// WHERE AZURE AI FOUNDRY WOULD BE INTEGRATED
// ───────────────────────────────────────────────────────────────────────────
// This mock mirrors src/lib/financeAi.ts (mock-first fallback). In production
// each step below would call Azure AI Foundry instead of returning canned text:
//
//   • Foundry model endpoint (e.g. GPT-4o) — generate the narrative report
//     sections from the Analysis output + template (the Drafting step).
//   • Foundry Agent Service — orchestrate the 6-step pipeline as a multi-agent
//     workflow (Intake → Analysis → Drafting → Fact-Check → Completeness →
//     Knowledge) with tool calls and hand-offs.
//   • Azure AI Search — ground generation in R&D report templates, design-
//     control standards, and the prior-experiment corpus (the Knowledge step).
//   • Azure AI Content Safety — screen generated narrative before it is shown.
//   • Azure Monitor / Application Insights — trace every AI call, token usage,
//     and grounding decision for auditability.
//   • Azure SQL / Microsoft Fabric Lakehouse — replace the mock experiment
//     data in src/data/mockDoeData.ts with the real LIMS / experiment store.
// ===========================================================================

// --- pipeline step model ---------------------------------------------------

export type DoeStepKey =
  | 'intake'
  | 'analysis'
  | 'drafting'
  | 'factcheck'
  | 'completeness'
  | 'knowledge';

export interface DoePipelineStep {
  key: DoeStepKey;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'done' | 'error';
  detail?: string;
}

export const DOE_PIPELINE_STEPS: { key: DoeStepKey; name: string; description: string }[] = [
  { key: 'intake', name: 'Intake', description: 'Load experiment definition + runs; validate schema.' },
  { key: 'analysis', name: 'Analysis', description: 'Compute main effects, interactions, and significance (real statistics).' },
  { key: 'drafting', name: 'Drafting', description: 'Generate the report section-by-section, grounded in the analysis + template.' },
  { key: 'factcheck', name: 'Grounding / Fact-Check', description: 'Verify every numeric claim against the computed values.' },
  { key: 'completeness', name: 'Completeness', description: 'Check the draft against the Definition of Good checklist.' },
  { key: 'knowledge', name: 'Knowledge', description: 'Surface relevant prior experiments from the corpus.' },
];

// --- report model ----------------------------------------------------------

export interface ReportSection {
  id: string;
  title: string;
  markdown: string;
}

export interface NumericClaim {
  id: string;
  sectionId: string;
  metric: string;
  text: string;            // claim as first drafted by the AI
  claimedValue: number;
  computedValue: number;
  unit: string;
  status: 'verified' | 'flagged';
  source: string;          // grounding source for the value
  correctedText?: string;  // present when a flagged claim is corrected
}

export interface CompletenessResult {
  item: DoeChecklistItem;
  satisfied: boolean;
  note: string;
}

export interface KnowledgeHit {
  report: DoePriorReport;
  relevance: number;
  matchedTags: string[];
  reason: string;
}

export interface DoeReport {
  studyId: string;
  generatedAt: string;
  analysis: DoeAnalysisResult;
  sections: ReportSection[];
  claims: NumericClaim[];
  completeness: CompletenessResult[];
  knowledge: KnowledgeHit[];
  readinessScore: number;
}

// --- formatting helpers ----------------------------------------------------

export function formatP(p: number | undefined): string {
  if (p === undefined || Number.isNaN(p)) return '—';
  if (p < 0.001) return '< 0.001';
  return p.toFixed(3);
}

function round(value: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round(value * f) / f;
}

function findResponse(analysis: DoeAnalysisResult, id: string): ResponseAnalysis | undefined {
  return analysis.responses.find((r) => r.responseId === id);
}

function findEffect(resp: ResponseAnalysis | undefined, name: string): EffectResult | undefined {
  return resp?.effects.find((e) => e.name === name);
}

// --- async simulation ------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===========================================================================
// Section drafting — grounded ONLY in the analysis output and the template.
// ===========================================================================

function draftSections(study: DoeStudy, analysis: DoeAnalysisResult): ReportSection[] {
  const wear = findResponse(analysis, 'wearTime_hours');
  const peel = findResponse(analysis, 'peelAdhesion_N_per_cm');
  const moisture = findResponse(analysis, 'moistureAbsorption_pct');
  const aWear = findEffect(wear, 'A');
  const abWear = findEffect(wear, 'A×B');
  const bMoist = findEffect(moisture, 'B');

  const factorTable = [
    '| Code | Factor | Unit | Low | Center | High |',
    '|------|--------|------|-----|--------|------|',
    ...study.factors.map(
      (f) => `| ${f.id} | ${f.name} | ${f.unit} | ${f.low} | ${f.center} | ${f.high} |`,
    ),
  ].join('\n');

  const responseList = study.responses
    .map((r) => `- **${r.label}** (${r.unit}) — ${r.direction}`)
    .join('\n');

  const resultsTable = buildResultsTable(study);

  const statsTable = buildStatisticsTable(analysis);

  return [
    {
      id: 'header',
      title: 'Header & metadata',
      markdown: [
        `**Study ID:** ${study.id}`,
        `**Product:** ${study.product}`,
        `**Author:** ${study.author}`,
        `**Project:** ${study.project}`,
        `**Date:** ${study.date}`,
        `**Design-control reference:** ${study.designControlRef}`,
        `**Status:** ${study.status}`,
      ].join('  \n'),
    },
    {
      id: 'objective',
      title: 'Objective & hypothesis',
      markdown: `**Objective.** ${study.objective}\n\n**Hypothesis.** ${study.hypothesis}`,
    },
    {
      id: 'background',
      title: 'Background',
      markdown: study.background,
    },
    {
      id: 'design',
      title: 'Experimental design',
      markdown:
        `This study used a **${study.designType}**. The factors and levels were:\n\n${factorTable}\n\n` +
        `The measured responses were:\n\n${responseList}\n\n` +
        `Runs were randomized; center points and one full replicate of the factorial block were included so that pure-error (replicate) variance — and therefore effect significance — could be estimated.`,
    },
    {
      id: 'methods',
      title: 'Materials & methods',
      markdown:
        'Adhesive samples were prepared at each factor setting and laminated to the baseplate substrate. ' +
        'Peel adhesion was measured by 90° peel (N/cm); wear time by accelerated in-vitro wear simulation (hours); ' +
        'moisture absorption gravimetrically (%); skin stripping by a 1–5 expert panel score; and leakage events recorded as a binary outcome. ' +
        'All measurements followed the standard R&D test methods referenced under design control ' +
        `${study.designControlRef}.`,
    },
    {
      id: 'results',
      title: 'Results table',
      markdown: resultsTable,
    },
    {
      id: 'statistics',
      title: 'Statistical analysis',
      markdown:
        `Effects are reported in coded units (mean at High − mean at Low). Significance was estimated using a **${wear?.method ?? 'replicate t-test'}** ` +
        (wear?.errorDf ? `with ${wear.errorDf} error degrees of freedom. ` : '. ') +
        `\n\n${statsTable}\n\n` +
        (aWear
          ? `For wear time, **${aWear.label}** is the dominant factor with an effect of **${round(aWear.effect, 1)} h** (p ${formatP(aWear.pValue)}). `
          : '') +
        (abWear && abWear.significant
          ? `A significant **${abWear.label}** interaction (${round(abWear.effect, 1)} h, p ${formatP(abWear.pValue)}) indicates the benefit of higher hydrocolloid content is amplified at moderate coating thickness. `
          : '') +
        (bMoist
          ? `Coating thickness is the main driver of moisture absorption (${round(bMoist.effect, 1)} %, p ${formatP(bMoist.pValue)}), confirming a sweet-spot trade-off. `
          : '') +
        (wear ? `The wear-time model fit is R² = ${round(wear.rSquared, 3)} (adjusted R² = ${round(wear.adjRSquared, 3)}).` : ''),
    },
    {
      id: 'discussion',
      title: 'Discussion',
      markdown:
        (aWear
          ? `Increasing hydrocolloid content from ${study.factors[0].low}% to ${study.factors[0].high}% raised wear time by ${round(aWear.effect, 0)} hours, the largest single effect in the study. `
          : '') +
        (peel ? `Peel adhesion followed the same direction, comfortably clearing the ${study.responses[0].target} N/cm target at high hydrocolloid content. ` : '') +
        'Coating thickness improved wear time modestly but pushed moisture absorption toward swelling at the high level, so thickness should not be maximized. ' +
        'Cure temperature had the smallest effect of the three factors. These findings are consistent with the stated hypothesis.',
    },
    {
      id: 'conclusions',
      title: 'Conclusions',
      markdown:
        'A combination of **moderate coating thickness and higher hydrocolloid content** gives the best wear time and the fewest leakage events while keeping skin stripping acceptable. ' +
        'All leakage events in this study occurred at the low hydrocolloid level.',
    },
    {
      id: 'recommendations',
      title: 'Recommendations & next steps',
      markdown:
        `1. Set hydrocolloid content to the high level (${study.factors[0].high}%) and coating thickness near the center point (${study.factors[1].center} mm).\n` +
        '2. Run a confirmation experiment (≥ 3 replicates) at the recommended settings to validate wear time and leakage performance.\n' +
        '3. Add a skin-friendliness verification given the small increase in skin stripping at high hydrocolloid content.\n' +
        '4. Hold cure temperature at the center point pending the separate cure-robustness study.',
    },
    {
      id: 'appendix',
      title: 'Appendix (raw data)',
      markdown: resultsTable,
    },
  ];
}

const RESULT_COLUMNS: { key: keyof DoeRun | 'A' | 'B' | 'C'; header: string }[] = [
  { key: 'run', header: 'Run' },
  { key: 'A', header: 'A' },
  { key: 'B', header: 'B' },
  { key: 'C', header: 'C' },
  { key: 'peelAdhesion_N_per_cm', header: 'Peel (N/cm)' },
  { key: 'wearTime_hours', header: 'Wear (h)' },
  { key: 'moistureAbsorption_pct', header: 'Moisture (%)' },
  { key: 'skinStripping_score', header: 'Skin (1–5)' },
  { key: 'leakageEvent', header: 'Leak' },
];

export function buildResultsTable(study: DoeStudy): string {
  const header = `| ${RESULT_COLUMNS.map((c) => c.header).join(' | ')} |`;
  const sep = `| ${RESULT_COLUMNS.map(() => '---').join(' | ')} |`;
  const rows = study.runs.map((r) => {
    const cells = RESULT_COLUMNS.map((c) => {
      const v = (r as unknown as Record<string, number>)[c.key as string];
      return String(v);
    });
    const tag = r.isCenterPoint ? ' (C)' : r.replicateOf ? ' (R)' : '';
    return `| ${cells.join(' | ')}${tag} |`;
  });
  return [header, sep, ...rows].join('\n');
}

export function buildStatisticsTable(analysis: DoeAnalysisResult): string {
  const lines: string[] = [];
  for (const resp of analysis.responses) {
    lines.push(`**${resp.responseLabel}** (${resp.unit}) — method: ${resp.method}, R² = ${round(resp.rSquared, 3)}`);
    lines.push('');
    lines.push('| Term | Type | Effect | p-value | Significant |');
    lines.push('|------|------|--------|---------|-------------|');
    for (const e of resp.effects) {
      lines.push(
        `| ${e.name} | ${e.type} | ${round(e.effect, 3)} | ${formatP(e.pValue)} | ${e.significant ? 'Yes' : 'no'} |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ===========================================================================
// Grounding / fact-check — verify every numeric claim against computed values.
// ===========================================================================

function buildClaims(study: DoeStudy, analysis: DoeAnalysisResult): NumericClaim[] {
  const wear = findResponse(analysis, 'wearTime_hours');
  const peel = findResponse(analysis, 'peelAdhesion_N_per_cm');
  const moisture = findResponse(analysis, 'moistureAbsorption_pct');
  const aWear = findEffect(wear, 'A');
  const abWear = findEffect(wear, 'A×B');
  const aPeel = findEffect(peel, 'A');
  const bMoist = findEffect(moisture, 'B');
  const leakage = findResponse(analysis, 'leakageEvent');
  const aLeak = findEffect(leakage, 'A');

  const claims: NumericClaim[] = [];

  if (aWear) {
    const computed = round(aWear.effect, 0);
    claims.push({
      id: 'claim-wear-A',
      sectionId: 'discussion',
      metric: 'Wear-time main effect of hydrocolloid content (A)',
      // DELIBERATELY WRONG: the first AI draft overstates the effect as 60 h.
      // The fact-check step below catches and corrects this to the real value.
      text: `Increasing hydrocolloid content raised wear time by 60 hours.`,
      claimedValue: 60,
      computedValue: computed,
      unit: 'h',
      status: 'verified',
      source: 'Analysis · wear time · main effect A',
    });
  }
  if (abWear) {
    const computed = round(abWear.effect, 1);
    claims.push({
      id: 'claim-wear-AB',
      sectionId: 'statistics',
      metric: 'Wear-time A×B interaction',
      text: `The hydrocolloid × thickness interaction on wear time was ${computed} hours.`,
      claimedValue: computed,
      computedValue: computed,
      unit: 'h',
      status: 'verified',
      source: 'Analysis · wear time · A×B interaction',
    });
  }
  if (aPeel) {
    const computed = round(aPeel.effect, 2);
    claims.push({
      id: 'claim-peel-A',
      sectionId: 'discussion',
      metric: 'Peel-adhesion main effect of hydrocolloid content (A)',
      text: `Hydrocolloid content increased peel adhesion by ${computed} N/cm.`,
      claimedValue: computed,
      computedValue: computed,
      unit: 'N/cm',
      status: 'verified',
      source: 'Analysis · peel adhesion · main effect A',
    });
  }
  if (bMoist) {
    const computed = round(bMoist.effect, 1);
    claims.push({
      id: 'claim-moist-B',
      sectionId: 'statistics',
      metric: 'Moisture-absorption main effect of coating thickness (B)',
      text: `Coating thickness increased moisture absorption by ${computed}%.`,
      claimedValue: computed,
      computedValue: computed,
      unit: '%',
      status: 'verified',
      source: 'Analysis · moisture absorption · main effect B',
    });
  }
  if (wear) {
    const computed = round(wear.rSquared, 3);
    claims.push({
      id: 'claim-wear-r2',
      sectionId: 'statistics',
      metric: 'Wear-time model fit (R²)',
      text: `The wear-time model explained ${computed} of the variance (R²).`,
      claimedValue: computed,
      computedValue: computed,
      unit: '',
      status: 'verified',
      source: 'Analysis · wear time · model fit',
    });
  }
  if (aLeak) {
    // Count leakage events at the low hydrocolloid level — descriptive, grounded.
    const lowA = study.factors[0].low;
    const lowLeaks = study.runs.filter((r) => r.A === lowA).reduce((s, r) => s + r.leakageEvent, 0);
    claims.push({
      id: 'claim-leak-A',
      sectionId: 'conclusions',
      metric: 'Leakage events at low hydrocolloid content',
      text: `All ${lowLeaks} leakage events occurred at the low hydrocolloid level.`,
      claimedValue: lowLeaks,
      computedValue: lowLeaks,
      unit: 'events',
      status: 'verified',
      source: 'Analysis · leakage · raw runs at A = low',
    });
  }

  return claims;
}

/** Verify claims against computed values; flag and correct any mismatch. */
function verifyClaims(claims: NumericClaim[]): NumericClaim[] {
  return claims.map((c) => {
    const tol = c.unit === '' ? 0.02 : Math.max(0.05, Math.abs(c.computedValue) * 0.02);
    const ok = Math.abs(c.claimedValue - c.computedValue) <= tol;
    if (ok) {
      return { ...c, status: 'verified' as const };
    }
    // Build a corrected sentence by substituting the verified value.
    const corrected = c.text.replace(
      String(c.claimedValue),
      `${c.computedValue}`,
    );
    return {
      ...c,
      status: 'flagged' as const,
      correctedText: corrected,
    };
  });
}

// ===========================================================================
// Completeness — check the draft against the Definition of Good.
// ===========================================================================

function checkCompleteness(
  sections: ReportSection[],
  analysis: DoeAnalysisResult,
): CompletenessResult[] {
  const items = getDoeDefinitionOfGood();
  const present = new Set(sections.filter((s) => s.markdown.trim().length > 0).map((s) => s.id));
  const hasSignificance = analysis.responses.some((r) => r.effects.some((e) => e.significant));

  return items.map((item) => {
    let satisfied = item.sectionIds.every((id) => present.has(id));
    let note = satisfied ? 'Present.' : `Missing section(s): ${item.sectionIds.join(', ')}.`;

    if (item.id === 'dog-significance') {
      satisfied = satisfied && hasSignificance;
      note = satisfied ? 'Significant effects reported with p-values.' : 'No significant effects with p-values found.';
    }
    if (item.id === 'dog-recommendations') {
      // Deliberate, realistic minor gap to show the checklist surfacing work.
      satisfied = false;
      note = 'Recommendations are present but the confirmation-run sample size is not yet specified — add before approval.';
    }
    return { item, satisfied, note };
  });
}

// ===========================================================================
// Knowledge — surface relevant prior experiments from the corpus.
// ===========================================================================

function retrieveKnowledge(study: DoeStudy): KnowledgeHit[] {
  const reports = getDoePriorReports();
  const studyTerms = new Set(
    [
      ...study.factors.map((f) => f.name.toLowerCase()),
      ...study.responses.map((r) => r.label.toLowerCase()),
      'adhesive',
      'leakage',
      'wear time',
    ].flatMap((t) => t.split(/\s+/)),
  );

  return reports
    .map((report) => {
      const matchedTags = report.tags.filter((tag) =>
        tag
          .toLowerCase()
          .split(/\s+/)
          .some((w) => studyTerms.has(w)),
      );
      const relevance = matchedTags.length / report.tags.length;
      return {
        report,
        relevance,
        matchedTags,
        reason:
          matchedTags.length > 0
            ? `Matched on: ${matchedTags.join(', ')}.`
            : 'Related R&D experiment in the same product area.',
      };
    })
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
}

// ===========================================================================
// Public API
// ===========================================================================

export interface DoePipelineProgress {
  steps: DoePipelineStep[];
}

/**
 * Run the full 6-step DoE report pipeline as a deterministic mock.
 *
 * TODO: Azure AI Foundry — replace this orchestration with Foundry Agent
 * Service; each step becomes an agent/tool call. The Analysis step keeps using
 * src/lib/doeAnalysis.ts (real statistics) regardless of backend.
 */
export async function runDoePipeline(
  study: DoeStudy,
  onProgress: (steps: DoePipelineStep[]) => void,
): Promise<DoeReport> {
  const steps: DoePipelineStep[] = DOE_PIPELINE_STEPS.map((s) => ({
    ...s,
    status: 'pending',
  }));

  const setStep = (key: DoeStepKey, status: DoePipelineStep['status'], detail?: string) => {
    const idx = steps.findIndex((s) => s.key === key);
    if (idx >= 0) steps[idx] = { ...steps[idx], status, detail };
    onProgress(steps.map((s) => ({ ...s })));
  };

  // 1. Intake
  setStep('intake', 'running');
  await delay(500);
  const runCount = study.runs.length;
  const factorCount = study.factors.length;
  setStep('intake', 'done', `Loaded ${runCount} runs across ${factorCount} factors; schema valid.`);

  // 2. Analysis (REAL computation)
  setStep('analysis', 'running');
  await delay(700);
  const analysis = computeDoeAnalysis(study);
  const sigCount = analysis.responses.reduce(
    (sum, r) => sum + r.effects.filter((e) => e.significant).length,
    0,
  );
  setStep('analysis', 'done', `${sigCount} significant effects; top factor: ${analysis.topFactorName}.`);

  // 3. Drafting
  setStep('drafting', 'running');
  await delay(700);
  const sections = draftSections(study, analysis);
  setStep('drafting', 'done', `Drafted ${sections.length} sections grounded in the analysis + template.`);

  // 4. Fact-check / grounding
  setStep('factcheck', 'running');
  await delay(700);
  const claims = verifyClaims(buildClaims(study, analysis));
  const flagged = claims.filter((c) => c.status === 'flagged').length;
  setStep(
    'factcheck',
    'done',
    `${claims.length} numeric claims checked; ${flagged} flagged and corrected, ${claims.length - flagged} verified.`,
  );

  // 5. Completeness
  setStep('completeness', 'running');
  await delay(600);
  const completeness = checkCompleteness(sections, analysis);
  const gaps = completeness.filter((c) => !c.satisfied).length;
  const readinessScore = Math.round(
    ((completeness.length - gaps) / completeness.length) * 100,
  );
  setStep('completeness', 'done', `${completeness.length - gaps}/${completeness.length} checklist items satisfied.`);

  // 6. Knowledge
  setStep('knowledge', 'running');
  await delay(500);
  const knowledge = retrieveKnowledge(study);
  setStep('knowledge', 'done', `Surfaced ${knowledge.length} relevant prior experiments.`);

  return {
    studyId: study.id,
    generatedAt: new Date().toISOString(),
    analysis,
    sections,
    claims,
    completeness,
    knowledge,
    readinessScore,
  };
}

/** Render the full report (with corrected claims applied) as Markdown. */
export function buildReportMarkdown(study: DoeStudy, report: DoeReport): string {
  const template = getDoeTemplate();
  const ordered = template
    .map((t) => report.sections.find((s) => s.id === t.id))
    .filter((s): s is ReportSection => !!s);

  const banner =
    '> ⚠️ **AI-generated draft — requires scientist review and approval.**\n> All data is synthetic / sample data for demonstration only.';

  const body = ordered
    .map((s, i) => `## ${i + 1}. ${s.title}\n\n${s.markdown}`)
    .join('\n\n');

  const flagged = report.claims.filter((c) => c.status === 'flagged');
  const factCheck = [
    '## Grounding / fact-check log',
    '',
    ...report.claims.map(
      (c) =>
        `- [${c.status === 'verified' ? 'VERIFIED' : 'FLAGGED→CORRECTED'}] ${c.metric}: ` +
        `claimed ${c.claimedValue}${c.unit ? ' ' + c.unit : ''}, computed ${c.computedValue}${c.unit ? ' ' + c.unit : ''} (${c.source}).`,
    ),
    ...(flagged.length
      ? ['', `${flagged.length} claim(s) were auto-corrected to match the computed statistics before approval.`]
      : []),
  ].join('\n');

  return `# DoE Report — ${study.id}\n\n${banner}\n\n${body}\n\n${factCheck}\n`;
}
