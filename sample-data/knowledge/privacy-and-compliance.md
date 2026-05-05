# Privacy and Compliance

**Last Reviewed:** February 10, 2026
**Owner:** Lisa Nakamura, Chief Privacy Officer
**Approved Use:** May be referenced in RFP responses, DPA negotiations, and compliance questionnaires. Any statements about future compliance milestones (e.g., FedRAMP, CJIS) must include the caveat that timelines are subject to change.

---

## GDPR Readiness

Northstar Analytics Platform is **GDPR-ready** and provides the technical and organizational measures necessary for customers acting as data controllers to meet their obligations under the General Data Protection Regulation (EU) 2016/679.

Key GDPR capabilities:
- **Data Processing Agreement (DPA):** A GDPR-compliant DPA template is available and can be executed as part of the master subscription agreement. Custom DPA terms are negotiable with Legal review.
- **Data subject rights:** The platform supports data subject access requests (DSARs) including the right to access, rectification, erasure, and data portability. Administrative APIs enable bulk DSAR processing.
- **Lawful basis documentation:** Administrators can document the lawful basis for processing within the platform's data catalog.
- **Data Protection Impact Assessment (DPIA):** Northstar provides a DPIA template pre-populated with platform-specific information to assist customers.
- **Sub-processor list:** A current list of sub-processors is maintained and published. Customers are notified at least 30 days before any new sub-processor is engaged.

## CCPA Compliance

Northstar is **CCPA compliant** and supports customers subject to the California Consumer Privacy Act:

- **Do Not Sell:** Northstar does not sell personal information of any customer or end user
- **Consumer rights:** The platform supports consumer rights requests including the right to know, delete, and opt-out
- **Privacy notice:** Northstar's privacy notice discloses all categories of personal information collected and the purposes for which they are used
- **Service provider agreement:** Northstar operates as a service provider under CCPA and processes personal information only as directed by the customer

## Data Anonymization and Masking

Northstar provides built-in tools for protecting sensitive data:

- **Dynamic data masking:** Sensitive columns can be masked in real-time based on user role (e.g., SSN displayed as XXX-XX-1234 for non-privileged users)
- **Static anonymization:** Datasets can be anonymized for use in development, testing, or analytics environments using configurable anonymization rules (hashing, generalization, suppression)
- **Tokenization:** Sensitive values can be replaced with non-reversible tokens while preserving referential integrity across datasets
- **PII detection:** Automated scanning identifies columns likely to contain PII (names, addresses, SSNs, email addresses) and flags them for review

## Configurable Retention Policies

Data retention in Northstar is fully configurable at multiple levels:

- **Tenant-level defaults:** Administrators set default retention periods for all data within the tenant
- **Dataset-level overrides:** Individual datasets can have custom retention periods
- **Automated purge:** Data past its retention period is automatically purged from the platform, including backups, within 30 days of the retention expiration date
- **Retention hold:** Legal hold can be placed on specific datasets to prevent automated purge
- **Audit trail:** All retention policy changes and data purge actions are logged in the audit system

## CJIS Compliance

Northstar is currently **in assessment** for Criminal Justice Information Services (CJIS) compliance:

| Milestone | Status | Target Date |
|-----------|--------|-------------|
| Gap analysis | Complete | Completed Q4 2025 |
| Technical controls remediation | In progress | Q1 2026 |
| Policy and procedure documentation | In progress | Q2 2026 |
| Third-party assessment | Planned | **Q3 2026** |
| CJIS compliance certification | Planned | Q3 2026 |

**Current status:** Northstar has completed a CJIS gap analysis and is actively remediating identified technical control gaps, including enhanced background check processes for personnel with access to CJIS data and implementation of advanced auditing controls. The platform's existing security controls (encryption, MFA, audit logging) align with the majority of CJIS Security Policy requirements.

**Important:** Northstar is **not yet CJIS certified**. Proposals to CJIS-regulated customers should clearly state the current assessment status and expected certification timeline.

## Data Residency

Northstar customer data is hosted exclusively in **Microsoft Azure data centers** in the United States:

| Region | Azure Region | Purpose |
|--------|-------------|---------|
| Primary | **Azure East US 2** (Virginia) | Primary production workloads |
| Secondary | **Azure West US 2** (Washington) | Disaster recovery and geo-redundancy |

Data residency commitments:
- **No cross-border data transfers** are performed without explicit customer consent
- Customer data does not leave the United States unless the customer explicitly configures a cross-border integration
- Backups are stored in the same Azure regions as production data
- Northstar personnel access customer data only from within the United States unless otherwise agreed in writing

For customers requiring data residency in other regions (EU, Canada, Australia), Northstar is evaluating regional deployment options for 2027.

## FedRAMP

Northstar is **not currently FedRAMP certified**.

FedRAMP authorization is on the Northstar product roadmap:
- **Target:** FedRAMP Moderate authorization
- **Timeline:** Authorization process planned to begin in **2027**
- **Sponsor:** Northstar is actively seeking a federal agency sponsor
- **Current posture:** Many of Northstar's existing security controls align with NIST 800-53 Rev 5 (the control framework underlying FedRAMP), but a full assessment and remediation cycle is required

**Important:** Northstar should not be positioned as FedRAMP compliant or "FedRAMP ready" in proposals. The accurate statement is that FedRAMP authorization is planned for 2027.

---

## Constraints and Caveats

- GDPR readiness means Northstar provides the technical controls and contractual terms necessary to support customer compliance. Northstar does not guarantee customer compliance with GDPR, as compliance depends on the customer's own data processing practices.
- CJIS compliance is expected in Q3 2026 but timelines are subject to change based on assessment findings and remediation progress.
- FedRAMP authorization is planned for 2027 but has not yet entered the formal authorization process. No commitment to a specific authorization date should be made.
- Data residency commitments apply to the Northstar cloud platform. Customers who export data or configure integrations that send data outside the platform are responsible for their own data residency compliance.
- The DPA template is designed for standard engagements. Highly customized DPA terms may require extended Legal review (typically 2–4 weeks).

---

## Suggested RFP Response Language

> Northstar Analytics Platform is GDPR-ready and CCPA compliant, with built-in data anonymization, dynamic masking, and configurable retention policies. A GDPR-compliant Data Processing Agreement (DPA) template is available. Customer data is hosted exclusively in US-based Microsoft Azure data centers (East US 2 and West US 2), with no cross-border data transfers without explicit consent. CJIS compliance assessment is in progress with certification expected in Q3 2026. FedRAMP Moderate authorization is planned for 2027. Northstar provides automated PII detection, tokenization, and data subject rights support to assist customers in meeting their regulatory obligations.
