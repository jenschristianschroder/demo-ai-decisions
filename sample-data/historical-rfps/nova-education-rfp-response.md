# RFP Response: Nova Education Consortium
## Student Analytics and Institutional Effectiveness Platform

**Submitted by:** Northstar Analytics, Inc.
**Date:** January 12, 2024
**RFP Reference:** NEC-2024-003
**Contact:** Sarah Chen, VP of Sales
**Email:** sarah.chen@northstaranalytics.com
**Phone:** (612) 555-0142

**Outcome:** ✅ WON — Contract awarded February 28, 2024 (with lessons learned)

---

## Table of Contents

1. Executive Summary
2. Company Overview
3. Understanding of Requirements
4. Technical Solution
5. FERPA Compliance and Data Privacy
6. Implementation Plan
7. Support and Training
8. Pricing
9. References

---

## 1. Executive Summary

Northstar Analytics is pleased to submit this proposal in response to the Nova Education
Consortium's RFP for a Student Analytics and Institutional Effectiveness Platform. NEC
comprises 5 community colleges and 2 regional universities serving over 45,000 students
across a tri-state region.

We understand that NEC seeks a unified analytics platform to:

- Track student enrollment; retention; and completion metrics across all 7 institutions
- Provide early alert capabilities for at-risk students
- Support institutional effectiveness and accreditation reporting
- Enable data-driven decision-making for academic program planning
- Comply with FERPA requirements and state education data privacy laws

Our proposed Northstar Education Analytics Platform (EAP) brings our proven analytics
capabilities to the higher education sector with purpose-built modules for student
success; enrollment management; and institutional research. We have partnered with
EduTech Consulting — a recognized leader in higher education data strategy — to provide
domain expertise for this engagement.

We propose an aggressive 12-week implementation timeline to meet NEC's requirement
of going live before the fall semester registration period.

---

## 2. Company Overview

### About Northstar Analytics

- **Founded:** 2015
- **Headquarters:** Minneapolis, MN
- **Employees:** 285
- **Annual Revenue:** $42M (FY2023)
- **Education Sector Clients:** 2 (K-12 and workforce development)
- **SOC 2 Type II Certified:** Yes

### Education Practice

Our education analytics practice supports:

- Lakewood School District — K-12 student performance analytics
- Statewide Workforce Development Board — training program outcomes tracking

For this engagement we have partnered with EduTech Consulting to augment our team
with higher education domain expertise. EduTech has supported analytics initiatives
at 25+ colleges and universities.

### Subcontractor: EduTech Consulting

- **Founded:** 2012
- **Specialty:** Higher education data strategy and institutional research
- **Clients:** 25+ colleges and universities
- **Key Personnel for NEC:** Dr. Rachel Torres (former VP of Institutional Research
  at a state university system)

---

## 3. Understanding of Requirements

### 3.1 Student Success Analytics

- Enrollment funnel tracking from inquiry through graduation
- Retention and persistence rate analysis by demographics; program; and institution
- Early alert system using predictive modeling to identify at-risk students
- Course success rates and DFW (D grade; F grade; Withdrawal) analysis
- Advising caseload management with student risk dashboard

### 3.2 Enrollment Management

- Application and admissions pipeline visualization
- Yield prediction modeling
- Financial aid impact analysis on enrollment decisions
- Course demand forecasting for schedule planning
- Cross-institution enrollment patterns for consortium optimization

### 3.3 Institutional Effectiveness

- Accreditation reporting data preparation (HLC; SACSCOC alignment)
- Program review metrics with benchmarking
- Faculty workload and student-to-faculty ratio analysis
- IPEDS reporting data validation and submission support
- Strategic plan KPI tracking and progress dashboards

### 3.4 Financial and Operational Analytics

- Tuition revenue forecasting
- Cost per student credit hour by program
- Space utilization analysis
- Auxiliary services performance (bookstore; dining; housing)

---

## 4. Technical Solution

### 4.1 Architecture

The Northstar EAP is built on our core analytics platform with education-specific
extensions:

- **Student Data Hub:** Centralized repository for student records from multiple
  SIS platforms with identity resolution across institutions
- **Integration Layer:** Pre-built connectors for Banner; Colleague; PeopleSoft;
  and Canvas LMS; plus SIS-agnostic flat file ingestion
- **Analytics Engine:** Configurable cohort definitions; IPEDS-aligned calculations;
  and predictive models
- **Visualization Layer:** Role-based dashboards for presidents; deans; department
  chairs; advisors; and institutional researchers

### 4.2 SIS Integration

| System | Institution(s) | Integration Method |
|--------|---------------|-------------------|
| Ellucian Banner | 4 community colleges | Banner Integration API |
| Ellucian Colleague | 1 community college | Colleague Web API |
| PeopleSoft Campus Solutions | 2 universities | Integration Broker |
| Canvas LMS | All 7 institutions | Canvas Data 2 API |

