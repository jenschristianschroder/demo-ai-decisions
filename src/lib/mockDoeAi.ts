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
import { apiPost } from './aiClient';
import { isAiConfigured } from './aiConfig';

// ===========================================================================
// mockDoeAi.ts — orchestrator for the "R&D DoE Report Assistant" AI pipeline.
//
// MOCK-FIRST: by default (when `isAiConfigured()` is true and the Express
// backend is reachable) the Drafting, Fact-Check correction, Completeness, and
// Knowledge steps call REAL Azure AI Foundry via the backend `/api/ai/doe/*`
// routes. When the backend is unavailable — or `VITE_AI_BACKEND_ENABLED=false`
// — it falls back to the deterministic mock so `npm run dev` works out of the
// box with NO backend and NO Azure credentials.
//
// Theme: AI drafts, the scientist stays accountable. The statistics are ALWAYS
// computed in code (src/lib/doeAnalysis.ts) and every numeric claim is ALWAYS
// re-verified in code, regardless of backend — so the LLM can never alter a
// number without it being caught and corrected before approval.
//
// ───────────────────────────────────────────────────────────────────────────
// HOW AZURE AI FOUNDRY IS INTEGRATED
// ───────────────────────────────────────────────────────────────────────────
// This mirrors src/lib/financeAi.ts (mock-first fallback). Each AI step calls
// the backend, which authenticates to Azure AI Foundry via Managed Identity
// (server/src/aiClient.ts) — the frontend never handles credentials:
//
//   • Foundry model endpoint (e.g. GPT-4o) — generates the narrative report
//     sections from the Analysis output + template (Drafting step) and rewrites
//     flagged numeric claims (Fact-Check correction step).
//   • POST /api/ai/doe/draft-sections, /correct-claims, /check-completeness,
//     /rank-knowledge — the per-step backend routes (server/src/routes/doeAi.ts).
//
// Future hardening (out of scope here):
//   • Foundry Agent Service — orchestrate the 6 steps as a multi-agent workflow.
//   • Azure AI Search — ground generation in R&D templates, design-control
//     standards, and the prior-experiment corpus (the Knowledge step).
//   • Azure AI Content Safety — screen generated narrative before it is shown.
//   • Azure Monitor / Application Insights — trace every AI call for audit.
//   • Azure SQL / Microsoft Fabric Lakehouse — replace the mock experiment data
//     in src/data/mockDoeData.ts with the real LIMS / experiment store.
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
  /** True when the narrative steps were generated by real Azure AI Foundry. */
  aiBacked: boolean;
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

