import type {
  AdpAccount,
  Stakeholder,
  Interaction,
  Signal,
  Initiative,
  Nudge,
  AccountPlan,
  AdpDashboardSummary,
} from '../types/adp';

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

const accounts: AdpAccount[] = [
  {
    id: 'contoso-mfg',
    name: 'Contoso Manufacturing',
    industry: 'Manufacturing',
    region: 'EMEA',
    revenueTier: 'Tier 1',
    kam: 'Sarah Mitchell',
    healthScore: 58,
    healthTrend: 'declining',
    lastUpdated: '2026-04-20T16:00:00Z',
    signalCount: 5,
    overdueActions: 2,
  },
  {
    id: 'fabrikam-fs',
    name: 'Fabrikam Financial Services',
    industry: 'Financial Services',
    region: 'EMEA',
    revenueTier: 'Tier 1',
    kam: 'Sarah Mitchell',
    healthScore: 74,
    healthTrend: 'stable',
    lastUpdated: '2026-03-05T10:30:00Z',
    signalCount: 2,
    overdueActions: 0,
  },
  {
    id: 'northwind-retail',
    name: 'Northwind Traders',
    industry: 'Retail',
    region: 'Americas',
    revenueTier: 'Tier 2',
    kam: 'James Cooper',
    healthScore: 41,
    healthTrend: 'declining',
    lastUpdated: '2025-10-18T14:00:00Z',
    signalCount: 1,
    overdueActions: 2,
  },
  {
    id: 'adventure-works',
    name: 'Adventure Works',
    industry: 'Technology',
    region: 'APAC',
    revenueTier: 'Tier 2',
    kam: 'James Cooper',
    healthScore: 85,
    healthTrend: 'improving',
    lastUpdated: '2026-04-18T09:00:00Z',
    signalCount: 1,
    overdueActions: 0,
  },
  {
    id: 'tailspin-energy',
    name: 'Tailspin Energy',
    industry: 'Energy',
    region: 'EMEA',
    revenueTier: 'Tier 1',
    kam: 'Sarah Mitchell',
    healthScore: 67,
    healthTrend: 'stable',
    lastUpdated: '2026-04-12T11:45:00Z',
    signalCount: 1,
    overdueActions: 1,
  },
  {
    id: 'wingtip-pharma',
    name: 'Wingtip Pharmaceuticals',
    industry: 'Healthcare',
    region: 'Americas',
    revenueTier: 'Tier 1',
    kam: 'James Cooper',
    healthScore: 72,
    healthTrend: 'improving',
    lastUpdated: '2026-04-15T08:20:00Z',
    signalCount: 2,
    overdueActions: 0,
  },
];

// ---------------------------------------------------------------------------
// Stakeholders
// ---------------------------------------------------------------------------

const stakeholders: Stakeholder[] = [
  // Contoso Manufacturing (4)
  {
    id: 'STK-001', accountId: 'contoso-mfg', name: 'Marcus Weber', role: 'CTO',
    sentiment: 'positive', influenceLevel: 'high', lastContactDate: '2026-04-20',
    email: 'marcus.weber@contoso-mfg.example.com',
  },
  {
    id: 'STK-002', accountId: 'contoso-mfg', name: 'Lisa Hartmann', role: 'CFO',
    sentiment: 'negative', influenceLevel: 'high', lastContactDate: '2026-04-20',
    email: 'lisa.hartmann@contoso-mfg.example.com',
  },
  {
    id: 'STK-003', accountId: 'contoso-mfg', name: 'Thomas Bauer', role: 'VP Operations',
    sentiment: 'neutral', influenceLevel: 'medium', lastContactDate: '2026-04-10',
    email: 'thomas.bauer@contoso-mfg.example.com',
  },
  {
    id: 'STK-004', accountId: 'contoso-mfg', name: 'Julia Fischer', role: 'IT Director',
    sentiment: 'positive', influenceLevel: 'medium', lastContactDate: '2026-03-28',
    email: 'julia.fischer@contoso-mfg.example.com',
  },
  // Fabrikam Financial Services (3)
  {
    id: 'STK-005', accountId: 'fabrikam-fs', name: 'David Chen', role: 'CIO',
    sentiment: 'positive', influenceLevel: 'high', lastContactDate: '2026-03-05',
    email: 'david.chen@fabrikam-fs.example.com',
  },
  {
    id: 'STK-006', accountId: 'fabrikam-fs', name: 'Maria Santos', role: 'Head of Risk',
    sentiment: 'neutral', influenceLevel: 'medium', lastContactDate: '2026-02-20',
    email: 'maria.santos@fabrikam-fs.example.com',
  },
  {
    id: 'STK-007', accountId: 'fabrikam-fs', name: 'Robert Klein', role: 'Procurement Lead',
    sentiment: 'negative', influenceLevel: 'low', lastContactDate: '2026-01-15',
    email: 'robert.klein@fabrikam-fs.example.com',
  },
  // Northwind Traders (2)
  {
    id: 'STK-008', accountId: 'northwind-retail', name: 'Amanda Torres', role: 'VP Retail Operations',
    sentiment: 'neutral', influenceLevel: 'high', lastContactDate: '2025-10-18',
    email: 'amanda.torres@northwind.example.com',
  },
  {
    id: 'STK-009', accountId: 'northwind-retail', name: 'Kevin Patel', role: 'Head of IT',
    sentiment: 'negative', influenceLevel: 'medium', lastContactDate: '2025-11-02',
    email: 'kevin.patel@northwind.example.com',
  },
  // Adventure Works (2)
  {
    id: 'STK-010', accountId: 'adventure-works', name: 'Yuki Tanaka', role: 'CEO',
    sentiment: 'positive', influenceLevel: 'high', lastContactDate: '2026-04-18',
    email: 'yuki.tanaka@adventureworks.example.com',
  },
  {
    id: 'STK-011', accountId: 'adventure-works', name: 'Raj Gupta', role: 'VP Engineering',
    sentiment: 'positive', influenceLevel: 'medium', lastContactDate: '2026-04-10',
    email: 'raj.gupta@adventureworks.example.com',
  },
  // Tailspin Energy (2)
  {
    id: 'STK-012', accountId: 'tailspin-energy', name: 'Henrik Larsen', role: 'COO',
    sentiment: 'neutral', influenceLevel: 'high', lastContactDate: '2026-04-12',
    email: 'henrik.larsen@tailspin.example.com',
  },
  {
    id: 'STK-013', accountId: 'tailspin-energy', name: 'Fatima Al-Rashid', role: 'Head of Sustainability',
    sentiment: 'positive', influenceLevel: 'medium', lastContactDate: '2026-03-20',
    email: 'fatima.alrashid@tailspin.example.com',
  },
  // Wingtip Pharmaceuticals (2)
  {
    id: 'STK-014', accountId: 'wingtip-pharma', name: 'Dr. Patricia Reeves', role: 'Chief Digital Officer',
    sentiment: 'positive', influenceLevel: 'high', lastContactDate: '2026-04-15',
    email: 'patricia.reeves@wingtip.example.com',
  },
  {
    id: 'STK-015', accountId: 'wingtip-pharma', name: 'Carlos Mendez', role: 'VP Supply Chain',
    sentiment: 'neutral', influenceLevel: 'medium', lastContactDate: '2026-04-02',
    email: 'carlos.mendez@wingtip.example.com',
  },
];