### 4.3 Pre-Built Education Analytics

- **Retention Model:** Random forest model trained on 500K+ student records with
  demonstrated prediction accuracy of 78% for first-year retention
- **IPEDS Data Validator:** Automated cross-checks against IPEDS submission
  requirements with error flagging
- **Cohort Builder:** Flexible student cohort definition tool supporting IPEDS;
  state; and custom cohort definitions
- **Benchmark Comparisons:** Integration with IPEDS peer comparison data

### 4.4 Early Alert System

The early alert module identifies students showing risk indicators:

- Declining grades (based on LMS gradebook data)
- Missed assignments (Canvas integration)
- Attendance patterns (where tracked)
- Financial holds or aid status changes
- Demographic and historical risk factors

Alerts are delivered to advisors via dashboard; email; and optional SMS notifications.

---

## 5. FERPA Compliance and Data Privacy

### 5.1 FERPA Compliance Framework

Northstar Analytics understands the critical importance of FERPA compliance when
handling student education records. Our platform and processes are designed to
ensure compliance with the Family Educational Rights and Privacy Act (20 U.S.C.
§ 1232g; 34 CFR Part 99).

### 5.2 Designation as School Official

Northstar Analytics will function as a "school official" with "legitimate educational
interests" under FERPA. We will:

- Execute appropriate data sharing agreements with each NEC institution
- Limit access to education records to personnel with legitimate need
- Use education records solely for the purposes specified in the agreement
- Not disclose education records to third parties without consent
- Return or destroy education records upon contract termination

### 5.3 Technical Controls for FERPA

| Control | Implementation |
|---------|---------------|
| Access Control | Role-based access enforcing legitimate educational interest |
| Directory Information | Configurable directory information flags per institution policy |
| Audit Logging | Complete audit trail of all access to student records |
| De-identification | Automated suppression of cells with fewer than 5 students in reports |
| Data Minimization | Collection limited to fields necessary for analytics purposes |
| Consent Management | Tracking of student consent for optional data sharing |

### 5.4 State Privacy Law Compliance

In addition to FERPA we will comply with applicable state student data privacy laws
in all three states where NEC institutions operate. Our legal team has reviewed
the relevant statutes and confirmed platform compliance.

### 5.5 Data Governance

- Joint data governance committee with NEC representation
- Data classification framework (public; internal; confidential; restricted)
- Annual privacy impact assessment
- Data retention and disposal procedures aligned with NEC policies
- Incident response plan with FERPA breach notification procedures

---

## 6. Implementation Plan

### 6.1 Timeline (12 Weeks)

| Phase | Duration | Key Activities |
|-------|----------|----------------|
| Discovery | Week 1-2 | SIS data assessment; stakeholder interviews; governance setup |
| Integration | Weeks 3-6 | SIS and LMS connectors; data validation; identity resolution |
| Build | Weeks 5-9 | Dashboard development; early alert configuration; IPEDS validators |
| Test | Weeks 8-10 | Data accuracy validation; UAT with IR offices; performance testing |
| Train | Weeks 10-11 | Role-based training; administrator training; documentation |
| Go-Live | Week 12 | Phased rollout by institution; hypercare support |

### 6.2 Project Team

| Role | Resource | Organization | Allocation |
|------|----------|-------------|------------|
| Project Manager | Lisa Fernandez | Northstar | 100% |
| Solution Architect | Raj Mehta | Northstar | 50% |
| Higher Ed Domain Lead | Dr. Rachel Torres | EduTech | 75% |
| Data Engineer | Carlos Reyes | Northstar | 100% |
| Dashboard Developer | Yuki Tanaka | Northstar | 100% |
| QA Analyst | Kevin Cho | Northstar | 50% |
| SIS Integration Specialist | Mark Stevens | EduTech | 100% |

### 6.3 Implementation Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 12-week timeline is aggressive | High | High | Parallel workstreams; experienced SIS integrators; weekly risk reviews |
| Multiple SIS platforms increase complexity | Medium | High | Pre-built connectors; dedicated integration specialist per SIS |
| Data quality varies across institutions | Medium | Medium | Early data profiling; institution-specific validation rules |
| Stakeholder alignment across 7 institutions | Medium | Medium | Governance committee; institution champions; regular communication |
| FERPA compliance review delays | Low | High | Engage legal counsel in Week 1; use template agreements |

---

## 7. Support and Training

### 7.1 Service Level Agreement

| Metric | Target |
|--------|--------|
| Platform Availability | 99.9% (excluding scheduled maintenance) |
| Severity 1 Response | 1 hour |
| Severity 2 Response | 4 hours |
| Severity 3 Response | 1 business day |
| Scheduled Maintenance Window | Sundays 2-6 AM ET |

