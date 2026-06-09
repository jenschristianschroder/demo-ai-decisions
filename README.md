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

## Azure Deployment

### Prerequisites

- An Azure subscription
- A GitHub repository with this code
- Azure CLI installed locally (for initial setup)

### Infrastructure

The `infra/` directory contains Bicep templates that provision:

| Resource | Purpose |
|----------|---------|
| Azure Container Registry (ACR) | Stores the Docker image |
| Container Apps Environment | Hosts the container app |
| Container App (SPA) | Runs the nginx-served React app |
| Managed Identity | Pulls images from ACR without passwords |

### GitHub Actions Workflow

The `.github/workflows/deploy.yml` workflow automatically deploys on every push to `main`. It can also be triggered manually via **Actions → Deploy to Azure Container Apps → Run workflow**.

The workflow:
1. Logs into Azure using OIDC (federated credentials — no stored passwords)
2. Ensures the resource group exists
3. Deploys infrastructure via Bicep
4. Builds and pushes the Docker image to ACR
5. Updates the Container App with the new image

---

## Setting Up GitHub Secrets and Variables

The deploy workflow requires secrets and variables configured in your GitHub repository.

### Step 1 — Create an Azure App Registration (Service Principal)

```bash
# Create the app registration
az ad app create --display-name "github-deploy-ai-decisions"

# Note the appId (client ID) from the output
APP_ID=$(az ad app list --display-name "github-deploy-ai-decisions" --query "[0].appId" -o tsv)

# Create a service principal for the app
az ad sp create --id $APP_ID
```

### Step 2 — Configure OIDC Federated Credentials

This allows GitHub Actions to authenticate without storing secrets:

```bash
# Get your GitHub org/user and repo name
GITHUB_ORG="<your-github-username-or-org>"
GITHUB_REPO="demo-ai-decisions"

# Add federated credential for the main branch
az ad app federated-credential create --id $APP_ID --parameters '{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:'"$GITHUB_ORG/$GITHUB_REPO"':ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

### Step 3 — Assign Azure Roles

```bash
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Assign Contributor role at the subscription level (or scope to a resource group)
az role assignment create \
  --assignee $APP_ID \
  --role "Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"
```

### Step 4 — Configure GitHub Secrets

Go to your repository on GitHub → **Settings** → **Secrets and variables** → **Actions** → **Secrets** tab → **New repository secret** and add:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AZURE_CLIENT_ID` | `<app-registration-client-id>` | The Application (client) ID from Step 1 |
| `AZURE_TENANT_ID` | `<azure-ad-tenant-id>` | Your Azure AD tenant ID (`az account show --query tenantId -o tsv`) |
| `AZURE_SUBSCRIPTION_ID` | `<azure-subscription-id>` | Your Azure subscription ID (`az account show --query id -o tsv`) |
| `AZURE_RESOURCE_GROUP` | `rg-ai-decisions-demo` | Name of the Azure resource group to deploy into |

### Step 5 — Configure GitHub Variables

Go to your repository on GitHub → **Settings** → **Secrets and variables** → **Actions** → **Variables** tab → **New repository variable** and add:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `AZURE_LOCATION` | `northeurope` | Azure region for the resource group and resources (e.g., `northeurope`, `westeurope`, `eastus`) |

### Quick Reference — Finding Your Azure IDs

```bash
# Tenant ID
az account show --query tenantId -o tsv

# Subscription ID
az account show --query id -o tsv

# Client ID (App Registration)
az ad app list --display-name "github-deploy-ai-decisions" --query "[0].appId" -o tsv
```

### Manual Deployment (without GitHub Actions)

```bash
# Create resource group
az group create -n rg-ai-decisions-demo -l northeurope

# Deploy infrastructure
az deployment group create \
  -g rg-ai-decisions-demo \
  -f infra/main.bicep \
  -p imageTag=latest

# Build and push image
ACR=$(az deployment group show -g rg-ai-decisions-demo -n ai-decisions-infra --query properties.outputs.acrLoginServer.value -o tsv)
az acr login --name $ACR

docker build -t $ACR/ai-decisions-spa:latest .
docker push $ACR/ai-decisions-spa:latest
```

