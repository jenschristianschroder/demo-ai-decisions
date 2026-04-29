import type { Anomaly, AiResponse } from '../types/finance';
import { apiPost } from './aiClient';
import { isAiConfigured } from './aiConfig';
import { formatCurrency } from './formatters';

// ---------------------------------------------------------------------------
// Fallback mock helpers – used when the backend API is not available so the
// demo still works without Azure credentials.
// ---------------------------------------------------------------------------

export async function generateAnomalyExplanation(anomaly: Anomaly): Promise<AiResponse> {
  if (!isAiConfigured()) {
    // Simulate async AI call
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      explanation: anomaly.explanation,
      possibleCauses: anomaly.possibleCauses,
      recommendedFollowUp: anomaly.recommendedFollowUp,
      draftEmail: generateDraftEmail(anomaly),
      confidenceLevel: deriveConfidenceLevel(anomaly),
      evidenceList: buildEvidenceList(anomaly),
    };
  }

  return apiPost<AiResponse>('/api/ai/finance/generate-explanation', { anomaly });
}

function deriveConfidenceLevel(anomaly: Anomaly): number {
  let base = 0.9;
  if (anomaly.commentaryQuality === 'Missing') base -= 0.05;
  if (anomaly.commentaryQuality === 'Weak') base -= 0.02;
  if (anomaly.severity === 'Low') base -= 0.03;
  if (anomaly.category === 'Commentary Anomaly') base -= 0.05;
  return Math.max(0.65, Math.min(0.97, base));
}

function buildEvidenceList(anomaly: Anomaly): string[] {
  return [
    `${anomaly.period} actual: ${formatCurrency(anomaly.actual, anomaly.currency)}`,
    `Budget: ${formatCurrency(anomaly.benchmark, anomaly.currency)}`,
    `Variance to budget: ${formatCurrency(anomaly.varianceAmount, anomaly.currency)} (${anomaly.variancePercent > 0 ? '+' : ''}${(anomaly.variancePercent * 100).toFixed(0)}%)`,
    `Commentary submitted: "${anomaly.commentary || 'None'}"`,
    `Commentary quality: ${anomaly.commentaryQuality}`,
    `Materiality impact: ${anomaly.materialityImpact}`,
    `Detection method: ${anomaly.detectionMethod}`,
  ];
}

function generateDraftEmail(anomaly: Anomaly): string {
  if (anomaly.id === 'ANO-001') {
    return `Hi Anna,

During our March review for DE01, we noticed that marketing expense increased to €184k, which is 52% above budget and outside the historical monthly range.

Could you please confirm:
1. The main business driver for the increase
2. Whether the cost relates fully to March or includes future-period spend
3. Whether any reclassification, accrual, or prepaid adjustment is required
4. Supporting vendor detail for the largest items

Thanks,
Group Finance`;
  }

  const entityName = anomaly.entityId;
  return `Hi,

During our March 2026 review for ${entityName}, we noticed that ${anomaly.accountName.toLowerCase()} ${anomaly.variancePercent > 0 ? 'increased' : 'decreased'} to ${formatCurrency(anomaly.actual, anomaly.currency)}, which is ${Math.abs(anomaly.variancePercent * 100).toFixed(0)}% ${anomaly.variancePercent > 0 ? 'above' : 'below'} ${anomaly.category === 'Variance Anomaly' ? 'budget' : 'prior month'}.

${anomaly.recommendedFollowUp}

Thanks,
Group Finance`;
}

export async function regenerateDraftEmail(anomaly: Anomaly): Promise<string> {
  if (!isAiConfigured()) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return generateDraftEmail(anomaly);
  }

  const result = await apiPost<{ draftEmail: string }>('/api/ai/finance/regenerate-email', { anomaly });
  return result.draftEmail;
}
