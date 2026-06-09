import type { DoeStudy, DoeRun, DoeFactor } from '../types/doe';

// ---------------------------------------------------------------------------
// doeAnalysis.ts — REAL Design-of-Experiments statistics, computed in pure
// TypeScript with NO backend and NO faked numbers.
//
// For each response it computes:
//   - main effects   (mean at High − mean at Low) per factor
//   - all two-factor interactions
//   - a ranking of factors/interactions by |effect|
//   - significance: a t-statistic from the replicate error when replicates
//     exist; otherwise Lenth's Pseudo Standard Error (PSE)
//   - model fit (R² and adjusted R²) from the significant-effect model
//
// These results ground every numeric claim the AI drafting + fact-check steps
// make in src/lib/mockDoeAi.ts.
// ---------------------------------------------------------------------------

const RESPONSE_KEYS = [
  'peelAdhesion_N_per_cm',
  'wearTime_hours',
  'moistureAbsorption_pct',
  'skinStripping_score',
  'leakageEvent',
] as const;

type ResponseKey = (typeof RESPONSE_KEYS)[number];

export interface EffectResult {
  name: string;              // 'A', 'B', 'C', 'A×B', ...
  type: 'main' | 'interaction';
  factorIds: string[];       // ['A'] or ['A', 'B']
  label: string;             // human readable, e.g. 'Hydrocolloid content'
  effect: number;            // mean(High) − mean(Low) in coded space
  absEffect: number;
  se?: number;               // standard error of the effect (replicate path)
  tValue?: number;
  pValue?: number;
  significant: boolean;
}

export interface ResponseAnalysis {
  responseId: ResponseKey;
  responseLabel: string;
  unit: string;
  mean: number;
  effects: EffectResult[];   // ranked by |effect|, descending
  method: "replicate t-test" | "Lenth's PSE";
  replicateStdDev?: number;
  errorDf?: number;
  rSquared: number;
  adjRSquared: number;
  topEffect: EffectResult;
}

export interface DoeAnalysisResult {
  studyId: string;
  responses: ResponseAnalysis[];
  topFactorName: string;     // factor with the largest effect on the lead response
  topFactorEffect: number;
  leadResponseId: ResponseKey;
}

// --- numerical helpers -----------------------------------------------------

/** Code a factor value to -1 / 0 / +1 using its low/high/center levels. */
function codeFactor(value: number, factor: DoeFactor): number {
  const mid = (factor.low + factor.high) / 2;
  const half = (factor.high - factor.low) / 2;
  if (half === 0) return 0;
  const coded = (value - mid) / half;
  // snap tiny floating error to clean coded levels
  if (Math.abs(coded) < 1e-9) return 0;
  return coded;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Natural log of the gamma function (Lanczos approximation). */
function lnGamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  }
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Regularized incomplete beta function I_x(a,b) via continued fraction. */
function betacf(x: number, a: number, b: number): number {
  const fpmin = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-7) break;
  }
  return h;
}

function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a;
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

/** Two-sided p-value for a Student's t statistic with `df` degrees of freedom. */
export function tTwoSidedPValue(t: number, df: number): number {
  if (df <= 0) return NaN;
  const x = df / (df + t * t);
  return incompleteBeta(x, df / 2, 0.5);
}

// --- effect computation ----------------------------------------------------

interface CodedRun {
  run: DoeRun;
  coded: Record<string, number>; // factorId -> -1/0/1
}

function codeRuns(study: DoeStudy): CodedRun[] {
  return study.runs.map((run) => {
    const coded: Record<string, number> = {};
    for (const f of study.factors) {
      const raw = (run as unknown as Record<string, number>)[f.id];
      coded[f.id] = codeFactor(raw, f);
    }
    return { run, coded };
  });
}

/** Factorial runs only (exclude center points where every factor is coded 0). */
function factorialRuns(coded: CodedRun[]): CodedRun[] {
  return coded.filter((cr) => Object.values(cr.coded).some((v) => v !== 0));
}

