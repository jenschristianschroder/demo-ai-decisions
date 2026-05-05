# Security Overview

**Last Reviewed:** January 28, 2026
**Owner:** David Park, Chief Information Security Officer (CISO)
**Approved Use:** May be shared with prospects, security review teams, and procurement offices. Full security documentation packages (including penetration test executive summaries) are available under NDA upon request.

---

## Authentication

### Single Sign-On (SSO)
Northstar supports enterprise SSO integration via:
- **SAML 2.0** — Certified with Okta, Azure AD (Entra ID), PingFederate, and ADFS. Custom SAML IdP configurations are supported.
- **OpenID Connect (OIDC)** — Certified with Okta, Azure AD (Entra ID), and Auth0. Standard OIDC Discovery is supported for other providers.

SSO is available on all tiers. Customers may enforce SSO-only authentication, disabling local username/password login.

### Multi-Factor Authentication (MFA)
- Built-in MFA using TOTP (Google Authenticator, Microsoft Authenticator, Authy)
- SMS-based MFA available but not recommended as primary factor
- MFA can be enforced at the tenant level or per user role
- When SSO is configured, MFA is typically managed by the customer's identity provider

### Session Management
- Configurable session timeout (default: 30 minutes idle, 8 hours absolute)
- Concurrent session limits configurable per role
- Session revocation available via admin console and API

## Encryption

### Data at Rest
- **AES-256** encryption for all data stored in the Northstar platform
- Encryption keys managed via **Azure Key Vault** with customer-managed key (CMK) option available on Enterprise tier
- Database backups are encrypted using the same AES-256 standard
- Temporary query result caches are encrypted at rest

### Data in Transit
- **TLS 1.3** enforced for all client-to-server and server-to-server communications
- TLS 1.2 is supported for backward compatibility with legacy clients but TLS 1.3 is preferred and negotiated by default
- Certificate management is automated via Azure-managed certificates
- Internal service-to-service communication within the platform uses mutual TLS (mTLS)

## Penetration Testing

Northstar engages **NCC Group**, an independent third-party security firm, to conduct annual penetration testing of the platform. The testing program includes:

- **External network penetration testing** of all internet-facing endpoints
- **Web application penetration testing** of the Northstar user interface and APIs
- **API security testing** including authentication bypass, injection, and authorization flaws
- **Cloud infrastructure review** of the Azure environment configuration

The most recent penetration test was completed in **October 2025**. Executive summaries of penetration test results are available under NDA. Full detailed reports are not shared externally.

Northstar also maintains a **continuous vulnerability scanning** program using automated tools (Qualys, Snyk) with weekly scans of production infrastructure and application dependencies.

## Compliance Certifications

| Certification | Status | Last Audit | Next Audit |
|--------------|--------|------------|------------|
| SOC 2 Type II | **Certified** | August 2025 | August 2026 |
| SOC 2 Type I | Certified (superseded by Type II) | — | — |

The SOC 2 Type II audit covers the Security, Availability, and Confidentiality trust service criteria. The audit is conducted by **Deloitte** and covers a 12-month observation period.

SOC 2 Type II reports are available to customers and prospects under NDA.

## VPAT (Voluntary Product Accessibility Template)

A current **VPAT** based on the WCAG 2.1 Level AA standard is on file and available upon request. See the Accessibility knowledge article for full details.

## Audit Logging

Northstar maintains comprehensive audit logs covering:

- **User authentication events** — login, logout, failed login, MFA challenge, SSO assertions
- **Data access events** — queries executed, datasets accessed, reports viewed, exports performed
- **Administrative actions** — user provisioning, role changes, security configuration changes, data source connections
- **System events** — scheduled job execution, API calls, integration activity

Audit log details:
- **Retention period:** 3 years (rolling)
- **Format:** Structured JSON
- **Export:** Audit logs can be exported to customer SIEM systems via Syslog (CEF format) or REST API
- **Immutability:** Audit logs are stored in append-only storage and cannot be modified or deleted by any user, including administrators
- **Search:** Full-text search and filtering available in the admin console

## Incident Response and Breach Notification

Northstar maintains a formal Incident Response Plan (IRP) that is reviewed and tested annually. Key commitments:

- **Breach notification:** Northstar will notify affected customers within **24 hours** of confirming a data breach involving customer data, per Northstar's Data Breach Notification Policy
- **Incident communication:** Dedicated incident communication channel provided to affected customers during active incidents
- **Post-incident review:** Root cause analysis (RCA) reports are provided within 10 business days of incident resolution
- **Regulatory notification:** Northstar will cooperate with customer obligations to notify regulators and data subjects as required by applicable law

## Customer Security Audits

Northstar permits customers to conduct security audits or assessments of the platform under the following terms:

- **Notice period:** Minimum **30 calendar days** written notice required
- **Scope:** Audits may cover security controls, compliance documentation, and operational procedures. Direct access to production infrastructure is not permitted.
- **Frequency:** One audit per customer per 12-month period (additional audits subject to mutual agreement)
- **Cost:** Northstar bears the cost of staff time for audits of reasonable scope (up to 3 business days). Extended audits may be subject to a professional services fee.
- **Confidentiality:** Audit findings must be treated as Northstar confidential information

---

## Constraints and Caveats

- Customer-managed encryption keys (CMK) are available only on the Enterprise tier and require the customer to maintain their own Azure Key Vault instance.
- Penetration test executive summaries are shared under NDA only. Full detailed reports are never shared externally.
- The 24-hour breach notification commitment applies to confirmed breaches involving customer data. Suspected incidents that are under investigation are communicated as soon as practicable but are not subject to the 24-hour commitment.
- Security audit access does not include direct access to production systems, source code, or other customers' data.
- SOC 2 reports cover the Northstar cloud platform only. Customers deploying Northstar on-premises are responsible for their own infrastructure security controls.

---

## Suggested RFP Response Language

> Northstar Analytics Platform employs enterprise-grade security controls including SAML 2.0 and OpenID Connect SSO, multi-factor authentication, AES-256 encryption at rest, and TLS 1.3 encryption in transit. The platform is SOC 2 Type II certified (audited by Deloitte) and undergoes annual penetration testing by NCC Group. Comprehensive audit logs are retained for 3 years and can be exported to customer SIEM systems. Northstar commits to breach notification within 24 hours of confirmation and permits customer security audits with 30 days' notice. A current VPAT is available upon request.
