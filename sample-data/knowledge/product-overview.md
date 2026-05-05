# Northstar Analytics Platform — Product Overview

**Last Reviewed:** January 15, 2026
**Owner:** Sarah Chen, Chief Product Officer
**Approved Use:** May be shared with prospects, included in RFP responses, and referenced in marketing materials. Specific performance benchmarks should be validated with Engineering before inclusion in contractual commitments.

---

## Platform Summary

The Northstar Analytics Platform is an enterprise-grade business intelligence and reporting solution purpose-built for organizations that require scalable, secure, and user-friendly analytics. Current production version: **8.2**.

Northstar is delivered as a **multi-tenant cloud** application hosted on Microsoft Azure. On-premises and hybrid deployment models are available for Enterprise-tier customers upon request.

The platform is **SOC 2 Type II certified** and undergoes annual audit cycles to maintain certification.

## Core Capabilities

### Interactive Dashboards
Drag-and-drop dashboard builder with 40+ visualization types including charts, maps, pivot tables, and KPI scorecards. Dashboards support drill-down, cross-filtering, and dynamic parameter controls. Users can create personal dashboards or publish to shared workspaces with role-based permissions.

### Ad-Hoc Query Builder
Business users can build queries without writing SQL using the visual query designer. Power users have access to a full SQL editor with syntax highlighting, auto-complete, and query history. Query results can be exported or saved as reusable datasets.

### Natural Language Query (NLQ)
Northstar's NLQ engine allows users to ask questions in plain English (e.g., "Show me revenue by region for the last 6 months") and receive instant visualizations. NLQ leverages a semantic model that administrators configure to map business terminology to data structures. Supported in English; Spanish and French language packs are in beta as of v8.2.

### Scheduled Reports
Reports can be scheduled for automatic generation and delivery via email (PDF, Excel, CSV) or published to shared file systems (SFTP, SharePoint, S3). Scheduling supports cron-style expressions, business-calendar awareness, and conditional delivery (e.g., only send if data threshold is met).

### Embedded Analytics API
The Embedded Analytics API enables customers to integrate Northstar visualizations and dashboards directly into their own applications. The API supports iframe embedding, JavaScript SDK integration, and server-side rendering for PDF export. Full theming and white-labeling are supported.

### White-Labeling
Enterprise customers can fully white-label the Northstar platform, including custom logos, color schemes, login pages, email templates, and URL domains. White-labeling is configured at the tenant level and requires no custom code.

## Performance and Scalability

- **Concurrent Users:** The platform supports **500+ concurrent users** per tenant with standard resource allocation. Higher concurrency (up to 2,000 users) is available with dedicated compute tier.
- **Real-Time Data Refresh:** Data refresh intervals of **under 5 minutes** for connected data sources. Near-real-time streaming is available via the Kafka connector (currently in beta; GA planned for v8.3).
- **Query Performance:** P95 query response time is under 3 seconds for datasets up to 500 million rows when using the Northstar optimized data store.

## Access Control

Role-based access control (RBAC) is built into every layer of the platform:
- **Object-Level Security:** Control who can view, edit, or share dashboards, reports, and datasets.
- **Row-Level Security:** Dynamically filter data based on user attributes (department, region, role).
- **Column-Level Security:** Mask or hide sensitive columns based on user permissions.
- **Workspace Isolation:** Multi-tenant architecture ensures complete data isolation between customer tenants.

## Version History

| Version | Release Date | Key Features |
|---------|-------------|--------------|
| 8.2 | November 2025 | NLQ improvements, column-level security, API v3 |
| 8.1 | June 2025 | Embedded analytics SDK, white-label enhancements |
| 8.0 | January 2025 | Platform re-architecture, RBAC overhaul |
| 7.x | 2023–2024 | Legacy; end-of-support December 2026 |

---

## Constraints and Caveats

- NLQ accuracy depends on the quality of the configured semantic model. Customers should plan for 2–4 weeks of semantic model tuning during implementation.
- The 500+ concurrent user figure assumes standard dashboard usage patterns. Heavy ad-hoc query workloads may require dedicated compute resources.
- Real-time refresh under 5 minutes applies to direct-connect data sources. Imported/cached datasets have separate refresh schedules.
- White-labeling is available only on the Enterprise tier.
- On-premises deployment requires a minimum infrastructure footprint and is subject to a separate pricing model.

---

## Suggested RFP Response Language

> Northstar Analytics Platform (v8.2) is a SOC 2 Type II certified, multi-tenant cloud analytics solution supporting interactive dashboards, ad-hoc queries, natural language query, scheduled reporting, and embedded analytics. The platform supports 500+ concurrent users with role-based access control at the object, row, and column levels. Data refresh intervals are under 5 minutes for connected sources. White-labeling and embedded analytics APIs enable seamless integration into customer-facing applications. The platform is hosted on Microsoft Azure with enterprise-grade security and scalability.