---

## RFP Response Automation Demo

> **Route:** `/rfp` → `/rfp/dashboard`

The **RFP Response Automation Demo** shows how multiple AI agents can analyze an incoming RFP and internal knowledge to produce a complete proposal response.

### How to Run

1. Start the app: `npm run dev` and open [http://localhost:5173](http://localhost:5173)
2. Navigate to **Demos** → **RFP Response Automation** (or go directly to `/rfp`)
3. Click **Run Analysis** to process the sample RFP
4. View the results on the dashboard at `/rfp/dashboard`

### Demo Scenario

- **Buyer:** Acme Public Services (fictional government agency)
- **Vendor:** Northstar Analytics (fictional B2B SaaS analytics company)
- **RFP:** Enterprise Analytics and Reporting Platform procurement

### Sample Data

All sample data lives in `sample-data/` at the repo root:

| Directory | Contents |
|-----------|----------|
| `sample-data/rfp/` | Incoming RFP package (markdown versions of PDF/DOCX/XLSX) |
| `sample-data/knowledge/` | 11 internal knowledge files (product, security, legal, etc.) |
| `sample-data/historical-rfps/` | 3 past RFP responses |
| `sample-data/data/` | 6 CSV files (approved answers, SME directory, risk rules, etc.) |

### How to Replace the Sample RFP

Replace the files in `sample-data/rfp/` with your own RFP content in markdown format. The demo parses markdown text — the agents extract requirements using `REQ-` prefixed patterns.

### Agent Workflow (8 Stages)

| # | Agent | What It Does |
|---|-------|-------------|
| 1 | Intake Agent | Extracts buyer info, deadline, submission instructions, evaluation criteria |
| 2 | Requirement Extraction | Identifies and categorizes all RFP requirements |
| 3 | Knowledge Retrieval | Searches approved answers and knowledge base for each requirement |
| 4 | Drafting Agent | Produces draft answers grounded in internal knowledge |
| 5 | SME Routing | Assigns unanswered or risky items to subject matter experts |
| 6 | Risk Review | Checks requirements against risk rules for legal/commercial flags |
| 7 | Compliance Agent | Builds the compliance matrix with response status |
| 8 | Response Assembly | Generates the final response preview with checklist |

### Outputs Produced

- **Intake Summary** — Buyer, deadline, evaluation criteria, required attachments
- **Compliance Matrix** — Filterable table of all requirements with status/risk/owner
- **Draft Answers** — Answers grounded in sample data with source citations
- **SME Questions** — Questions routed to experts for gaps or risky items
- **Risk Register** — Flagged risks with severity, reason, and required approvers
- **Final Response Preview** — Assembled markdown response with executive summary

### Known Limitations

- Uses deterministic mock agent logic (no real AI calls) — works without Azure backend
- RFP files are markdown (not actual PDF/DOCX/XLSX) for demo simplicity
- Agent reasoning is simulated, not from a real LLM
- No persistence — state resets on page refresh
- CSV parsing is simple (no quoted fields with commas)

---

## R&D DoE Report Assistant Demo

> **Route:** `/doe` → `/doe/dashboard` → `/doe/experiment/:id`

The **R&D DoE Report Assistant** is a Decision / Documentation demo showing how a chain of
specialized AI steps can turn raw **Design of Experiments (DoE)** data into a structured,
compliant, human-reviewable report for a medical-device R&D team (Coloplast-style context).
The theme is **AI drafts, the scientist stays accountable**: the AI computes the statistics
and drafts every section, but each numeric claim is fact-checked against the real computed
values and the scientist must review and approve.

> All data in this demo is **synthetic / sample data** for demonstration only.

### How to Run

1. Start the app: `npm install && npm run dev` and open [http://localhost:5173](http://localhost:5173)
2. Navigate to **Demos** → **R&D DoE Report Assistant** (or go directly to `/doe`)
3. Click **Launch Demo**, open the primary study **DOE-2026-ADH-014**, then **Run AI pipeline**
4. Review the generated report, fact-check panel, completeness checklist, and audit trail;
   edit, approve, and **Download report (Markdown)**

### Screens Included

| Screen | Route | Description |
|--------|-------|-------------|
| Scenario Landing | `/doe` | Demo introduction with "Launch Demo" CTA |
| DoE Dashboard | `/doe/dashboard` | List of studies with status, #factors, #runs, readiness score, top factor |
| Experiment Report | `/doe/experiment/:id` | Agent pipeline, data table, effects charts, generated report, fact-check, completeness checklist, knowledge, edit & approve, audit trail |
| Upload Dataset | `/doe/upload` | Mock upload area for a new experiment dataset |

### The AI Pipeline (6 Steps)

| # | Step | What It Does |
|---|------|-------------|
| 1 | Intake | Loads the experiment definition + runs and validates the schema |
| 2 | Analysis | **Real statistics** in TypeScript — main effects, all two-factor interactions, factor ranking, and significance from replicate variance (t-test) or Lenth's PSE |
| 3 | Drafting | Generates the report section-by-section, grounded only in the Analysis output + template |
| 4 | Grounding / Fact-Check | Verifies every numeric claim against the computed values (one claim is deliberately wrong, caught, and corrected) |
| 5 | Completeness | Checks the draft against a "Definition of Good" checklist and lists gaps |
| 6 | Knowledge | Surfaces relevant prior experiments from the mock corpus |

### Real Statistics (not faked)

The numbers are computed from the mock runs in `src/lib/doeAnalysis.ts` — the demo does **not**
hard-code results. The primary study **DOE-2026-ADH-014** is a 2³ full factorial + 3 center
points + 1 replicate (19 runs) over three factors (hydrocolloid content, coating thickness,
cure temperature) and five responses (peel adhesion, wear time, moisture absorption, skin
stripping, leakage). The engine codes the factors, computes main effects and interactions,
estimates significance from the replicate error, and reports R² / adjusted R².

### Mock Data

All data is static TypeScript in `src/data/`:

| File | Contents |
|------|----------|
| `src/data/mockDoeData.ts` | 3 studies (primary + 2 dashboard rows) with factors, responses, and the 19 primary runs |
| `src/data/doeTemplate.ts` | The 11 report section headings with one-line guidance each |
| `src/data/doeDefinitionOfGood.ts` | Completeness checklist ("Definition of Good") items |
| `src/data/doePriorReports.ts` | 3 prior-experiment summaries for the Knowledge step |

Logic lives in `src/lib/`: `doeAnalysis.ts` (real statistics) and `mockDoeAi.ts` (the
deterministic mock pipeline, with **"Where Azure AI Foundry Would Be Integrated"** TODO
markers for the Foundry model endpoint, Foundry Agent Service, Azure AI Search, AI Content
Safety, Application Insights, and Azure SQL / Fabric Lakehouse).

### Known Limitations

- Uses deterministic mock pipeline logic (no real AI calls) — works without an Azure backend
- The narrative text is templated, grounded in the real computed statistics
- Secondary dashboard studies are illustrative rows (no run data)
- No persistence — state resets on page refresh

---

## MusicBrainz Embedding Backfill (Azure Container Apps Job)


The MusicBrainz semantic-search feature stores `pgvector(1536)` embeddings on
`musicbrainz.artist` and `musicbrainz.recording`. Computing those embeddings
in bulk is done by a dedicated **Azure Container Apps Job**
(`ai-decisions-backfill`), provisioned by `infra/modules/aca-backfill-job.bicep`
and updated on every successful `deploy.yml` run.

The job runs the same container image as the SPA, but overrides the
entrypoint to `node dist/scripts/backfillEmbeddings.js`. Running the
backfill inside Azure (rather than from a GitHub Actions runner) removes
the public-internet PG round-trip tax and the 6 h GitHub job cap.

### Controlling the job (GitHub Actions)

Use the **Backfill Job — Control** workflow
(`.github/workflows/backfill-job.yml`) for one-click operations:

| Action  | What it does                                                                 |
| ------- | ---------------------------------------------------------------------------- |
| `start` | Starts a new execution with per-execution env-var overrides                  |
| `stop`  | Sends SIGTERM to a running execution (script finishes current page, exits)   |
| `status`| Lists the 10 most recent executions and their state                          |
| `logs`  | Tails the last 500 log lines for a given (or the latest) execution           |

### Controlling the job (Azure CLI)

```bash
JOB=ai-decisions-backfill
RG=<your-resource-group>

# Start an execution (overrides applied for this run only)
az containerapp job start -n "$JOB" -g "$RG" --env-vars \
  BACKFILL_ENTITY=artist BACKFILL_BATCH_SIZE=128 BACKFILL_CONCURRENCY=8

# List executions
az containerapp job execution list -n "$JOB" -g "$RG" -o table

# Stop a specific execution (graceful SIGTERM)
az containerapp job stop -n "$JOB" -g "$RG" --execution-name <exec>

# Tail logs
az containerapp job logs show -n "$JOB" -g "$RG" \
  --container "$JOB" --execution <exec> --follow
```

### Tracking progress

The script persists per-execution progress in `musicbrainz.backfill_progress`
on every page. Read it from the SPA:

```bash
curl https://<spa-fqdn>/api/backfill/status        # most recent 20 runs
curl https://<spa-fqdn>/api/backfill/status/<runId>
```

Each row reports `processed`, `embedded`, `errors`, `last_id`,
`last_heartbeat_at`, the run status (`running` / `completed` / `cancelled`
/ `failed`), and a computed rate / elapsed time. The same data is visible
to anyone with PostgreSQL access via `SELECT * FROM musicbrainz.backfill_progress`.

### Configuration (env vars)

All options can be set per-execution with `az containerapp job start --env-vars`
or persisted as defaults on the job template (see `aca-backfill-job.bicep`).

| Env var                       | Default | Notes                                             |
| ----------------------------- | ------- | ------------------------------------------------- |
| `BACKFILL_ENTITY`             | `artist`| `artist`, `recording`, or `all`                   |
| `BACKFILL_BATCH_SIZE`         | `128`   | Inputs per Azure OpenAI embeddings call (max 2048)|
| `BACKFILL_CONCURRENCY`        | `8`     | Concurrent embedding batches in flight            |
| `BACKFILL_WRITE_CONCURRENCY`  | `4`     | Concurrent UPDATE writers                         |
| `BACKFILL_MIN_ID`             | `0`     | Resume from this id                               |
| `BACKFILL_MAX_ID`             | _none_  | Stop at this id (sharding across executions)      |
| `BACKFILL_LIMIT`              | _none_  | Hard cap on rows processed                        |
| `BACKFILL_DRY_RUN`            | `false` | Compose text but skip Azure calls + writes        |
| `BACKFILL_DROP_INDEX`         | `false` | Drop & rebuild the vector index around the run    |
| `BACKFILL_TRACK_PROGRESS`     | `true`  | Write to `musicbrainz.backfill_progress`          |
| `BACKFILL_RUN_ID`             | auto    | Defaults to the ACA execution name                |
| `BACKFILL_HEARTBEAT_EVERY`    | `1`     | Heartbeat to progress table every N pages         |

### Sharding (parallel executions)

To parallelise across the id range, start multiple executions with
disjoint `BACKFILL_MIN_ID` / `BACKFILL_MAX_ID` windows — for example to
split artists into 4 shards:

```bash
for i in 0 1 2 3; do
  az containerapp job start -n "$JOB" -g "$RG" --env-vars \
    BACKFILL_ENTITY=artist \
    BACKFILL_MIN_ID=$((i * 1000000)) \
    BACKFILL_MAX_ID=$(((i + 1) * 1000000 - 1))
done
```

Each execution writes its own row to `musicbrainz.backfill_progress`
(keyed on the ACA execution name) so progress is independently visible
per shard.

### Legacy GitHub Actions workflow

`.github/workflows/backfill-embeddings.yml` remains as a fallback for
running the backfill from a GitHub-hosted runner (useful when the Azure
job is not yet deployed). Prefer the Container Apps Job for any non-trivial
backfill — it is dramatically faster and has no 6 h cap.

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