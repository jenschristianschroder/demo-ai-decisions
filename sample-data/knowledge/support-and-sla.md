# Support and Service Level Agreements

**Last Reviewed:** February 5, 2026
**Owner:** Rachel Kim, VP of Customer Success
**Approved Use:** May be referenced in RFP responses, contract negotiations, and customer-facing service descriptions. Non-standard SLA terms (e.g., enhanced service credits) must be approved by the VP of Customer Success before inclusion in proposals.

---

## Support Tiers

Northstar offers two support tiers to meet varying customer needs:

### Standard Support
| Attribute | Detail |
|-----------|--------|
| Availability | **Business hours** (Monday–Friday, 7:00 AM – 7:00 PM ET, excluding US federal holidays) |
| Channels | Email, web portal (ticketing system) |
| Included in | Standard and Professional subscription tiers |
| Named contacts | Up to 5 authorized support contacts |

### Premium Support
| Attribute | Detail |
|-----------|--------|
| Availability | **24/7/365** |
| Channels | Email, web portal, phone (dedicated support line), live chat |
| Included in | Enterprise subscription tier (available as add-on for other tiers) |
| Named contacts | Up to 15 authorized support contacts |
| Additional features | Priority queue routing, quarterly support review meetings, proactive monitoring alerts |

## Service Level Agreement (SLA)

### Uptime Guarantee

Northstar guarantees **99.9% platform availability** measured on a monthly basis.

**Uptime calculation:**
```
Uptime % = ((Total Minutes in Month - Downtime Minutes) / Total Minutes in Month) × 100
```

**Exclusions from downtime calculation:**
- Scheduled maintenance windows (communicated at least 72 hours in advance; typically performed Saturday 2:00–6:00 AM ET)
- Force majeure events
- Customer-caused outages (e.g., misconfigured integrations, excessive query loads)
- Third-party service outages beyond Northstar's control (e.g., Azure regional outages)

### Incident Severity Levels and Response Times

| Severity | Definition | Response Time (Premium) | Response Time (Standard) |
|----------|-----------|------------------------|-------------------------|
| **Sev 1 — Critical** | Platform is completely unavailable or a critical business function is non-operational for all users | **15 minutes** | 1 hour |
| **Sev 2 — High** | Major feature is significantly impaired; workaround may exist but is not sustainable | **2 hours** | 4 hours |
| **Sev 3 — Medium** | Feature is impaired but a reasonable workaround exists; limited user impact | 8 hours | Next business day |
| **Sev 4 — Low** | Minor issue, cosmetic defect, or general question | Next business day | 2 business days |

**Response time** is defined as the time from ticket submission (or phone call for Premium) to the first substantive response from a Northstar support engineer. Automated acknowledgment emails do not constitute a substantive response.

### Resolution Targets

| Severity | Target Resolution Time | Notes |
|----------|----------------------|-------|
| Sev 1 | 4 hours | Continuous effort until resolved or mitigated |
| Sev 2 | 24 hours | May be resolved via hotfix or workaround |
| Sev 3 | 5 business days | May be resolved in next scheduled release |
| Sev 4 | 10 business days | Addressed in standard release cycle |

Resolution targets are best-effort goals, not contractual commitments. Response times are contractual commitments.

## Service Credits

When Northstar fails to meet the 99.9% uptime SLA, customers are entitled to service credits applied to future subscription fees:

### Standard Service Credit Schedule

| Monthly Uptime | Service Credit |
|---------------|----------------|
| 99.80% – 99.89% | **3%** of monthly subscription fee |
| 99.70% – 99.79% | **6%** of monthly subscription fee |
| 99.50% – 99.69% | **10%** of monthly subscription fee |
| Below 99.50% | **15%** of monthly subscription fee |

The standard credit rate is **3% per 0.1% below SLA**.

### Enhanced Service Credits

Some customers request enhanced service credit rates (e.g., 5% per 0.1% below SLA). Enhanced credits are **non-standard** and require the following approval:

| Credit Rate | Approval Required |
|------------|-------------------|
| Standard (3% per 0.1%) | Pre-approved; no additional approval needed |
| Enhanced (up to 5% per 0.1%) | **VP of Customer Success** approval |
| Enhanced (above 5% per 0.1%) | **COO** approval |

### Service Credit Process
- Credits must be requested by the customer within 30 days of the affected month
- Northstar will validate the downtime claim and respond within 10 business days
- Approved credits are applied to the next invoice
- Service credits are the sole and exclusive remedy for SLA failures
- Maximum aggregate credits in any 12-month period shall not exceed 30% of annual subscription fees

## Customer Success Manager

A **dedicated Customer Success Manager (CSM)** is included in the **Enterprise tier** at no additional cost. The CSM provides:

- **Onboarding support:** Guides the customer through post-implementation adoption
- **Quarterly business reviews (QBRs):** Reviews platform usage, adoption metrics, and ROI
- **Adoption monitoring:** Proactive identification of underutilized features and training opportunities
- **Escalation management:** Serves as an internal advocate for the customer within Northstar
- **Renewal planning:** Engages 90 days before renewal to review contract terms and expansion opportunities

For Standard and Professional tier customers, CSM services are available as an add-on for $2,500/month.

## Support Escalation Path

| Escalation Level | Role | Trigger |
|-----------------|------|---------|
| Level 1 | Support Engineer | Initial ticket triage and troubleshooting |
| Level 2 | Senior Support Engineer | Unresolved after Level 1 SLA target |
| Level 3 | Engineering (Development Team) | Product defect or platform issue identified |
| Management Escalation | Support Manager → VP Customer Success | Customer request or SLA breach |

---

## Constraints and Caveats

- The 99.9% uptime SLA applies to the Northstar cloud platform only. On-premises deployments are not covered by Northstar's SLA; uptime is the customer's responsibility.
- Response times for Standard Support apply during business hours only. Tickets submitted outside business hours will be responded to on the next business day.
- Enhanced service credits (above 3% per 0.1%) are not pre-approved and should not be offered in proposals without obtaining the required approval.
- CSM services for non-Enterprise customers are subject to availability.
- Service credits are the sole remedy for SLA failures and do not constitute admission of liability.

---

## Suggested RFP Response Language

> Northstar provides Standard (business hours) and Premium (24/7/365) support tiers with a guaranteed 99.9% platform uptime SLA. Severity 1 incidents receive a 15-minute response time under Premium support. Service credits of 3% of monthly fees per 0.1% below the SLA threshold are provided when uptime commitments are not met. Enterprise tier customers receive a dedicated Customer Success Manager who conducts quarterly business reviews and proactive adoption monitoring. A structured escalation path ensures rapid resolution of critical issues.
