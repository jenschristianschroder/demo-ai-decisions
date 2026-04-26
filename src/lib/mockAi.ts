import type { Anomaly, AiResponse } from '../types/finance';

// TODO: Azure AI Foundry integration points:
// - Replace mockGenerateExplanation with Azure AI Foundry model endpoint call
// - Replace mockGenerateDraftEmail with Foundry Agent Service
// - Add Azure AI Search for group accounting policy grounding
// - Add Azure AI Content Safety for user-generated commentary review
// - Add Application Insights tracing for all AI calls
// - Connect to Azure SQL or Fabric Lakehouse for live financial data

export async function generateAnomalyExplanation(anomaly: Anomaly): Promise<AiResponse> {
  // Simulate async AI call
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    explanation: anomaly.explanation,
    possibleCauses: anomaly.possibleCauses,
    recommendedFollowUp: anomaly.recommendedFollowUp,
    draftEmail: generateDraftEmail(anomaly),
    confidenceLevel: 0.87,
    evidenceList: buildEvidenceList(anomaly),
  };
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

export async function regenerateDraftEmail(anomaly: Anomaly, _previousDraft: string): Promise<string> {
  // TODO: Azure AI Foundry - regenerate with different tone/emphasis
  await new Promise(resolve => setTimeout(resolve, 600));
  return generateDraftEmail(anomaly);
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency + ' ';
  return `${symbol}${(amount / 1000).toFixed(0)}k`;
}
