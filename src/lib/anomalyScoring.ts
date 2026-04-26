import type { Anomaly, Entity } from '../types/finance';

// TODO: Azure AI Foundry integration - replace with Foundry Agent Service call
// when real services are connected

export function calculateRiskScore(entity: Entity): number {
  let score = 0;
  score += entity.highRiskAnomalies * 25;
  score += entity.mediumRiskAnomalies * 10;
  score += entity.weakCommentaryCount * 5;
  score += entity.intercompanyBreaks * 15;
  return Math.min(100, score);
}

export function detectVarianceAnomaly(
  actual: number,
  budget: number,
  materialityThreshold: number
): boolean {
  const variance = Math.abs(actual - budget);
  const variancePercent = Math.abs((actual - budget) / budget);
  return variancePercent > 0.2 && variance > materialityThreshold;
}

export function detectTrendAnomaly(
  actual: number,
  historicalRange: [number, number]
): boolean {
  return actual < historicalRange[0] || actual > historicalRange[1];
}

export function detectCommentaryAnomaly(
  commentary: string,
  varianceAmount: number,
  materialityThreshold: number
): boolean {
  if (Math.abs(varianceAmount) < materialityThreshold) return false;
  return !commentary || commentary.length < 20;
}

export function scoreCommentaryQuality(commentary: string): 'Strong' | 'Adequate' | 'Weak' | 'Missing' {
  if (!commentary || commentary.trim().length === 0) return 'Missing';
  if (commentary.length < 20) return 'Weak';
  if (commentary.length < 60) return 'Adequate';
  return 'Strong';
}

export function sortAnomaliesByPriority(anomalies: Anomaly[]): Anomaly[] {
  const severityScore: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
  return [...anomalies].sort((a, b) => {
    const sevDiff = severityScore[b.severity] - severityScore[a.severity];
    if (sevDiff !== 0) return sevDiff;
    return Math.abs(b.variancePercent) - Math.abs(a.variancePercent);
  });
}
