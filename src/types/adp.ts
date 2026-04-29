export type InteractionType = 'meeting' | 'email' | 'call' | 'survey';

export type SignalCategory = 'risk' | 'opportunity' | 'gap' | 'sentiment-shift';

export type SignalSeverity = 'high' | 'medium' | 'low';

export type SignalStatus = 'new' | 'acknowledged' | 'actioned' | 'dismissed';

export type InitiativeStatus = 'proposed' | 'in-progress' | 'completed' | 'stalled';

export type InitiativePriority = 'high' | 'medium' | 'low';

export type ActionStatus = 'pending' | 'done' | 'overdue';

export type NudgeType = 'reminder' | 'stale-data' | 'follow-up' | 'missing-info';

export type HealthTrend = 'improving' | 'stable' | 'declining';

export interface AdpAccount {
  id: string;
  name: string;
  industry: string;
  region: string;
  revenueTier: string;
  kam: string;
  healthScore: number;
  healthTrend: HealthTrend;
  lastUpdated: string;
  signalCount: number;
  overdueActions: number;
}

export interface Stakeholder {
  id: string;
  accountId: string;
  name: string;
  role: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  influenceLevel: 'high' | 'medium' | 'low';
  lastContactDate: string;
  email: string;
}

export interface Interaction {
  id: string;
  accountId: string;
  type: InteractionType;
  date: string;
  summary: string;
  rawNotes: string;
  participants: string[];
  extractedSignalIds: string[];
}

export interface Signal {
  id: string;
  accountId: string;
  category: SignalCategory;
  severity: SignalSeverity;
  sourceInteractionId: string;
  description: string;
  status: SignalStatus;
  createdAt: string;
}

export interface Initiative {
  id: string;
  accountId: string;
  title: string;
  description: string;
  linkedSignalIds: string[];
  owner: string;
  status: InitiativeStatus;
  priority: InitiativePriority;
  dueDate: string;
  progressPercent: number;
  createdAt: string;
  actions: Action[];
}

export interface Action {
  id: string;
  initiativeId: string;
  description: string;
  owner: string;
  dueDate: string;
  status: ActionStatus;
}

export interface Nudge {
  id: string;
  accountId: string;
  message: string;
  type: NudgeType;
  targetType: 'account' | 'initiative' | 'action';
  targetId: string;
  createdAt: string;
  dismissed: boolean;
}

export interface AccountPlan {
  id: string;
  accountId: string;
  vision: string;
  objectives: string[];
  swpiSummary: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  linkedInitiativeIds: string[];
  completenessPercent: number;
  sections: PlanSection[];
}

export interface PlanSection {
  name: string;
  status: 'complete' | 'partial' | 'missing' | 'stale';
  lastUpdated: string;
  guidance: string;
}

export interface AdpDashboardSummary {
  totalAccounts: number;
  accountsAtRisk: number;
  newSignals: number;
  overdueActions: number;
  averageHealth: number;
  staleAccounts: number;
}

export interface ExtractionResult {
  signals: Signal[];
  stakeholderUpdates: {
    stakeholderId: string;
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  suggestedActions: {
    description: string;
    owner: string;
  }[];
}
