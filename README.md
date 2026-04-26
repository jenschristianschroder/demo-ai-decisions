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