// ---------------------------------------------------------------------------
// Pre-loaded sample meeting notes (for the demo capture walkthrough)
// ---------------------------------------------------------------------------

const SAMPLE_MEETING_NOTES = `QBR with Contoso leadership. Marcus (CTO) confirmed strong support for Phase 2 but Lisa (CFO) announced a temporary budget freeze across all divisions effective May 1. New Advanced Materials division launching Q3 — potential expansion opportunity. Thomas (VP Ops) reported 15% efficiency gains from Phase 1 implementation. Need to schedule follow-up with CFO to understand budget timeline and impact on Phase 2 milestones.`;

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

const interactions: Interaction[] = [
  // Contoso Manufacturing (5)
  {
    id: 'INT-001', accountId: 'contoso-mfg', type: 'meeting', date: '2026-03-15',
    summary: 'QBR — Phase 2 digital transformation progress review with Contoso leadership.',
    rawNotes: 'Quarterly business review covering Phase 2 digital transformation. Budget freeze mentioned by CFO Lisa Hartmann affecting all capital expenditure through Q2. CTO Marcus Weber remains supportive of continued partnership and Phase 2 roadmap. Phase 1 efficiency metrics reviewed — positive results across manufacturing lines.',
    participants: ['Sarah Mitchell', 'Marcus Weber', 'Lisa Hartmann', 'Thomas Bauer'],
    extractedSignalIds: ['SIG-003'],
  },
  {
    id: 'INT-002', accountId: 'contoso-mfg', type: 'call', date: '2026-03-28',
    summary: 'Customer feedback survey results discussed — mixed satisfaction scores.',
    rawNotes: 'Reviewed latest NPS and CSAT results with Julia Fischer. Overall NPS dropped from 42 to 35. Implementation team scored well but support responsiveness flagged as concern. Julia shared that internal teams are generally positive about Phase 1 outcomes but frustrated by vendor selection delays for Phase 2 components.',
    participants: ['Sarah Mitchell', 'Julia Fischer'],
    extractedSignalIds: [],
  },
  {
    id: 'INT-003', accountId: 'contoso-mfg', type: 'email', date: '2026-04-05',
    summary: 'CTO shared plans for new Advanced Materials division expansion.',
    rawNotes: 'Email from Marcus Weber outlining the new Advanced Materials division launching in Q3 2026. Division will have its own P&L and technology stack. Marcus sees opportunity for our platform to be part of the greenfield buildout. No established contacts in the new division leadership yet — Marcus offered to make introductions.',
    participants: ['Sarah Mitchell', 'Marcus Weber'],
    extractedSignalIds: ['SIG-002', 'SIG-005'],
  },
  {
    id: 'INT-004', accountId: 'contoso-mfg', type: 'meeting', date: '2026-04-10',
    summary: 'Stakeholder alignment session — CFO raised cost concerns for Phase 2.',
    rawNotes: 'Alignment meeting with key stakeholders. Lisa Hartmann (CFO) reiterated cost reduction mandate and questioned Phase 2 ROI projections. Thomas Bauer (VP Ops) presented 15% efficiency gains from Phase 1 as evidence of value. Discussion around delaying non-critical Phase 2 milestones. Vendor selection for integration middleware still pending — blocking critical path items.',
    participants: ['Sarah Mitchell', 'Lisa Hartmann', 'Thomas Bauer', 'Marcus Weber'],
    extractedSignalIds: ['SIG-001', 'SIG-004'],
  },
  {
    id: 'INT-005', accountId: 'contoso-mfg', type: 'meeting', date: '2026-04-20',
    summary: 'QBR with Contoso leadership — budget freeze confirmed, expansion opportunity identified.',
    rawNotes: SAMPLE_MEETING_NOTES,
    participants: ['Sarah Mitchell', 'Marcus Weber', 'Lisa Hartmann', 'Thomas Bauer'],
    extractedSignalIds: ['SIG-001', 'SIG-002'],
  },
  // Fabrikam Financial Services (3)
  {
    id: 'INT-006', accountId: 'fabrikam-fs', type: 'meeting', date: '2026-01-20',
    summary: 'Annual planning session with Fabrikam CIO — discussed regulatory compliance roadmap.',
    rawNotes: 'Met with David Chen (CIO) to review 2026 priorities. Primary focus on regulatory compliance automation and real-time risk monitoring. David expressed interest in expanding our analytics platform to cover new Basel IV reporting requirements. Maria Santos (Head of Risk) joined briefly to confirm risk dashboard requirements.',
    participants: ['Sarah Mitchell', 'David Chen', 'Maria Santos'],
    extractedSignalIds: ['SIG-006'],
  },
  {
    id: 'INT-007', accountId: 'fabrikam-fs', type: 'email', date: '2026-02-10',
    summary: 'Procurement raised concerns about licensing costs for renewal.',
    rawNotes: 'Email from Robert Klein flagging that licensing costs for the upcoming renewal are 18% above initial projections. Requested a detailed cost breakdown and alternative pricing models. Tone was firm but professional — may need executive-level engagement to maintain current scope.',
    participants: ['Sarah Mitchell', 'Robert Klein'],
    extractedSignalIds: ['SIG-007'],
  },
  {
    id: 'INT-008', accountId: 'fabrikam-fs', type: 'call', date: '2026-03-05',
    summary: 'Check-in call with CIO — confirmed satisfaction with current platform performance.',
    rawNotes: 'Brief check-in with David Chen. Platform performing well with 99.7% uptime. Basel IV module proof-of-concept scheduled for Q2. David mentioned that procurement concerns are being handled internally and not to worry. No new action items.',
    participants: ['Sarah Mitchell', 'David Chen'],
    extractedSignalIds: [],
  },
  // Northwind Traders (2)
  {
    id: 'INT-009', accountId: 'northwind-retail', type: 'meeting', date: '2025-10-18',
    summary: 'Annual review — declining engagement and unresolved support issues discussed.',
    rawNotes: 'Annual review with Amanda Torres (VP Retail Ops). Several outstanding support tickets flagged — average resolution time has increased to 14 days. Kevin Patel (Head of IT) expressed frustration with API performance during peak shopping seasons. Discussed potential POS integration project but no commitment from Northwind side.',
    participants: ['James Cooper', 'Amanda Torres', 'Kevin Patel'],
    extractedSignalIds: ['SIG-008'],
  },
  {
    id: 'INT-010', accountId: 'northwind-retail', type: 'email', date: '2025-11-02',
    summary: 'Follow-up on support escalations — partial resolution.',
    rawNotes: 'Email exchange with Kevin Patel confirming that 3 of 5 critical support tickets have been resolved. Remaining 2 require engineering involvement. Kevin noted that if performance issues persist through holiday season, they will evaluate alternative vendors for 2026.',
    participants: ['James Cooper', 'Kevin Patel'],
    extractedSignalIds: [],
  },
  // Adventure Works (2)
  {
    id: 'INT-011', accountId: 'adventure-works', type: 'meeting', date: '2026-04-18',
    summary: 'Strategic planning session — CEO outlined aggressive growth targets for APAC.',
    rawNotes: 'Met with Yuki Tanaka (CEO) and Raj Gupta (VP Engineering). Adventure Works planning 3x expansion in APAC region over next 18 months. They want our platform to serve as the backbone for new market deployments. Raj outlined technical requirements for multi-region architecture. Very positive engagement — strong executive sponsorship.',
    participants: ['James Cooper', 'Yuki Tanaka', 'Raj Gupta'],
    extractedSignalIds: ['SIG-009'],
  },
  {
    id: 'INT-012', accountId: 'adventure-works', type: 'call', date: '2026-04-10',
    summary: 'Technical deep-dive on multi-region architecture with VP Engineering.',
    rawNotes: 'Raj Gupta walked through their requirements for multi-region deployment: data residency compliance, sub-100ms latency, and active-active failover. Our platform meets most requirements out of the box. One gap identified: need custom connector for their proprietary inventory system.',
    participants: ['James Cooper', 'Raj Gupta'],
    extractedSignalIds: [],
  },
  // Tailspin Energy (2)
  {
    id: 'INT-013', accountId: 'tailspin-energy', type: 'meeting', date: '2026-04-12',
    summary: 'Quarterly review — renewable energy monitoring project on track.',
    rawNotes: 'Quarterly review with Henrik Larsen (COO). Renewable energy monitoring project proceeding on schedule. Fatima Al-Rashid (Head of Sustainability) presented carbon tracking dashboard requirements for Phase 2. Henrik raised concerns about data integration with legacy SCADA systems — may require additional consulting hours.',
    participants: ['Sarah Mitchell', 'Henrik Larsen', 'Fatima Al-Rashid'],
    extractedSignalIds: ['SIG-010'],
  },
  {
    id: 'INT-014', accountId: 'tailspin-energy', type: 'email', date: '2026-03-20',
    summary: 'Sustainability team shared updated carbon reporting requirements.',
    rawNotes: 'Fatima Al-Rashid sent updated requirements for carbon reporting module. Scope has expanded to include Scope 3 emissions tracking across supply chain partners. This is a significant scope increase but also represents meaningful upsell opportunity.',
    participants: ['Sarah Mitchell', 'Fatima Al-Rashid'],
    extractedSignalIds: [],
  },
  // Wingtip Pharmaceuticals (2)
  {
    id: 'INT-015', accountId: 'wingtip-pharma', type: 'meeting', date: '2026-04-15',
    summary: 'Digital transformation kickoff — clinical trial data platform initiative.',
    rawNotes: 'Kickoff meeting for clinical trial data platform with Dr. Patricia Reeves (CDO). Project aims to unify data from 12 clinical trial sites into a single analytics platform. Patricia is a strong internal champion. Carlos Mendez (VP Supply Chain) joined to discuss potential integration with pharmaceutical supply chain tracking.',
    participants: ['James Cooper', 'Dr. Patricia Reeves', 'Carlos Mendez'],
    extractedSignalIds: ['SIG-011'],
  },
  {
    id: 'INT-016', accountId: 'wingtip-pharma', type: 'call', date: '2026-04-02',
    summary: 'Supply chain integration scoping call with VP Supply Chain.',
    rawNotes: 'Carlos Mendez outlined supply chain visibility requirements. Key need: real-time tracking of active pharmaceutical ingredients (API) across 6 manufacturing facilities. Compliance with FDA 21 CFR Part 11 is mandatory. Carlos is cautiously supportive but wants to see proof-of-concept before committing budget.',
    participants: ['James Cooper', 'Carlos Mendez'],
    extractedSignalIds: ['SIG-012'],
  },
];

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

