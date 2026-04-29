import type { ExtractionResult, Signal } from '../types/adp';

// TODO: Azure AI Foundry integration points:
// - Replace extractSignals with Azure AI Foundry model endpoint for NLP extraction
// - Replace generateInsights with Foundry Agent Service for multi-step analysis
// - Replace suggestActions with Azure AI Foundry for context-aware action generation
// - Replace assessPlanCompleteness with Azure AI Search grounded in account history
// - Replace generateNudges with Power Automate triggers
// - Replace draftFollowUp with Azure AI Foundry for tone-appropriate email generation
// - Add Application Insights tracing for all AI calls

/**
 * Extract signals, stakeholder updates, and suggested actions from raw interaction notes.
 *
 * TODO: Replace with Azure AI Foundry model endpoint for NLP extraction.
 */
export async function extractSignals(rawText: string): Promise<ExtractionResult> {
  await new Promise(resolve => setTimeout(resolve, 1200));

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

/**
 * Generate cross-signal insights for an account.
 *
 * TODO: Replace with Foundry Agent Service for multi-step analysis.
 */
export async function generateInsights(
  accountId: string,
): Promise<{
  insights: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    linkedSignalIds: string[];
    suggestedAction: string;
  }>;
}> {
  await new Promise(resolve => setTimeout(resolve, 900));

  if (accountId === 'contoso-mfg') {
    return {
      insights: [
        {
          id: 'INS-001',
          title: 'Budget Freeze Threatens Phase 2 Timeline',
          description:
            'Budget freeze risk combined with delayed Phase 2 initiative suggests re-prioritisation needed. Current funding model assumes Q3 approval which is now unlikely.',
          severity: 'high',
          linkedSignalIds: ['SIG-001', 'SIG-003'],
          suggestedAction:
            'Propose a phased funding model that defers discretionary items to Q4 while protecting core deliverables.',
        },
        {
          id: 'INS-002',
          title: 'Expansion Risk with Strained CFO Relationship',
          description:
            'Expanding into new division while core relationship with CFO is strained creates execution risk. New division engagement requires CFO sign-off on incremental budget.',
          severity: 'medium',
          linkedSignalIds: ['SIG-002', 'SIG-001'],
          suggestedAction:
            'Align new division proposal with cost-saving narrative to address CFO budget concerns.',
        },
        {
          id: 'INS-003',
          title: 'CTO Advocacy as Internal Champion',
          description:
            'CTO advocacy can be leveraged to build internal support for continued investment. Phase 1 success metrics provide concrete evidence for ROI conversations.',
          severity: 'low',
          linkedSignalIds: ['SIG-004', 'SIG-NEW-003'],
          suggestedAction:
            'Co-author an internal case study with CTO to circulate among executive stakeholders.',
        },
        {
          id: 'INS-004',
          title: 'Competitive Pressure from Alternate Vendors',
          description:
            'Two competing vendors have been referenced in recent procurement communications. Budget freeze may accelerate vendor evaluation.',
          severity: 'medium',
          linkedSignalIds: ['SIG-001'],
          suggestedAction:
            'Prepare competitive displacement analysis and schedule executive briefing.',
        },
      ],
    };
  }

  return {
    insights: [
      {
        id: 'INS-GEN-001',
        title: 'Account Activity Below Threshold',
        description:
          'No new interactions recorded in the past 30 days. Risk of relationship going stale.',
        severity: 'medium',
        linkedSignalIds: [],
        suggestedAction: 'Schedule a check-in call with the primary contact.',
      },
    ],
  };
}

/**
 * Suggest concrete actions for a given signal.
 *
 * TODO: Replace with Azure AI Foundry for context-aware action generation.
 */
export async function suggestActions(
  signalId: string,
): Promise<Array<{ description: string; owner: string; priority: string; dueDate: string }>> {
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

/**
 * Assess the completeness of an account plan section by section.
 *
 * TODO: Replace with Azure AI Search grounded in account history.
 */
export async function assessPlanCompleteness(
  accountId: string,
): Promise<{
  overallPercent: number;
  sections: Array<{ name: string; status: string; guidance: string }>;
  recommendations: string[];
}> {
  await new Promise(resolve => setTimeout(resolve, 700));

  if (accountId === 'contoso-mfg') {
    return {
      overallPercent: 62,
      sections: [
        {
          name: 'Executive Summary',
          status: 'complete',
          guidance: 'Looks good — refreshed within the last 30 days.',
        },
        {
          name: 'Stakeholder Map',
          status: 'partial',
          guidance:
            'Missing contacts from the new Advanced Materials division. Add at least the division GM and procurement lead.',
        },
        {
          name: 'Competitive Landscape',
          status: 'stale',
          guidance:
            'Last updated 90+ days ago. Two new vendor mentions detected in recent interactions — update needed.',
        },
        {
          name: 'Financial Projections',
          status: 'partial',
          guidance:
            'Current projections do not reflect the Q3 budget freeze. Revise revenue forecast and deal timeline accordingly.',
        },
        {
          name: 'SWOT Analysis',
          status: 'complete',
          guidance: 'Recently updated. Consider adding budget freeze as a new threat.',
        },
        {
          name: 'Initiative Roadmap',
          status: 'partial',
          guidance:
            'Phase 2 timeline is outdated. Align milestones with revised budget assumptions.',
        },
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
      {
        name: 'Executive Summary',
        status: 'partial',
        guidance: 'Summary exists but lacks recent context. Refresh with latest interaction data.',
      },
      {
        name: 'Stakeholder Map',
        status: 'missing',
        guidance: 'No stakeholder map found. Add primary and secondary contacts.',
      },
      {
        name: 'Financial Projections',
        status: 'missing',
        guidance: 'No financial data linked. Import from CRM or add manually.',
      },
    ],
    recommendations: [
      'Complete the stakeholder map with at least 3 key contacts',
      'Add financial projections for the next 4 quarters',
    ],
  };
}

/**
 * Generate context-aware nudges for an account.
 *
 * TODO: Replace with Power Automate triggers.
 */
export async function generateNudges(
  accountId: string,
): Promise<Array<{ message: string; type: string; priority: string }>> {
  await new Promise(resolve => setTimeout(resolve, 500));

  if (accountId === 'contoso-mfg') {
    return [
      {
        message:
          'CFO has not been contacted in 21 days — consider scheduling a touchpoint before the budget review.',
        type: 'follow-up',
        priority: 'high',
      },
      {
        message:
          'Competitive landscape section is 90+ days stale. Recent vendor mentions suggest an update is needed.',
        type: 'stale-data',
        priority: 'medium',
      },
      {
        message:
          'Phase 2 initiative has 2 overdue actions. Review and update status to keep the plan current.',
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

/**
 * Draft a follow-up email based on a past interaction.
 *
 * TODO: Replace with Azure AI Foundry for tone-appropriate email generation.
 */
export async function draftFollowUp(
  interactionId: string,
): Promise<{ subject: string; body: string; recipients: string[] }> {
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
