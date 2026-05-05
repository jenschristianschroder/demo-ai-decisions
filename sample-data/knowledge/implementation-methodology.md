# Implementation Methodology

**Last Reviewed:** January 22, 2026
**Owner:** Angela Torres, VP of Professional Services
**Approved Use:** May be referenced in RFP responses, statements of work, and project planning documents. Timeline estimates are based on standard engagement complexity; actual timelines should be scoped during Discovery.

---

## Methodology Overview

Northstar employs a structured **4-phase implementation methodology** designed to minimize risk, ensure knowledge transfer, and deliver measurable value within a predictable timeline.

**Standard engagement duration: approximately 17 weeks** (varies based on scope complexity, data source count, and organizational readiness).

Each engagement is led by a **dedicated Northstar Project Manager (PM)** who serves as the single point of accountability from kickoff through hypercare completion.

## Phase 1: Discovery (2 Weeks)

### Objectives
- Understand current analytics landscape and pain points
- Document business requirements and success criteria
- Inventory existing data sources, reports, and dashboards
- Assess organizational readiness and change management needs
- Define project scope, timeline, and resource commitments

### Key Activities
| Activity | Duration | Participants |
|----------|----------|-------------|
| Executive kickoff | 2 hours | Executive sponsors, PM, Northstar leadership |
| Current state assessment | 3–5 days | Business analysts, IT stakeholders |
| Data source inventory | 2–3 days | Database administrators, data engineers |
| Requirements workshops | 3–5 sessions | Business users, report owners, IT leads |
| Scope and timeline finalization | 1–2 days | PM, customer project lead |

### Deliverables
- Discovery Summary Report
- Business Requirements Document (BRD)
- Data Source Inventory and Connectivity Assessment
- Project Plan with milestones and resource assignments
- Risk Register

## Phase 2: Design (3 Weeks)

### Objectives
- Translate business requirements into technical specifications
- Design the data model, semantic layer, and security model
- Create wireframes for priority dashboards and reports
- Plan data migration from legacy platforms
- Establish development and testing environments

### Key Activities
| Activity | Duration | Participants |
|----------|----------|-------------|
| Data model design | 5–7 days | Northstar solution architect, customer data engineers |
| Semantic layer configuration | 3–5 days | Northstar analyst, business subject matter experts |
| Dashboard wireframing | 3–5 days | UX designer, business stakeholders |
| Security model design (RBAC) | 2–3 days | Customer IT security, Northstar architect |
| Migration planning | 2–3 days | Northstar migration specialist |

### Deliverables
- Technical Design Document
- Data Model and Semantic Layer Specification
- Dashboard and Report Wireframes (approved by stakeholders)
- Security Model Design (roles, permissions, row-level security rules)
- Migration Plan

## Phase 3: Build & Migrate (8 Weeks)

### Objectives
- Configure the Northstar platform per the approved design
- Build and validate data connections and pipelines
- Develop dashboards, reports, and scheduled jobs
- Execute data migration from legacy platforms
- Conduct system integration testing (SIT) and user acceptance testing (UAT)

### Key Activities
| Activity | Duration | Participants |
|----------|----------|-------------|
| Platform configuration | 1–2 weeks | Northstar implementation engineers |
| Data connector setup and validation | 1–2 weeks | Data engineers (both teams) |
| Dashboard and report development | 3–4 weeks | Northstar developers, customer reviewers |
| Data migration execution | 2–3 weeks | Northstar migration specialist |
| SIT and UAT | 1–2 weeks | QA team, business users |

### Data Migration Support

Northstar has proven migration tooling and experience for the following legacy platforms:

- **IBM Cognos Analytics** — Report specification conversion, connection migration, scheduling migration
- **Tableau** — Workbook and data source conversion, user and permissions migration
- **Microsoft Power BI** — Report and dataset conversion, gateway configuration migration

Migration is performed using a combination of automated conversion tools and manual validation. Typical migration fidelity is 70–85% automated, with the remainder requiring manual adjustment and optimization.

### Deliverables
- Configured Northstar environment
- Validated data connections and pipelines
- Developed dashboards and reports
- Migration completion report with fidelity metrics
- SIT and UAT sign-off

## Phase 4: Go-Live & Hypercare (4 Weeks)

### Objectives
- Transition to production usage
- Conduct end-user and administrator training
- Monitor platform performance and user adoption
- Resolve post-launch issues with priority response
- Complete formal project closure and handoff to support

### Key Activities
| Activity | Duration | Participants |
|----------|----------|-------------|
| Production cutover | 1–2 days | All teams |
| Administrator training | 3–5 days | Up to 50 administrators |
| End-user training | 5–10 days | Up to 200 end users |
| Hypercare monitoring | 4 weeks | Northstar PM and support team |
| Project closure | 1 day | Executive sponsors, PM |

### Training Program

Standard implementation includes the following training:

| Training Track | Audience | Capacity | Format |
|---------------|----------|----------|--------|
| Platform Administration | IT administrators, data engineers | Up to **50 admins** | Instructor-led (virtual or on-site) |
| End-User Essentials | Business users, analysts | Up to **200 users** | Instructor-led (virtual) with self-paced modules |
| Dashboard Development | Power users, report developers | Included in admin track | Instructor-led with hands-on labs |

Additional training beyond the standard allocation is available at standard professional services rates.

### Deliverables
- Production environment live and operational
- Training completion records
- Hypercare summary report
- Project closure document with lessons learned
- Handoff to Northstar Customer Success and Support teams

## Milestone Penalty Policy

Northstar standard contracts include a milestone-based delivery schedule with the following penalty provisions:

- **Grace period:** Up to **15 calendar days** beyond the agreed milestone date before penalties apply
- **Penalty structure:** Service credits applied to implementation fees for delays attributable to Northstar (specific credit amounts are defined in the Statement of Work)
- **Exclusions:** Delays caused by customer dependencies (data access, resource availability, approvals) do not count toward penalty calculations
- **Dispute resolution:** Milestone completion disputes are escalated to the executive sponsors from both parties

**Important:** The standard grace period is **15 days, not 30 days**. Requests for a 30-day grace period are non-standard and require VP of Professional Services approval.

---

## Constraints and Caveats

- The 17-week standard timeline assumes a moderately complex engagement (3–5 data sources, up to 30 dashboards, single legacy platform migration). Larger or more complex engagements may require extended timelines.
- Data migration fidelity rates (70–85% automated) are estimates based on historical engagements. Actual fidelity depends on the complexity and customization of legacy content.
- Training capacity (50 admins, 200 users) is included in standard implementation pricing. Additional training requires a separate SOW or change order.
- The milestone penalty policy applies to delays attributable to Northstar only. A mutual responsibility matrix (RACI) is established during Discovery to clearly delineate accountability.
- On-premises deployments follow the same methodology but may require additional time for infrastructure provisioning (typically 2–4 weeks added to Phase 3).

---

## Suggested RFP Response Language

> Northstar follows a proven 4-phase implementation methodology — Discovery (2 weeks), Design (3 weeks), Build & Migrate (8 weeks), and Go-Live & Hypercare (4 weeks) — with a standard duration of approximately 17 weeks. Each engagement is led by a dedicated Project Manager. The implementation includes data migration support from Cognos, Tableau, and Power BI, along with training for up to 50 administrators and 200 end users. Milestone-based delivery with a 15-day grace period and defined penalty provisions ensures accountability and on-time delivery.
