import type { ExtractionResult, Signal } from '../types/adp';
import type { GeneratedDemoData } from '../data/mockAdpData';
import { apiPost } from './aiClient';
import { isAiConfigured } from './aiConfig';

// ---------------------------------------------------------------------------
// Fallback mock data – used when the backend API is not available so the
// demo still works without Azure credentials.
// ---------------------------------------------------------------------------

function mockExtractionResult(): ExtractionResult {
  const now = new Date().toISOString();
  const signals: Signal[] = [
    {
      id: 'SIG-NEW-001',
      accountId: 'contoso-mfg',
      category: 'risk',
      severity: 'high',
      sourceInteractionId: 'INT-005',
      description:
        'CFO announced a budget freeze across all discretionary spend for Q3; may delay Phase 2 rollout funding.',
      status: 'new',
      createdAt: now,
    },
    {
      id: 'SIG-NEW-002',
      accountId: 'contoso-mfg',
      category: 'opportunity',
      severity: 'medium',
      sourceInteractionId: 'INT-005',
      description:
        'Contoso is launching a new Advanced Materials division in Q4 — potential greenfield engagement for analytics platform.',
      status: 'new',
      createdAt: now,
    },
    {
      id: 'SIG-NEW-003',
      accountId: 'contoso-mfg',
      category: 'sentiment-shift',
      severity: 'low',
      sourceInteractionId: 'INT-005',
      description:
        'CTO expressed strong support for expanding the current partnership; described Phase 1 results as "transformational".',
      status: 'new',
      createdAt: now,
    },
  ];

  return {
    signals,
    stakeholderUpdates: [
      {
        stakeholderId: 'STK-002',
        field: 'sentiment',
        oldValue: 'neutral',
        newValue: 'positive',
      },
    ],
    suggestedActions: [
      {
        description: 'Schedule follow-up with CFO on budget timeline',
        owner: 'Sarah Chen',
      },
      {
        description: 'Draft expansion proposal for Advanced Materials division',
        owner: 'Sarah Chen',
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// extractSignals
// ---------------------------------------------------------------------------

export async function extractSignals(rawText: string): Promise<ExtractionResult> {
  if (!isAiConfigured()) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return mockExtractionResult();
  }

  return apiPost<ExtractionResult>('/api/ai/extract-signals', { rawText });
}

// ---------------------------------------------------------------------------
// generateInsights
// ---------------------------------------------------------------------------

interface InsightsResponse {
  insights: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    linkedSignalIds: string[];
    suggestedAction: string;
  }>;
}

export async function generateInsights(
  accountId: string,
): Promise<InsightsResponse> {
  if (!isAiConfigured()) {
    await new Promise(resolve => setTimeout(resolve, 900));
    if (accountId === 'contoso-mfg') {
      return {
        insights: [
          {
            id: 'INS-001',
            title: 'Budget Freeze Threatens Phase 2 Timeline',
            description:
              'Budget freeze risk combined with delayed Phase 2 initiative suggests re-prioritisation needed.',
            severity: 'high',
            linkedSignalIds: ['SIG-001', 'SIG-003'],
            suggestedAction:
              'Propose a phased funding model that defers discretionary items to Q4 while protecting core deliverables.',
          },
          {
            id: 'INS-002',
            title: 'CTO Advocacy as Internal Champion',
            description:
              'CTO advocacy can be leveraged to build internal support for continued investment.',
            severity: 'low',
            linkedSignalIds: ['SIG-004', 'SIG-NEW-003'],
            suggestedAction:
              'Co-author an internal case study with CTO to circulate among executive stakeholders.',
          },
        ],
      };
    }
    return {
      insights: [
        {
          id: 'INS-GEN-001',
          title: 'Account Activity Below Threshold',
          description: 'No new interactions recorded in the past 30 days.',
          severity: 'medium',
          linkedSignalIds: [],
          suggestedAction: 'Schedule a check-in call with the primary contact.',
        },
      ],
    };
  }

  return apiPost<InsightsResponse>('/api/ai/generate-insights', { accountId });
}

// ---------------------------------------------------------------------------
// suggestActions
// ---------------------------------------------------------------------------

export async function suggestActions(
  signalId: string,
): Promise<Array<{ description: string; owner: string; priority: string; dueDate: string }>> {
  if (!isAiConfigured()) {
    await new Promise(resolve => setTimeout(resolve, 600));
    if (signalId === 'SIG-001') {
      return [
        {
          description: 'Schedule follow-up with CFO on budget timeline',
          owner: 'Sarah Chen',
          priority: 'high',
          dueDate: '2026-04-18',
        },
        {
          description: 'Revise Phase 2 scope proposal with phased funding model',
          owner: 'Sarah Chen',
          priority: 'high',
          dueDate: '2026-04-25',
        },
        {
          description: 'Prepare value realization report from Phase 1',
          owner: 'David Kim',
          priority: 'medium',
          dueDate: '2026-04-30',
        },
      ];
    }
    return [
      {
        description: 'Review signal and determine appropriate response',
        owner: 'Account Manager',
        priority: 'medium',
        dueDate: '2026-04-22',
      },
      {
        description: 'Update account plan to reflect new information',
        owner: 'Account Manager',
        priority: 'low',
        dueDate: '2026-04-30',
      },
    ];
  }

  const result = await apiPost<{
    actions: Array<{ description: string; owner: string; priority: string; dueDate: string }>;
  }>('/api/ai/suggest-actions', { signalId });

  return result.actions;
}

// ---------------------------------------------------------------------------
// assessPlanCompleteness
// ---------------------------------------------------------------------------

interface PlanCompletenessResponse {
  overallPercent: number;
  sections: Array<{ name: string; status: string; guidance: string }>;
  recommendations: string[];
}

export async function assessPlanCompleteness(
  accountId: string,
): Promise<PlanCompletenessResponse> {
  if (!isAiConfigured()) {
    await new Promise(resolve => setTimeout(resolve, 700));
    if (accountId === 'contoso-mfg') {
      return {
        overallPercent: 62,
        sections: [
          { name: 'Executive Summary', status: 'complete', guidance: 'Looks good — refreshed within the last 30 days.' },
          { name: 'Stakeholder Map', status: 'partial', guidance: 'Missing contacts from the new Advanced Materials division.' },
          { name: 'Competitive Landscape', status: 'stale', guidance: 'Last updated 90+ days ago.' },
          { name: 'Financial Projections', status: 'partial', guidance: 'Current projections do not reflect the Q3 budget freeze.' },
          { name: 'SWOT Analysis', status: 'complete', guidance: 'Recently updated.' },
          { name: 'Initiative Roadmap', status: 'partial', guidance: 'Phase 2 timeline is outdated.' },
        ],
        recommendations: [
          'Update competitive landscape with recently mentioned vendors',
          'Add new stakeholder contacts from Advanced Materials division',
          'Refresh financial projections with budget freeze impact',
        ],
      };
    }
    return {
      overallPercent: 45,
      sections: [
        { name: 'Executive Summary', status: 'partial', guidance: 'Summary exists but lacks recent context.' },
        { name: 'Stakeholder Map', status: 'missing', guidance: 'No stakeholder map found.' },
        { name: 'Financial Projections', status: 'missing', guidance: 'No financial data linked.' },
      ],
      recommendations: [
        'Complete the stakeholder map with at least 3 key contacts',
        'Add financial projections for the next 4 quarters',
      ],
    };
  }

  return apiPost<PlanCompletenessResponse>('/api/ai/assess-plan', { accountId });
}

// ---------------------------------------------------------------------------
// generateNudges
// ---------------------------------------------------------------------------

export async function generateNudges(
  accountId: string,
): Promise<Array<{ message: string; type: string; priority: string }>> {
  if (!isAiConfigured()) {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (accountId === 'contoso-mfg') {
      return [
        {
          message: 'CFO has not been contacted in 21 days — consider scheduling a touchpoint before the budget review.',
          type: 'follow-up',
          priority: 'high',
        },
        {
          message: 'Competitive landscape section is 90+ days stale. Recent vendor mentions suggest an update is needed.',
          type: 'stale-data',
          priority: 'medium',
        },
        {
          message: 'Phase 2 initiative has 2 overdue actions. Review and update status to keep the plan current.',
          type: 'reminder',
          priority: 'high',
        },
      ];
    }
    return [
      {
        message: 'No interactions logged in the past 30 days. Schedule a check-in to maintain momentum.',
        type: 'follow-up',
        priority: 'medium',
      },
      {
        message: 'Account plan completeness is below 50%. Dedicate time to fill in missing sections.',
        type: 'missing-info',
        priority: 'low',
      },
    ];
  }

  const result = await apiPost<{
    nudges: Array<{ message: string; type: string; priority: string }>;
  }>('/api/ai/generate-nudges', { accountId });

  return result.nudges;
}

// ---------------------------------------------------------------------------
// draftFollowUp
// ---------------------------------------------------------------------------

interface FollowUpResponse {
  subject: string;
  body: string;
  recipients: string[];
}

export async function draftFollowUp(
  interactionId: string,
): Promise<FollowUpResponse> {
  if (!isAiConfigured()) {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (interactionId === 'INT-001') {
      return {
        subject: 'Follow-Up: Budget Timeline & Phase 2 Next Steps',
        body: `Dear David,

Thank you for taking the time to meet during last week's Quarterly Business Review. I appreciate your transparency regarding the upcoming budget freeze and understand the pressure on discretionary spend.

I wanted to follow up on two items:

1. **Budget Timeline** — Could you share the expected duration of the freeze? Understanding the timeline will help us align our Phase 2 proposal with your fiscal planning cycle.

2. **Phase 2 Scope** — Based on your feedback, we've begun exploring a phased funding model that spreads investment over Q3–Q4. I'd welcome 30 minutes to walk you through the revised approach.

Additionally, Dr. Martinez mentioned strong interest in extending our analytics platform to the new Advanced Materials division. We'd be happy to include a lightweight assessment in our next proposal.

Please let me know your availability for a brief call next week.

Best regards,
Sarah Chen
Key Account Manager`,
        recipients: ['d.kim@contoso.com', 'l.martinez@contoso.com'],
      };
    }
    return {
      subject: 'Follow-Up: Recent Discussion & Next Steps',
      body: `Hi,

Thank you for our recent conversation. I wanted to follow up on the key points we discussed and outline the next steps.

Please let me know if you have any questions or if there's anything else I can help with.

Best regards,
Account Team`,
      recipients: ['contact@example.com'],
    };
  }

  return apiPost<FollowUpResponse>('/api/ai/draft-followup', { interactionId });
}

// ---------------------------------------------------------------------------
// generateDemoData
// ---------------------------------------------------------------------------

export type GenerateDemoDataResult =
  | { valid: true; data: GeneratedDemoData }
  | { valid: false; message: string };

export async function generateDemoData(
  prompt: string,
): Promise<GenerateDemoDataResult> {
  if (!isAiConfigured()) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      valid: false,
      message: 'AI backend is not configured — live generation is unavailable in mock mode.',
    };
  }

  return apiPost<GenerateDemoDataResult>('/api/ai/generate-demo-data', { prompt });
}
