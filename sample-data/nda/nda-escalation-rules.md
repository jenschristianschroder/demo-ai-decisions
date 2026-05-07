# NDA Escalation Rules

Tiered approval routing rules for NDA review and execution.

---

## Tier 1 — Auto-Approve (Legal Coordinator)

**Approver:** Legal Coordinator / Paralegal
**SLA:** 1 business day

### Criteria (ALL must be met)
- Uses a standard template without modifications
- Term within acceptable range for the template type
- Jurisdiction is Tier 1 or Tier 2 (US preferred jurisdictions)
- No indemnification above standard thresholds
- No non-standard clauses added
- Counterparty is not a competitor or government entity
- No personal data processing beyond standard scope
- Residuals clause (if present) conforms to template standard

### Auto-Approve Templates
The following may be auto-approved if unmodified:
- `mutual-general` (term ≤ 3 years, US jurisdiction)
- `one-way-vendor` (term ≤ 2 years, US jurisdiction)
- `one-way-recruitment` (term ≤ 1 year, US jurisdiction)

---

## Tier 2 — Legal Counsel Review

**Approver:** Associate General Counsel or Senior Legal Counsel
**SLA:** 3 business days

### Triggers (ANY triggers Tier 2)
- Counterparty has proposed redline modifications
- Term exceeds template standard maximum
- Non-preferred US jurisdiction (Tier 3 jurisdiction)
- Foreign jurisdiction involved
- Indemnification clause modified from standard
- Non-standard clause added by counterparty
- Counterparty is a competitor
- Financial NDA with non-standard standstill terms
- Technology NDA with modified IP protections
- Residuals clause deviates from template standard
- Government entity as counterparty
- Counterparty requests removal of standard exclusions
- Missing or weakened return/destruction clause
- Remedies clause modified to limit injunctive relief
- Deal value context exceeds $5M

### Required Documentation
- Marked-up NDA showing all deviations from standard template
- Business justification for any non-standard terms
- Counterparty background summary

---

## Tier 3 — Senior Leadership / CLO

**Approver:** Chief Legal Officer (CLO) or General Counsel
**SLA:** 5 business days

### Triggers (ANY triggers Tier 3)
- Non-compete clause included in NDA
- Unlimited or uncapped liability/indemnification
- Perpetual term (except trade secrets in employee NDA)
- Waiver of injunctive relief
- Residuals clause in financial NDA
- Unrestricted use of confidential information (no purpose limitation)
- Counterparty is a sovereign government or state-owned enterprise
- NDA involves classified or export-controlled information
- Multi-jurisdictional governing law (multiple countries)
- Deal value context exceeds $50M
- NDA forms part of a complex transaction (M&A, joint venture > $10M)
- Broad standstill in non-financial NDA

### Required Documentation
- All Tier 2 documentation
- Risk assessment memo from legal counsel
- Executive sponsor sign-off
- Board notification (if deal value > $100M)

---

## Delegation Rules

### Delegation Authority
- **CLO** may delegate Tier 3 approvals to Deputy General Counsel for NDAs with deal value < $25M
- **Associate GC** may delegate Tier 2 approvals to Senior Legal Counsel for standard redline negotiations
- **Legal Coordinator** may escalate any Tier 1 matter to Tier 2 at their discretion

### Cross-Border Delegation
- NDAs involving EU counterparties require additional review by Data Privacy Counsel
- NDAs involving China, Russia, or sanctioned jurisdictions require Export Control Officer review
- NDAs involving government entities require Government Contracts Counsel review

### Conflict of Interest
- If the approver has a personal relationship with the counterparty, the matter must be escalated one tier
- If the approver's business unit is the requesting unit, an independent legal reviewer must co-sign

---

## Business-Rule Triggers

### Automatic Escalation Rules
1. **Counterparty Revenue > $1B:** Minimum Tier 2 regardless of template
2. **Public Company Counterparty:** Minimum Tier 2 for any mutual NDA
3. **Healthcare / Pharma Industry:** Minimum Tier 2 (regulatory considerations)
4. **Financial Services Counterparty:** Minimum Tier 2 (MNPI handling)
5. **Previous Breach History:** If counterparty has known breach history, escalate to Tier 3
6. **Multiple Active NDAs with Same Counterparty:** Review for conflicts, minimum Tier 2

### Expedited Review
- **Urgent Business Need:** Tier 1 and Tier 2 matters may be expedited to same-day review with VP-level business sponsor justification
- **Board-Mandated Transactions:** Tier 3 matters may be expedited to 2-business-day review with CLO pre-approval