### 7.2 Training Program

- **IR Analysts Training:** 3-day intensive for institutional research staff
- **Administrator Training:** 2-day training for IT and system administrators
- **Executive Dashboard Training:** Half-day session for presidents and VPs
- **Advisor Training:** 1-day training on early alert system and student dashboards
- **Self-Paced Learning:** Online training library with 30+ modules
- **Annual Training Refresh:** Included in support agreement

### 7.3 Ongoing Services

- IPEDS submission support each reporting cycle
- Annual measure definition updates
- Predictive model retraining with current year data
- Quarterly business reviews with consortium analytics committee

---

## 8. Pricing

### 8.1 Pricing Summary

| Component | Year 1 | Year 2 | Year 3 |
|-----------|--------|--------|--------|
| Platform License (7 institutions; up to 500 users) | $240,000 | $240,000 | $240,000 |
| Implementation Services (Northstar) | $145,000 | — | — |
| Implementation Services (EduTech subcontract) | $85,000 | — | — |
| Training | $20,000 | $8,000 | $8,000 |
| Premium Support | $45,000 | $45,000 | $45,000 |
| **Total** | **$535,000** | **$293,000** | **$293,000** |

### 8.2 Three-Year Total: $1,121,000

### 8.3 Consortium Discount

The pricing above reflects a 15% consortium discount applied to the platform license
based on the commitment of all 7 institutions. Individual institution pricing is
available upon request.

---

## 9. References

### Reference 1: Lakewood School District

- **Contact:** Dr. Maria Gonzalez; Superintendent
- **Deployment:** Student Performance Analytics Platform
- **Duration:** 18 months in production
- **Relevance:** Demonstrates our ability to handle student data with FERPA compliance

### Reference 2: Statewide Workforce Development Board

- **Contact:** Thomas Reed; Executive Director
- **Deployment:** Training Outcomes Analytics
- **Duration:** 12 months in production
- **Relevance:** Multi-site deployment with data integration across 15 workforce centers

### Reference 3: City of Lakes Municipal Authority

- **Contact:** Michael Torres; CIO
- **Deployment:** Unified Reporting Platform
- **Duration:** 9 months in production
- **Relevance:** Demonstrates complex multi-department analytics deployment

---

## Post-Award Notes (Internal)

### Win Analysis

**Why we won:**
- Partnership with EduTech Consulting provided credible higher education domain expertise
- Consortium pricing model was 20% below the nearest competitor
- Our early alert system demo was well received by student affairs stakeholders
- FERPA compliance documentation was thorough and addressed all evaluator questions
- Strong references from Lakewood School District (education sector) built confidence

**Evaluation scoring (from post-award debrief):**
- Technical Capability: 85/100
- Education Domain Expertise: 79/100 (EduTech partnership helped significantly)
- Implementation Approach: 74/100 (timeline concerns noted)
- Price: 94/100
- Overall: 83/100

### Lessons Learned — Critical

**Timeline risk materialized:**
The 12-week implementation timeline was identified as high risk in our proposal and
this risk did materialize. Key issues during implementation:

1. Banner integration for 2 colleges took 3 additional weeks due to customized
   configurations not documented by the institutions
2. Identity resolution across 7 institutions required more complex matching logic
   than anticipated (students enrolled at multiple institutions with different IDs)
3. Data quality issues at one community college required a 2-week remediation effort
   before analytics could be validated

**Actual timeline: 18 weeks (6 weeks over the 12-week commitment)**

The delay meant the platform was not fully operational for fall registration as
promised. A reduced-functionality version with enrollment dashboards was available
on time but the early alert system and predictive models went live 6 weeks late.

**Impact:**
- Client satisfaction was impacted despite ultimate successful delivery
- We provided $30,000 in service credits as goodwill for the delayed deliverables
- NEC leadership expressed frustration during weeks 13-18
- The relationship recovered after full go-live and strong adoption in the fall semester

**Recommendations for future proposals:**
1. Add a minimum 25% buffer to implementation timelines for multi-institution deployments
2. Require pre-implementation data readiness assessments before committing to timelines
3. Do not commit to hard go-live dates tied to academic calendars without contingency plans
4. Include explicit assumptions about data quality and SIS configuration in the SOW
5. Consider phased go-live by institution rather than big-bang consortium deployments

**Current status (as of June 2024):**
- Platform is fully operational across all 7 institutions
- 340 active users (advisors; IR staff; administrators; executives)
- Early alert system has flagged 1,200 at-risk students in the first semester
- NEC has expressed interest in expanding to include financial aid optimization module
- Client satisfaction has recovered and NEC provided a positive reference for a new prospect