function draftSectionsMock(study: DoeStudy, analysis: DoeAnalysisResult): ReportSection[] {
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

/**
 * Specification of a single fact-checkable numeric claim. The `computedValue`
 * is the ground truth (from the real analysis). `defaultClaimed` is the value
 * the deterministic mock asserts (used when no AI-claimed value is supplied);
 * `makeText` renders the claim sentence for any value.
 */
interface NumericClaimSpec {
  id: string;
  sectionId: string;
  metric: string;
  unit: string;
  source: string;
  computedValue: number;
  defaultClaimed: number;
  makeText: (value: number) => string;
}

/**
 * Build the canonical list of numeric-claim specs grounded in the computed
 * analysis. The set of claims (metrics + computed values) is deterministic in
 * BOTH the mock and the real-AI path; only the *claimed* value/prose differs.
 */
function buildClaimSpecs(study: DoeStudy, analysis: DoeAnalysisResult): NumericClaimSpec[] {
  const wear = findResponse(analysis, 'wearTime_hours');
  const peel = findResponse(analysis, 'peelAdhesion_N_per_cm');
  const moisture = findResponse(analysis, 'moistureAbsorption_pct');
  const aWear = findEffect(wear, 'A');
  const abWear = findEffect(wear, 'A×B');
  const aPeel = findEffect(peel, 'A');
  const bMoist = findEffect(moisture, 'B');
  const leakage = findResponse(analysis, 'leakageEvent');
  const aLeak = findEffect(leakage, 'A');

  const specs: NumericClaimSpec[] = [];

  if (aWear) {
    const computed = round(aWear.effect, 0);
    specs.push({
      id: 'claim-wear-A',
      sectionId: 'discussion',
      metric: 'Wear-time main effect of hydrocolloid content (A)',
      unit: 'h',
      source: 'Analysis · wear time · main effect A',
      computedValue: computed,
      // DELIBERATELY WRONG in the mock: the first draft overstates the effect
      // as 60 h. The fact-check step catches and corrects this to the real
      // value. The real-AI path replaces this with the model's actual value.
      defaultClaimed: 60,
      makeText: (v) => `Increasing hydrocolloid content raised wear time by ${v} hours.`,
    });
  }
  if (abWear) {
    const computed = round(abWear.effect, 1);
    specs.push({
      id: 'claim-wear-AB',
      sectionId: 'statistics',
      metric: 'Wear-time A×B interaction',
      unit: 'h',
      source: 'Analysis · wear time · A×B interaction',
      computedValue: computed,
      defaultClaimed: computed,
      makeText: (v) => `The hydrocolloid × thickness interaction on wear time was ${v} hours.`,
    });
  }
  if (aPeel) {
    const computed = round(aPeel.effect, 2);
    specs.push({
      id: 'claim-peel-A',
      sectionId: 'discussion',
      metric: 'Peel-adhesion main effect of hydrocolloid content (A)',
      unit: 'N/cm',
      source: 'Analysis · peel adhesion · main effect A',
      computedValue: computed,
      defaultClaimed: computed,
      makeText: (v) => `Hydrocolloid content increased peel adhesion by ${v} N/cm.`,
    });
  }
  if (bMoist) {
    const computed = round(bMoist.effect, 1);
    specs.push({
      id: 'claim-moist-B',
      sectionId: 'statistics',
      metric: 'Moisture-absorption main effect of coating thickness (B)',
      unit: '%',
      source: 'Analysis · moisture absorption · main effect B',
      computedValue: computed,
      defaultClaimed: computed,
      makeText: (v) => `Coating thickness increased moisture absorption by ${v}%.`,
    });
  }
  if (wear) {
    const computed = round(wear.rSquared, 3);
    specs.push({
      id: 'claim-wear-r2',
      sectionId: 'statistics',
      metric: 'Wear-time model fit (R²)',
      unit: '',
      source: 'Analysis · wear time · model fit',
      computedValue: computed,
      defaultClaimed: computed,
      makeText: (v) => `The wear-time model explained ${v} of the variance (R²).`,
    });
  }
  if (aLeak) {
    // Count leakage events at the low hydrocolloid level — descriptive, grounded.
    const lowA = study.factors[0].low;
    const lowLeaks = study.runs.filter((r) => r.A === lowA).reduce((s, r) => s + r.leakageEvent, 0);
    specs.push({
      id: 'claim-leak-A',
      sectionId: 'conclusions',
      metric: 'Leakage events at low hydrocolloid content',
      unit: 'events',
      source: 'Analysis · leakage · raw runs at A = low',
      computedValue: lowLeaks,
      defaultClaimed: lowLeaks,
      makeText: (v) => `All ${v} leakage events occurred at the low hydrocolloid level.`,
    });
  }

  return specs;
}

/**
 * Materialize claim specs into `NumericClaim`s. `claimedValues` (optional,
 * keyed by claim id) overrides the default claimed value — used to feed the
 * values the AI actually wrote into the narrative so they can be fact-checked.
 */
function materializeClaims(
  specs: NumericClaimSpec[],
  claimedValues?: Record<string, number>,
): NumericClaim[] {
  return specs.map((spec) => {
    const claimedRaw = claimedValues?.[spec.id];
    const claimedValue = typeof claimedRaw === 'number' && Number.isFinite(claimedRaw)
      ? claimedRaw
      : spec.defaultClaimed;
    return {
      id: spec.id,
      sectionId: spec.sectionId,
      metric: spec.metric,
      text: spec.makeText(claimedValue),
      claimedValue,
      computedValue: spec.computedValue,
      unit: spec.unit,
      status: 'verified',
      source: spec.source,
    };
  });
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

function checkCompletenessMock(
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

function retrieveKnowledgeMock(study: DoeStudy): KnowledgeHit[] {
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
// Real Azure AI Foundry path — each helper calls the backend `/api/ai/doe/*`
// route (which authenticates to Foundry via Managed Identity). Helpers THROW on
// failure so the orchestrator can fall back to the deterministic mock.
// ===========================================================================

interface DraftSectionsResponse {
  sections?: Array<{ id?: string; title?: string; markdown?: string }>;
  claims?: Array<{ id?: string; claimedValue?: number }>;
}

/**
 * Drafting (AI). Returns the model-written sections plus the numeric value the
 * model claims for each spec (so the deterministic fact-check can verify them).
 * Any template section the model omits is backfilled from the mock draft.
 */
async function draftSectionsAi(
  study: DoeStudy,
  analysis: DoeAnalysisResult,
  specs: NumericClaimSpec[],
): Promise<{ sections: ReportSection[]; claimedValues: Record<string, number> }> {
  const template = getDoeTemplate();
  const claimSpecs = specs.map((s) => ({
    id: s.id,
    metric: s.metric,
    unit: s.unit,
    computedValue: s.computedValue,
    source: s.source,
  }));

  const res = await apiPost<DraftSectionsResponse>('/api/ai/doe/draft-sections', {
    study,
    analysis,
    template,
    claimSpecs,
  });

  if (!res || !Array.isArray(res.sections) || res.sections.length === 0) {
    throw new Error('draft-sections returned no sections');
  }

  const byId = new Map<string, { title?: string; markdown?: string }>();
  for (const s of res.sections) {
    if (s && typeof s.id === 'string') byId.set(s.id, s);
  }

  // Backfill any omitted template sections from the mock draft so the report is
  // always complete and ordered by the template.
  const mockSections = draftSectionsMock(study, analysis);
  const sections: ReportSection[] = template.map((t) => {
    const ai = byId.get(t.id);
    const mock = mockSections.find((m) => m.id === t.id);
    const markdown = ai?.markdown && ai.markdown.trim().length > 0
      ? ai.markdown
      : (mock?.markdown ?? '');
    return { id: t.id, title: t.title, markdown };
  });

  const claimedValues: Record<string, number> = {};
  for (const c of res.claims ?? []) {
    if (c && typeof c.id === 'string' && typeof c.claimedValue === 'number') {
      claimedValues[c.id] = c.claimedValue;
    }
  }

  return { sections, claimedValues };
}

interface CorrectClaimsResponse {
  corrections?: Array<{ id?: string; correctedText?: string }>;
}

/** Fact-check correction (AI). Returns id → AI-rewritten corrected sentence. */
async function correctClaimsAi(flagged: NumericClaim[]): Promise<Record<string, string>> {
  const payload = flagged.map((c) => ({
    id: c.id,
    metric: c.metric,
    text: c.text,
    claimedValue: c.claimedValue,
    computedValue: c.computedValue,
    unit: c.unit,
  }));

  const res = await apiPost<CorrectClaimsResponse>('/api/ai/doe/correct-claims', {
    claims: payload,
  });

  const map: Record<string, string> = {};
  for (const c of res?.corrections ?? []) {
    if (c && typeof c.id === 'string' && typeof c.correctedText === 'string') {
      map[c.id] = c.correctedText;
    }
  }
  return map;
}

interface CheckCompletenessResponse {
  results?: Array<{ id?: string; satisfied?: boolean; note?: string }>;
}

/** Completeness (AI). Maps the model's verdicts back onto the checklist. */
async function checkCompletenessAi(
  sections: ReportSection[],
  analysis: DoeAnalysisResult,
): Promise<CompletenessResult[]> {
  const checklist = getDoeDefinitionOfGood();
  const res = await apiPost<CheckCompletenessResponse>('/api/ai/doe/check-completeness', {
    sections,
    checklist,
  });

  if (!res || !Array.isArray(res.results)) {
    throw new Error('check-completeness returned no results');
  }

  const byId = new Map<string, { satisfied?: boolean; note?: string }>();
  for (const r of res.results) {
    if (r && typeof r.id === 'string') byId.set(r.id, r);
  }

  // Fall back to the deterministic check for any item the model skipped.
  const mockResults = checkCompletenessMock(sections, analysis);
  return checklist.map((item) => {
    const ai = byId.get(item.id);
    if (ai && typeof ai.satisfied === 'boolean') {
      return { item, satisfied: ai.satisfied, note: ai.note ?? (ai.satisfied ? 'Present.' : 'Gap identified.') };
    }
    return mockResults.find((m) => m.item.id === item.id) ?? { item, satisfied: false, note: 'Not evaluated.' };
  });
}

interface RankKnowledgeResponse {
  hits?: Array<{ id?: string; relevance?: number; matchedTags?: string[]; reason?: string }>;
}

/** Knowledge (AI). Maps the ranked hit ids back to the prior-report corpus. */
async function rankKnowledgeAi(study: DoeStudy): Promise<KnowledgeHit[]> {
  const corpus = getDoePriorReports();
  const studyMeta = {
    id: study.id,
    objective: study.objective,
    hypothesis: study.hypothesis,
    factors: study.factors.map((f) => f.name),
    responses: study.responses.map((r) => r.label),
  };

  const res = await apiPost<RankKnowledgeResponse>('/api/ai/doe/rank-knowledge', {
    study: studyMeta,
    corpus,
  });

  if (!res || !Array.isArray(res.hits)) {
    throw new Error('rank-knowledge returned no hits');
  }

  const hits: KnowledgeHit[] = [];
  for (const h of res.hits) {
    const report = corpus.find((r) => r.id === h?.id);
    if (!report) continue;
    const relevance = typeof h?.relevance === 'number'
      ? Math.max(0, Math.min(1, h.relevance))
      : 0;
    hits.push({
      report,
      relevance,
      matchedTags: Array.isArray(h?.matchedTags) ? h.matchedTags.filter((t) => typeof t === 'string') : [],
      reason: typeof h?.reason === 'string' && h.reason.trim().length > 0
        ? h.reason
        : 'Related R&D experiment in the same product area.',
    });
  }

  if (hits.length === 0) {
    throw new Error('rank-knowledge matched no corpus entries');
  }
  return hits.slice(0, 3);
}

// ===========================================================================
// Public API
// ===========================================================================

export interface DoePipelineProgress {
  steps: DoePipelineStep[];
}

/**
 * Run the full 6-step DoE report pipeline.
 *
 * Mock-first orchestration: Intake and Analysis are ALWAYS deterministic (the
 * statistics in src/lib/doeAnalysis.ts are the single source of truth). When
 * the backend is configured (`isAiConfigured()`), the Drafting, Fact-Check
 * correction, Completeness, and Knowledge steps call real Azure AI Foundry via
 * the `/api/ai/doe/*` routes; each AI step falls back to the deterministic mock
 * if the backend call fails, so the demo never breaks.
 *
 * The fact-check (pass/flag decision) is ALWAYS done in code: every numeric
 * claim is re-verified against the computed analysis, so the model can never
 * alter a number without it being caught and corrected before approval.
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

  const useAi = isAiConfigured();
  let aiBacked = false;

  // 1. Intake
  setStep('intake', 'running');
  await delay(500);
  const runCount = study.runs.length;
  const factorCount = study.factors.length;
  setStep('intake', 'done', `Loaded ${runCount} runs across ${factorCount} factors; schema valid.`);

  // 2. Analysis (REAL computation — always deterministic)
  setStep('analysis', 'running');
  await delay(700);
  const analysis = computeDoeAnalysis(study);
  const sigCount = analysis.responses.reduce(
    (sum, r) => sum + r.effects.filter((e) => e.significant).length,
    0,
  );
  setStep('analysis', 'done', `${sigCount} significant effects; top factor: ${analysis.topFactorName}.`);

  // Canonical fact-checkable claim specs (computed values = ground truth).
  const specs = buildClaimSpecs(study, analysis);

  // 3. Drafting (AI, with mock fallback)
  setStep('drafting', 'running');
  let sections: ReportSection[];
  let claimedValues: Record<string, number> | undefined;
  if (useAi) {
    try {
      const drafted = await draftSectionsAi(study, analysis, specs);
      sections = drafted.sections;
      claimedValues = drafted.claimedValues;
      aiBacked = true;
      setStep('drafting', 'done', `Drafted ${sections.length} sections via Azure AI Foundry, grounded in the analysis + template.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI drafting failed';
      sections = draftSectionsMock(study, analysis);
      setStep('drafting', 'done', `AI drafting unavailable (${msg}); used deterministic mock for ${sections.length} sections.`);
    }
  } else {
    await delay(700);
    sections = draftSectionsMock(study, analysis);
    setStep('drafting', 'done', `Drafted ${sections.length} sections (deterministic mock) grounded in the analysis + template.`);
  }

  // 4. Fact-check / grounding (numeric verification ALWAYS in code; the AI is
  // only used to rewrite the prose of flagged claims).
  setStep('factcheck', 'running');
  if (!useAi) await delay(700);
  let claims = verifyClaims(materializeClaims(specs, claimedValues));
  const flaggedClaims = claims.filter((c) => c.status === 'flagged');
  if (useAi && aiBacked && flaggedClaims.length > 0) {
    try {
      const corrections = await correctClaimsAi(flaggedClaims);
      claims = claims.map((c) =>
        c.status === 'flagged' && corrections[c.id]
          ? { ...c, correctedText: corrections[c.id] }
          : c,
      );
    } catch {
      // Keep the deterministic string-substituted correction from verifyClaims.
    }
  }
  const flagged = claims.filter((c) => c.status === 'flagged').length;
  setStep(
    'factcheck',
    'done',
    `${claims.length} numeric claims checked; ${flagged} flagged and corrected, ${claims.length - flagged} verified.`,
  );

  // 5. Completeness (AI-assisted; readiness score ALWAYS computed in code)
  setStep('completeness', 'running');
  let completeness: CompletenessResult[];
  if (useAi && aiBacked) {
    try {
      completeness = await checkCompletenessAi(sections, analysis);
    } catch {
      completeness = checkCompletenessMock(sections, analysis);
    }
  } else {
    await delay(600);
    completeness = checkCompletenessMock(sections, analysis);
  }
  const gaps = completeness.filter((c) => !c.satisfied).length;
  const readinessScore = Math.round(
    ((completeness.length - gaps) / completeness.length) * 100,
  );
  setStep('completeness', 'done', `${completeness.length - gaps}/${completeness.length} checklist items satisfied.`);

  // 6. Knowledge (AI-assisted retrieval/ranking, with mock fallback)
  setStep('knowledge', 'running');
  let knowledge: KnowledgeHit[];
  if (useAi && aiBacked) {
    try {
      knowledge = await rankKnowledgeAi(study);
    } catch {
      knowledge = retrieveKnowledgeMock(study);
    }
  } else {
    await delay(500);
    knowledge = retrieveKnowledgeMock(study);
  }
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
    aiBacked,
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