function responseValue(run: DoeRun, key: ResponseKey): number {
  return (run as unknown as Record<string, number>)[key];
}

/** Effect for a column whose sign per run is given by `sign`. */
function columnEffect(
  runs: CodedRun[],
  key: ResponseKey,
  sign: (cr: CodedRun) => number,
): number {
  const high: number[] = [];
  const low: number[] = [];
  for (const cr of runs) {
    const s = sign(cr);
    if (s > 0) high.push(responseValue(cr.run, key));
    else if (s < 0) low.push(responseValue(cr.run, key));
  }
  return mean(high) - mean(low);
}

/** Pooled replicate standard deviation and df from replicate groups, per response. */
function pooledReplicateError(
  coded: CodedRun[],
  key: ResponseKey,
): { sd: number; df: number } | null {
  const groups = new Map<string, number[]>();
  for (const cr of coded) {
    const sig = Object.keys(cr.coded)
      .sort()
      .map((k) => `${k}:${cr.coded[k]}`)
      .join('|');
    if (!groups.has(sig)) groups.set(sig, []);
    groups.get(sig)!.push(responseValue(cr.run, key));
  }
  let ssError = 0;
  let df = 0;
  for (const vals of groups.values()) {
    if (vals.length < 2) continue;
    const m = mean(vals);
    for (const v of vals) ssError += (v - m) * (v - m);
    df += vals.length - 1;
  }
  if (df === 0) return null;
  return { sd: Math.sqrt(ssError / df), df };
}

/** Lenth's Pseudo Standard Error from a set of effect magnitudes. */
function lenthPSE(effects: number[]): number {
  const abs = effects.map((e) => Math.abs(e)).sort((a, b) => a - b);
  const median = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };
  const s0 = 1.5 * median(abs);
  const trimmed = abs.filter((e) => e < 2.5 * s0);
  return 1.5 * median(trimmed);
}

