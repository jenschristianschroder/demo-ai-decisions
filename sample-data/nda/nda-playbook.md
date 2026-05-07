# NDA Playbook — Clause-by-Clause Standards

This playbook defines acceptable ranges, standard positions, and escalation thresholds for NDA clauses across all template variants.

---

## 1. Definition of Confidential Information

### Standard Position
- Must include a comprehensive list of information categories
- Must explicitly include "information marked as Confidential"
- Should include catch-all language for unmarked information disclosed in circumstances indicating confidentiality

### Acceptable Variations
- **Mutual NDAs:** Symmetric definitions for both parties
- **One-Way NDAs:** Definition focused on disclosing party's information only
- **Technology NDAs:** Must explicitly list: source code, algorithms, APIs, architecture diagrams, data models
- **Financial NDAs:** Must explicitly list: financial statements, projections, cap tables, MNPI

### Escalation Triggers
- ⚠️ Definition is overly narrow (excludes key information categories) → Tier 1
- ⚠️ Definition is overly broad (could capture publicly available information) → Tier 1
- 🔴 No definition of confidential information → Tier 2

---

## 2. Exclusions from Confidential Information

### Standard Position (5 standard exclusions)
1. Publicly available information
2. Prior knowledge (with documentation requirement)
3. Independent development (without reference to confidential info)
4. Third-party lawful receipt
5. Legal compulsion (with notice requirement)

### Acceptable Variations
- Notice period for legal compulsion: 5–15 business days
- Documentation standard for prior knowledge: "written records" or "contemporaneous records"

### Escalation Triggers
- ⚠️ Fewer than 4 standard exclusions → Tier 1
- ⚠️ No legal compulsion exclusion → Tier 1
- 🔴 Fewer than 3 standard exclusions → Tier 2

---

## 3. Term and Duration

### Acceptable Ranges by Template

| Template | Acceptable Term | Default | Maximum |
|---|---|---|---|
| mutual-general | 1–3 years | 2 years | 5 years |
| mutual-technology | 2–5 years | 3 years | 7 years |
| mutual-financial | 2–3 years | 3 years | 5 years |
| one-way-vendor | 1–3 years | 2 years | 5 years |
| one-way-employee | Indefinite (trade secrets) + 2–5 years (other) | 3 years post-termination | Indefinite |
| one-way-recruitment | 6 months – 1 year | 1 year | 2 years |

### Survival Period
- Standard: Same as term duration
- Technology templates: May be indefinite for trade secrets
- Minimum survival: 1 year

### Escalation Triggers
- ⚠️ Term exceeds template maximum → Tier 1
- ⚠️ No survival period specified → Tier 1
- 🔴 Term exceeds 7 years for any template → Tier 2
- 🔴 Perpetual/indefinite term (except trade secrets in employee NDA) → Tier 3

---

## 4. Governing Law and Jurisdiction

### Preferred Jurisdictions
- **Tier 1 (Preferred):** New York, Delaware, California
- **Tier 2 (Acceptable):** Illinois, Texas, Massachusetts, Washington
- **Tier 3 (Requires Review):** Any other US state
- **Tier 4 (Requires Senior Approval):** Foreign jurisdictions

### Standard Position
- Governing law and jurisdiction should match
- Exclusive jurisdiction preferred over non-exclusive

### Escalation Triggers
- ⚠️ Non-preferred US jurisdiction → Tier 1
- 🔴 Foreign jurisdiction → Tier 2
- 🔴 No governing law specified → Tier 2
- 🔴 Arbitration clause (non-standard for NDAs) → Tier 2

---

## 5. Scope of Use Restriction

### Standard Position
- Confidential information must be used "solely for the Purpose"
- Purpose must be clearly defined

### Acceptable Variations
- Purpose may reference a separate agreement (e.g., MSA, SOW)
- Purpose may be described generally if sufficiently clear

### Escalation Triggers
- ⚠️ No clear purpose limitation → Tier 1
- 🔴 Unrestricted use of confidential information → Tier 3

---

## 6. Indemnification

### Standard Position by Template

| Template | Indemnification | Standard |
|---|---|---|
| mutual-general | Optional | Not typically included |
| mutual-technology | Required | Receiving party indemnifies for breach |
| mutual-financial | Required | Including securities law violations |
| one-way-vendor | Required | Vendor indemnifies for unauthorized disclosure |
| one-way-employee | Not included | Covered by employment agreement |
| one-way-recruitment | Not included | Not appropriate for candidates |

### Escalation Triggers
- ⚠️ Indemnification cap below $500,000 → Tier 1
- ⚠️ Mutual indemnification in one-way NDA → Tier 1
- 🔴 Unlimited indemnification in favor of counterparty only → Tier 2

---

## 7. Residuals Clause

### Standard Position

| Template | Residuals | Notes |
|---|---|---|
| mutual-general | Permitted | Standard residuals clause |
| mutual-technology | Restricted | Excludes source code, algorithms, data models |
| mutual-financial | Not permitted | No residuals for financial/MNPI data |
| one-way-vendor | Permitted | Standard residuals clause |
| one-way-employee | Not applicable | N/A for employee NDAs |
| one-way-recruitment | Not applicable | N/A for recruitment NDAs |

### Escalation Triggers
- ⚠️ Broad residuals in technology NDA (includes source code) → Tier 2
- 🔴 Residuals clause in financial NDA → Tier 3

---

## 8. Return/Destruction of Materials

### Standard Position
- Return or destruction within 10–15 business days
- Written certification of destruction required
- Exception for legally required retention

### Escalation Triggers
- ⚠️ No destruction certification requirement → Tier 1
- ⚠️ Return period exceeds 30 days → Tier 1
- 🔴 No return/destruction clause → Tier 2

---

## 9. Remedies

### Standard Position
- Equitable relief (injunction, specific performance) available
- No requirement to prove actual damages for injunctive relief
- No bond requirement for injunctive relief

### Acceptable Variations
- Monetary damages also available
- May reference liquidated damages

### Escalation Triggers
- ⚠️ Remedies limited to monetary damages only → Tier 1
- 🔴 Limitation of liability on NDA breach → Tier 2
- 🔴 Waiver of injunctive relief → Tier 3

---

## 10. Non-Solicitation / Non-Compete

### Standard Position
- NDAs should NOT contain non-compete clauses
- Non-solicitation may be referenced but not defined in NDA (belongs in employment/consulting agreement)
- Financial NDAs may contain a standstill provision (specific to M&A context)

### Escalation Triggers
- ⚠️ Non-solicitation clause in NDA (rather than by reference) → Tier 1
- 🔴 Non-compete clause in NDA → Tier 3
- 🔴 Broad standstill in non-financial NDA → Tier 2
