# Group Finance Anomaly Review Assistant

> **Decision Demo** — AI-powered review of subsidiary financial reporting during month-end close.

This is a Decision demo showing how AI can help Group Finance prioritize unusual subsidiary reporting patterns, explain anomalies, and draft follow-up questions during month-end close.

---

## Demo Overview

The **Group Finance Anomaly Review Assistant** helps Group Finance teams review monthly reporting submissions from subsidiaries. It detects anomalies, prioritises review items, explains why something is unusual, and drafts follow-up questions to subsidiary controllers — all without requiring a real AI backend for the demo.

---

## Business Scenario

It is month-end close. Twelve subsidiaries have submitted their financial reporting packs to Group Finance. Each submission contains actuals, budget, prior month, prior year, intercompany balances, FX information, and variance commentary. The assistant reviews the submissions, detects unusual reporting patterns, ranks the highest-risk issues, explains the reason for each flag, and drafts follow-up questions for the subsidiary controller.

---

## Screens Included

| Screen | Route | Description |
|--------|-------|-------------|
| Scenario Landing | `/` | Demo introduction with "Launch Demo" CTA |
| Group Close Dashboard | `/dashboard` | All 12 subsidiaries with risk scores and anomaly counts |
| Entity Detail | `/entity/:entityId` | Anomaly queue, explanation panel, follow-up assistant, audit trail |
| Data Upload | `/upload` | Mock upload area for new reporting packs |

---

## How to Run Locally

### Prerequisites

- Node.js 20+

### Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

The app runs entirely with **mock data** — no Azure credentials, no backend required.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Mock Data Explanation

All data is located in `src/data/mockFinancialData.ts`.

### Entities

12 subsidiaries are defined with realistic metadata:
- Entity code, name, country, region
- Functional currency and materiality threshold
- Controller name and email
- Risk score and anomaly counts
- Submission status and timestamp

### Anomalies

23 synthetic anomalies are included across all entities, covering every category:

| Category | Examples |
|----------|---------|
| Variance Anomaly | DE01 Marketing Expense +52% vs budget |
| Trend Anomaly | DE01 Cost of Sales outside 12-month range |
| Intercompany Mismatch | FR01/NL01 €86k receivable with no matching payable |
| Mapping Anomaly | ES01 Software subscriptions reclassified to Capex |
| Ratio Anomaly | IT01 Accruals up 72% while OpEx falls |
| FX Translation Anomaly | BR01 BRL devaluation not reflected |
| Commentary Anomaly | SE01 four material lines with no commentary |
| Peer Anomaly | UK01 Intercompany payable not confirmed |

### The DE01 Marketing Expense Scenario (Primary Demo Path)

This is the main walkthrough anomaly:

- **Account:** 620500 Marketing Expense
- **Period:** March 2026
- **Actual:** €184k vs **Budget:** €121k (52% above budget)
- **Prior Month:** €133k (38% above)
- **Historical range:** €92k–€148k (outside range)
- **Commentary submitted:** "Campaign timing." (Weak)
- **Draft email recipient:** Anna Müller, Controller DE01

---

## How Anomaly Scoring Works

Detection logic is in `src/lib/anomalyScoring.ts`:

| Rule | Trigger |
|------|---------|
| **Variance flag** | Actual vs budget exceeds 20% AND absolute variance exceeds entity materiality threshold |
| **Trend flag** | Actual falls outside the 12-month historical range |
| **Commentary flag** | Variance is material but commentary is missing or fewer than 20 characters |
| **Intercompany flag** | Counterparty balance mismatch exceeds threshold |
| **Mapping flag** | Current reporting line differs from historical mapping |

Severity is assigned based on:
- Variance magnitude relative to materiality
- Account sensitivity (revenue, payroll, intercompany)
- Commentary quality (Strong / Adequate / Weak / Missing)

Risk scores for each entity are derived from: `(High anomalies × 25) + (Medium × 10) + (Weak commentary × 5) + (IC breaks × 15)`, capped at 100.

---

## Where Azure AI Foundry Would Be Integrated

See `src/lib/mockAi.ts` for the full list of TODO integration points:

| Integration Point | Description |
|-------------------|-------------|
| **Azure AI Foundry model endpoint** | Replace mock explanation with real LLM call |
| **Foundry Agent Service** | Orchestrate multi-step anomaly investigation |
| **Azure AI Search** | Ground responses in group accounting policy documents |
| **Azure AI Content Safety** | Screen user-generated commentary before surfacing it |
| **Application Insights** | Trace all AI calls with latency and cost metrics |
| **Azure SQL / Fabric Lakehouse** | Replace mock data with live financial data |

---

## Suggested Future Enhancements

- Live integration with Azure AI Foundry for real explanation generation
- Persistent review state via Azure SQL or Cosmos DB
- Email dispatch via Microsoft Graph API (send directly to subsidiary controller)
- Power BI Embedded charts from Fabric Lakehouse
- Batch anomaly detection run on new data upload
- User authentication via Entra ID
- Role-based access (Group Finance Lead vs. Reviewer)
- Mobile-responsive layout for on-the-go review
- Configurable materiality thresholds per entity
- Multi-period trend comparison (12-month rolling)

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Routing | React Router v7 |
| Charts | Recharts |
| Styling | Plain CSS (enterprise design system) |
| Data | Static TypeScript mock files |
| Backend | None (first version) |

---

*Group Finance Anomaly Review Assistant · Decision Demo · Microsoft Innovation Hub*