function analyzeResponse(
  study: DoeStudy,
  coded: CodedRun[],
  key: ResponseKey,
): ResponseAnalysis {
  const response = study.responses.find((r) => r.id === key)!;
  const facRuns = factorialRuns(coded);
  const factorIds = study.factors.map((f) => f.id);

  const allValues = coded.map((cr) => responseValue(cr.run, key));
  const grandMean = mean(allValues);

  // --- main effects ---
  const mains: EffectResult[] = study.factors.map((f) => {
    const effect = columnEffect(facRuns, key, (cr) => cr.coded[f.id]);
    return {
      name: f.id,
      type: 'main',
      factorIds: [f.id],
      label: f.name,
      effect,
      absEffect: Math.abs(effect),
      significant: false,
    };
  });

  // --- two-factor interactions ---
  const interactions: EffectResult[] = [];
  for (let i = 0; i < factorIds.length; i++) {
    for (let j = i + 1; j < factorIds.length; j++) {
      const fi = factorIds[i];
      const fj = factorIds[j];
      const effect = columnEffect(facRuns, key, (cr) => cr.coded[fi] * cr.coded[fj]);
      const fiName = study.factors.find((f) => f.id === fi)!.name;
      const fjName = study.factors.find((f) => f.id === fj)!.name;
      interactions.push({
        name: `${fi}×${fj}`,
        type: 'interaction',
        factorIds: [fi, fj],
        label: `${fiName} × ${fjName}`,
        effect,
        absEffect: Math.abs(effect),
        significant: false,
      });
    }
  }

  const effects = [...mains, ...interactions];

  // --- significance ---
  const repError = pooledReplicateError(coded, key);
  let method: ResponseAnalysis['method'];
  let replicateStdDev: number | undefined;
  let errorDf: number | undefined;

  if (repError && repError.df > 0) {
    method = 'replicate t-test';
    replicateStdDev = repError.sd;
    errorDf = repError.df;
    // For a 2-level factorial effect = mean(+) − mean(−), with n factorial
    // runs split evenly, Var(effect) = sigma² · (1/(n/2) + 1/(n/2)) = 4σ²/n.
    const n = facRuns.length;
    const se = (2 * repError.sd) / Math.sqrt(n);
    for (const e of effects) {
      e.se = se;
      if (se > 0) {
        e.tValue = e.effect / se;
        e.pValue = tTwoSidedPValue(e.tValue, repError.df);
        e.significant = (e.pValue ?? 1) < 0.05;
      } else if (Math.abs(e.effect) > 1e-9) {
        // Zero replicate error with a non-zero effect = perfect separation
        // (e.g. a binary response fully explained by one factor). Treat as
        // significant; p is reported as "< 0.001" in the UI.
        e.tValue = Infinity;
        e.pValue = 0;
        e.significant = true;
      } else {
        e.tValue = 0;
        e.pValue = 1;
        e.significant = false;
      }
    }
  } else {
    method = "Lenth's PSE";
    const pse = lenthPSE(effects.map((e) => e.effect));
    const margin = pse > 0 ? 2.5 * pse : Infinity; // ~ simplified margin of error
    for (const e of effects) {
      e.tValue = pse > 0 ? e.effect / pse : 0;
      e.significant = Math.abs(e.effect) > margin;
    }
  }

  effects.sort((a, b) => b.absEffect - a.absEffect);

  // --- model fit (R² from significant effects; fall back to top effect) ---
  // SS_total around the grand mean across ALL runs.
  const ssTotal = allValues.reduce((s, v) => s + (v - grandMean) * (v - grandMean), 0);
  // SS for each factorial effect: contrast²/n on the factorial block.
  const nFac = facRuns.length;
  const ssFor = (e: EffectResult): number => {
    // effect = 2·contrast/n  →  contrast = effect·n/2 ; SS = contrast²/n
    const contrast = (e.effect * nFac) / 2;
    return (contrast * contrast) / nFac;
  };
  const modelEffects = effects.filter((e) => e.significant);
  const used = modelEffects.length > 0 ? modelEffects : [effects[0]];
  const ssModel = used.reduce((s, e) => s + ssFor(e), 0);
  const rSquared = ssTotal > 0 ? Math.min(1, ssModel / ssTotal) : 0;
  const p = used.length; // number of model terms
  const nObs = facRuns.length;
  const adjRSquared =
    nObs - p - 1 > 0 ? 1 - (1 - rSquared) * ((nObs - 1) / (nObs - p - 1)) : rSquared;

  return {
    responseId: key,
    responseLabel: response.label,
    unit: response.unit,
    mean: grandMean,
    effects,
    method,
    replicateStdDev,
    errorDf,
    rSquared,
    adjRSquared: Math.max(0, Math.min(1, adjRSquared)),
    topEffect: effects[0],
  };
}

/** Run the full DoE analysis for a study. Pure, deterministic, real math. */
export function computeDoeAnalysis(study: DoeStudy): DoeAnalysisResult {
  const coded = codeRuns(study);
  const responseIds = study.responses
    .map((r) => r.id)
    .filter((id): id is ResponseKey => (RESPONSE_KEYS as readonly string[]).includes(id));

  const responses = responseIds.map((key) => analyzeResponse(study, coded, key));

  // Lead response = wear time if present, else the first response.
  const leadResponseId = (responseIds.includes('wearTime_hours')
    ? 'wearTime_hours'
    : responseIds[0]) as ResponseKey;
  const lead = responses.find((r) => r.responseId === leadResponseId)!;
  const topMain = lead.effects.find((e) => e.type === 'main') ?? lead.topEffect;

  return {
    studyId: study.id,
    responses,
    topFactorName: topMain.label,
    topFactorEffect: topMain.effect,
    leadResponseId,
  };
}