const signals: Signal[] = [
  // Contoso Manufacturing (5)
  {
    id: 'SIG-001', accountId: 'contoso-mfg', category: 'risk', severity: 'high',
    sourceInteractionId: 'INT-004', status: 'acknowledged',
    description: 'CFO announced budget freeze effective May 1 — may impact Phase 2 funding.',
    createdAt: '2026-04-10T15:00:00Z',
  },
  {
    id: 'SIG-002', accountId: 'contoso-mfg', category: 'opportunity', severity: 'medium',
    sourceInteractionId: 'INT-003', status: 'new',
    description: 'New Advanced Materials division launching Q3 — expansion opportunity.',
    createdAt: '2026-04-05T09:30:00Z',
  },
  {
    id: 'SIG-003', accountId: 'contoso-mfg', category: 'sentiment-shift', severity: 'medium',
    sourceInteractionId: 'INT-001', status: 'actioned',
    description: 'CTO sentiment shifted from neutral to strongly supportive of partnership.',
    createdAt: '2026-03-15T14:00:00Z',
  },
  {
    id: 'SIG-004', accountId: 'contoso-mfg', category: 'risk', severity: 'medium',
    sourceInteractionId: 'INT-004', status: 'acknowledged',
    description: 'Phase 2 milestone at risk due to delayed vendor selection for integration middleware.',
    createdAt: '2026-04-10T15:30:00Z',
  },
  {
    id: 'SIG-005', accountId: 'contoso-mfg', category: 'gap', severity: 'low',
    sourceInteractionId: 'INT-003', status: 'new',
    description: 'No direct relationship with new Advanced Materials division leadership.',
    createdAt: '2026-04-05T10:00:00Z',
  },
  // Fabrikam Financial Services (2)
  {
    id: 'SIG-006', accountId: 'fabrikam-fs', category: 'opportunity', severity: 'medium',
    sourceInteractionId: 'INT-006', status: 'acknowledged',
    description: 'CIO interested in expanding analytics platform for Basel IV reporting.',
    createdAt: '2026-01-20T16:00:00Z',
  },
  {
    id: 'SIG-007', accountId: 'fabrikam-fs', category: 'risk', severity: 'medium',
    sourceInteractionId: 'INT-007', status: 'acknowledged',
    description: 'Procurement flagged licensing costs 18% above projections — renewal risk.',
    createdAt: '2026-02-10T11:00:00Z',
  },
  // Northwind Traders (1)
  {
    id: 'SIG-008', accountId: 'northwind-retail', category: 'risk', severity: 'high',
    sourceInteractionId: 'INT-009', status: 'acknowledged',
    description: 'Customer threatening vendor switch if API performance issues persist through holiday season.',
    createdAt: '2025-10-18T16:00:00Z',
  },
  // Adventure Works (1)
  {
    id: 'SIG-009', accountId: 'adventure-works', category: 'opportunity', severity: 'high',
    sourceInteractionId: 'INT-011', status: 'new',
    description: 'CEO planning 3x APAC expansion — wants our platform as backbone for new market deployments.',
    createdAt: '2026-04-18T10:00:00Z',
  },
  // Tailspin Energy (1)
  {
    id: 'SIG-010', accountId: 'tailspin-energy', category: 'risk', severity: 'low',
    sourceInteractionId: 'INT-013', status: 'acknowledged',
    description: 'Legacy SCADA integration may require unplanned consulting hours — scope creep risk.',
    createdAt: '2026-04-12T14:00:00Z',
  },
  // Wingtip Pharmaceuticals (2)
  {
    id: 'SIG-011', accountId: 'wingtip-pharma', category: 'opportunity', severity: 'high',
    sourceInteractionId: 'INT-015', status: 'acknowledged',
    description: 'Clinical trial data platform initiative — strong CDO sponsorship across 12 trial sites.',
    createdAt: '2026-04-15T10:00:00Z',
  },
  {
    id: 'SIG-012', accountId: 'wingtip-pharma', category: 'gap', severity: 'medium',
    sourceInteractionId: 'INT-016', status: 'new',
    description: 'FDA 21 CFR Part 11 compliance capability needs validation for pharma supply chain use case.',
    createdAt: '2026-04-02T14:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Initiatives
// ---------------------------------------------------------------------------

const initiatives: Initiative[] = [
  // Contoso Manufacturing (3)
  {
    id: 'INIT-001', accountId: 'contoso-mfg',
    title: 'Phase 2 Digital Transformation',
    description: 'Continue the digital transformation program with Contoso Manufacturing, extending smart factory capabilities to 3 additional production lines and integrating real-time quality monitoring.',
    linkedSignalIds: ['SIG-001', 'SIG-004'],
    owner: 'Sarah Mitchell', status: 'in-progress', priority: 'high',
    dueDate: '2026-09-30', progressPercent: 45, createdAt: '2026-01-15T09:00:00Z',
    actions: [
      {
        id: 'ACT-001', initiativeId: 'INIT-001',
        description: 'Finalize vendor selection for integration middleware',
        owner: 'Sarah Mitchell', dueDate: '2026-04-15', status: 'overdue',
      },
      {
        id: 'ACT-002', initiativeId: 'INIT-001',
        description: 'Submit revised Phase 2 timeline accounting for budget freeze',
        owner: 'Sarah Mitchell', dueDate: '2026-05-01', status: 'pending',
      },
      {
        id: 'ACT-003', initiativeId: 'INIT-001',
        description: 'Complete Phase 1 deliverable review with VP Operations',
        owner: 'Thomas Bauer', dueDate: '2026-04-12', status: 'overdue',
      },
      {
        id: 'ACT-004', initiativeId: 'INIT-001',
        description: 'Deliver quality monitoring proof-of-concept to production line 4',
        owner: 'Sarah Mitchell', dueDate: '2026-06-30', status: 'pending',
      },
    ],
  },
  {
    id: 'INIT-002', accountId: 'contoso-mfg',
    title: 'Advanced Materials Division Entry',
    description: 'Establish our platform presence in the newly formed Advanced Materials division, leveraging CTO relationship to build connections with new division leadership.',
    linkedSignalIds: ['SIG-002', 'SIG-005'],
    owner: 'Sarah Mitchell', status: 'proposed', priority: 'medium',
    dueDate: '2026-12-31', progressPercent: 0, createdAt: '2026-04-06T08:00:00Z',
    actions: [
      {
        id: 'ACT-005', initiativeId: 'INIT-002',
        description: 'Request introductions to Advanced Materials division leadership via CTO',
        owner: 'Sarah Mitchell', dueDate: '2026-05-15', status: 'pending',
      },
      {
        id: 'ACT-006', initiativeId: 'INIT-002',
        description: 'Prepare tailored platform demo for greenfield manufacturing scenarios',
        owner: 'Sarah Mitchell', dueDate: '2026-06-15', status: 'pending',
      },
    ],
  },
  {
    id: 'INIT-003', accountId: 'contoso-mfg',
    title: 'Executive Relationship Program',
    description: 'Strengthen executive relationships at Contoso, with a focus on converting CFO sentiment from negative to neutral through demonstrated ROI evidence and proactive budget-aligned proposals.',
    linkedSignalIds: ['SIG-003'],
    owner: 'Sarah Mitchell', status: 'in-progress', priority: 'high',
    dueDate: '2026-06-30', progressPercent: 30, createdAt: '2026-03-16T10:00:00Z',
    actions: [
      {
        id: 'ACT-007', initiativeId: 'INIT-003',
        description: 'Prepare Phase 1 ROI analysis for CFO presentation',
        owner: 'Sarah Mitchell', dueDate: '2026-04-25', status: 'done',
      },
      {
        id: 'ACT-008', initiativeId: 'INIT-003',
        description: 'Schedule executive dinner with CTO and our VP of Customer Success',
        owner: 'Sarah Mitchell', dueDate: '2026-05-10', status: 'pending',
      },
      {
        id: 'ACT-009', initiativeId: 'INIT-003',
        description: 'Send personalized budget-impact brief to CFO addressing freeze concerns',
        owner: 'Sarah Mitchell', dueDate: '2026-05-05', status: 'pending',
      },
    ],
  },
  // Fabrikam Financial Services (1)
  {
    id: 'INIT-004', accountId: 'fabrikam-fs',
    title: 'Basel IV Analytics Expansion',
    description: 'Expand analytics platform to support Basel IV regulatory reporting requirements, leveraging existing infrastructure.',
    linkedSignalIds: ['SIG-006'],
    owner: 'Sarah Mitchell', status: 'proposed', priority: 'medium',
    dueDate: '2026-09-30', progressPercent: 10, createdAt: '2026-01-21T09:00:00Z',
    actions: [
      {
        id: 'ACT-010', initiativeId: 'INIT-004',
        description: 'Deliver Basel IV module proof-of-concept',
        owner: 'Sarah Mitchell', dueDate: '2026-06-30', status: 'pending',
      },
      {
        id: 'ACT-011', initiativeId: 'INIT-004',
        description: 'Gather detailed requirements from Head of Risk',
        owner: 'Sarah Mitchell', dueDate: '2026-05-15', status: 'pending',
      },
    ],
  },
  // Northwind Traders (1)
  {
    id: 'INIT-005', accountId: 'northwind-retail',
    title: 'Performance Remediation & Retention',
    description: 'Address API performance issues and resolve outstanding support tickets to prevent customer churn.',
    linkedSignalIds: ['SIG-008'],
    owner: 'James Cooper', status: 'in-progress', priority: 'high',
    dueDate: '2026-03-31', progressPercent: 40, createdAt: '2025-10-20T09:00:00Z',
    actions: [
      {
        id: 'ACT-012', initiativeId: 'INIT-005',
        description: 'Resolve remaining 2 critical support tickets',
        owner: 'James Cooper', dueDate: '2025-12-15', status: 'overdue',
      },
      {
        id: 'ACT-013', initiativeId: 'INIT-005',
        description: 'Deploy API performance optimization patch to staging',
        owner: 'James Cooper', dueDate: '2026-01-31', status: 'overdue',
      },
      {
        id: 'ACT-014', initiativeId: 'INIT-005',
        description: 'Schedule recovery meeting with VP Retail Ops',
        owner: 'James Cooper', dueDate: '2026-02-15', status: 'done',
      },
    ],
  },
  // Adventure Works (1)
  {
    id: 'INIT-006', accountId: 'adventure-works',
    title: 'APAC Multi-Region Expansion',
    description: 'Support Adventure Works 3x APAC expansion by deploying multi-region architecture with data residency compliance.',
    linkedSignalIds: ['SIG-009'],
    owner: 'James Cooper', status: 'proposed', priority: 'high',
    dueDate: '2027-06-30', progressPercent: 5, createdAt: '2026-04-18T11:00:00Z',
    actions: [
      {
        id: 'ACT-015', initiativeId: 'INIT-006',
        description: 'Complete multi-region architecture assessment',
        owner: 'James Cooper', dueDate: '2026-05-30', status: 'pending',
      },
      {
        id: 'ACT-016', initiativeId: 'INIT-006',
        description: 'Develop custom connector for proprietary inventory system',
        owner: 'James Cooper', dueDate: '2026-07-31', status: 'pending',
      },
    ],
  },
  // Tailspin Energy (1)
  {
    id: 'INIT-007', accountId: 'tailspin-energy',
    title: 'Carbon Tracking Dashboard — Phase 2',
    description: 'Extend carbon tracking to include Scope 3 emissions across supply chain partners, with legacy SCADA integration.',
    linkedSignalIds: ['SIG-010'],
    owner: 'Sarah Mitchell', status: 'in-progress', priority: 'medium',
    dueDate: '2026-09-30', progressPercent: 25, createdAt: '2026-03-21T09:00:00Z',
    actions: [
      {
        id: 'ACT-017', initiativeId: 'INIT-007',
        description: 'Complete SCADA integration assessment and effort estimate',
        owner: 'Sarah Mitchell', dueDate: '2026-04-30', status: 'pending',
      },
      {
        id: 'ACT-018', initiativeId: 'INIT-007',
        description: 'Finalize Scope 3 data model with sustainability team',
        owner: 'Sarah Mitchell', dueDate: '2026-04-10', status: 'overdue',
      },
    ],
  },
  // Wingtip Pharmaceuticals (1)
  {
    id: 'INIT-008', accountId: 'wingtip-pharma',
    title: 'Clinical Trial Data Platform',
    description: 'Unify clinical trial data from 12 sites into a centralized analytics platform with FDA compliance.',
    linkedSignalIds: ['SIG-011', 'SIG-012'],
    owner: 'James Cooper', status: 'in-progress', priority: 'high',
    dueDate: '2026-12-31', progressPercent: 15, createdAt: '2026-04-15T11:00:00Z',
    actions: [
      {
        id: 'ACT-019', initiativeId: 'INIT-008',
        description: 'Complete FDA 21 CFR Part 11 compliance gap analysis',
        owner: 'James Cooper', dueDate: '2026-05-31', status: 'pending',
      },
      {
        id: 'ACT-020', initiativeId: 'INIT-008',
        description: 'Deliver proof-of-concept with 2 pilot trial sites',
        owner: 'James Cooper', dueDate: '2026-07-31', status: 'pending',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Nudges
// ---------------------------------------------------------------------------

const nudges: Nudge[] = [
  {
    id: 'NDG-001', accountId: 'contoso-mfg',
    message: 'Phase 1 deliverable review overdue by 7 days',
    type: 'reminder', targetType: 'action', targetId: 'ACT-003',
    createdAt: '2026-04-19T08:00:00Z', dismissed: false,
  },
  {
    id: 'NDG-002', accountId: 'contoso-mfg',
    message: 'CFO sentiment is negative — consider executive engagement',
    type: 'follow-up', targetType: 'initiative', targetId: 'INIT-003',
    createdAt: '2026-04-20T08:00:00Z', dismissed: false,
  },
  {
    id: 'NDG-003', accountId: 'contoso-mfg',
    message: 'Competitive landscape section not updated in 4 months',
    type: 'stale-data', targetType: 'account', targetId: 'contoso-mfg',
    createdAt: '2026-04-18T08:00:00Z', dismissed: false,
  },
  {
    id: 'NDG-004', accountId: 'fabrikam-fs',
    message: 'No interaction recorded in 45 days',
    type: 'stale-data', targetType: 'account', targetId: 'fabrikam-fs',
    createdAt: '2026-04-19T08:00:00Z', dismissed: false,
  },
  {
    id: 'NDG-005', accountId: 'fabrikam-fs',
    message: 'Risk assessment section is missing',
    type: 'missing-info', targetType: 'account', targetId: 'fabrikam-fs',
    createdAt: '2026-04-15T08:00:00Z', dismissed: false,
  },
  {
    id: 'NDG-006', accountId: 'northwind-retail',
    message: 'Annual review data is 6 months old',
    type: 'stale-data', targetType: 'account', targetId: 'northwind-retail',
    createdAt: '2026-04-18T08:00:00Z', dismissed: false,
  },
  {
    id: 'NDG-007', accountId: 'northwind-retail',
    message: '2 overdue actions need attention',
    type: 'reminder', targetType: 'initiative', targetId: 'INIT-005',
    createdAt: '2026-04-19T08:00:00Z', dismissed: false,
  },
  {
    id: 'NDG-008', accountId: 'adventure-works',
    message: 'New opportunity signal requires acknowledgement',
    type: 'follow-up', targetType: 'account', targetId: 'adventure-works',
    createdAt: '2026-04-19T08:00:00Z', dismissed: false,
  },
  {
    id: 'NDG-009', accountId: 'tailspin-energy',
    message: 'Stakeholder map incomplete — key contacts missing',
    type: 'missing-info', targetType: 'account', targetId: 'tailspin-energy',
    createdAt: '2026-04-17T08:00:00Z', dismissed: false,
  },
  {
    id: 'NDG-010', accountId: 'wingtip-pharma',
    message: 'Quarterly business review due in 5 days',
    type: 'reminder', targetType: 'account', targetId: 'wingtip-pharma',
    createdAt: '2026-04-20T08:00:00Z', dismissed: false,
  },
];

// ---------------------------------------------------------------------------
// Account Plans
// ---------------------------------------------------------------------------

const accountPlans: AccountPlan[] = [
  {
    id: 'PLAN-001', accountId: 'contoso-mfg',
    vision: 'Establish a strategic partnership with Contoso Manufacturing as their primary digital transformation partner, expanding from factory floor optimization into enterprise-wide operational intelligence.',
    objectives: [
      'Complete Phase 2 digital transformation by Q3 2026',
      'Expand into Advanced Materials division by Q4 2026',
      'Improve executive alignment — convert CFO to neutral/positive',
      'Achieve 90%+ platform adoption across all production lines',
    ],
    swotSummary: {
      strengths: [
        'Strong CTO sponsorship and proven Phase 1 ROI (15% efficiency gains)',
        'Deep domain expertise in manufacturing process optimization',
        'Existing integration with Contoso ERP and MES systems',
      ],
      weaknesses: [
        'Limited relationship with finance and procurement stakeholders',
        'No presence in newly formed Advanced Materials division',
        'Phase 2 vendor selection delays affecting credibility',
      ],
      opportunities: [
        'New Advanced Materials division — greenfield technology stack',
        'Phase 1 success creates case study for broader enterprise deployment',
        'Contoso competitor analysis shows no strong alternative vendors',
      ],
      threats: [
        'Budget freeze may stall Phase 2 indefinitely',
        'CFO pushing cost reduction agenda across all vendor contracts',
        'Delayed milestones eroding internal champion confidence',
      ],
    },
    linkedInitiativeIds: ['INIT-001', 'INIT-002', 'INIT-003'],
    completenessPercent: 62,
    sections: [
      { name: 'Executive Summary', status: 'complete', lastUpdated: '2026-04-20', guidance: 'Summarize the overall account strategy and current state.' },
      { name: 'Stakeholder Map', status: 'partial', lastUpdated: '2026-04-10', guidance: 'Map all key decision-makers, influencers, and blockers with sentiment and influence ratings.' },
      { name: 'Competitive Landscape', status: 'stale', lastUpdated: '2025-12-15', guidance: 'Analyze competitive positioning and alternative vendors the customer is evaluating.' },
      { name: 'Revenue Forecast', status: 'partial', lastUpdated: '2026-03-15', guidance: 'Project revenue for next 4 quarters with upside/downside scenarios.' },
      { name: 'Risk Assessment', status: 'complete', lastUpdated: '2026-04-20', guidance: 'Identify and score top risks to the account relationship and revenue.' },
      { name: 'Growth Opportunities', status: 'partial', lastUpdated: '2026-04-05', guidance: 'Outline expansion opportunities within the account with effort and revenue estimates.' },
      { name: 'Success Metrics', status: 'complete', lastUpdated: '2026-04-20', guidance: 'Define measurable KPIs that demonstrate value delivery to the customer.' },
    ],
  },
  {
    id: 'PLAN-002', accountId: 'fabrikam-fs',
    vision: 'Position as the preferred analytics and compliance automation platform for Fabrikam Financial Services, expanding from risk analytics into regulatory reporting.',
    objectives: [
      'Secure platform renewal with expanded Basel IV scope',
      'Resolve procurement cost concerns before renewal deadline',
      'Establish relationship with broader compliance team',
    ],
    swotSummary: {
      strengths: [
        'Strong CIO relationship with proven platform performance (99.7% uptime)',
        'Deep financial services domain expertise',
      ],
      weaknesses: [
        'Licensing costs perceived as too high by procurement',
        'Limited engagement beyond CIO — narrow stakeholder coverage',
      ],
      opportunities: [
        'Basel IV reporting requirements create natural expansion path',
        'Competitor platforms lack regulatory compliance features',
      ],
      threats: [
        'Procurement may force cost reduction or vendor switch at renewal',
        'No recent engagement — relationship going stale',
      ],
    },
    linkedInitiativeIds: ['INIT-004'],
    completenessPercent: 55,
    sections: [
      { name: 'Executive Summary', status: 'complete', lastUpdated: '2026-02-10', guidance: 'Summarize the overall account strategy and current state.' },
      { name: 'Stakeholder Map', status: 'partial', lastUpdated: '2026-01-20', guidance: 'Map all key decision-makers, influencers, and blockers.' },
      { name: 'Competitive Landscape', status: 'complete', lastUpdated: '2026-01-15', guidance: 'Analyze competitive positioning.' },
      { name: 'Revenue Forecast', status: 'partial', lastUpdated: '2026-02-10', guidance: 'Project revenue for next 4 quarters.' },
      { name: 'Risk Assessment', status: 'missing', lastUpdated: '2025-09-01', guidance: 'Identify and score top risks.' },
      { name: 'Growth Opportunities', status: 'partial', lastUpdated: '2026-01-20', guidance: 'Outline expansion opportunities.' },
    ],
  },
  {
    id: 'PLAN-003', accountId: 'northwind-retail',
    vision: 'Retain Northwind Traders as a customer by addressing performance concerns and demonstrating value through POS integration.',
    objectives: [
      'Resolve all critical support tickets by end of Q1 2026',
      'Deploy API performance fixes before holiday season',
      'Propose POS integration pilot to re-engage stakeholders',
    ],
    swotSummary: {
      strengths: ['Existing integration with supply chain systems'],
      weaknesses: [
        'Poor support response times damaging relationship',
        'API performance issues during peak periods',
      ],
      opportunities: ['POS integration pilot could re-engage stakeholders'],
      threats: [
        'Customer actively evaluating alternative vendors',
        'No recent engagement — 6+ months since last meaningful interaction',
      ],
    },
    linkedInitiativeIds: ['INIT-005'],
    completenessPercent: 40,
    sections: [
      { name: 'Executive Summary', status: 'stale', lastUpdated: '2025-10-18', guidance: 'Summarize the overall account strategy and current state.' },
      { name: 'Stakeholder Map', status: 'partial', lastUpdated: '2025-10-18', guidance: 'Map all key decision-makers, influencers, and blockers.' },
      { name: 'Competitive Landscape', status: 'missing', lastUpdated: '2025-06-01', guidance: 'Analyze competitive positioning.' },
      { name: 'Risk Assessment', status: 'stale', lastUpdated: '2025-10-18', guidance: 'Identify and score top risks.' },
      { name: 'Growth Opportunities', status: 'missing', lastUpdated: '2025-06-01', guidance: 'Outline expansion opportunities.' },
    ],
  },
  {
    id: 'PLAN-004', accountId: 'adventure-works',
    vision: 'Become the foundational platform for Adventure Works\' APAC expansion, supporting multi-region deployments with enterprise-grade reliability.',
    objectives: [
      'Deliver multi-region architecture assessment by Q2 2026',
      'Build custom connector for proprietary inventory system',
      'Secure multi-year expansion deal aligned with 3x growth plan',
    ],
    swotSummary: {
      strengths: [
        'Strong executive sponsorship from CEO',
        'Platform meets most multi-region requirements out of the box',
      ],
      weaknesses: ['Missing custom connector for proprietary inventory system'],
      opportunities: [
        '3x APAC expansion — significant revenue growth potential',
        'Greenfield deployments with minimal legacy constraints',
      ],
      threats: ['Aggressive timeline may outpace our delivery capacity'],
    },
    linkedInitiativeIds: ['INIT-006'],
    completenessPercent: 70,
    sections: [
      { name: 'Executive Summary', status: 'complete', lastUpdated: '2026-04-18', guidance: 'Summarize the overall account strategy.' },
      { name: 'Stakeholder Map', status: 'complete', lastUpdated: '2026-04-18', guidance: 'Map all key decision-makers.' },
      { name: 'Competitive Landscape', status: 'partial', lastUpdated: '2026-03-01', guidance: 'Analyze competitive positioning.' },
      { name: 'Revenue Forecast', status: 'complete', lastUpdated: '2026-04-18', guidance: 'Project revenue with expansion scenarios.' },
      { name: 'Growth Opportunities', status: 'complete', lastUpdated: '2026-04-18', guidance: 'Outline APAC expansion opportunities.' },
      { name: 'Risk Assessment', status: 'partial', lastUpdated: '2026-04-10', guidance: 'Identify delivery and scaling risks.' },
    ],
  },
  {
    id: 'PLAN-005', accountId: 'tailspin-energy',
    vision: 'Partner with Tailspin Energy on their sustainability transformation, becoming the platform of choice for energy monitoring and carbon reporting.',
    objectives: [
      'Deliver carbon tracking dashboard Phase 2 by Q3 2026',
      'Integrate with legacy SCADA systems',
      'Expand Scope 3 emissions tracking to supply chain partners',
    ],
    swotSummary: {
      strengths: [
        'Strong relationship with sustainability team',
        'Proven renewable energy monitoring capabilities',
      ],
      weaknesses: ['Limited SCADA integration experience', 'Scope 3 data model still in development'],
      opportunities: ['Growing regulatory pressure on carbon reporting — expanding market'],
      threats: ['Legacy system integration complexity may delay delivery'],
    },
    linkedInitiativeIds: ['INIT-007'],
    completenessPercent: 58,
    sections: [
      { name: 'Executive Summary', status: 'complete', lastUpdated: '2026-04-12', guidance: 'Summarize the overall account strategy.' },
      { name: 'Stakeholder Map', status: 'partial', lastUpdated: '2026-03-20', guidance: 'Map key contacts — identify missing stakeholders.' },
      { name: 'Revenue Forecast', status: 'partial', lastUpdated: '2026-03-01', guidance: 'Project revenue with Scope 3 upsell scenarios.' },
      { name: 'Risk Assessment', status: 'complete', lastUpdated: '2026-04-12', guidance: 'Identify integration and delivery risks.' },
      { name: 'Growth Opportunities', status: 'partial', lastUpdated: '2026-03-20', guidance: 'Outline carbon reporting market expansion.' },
    ],
  },
  {
    id: 'PLAN-006', accountId: 'wingtip-pharma',
    vision: 'Establish our platform as the clinical trial data backbone for Wingtip Pharmaceuticals, with FDA-compliant analytics across all trial sites.',
    objectives: [
      'Deliver proof-of-concept with 2 pilot trial sites by Q3 2026',
      'Validate FDA 21 CFR Part 11 compliance',
      'Expand to supply chain tracking integration',
    ],
    swotSummary: {
      strengths: [
        'Strong CDO sponsorship',
        'Platform analytics capabilities align with clinical data needs',
      ],
      weaknesses: ['FDA compliance gap needs validation', 'No existing pharma supply chain integrations'],
      opportunities: [
        'Clinical trial data platform — large TAM in pharmaceutical sector',
        'Supply chain integration creates cross-sell opportunity',
      ],
      threats: ['FDA compliance requirements may require significant engineering investment'],
    },
    linkedInitiativeIds: ['INIT-008'],
    completenessPercent: 85,
    sections: [
      { name: 'Executive Summary', status: 'complete', lastUpdated: '2026-04-15', guidance: 'Summarize the overall account strategy.' },
      { name: 'Stakeholder Map', status: 'complete', lastUpdated: '2026-04-15', guidance: 'Map all key decision-makers.' },
      { name: 'Competitive Landscape', status: 'complete', lastUpdated: '2026-04-01', guidance: 'Analyze competitive positioning in pharma analytics.' },
      { name: 'Revenue Forecast', status: 'complete', lastUpdated: '2026-04-15', guidance: 'Project revenue with multi-site rollout.' },
      { name: 'Risk Assessment', status: 'complete', lastUpdated: '2026-04-15', guidance: 'Identify compliance and delivery risks.' },
      { name: 'Growth Opportunities', status: 'complete', lastUpdated: '2026-04-15', guidance: 'Outline cross-sell and expansion opportunities.' },
      { name: 'Success Metrics', status: 'partial', lastUpdated: '2026-04-02', guidance: 'Define clinical trial KPIs and SLAs.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Getter functions
// ---------------------------------------------------------------------------

export function getAdpAccounts(): AdpAccount[] {
  return accounts;
}

export function getAdpAccount(id: string): AdpAccount | undefined {
  return accounts.find((a) => a.id === id);
}

export function getStakeholders(accountId: string): Stakeholder[] {
  return stakeholders.filter((s) => s.accountId === accountId);
}

export function getInteractions(accountId: string): Interaction[] {
  return interactions.filter((i) => i.accountId === accountId);
}

export function getSignals(accountId: string): Signal[] {
  return signals.filter((s) => s.accountId === accountId);
}

export function getAllSignals(): Signal[] {
  return signals;
}

export function getInitiatives(accountId: string): Initiative[] {
  return initiatives.filter((i) => i.accountId === accountId);
}

export function getNudges(accountId?: string): Nudge[] {
  const active = nudges.filter((n) => !n.dismissed);
  if (accountId) {
    return active.filter((n) => n.accountId === accountId);
  }
  return active;
}

export function getAccountPlan(accountId: string): AccountPlan | undefined {
  return accountPlans.find((p) => p.accountId === accountId);
}

export function getAdpDashboardSummary(): AdpDashboardSummary {
  const totalAccounts = accounts.length;
  const accountsAtRisk = accounts.filter((a) => a.healthScore < 50).length;
  const newSignals = signals.filter((s) => s.status === 'new').length;
  const overdueActions = initiatives
    .flatMap((i) => i.actions)
    .filter((a) => a.status === 'overdue').length;
  const averageHealth = Math.round(
    accounts.reduce((sum, a) => sum + a.healthScore, 0) / totalAccounts,
  );
  const staleAccounts = accounts.filter((a) => {
    const lastUpdate = new Date(a.lastUpdated);
    const thirtyDaysAgo = new Date('2026-04-20T00:00:00Z');
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastUpdate < thirtyDaysAgo;
  }).length;

  return {
    totalAccounts,
    accountsAtRisk,
    newSignals,
    overdueActions,
    averageHealth,
    staleAccounts,
  };
}

export function getSampleMeetingNotes(): string {
  return SAMPLE_MEETING_NOTES;
}
