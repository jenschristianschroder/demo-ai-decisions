# NDA Template Catalog

This catalog describes all available NDA templates. Use this document to determine which template best fits a given disclosure scenario.

---

## Template: mutual-general

- **Name:** Mutual NDA — General Commercial
- **Type:** Mutual (both parties exchange confidential information)
- **Intended Use Case:** Standard mutual NDA for general commercial discussions such as partnership exploration, joint ventures, co-marketing, distribution agreements, or preliminary business evaluations.
- **Key Differentiators:** Balanced obligations for both parties; broad definition of confidential information covering business, financial, and operational data; standard residuals clause; standard remedies.
- **Default Jurisdictions:** New York, NY
- **Typical Term Range:** 1–3 years (default: 2 years)
- **Survival Period:** 2 years
- **When to Use:** Use when both parties will share general business information and neither party's disclosure is predominantly technical, financial, or employment-related. Best for exploratory business conversations.
- **When NOT to Use:** Do not use when sharing source code, algorithms, or technical IP (use mutual-technology instead). Do not use for M&A, investment, or financial due diligence (use mutual-financial instead). Do not use for one-way disclosures to vendors, employees, or candidates.

---

## Template: mutual-technology

- **Name:** Mutual NDA — Technology & IP
- **Type:** Mutual
- **Intended Use Case:** Technology partnerships, joint development projects, API integrations, software evaluations, technical proof-of-concepts, or any scenario involving the exchange of source code, algorithms, architecture diagrams, or technical specifications.
- **Key Differentiators:** Enhanced IP protections; explicit no-reverse-engineering clause; no-derivative-works clause; detailed security requirements (AES-256 encryption, RBAC, MFA, audit logging); narrower residuals clause excluding source code and algorithms; indemnification clause; longer default term.
- **Default Jurisdictions:** San Francisco, CA (California law)
- **Typical Term Range:** 2–5 years (default: 3 years)
- **Survival Period:** 3 years (indefinite for trade secrets)
- **When to Use:** Use when either party will share technical information such as source code, APIs, algorithms, data models, system architecture, or technical documentation. Essential when IP ownership must be clearly preserved.
- **When NOT to Use:** Do not use for purely commercial discussions without technical content (use mutual-general). Do not use for financial due diligence or M&A (use mutual-financial).

---

## Template: mutual-financial

- **Name:** Mutual NDA — Financial Due Diligence / M&A
- **Type:** Mutual
- **Intended Use Case:** M&A exploratory discussions, investment due diligence, private equity evaluations, strategic acquisitions, joint venture financial assessments, or any scenario involving the exchange of financial statements, valuations, or material non-public information (MNPI).
- **Key Differentiators:** Standstill provision; securities law compliance (MNPI handling); no residuals clause; stricter return/destruction requirements (10 business days); no-contact provision for employees/customers; indemnification covering securities law violations; Delaware governing law.
- **Default Jurisdictions:** Wilmington, DE (Delaware law)
- **Typical Term Range:** 2–3 years (default: 3 years)
- **Survival Period:** 3 years
- **When to Use:** Use when either party will share financial data including revenue, EBITDA, projections, cap tables, or when the purpose involves evaluating a merger, acquisition, or investment. Required when MNPI may be disclosed.
- **When NOT to Use:** Do not use for general commercial discussions (use mutual-general). Do not use for technical partnerships (use mutual-technology). The standstill provision may be inappropriate for non-M&A contexts.

---

## Template: one-way-vendor

- **Name:** One-Way NDA — Vendor / Supplier
- **Type:** One-Way (company discloses to vendor)
- **Intended Use Case:** Sharing confidential information with vendors, suppliers, service providers, or contractors during procurement, RFP responses, implementation projects, or ongoing service delivery.
- **Key Differentiators:** One-way protection (company discloses, vendor receives); subcontractor restriction; audit rights for the disclosing party; data handling jurisdiction requirements; indemnification for unauthorized disclosure.
- **Default Jurisdictions:** New York, NY
- **Typical Term Range:** 1–3 years (default: 2 years)
- **Survival Period:** 3 years
- **When to Use:** Use when your organization needs to share confidential information with an external vendor or supplier and the vendor will not be sharing its own confidential information with you.
- **When NOT to Use:** Do not use when both parties will share confidential information (use a mutual NDA instead). Do not use for employees or contractors who are joining the company (use one-way-employee).

---

## Template: one-way-employee

- **Name:** One-Way NDA — Employee / Contractor / Consultant
- **Type:** One-Way (company discloses to individual)
- **Intended Use Case:** Protecting confidential information shared with employees, contractors, or consultants who are joining a project or team. Typically signed at the start of employment or engagement.
- **Key Differentiators:** Individual-focused (natural person as recipient); indefinite term for trade secrets; references to invention assignment and non-solicitation agreements; covers information the recipient "should know" is confidential; broader company-side protections.
- **Default Jurisdictions:** New York, NY
- **Typical Term Range:** Trade secrets: indefinite; other info: 3 years post-termination
- **Survival Period:** 3 years (indefinite for trade secrets)
- **When to Use:** Use when onboarding an employee, contractor, or consultant who will have access to company confidential information during their engagement.
- **When NOT to Use:** Do not use for external vendors or companies (use one-way-vendor or mutual NDAs). Do not use for recruitment candidates who have not yet been hired (use one-way-recruitment).

---

## Template: one-way-recruitment

- **Name:** One-Way NDA — Recruitment / Interview
- **Type:** One-Way (company discloses to candidate)
- **Intended Use Case:** Protecting information shared during the interview and recruitment process, including role details, compensation structures, team information, and any technical or business problems presented during assessments.
- **Key Differentiators:** Lightest-weight NDA; short term (1 year); explicitly states no employment obligation and no non-compete implications; limited scope focused on interview-process information; simple return-of-materials clause.
- **Default Jurisdictions:** New York, NY
- **Typical Term Range:** 6 months – 1 year (default: 1 year)
- **Survival Period:** Co-terminus with term
- **When to Use:** Use during the hiring process when candidates will be exposed to confidential information during interviews, technical assessments, or case studies.
- **When NOT to Use:** Do not use for employees who have been hired (use one-way-employee). Do not use for external vendors (use one-way-vendor). Should not be used if extensive proprietary information is being shared — consider a more comprehensive NDA.

---

## Selection Decision Tree

1. **Will both parties share confidential information?**
   - Yes → Mutual NDA → Go to step 2
   - No → One-Way NDA → Go to step 3

2. **What type of information will be shared?**
   - Technical (source code, APIs, algorithms, architecture) → **mutual-technology**
   - Financial (financials, valuations, MNPI, M&A) → **mutual-financial**
   - General business (strategy, partnerships, operations) → **mutual-general**

3. **Who is the recipient?**
   - External vendor or supplier → **one-way-vendor**
   - Employee, contractor, or consultant being onboarded → **one-way-employee**
   - Job candidate in interview process → **one-way-recruitment**
