// ──────────────────────────────────────────────────────────────────────────────
// Azure Container Apps Job — MusicBrainz embeddings backfill
//
// Manual-trigger job that runs the `dist/scripts/backfillEmbeddings.js` script
// from the existing SPA container image (same Dockerfile, just a different
// command). Operators start, stop, and inspect executions with:
//
//   az containerapp job start  --name <name> --resource-group <rg>
//   az containerapp job stop   --name <name> --resource-group <rg> \
//                              --execution-name <execution>
//   az containerapp job execution list --name <name> --resource-group <rg>
//   az containerapp job logs   --name <name> --resource-group <rg> \
//                              --container <name> --execution <execution>
//
// Progress is also persisted to musicbrainz.backfill_progress and exposed via
// GET /api/backfill/status from the SPA, so progress is visible from the UI
// while a job is running.
// ──────────────────────────────────────────────────────────────────────────────

@description('Azure region')
param location string

@description('Container Apps Job name')
param name string

@description('Container Apps Environment resource ID')
param environmentId string

@description('Container image reference (typically <acr>/<app>-spa:<tag>)')
param containerImage string

@description('ACR login server')
param acrLoginServer string

@description('Managed Identity resource ID (used for ACR pull)')
param identityId string

@description('CPU cores allocated to the job container')
param cpu string = '1.0'

@description('Memory allocated to the job container (e.g. 2Gi)')
param memory string = '2Gi'

@description('Per-execution timeout in seconds (default: 24h = 86400s)')
param replicaTimeoutSeconds int = 86400

@description('How many times to retry a failed replica before marking the execution failed')
param replicaRetryLimit int = 1

@description('How many parallel replicas per execution (kept at 1; sharding via min/max id env vars on separate executions)')
param parallelism int = 1

@description('Azure AI Foundry endpoint URL (https://<resource>.openai.azure.com)')
param azureAiEndpoint string

@description('Azure OpenAI embedding deployment name (matches vector(1536) columns)')
param azureAiEmbeddingDeployment string = 'text-embedding-3-small'

@description('PostgreSQL server host')
param pgHost string

@description('PostgreSQL database name')
param pgDatabase string

@description('PostgreSQL user')
param pgUser string

@description('PostgreSQL password')
@secure()
param pgPassword string

@description('Default BACKFILL_ENTITY when an execution does not override it')
param defaultEntity string = 'artist'

@description('Default BACKFILL_BATCH_SIZE')
param defaultBatchSize string = '128'

@description('Default BACKFILL_CONCURRENCY')
param defaultConcurrency string = '8'

@description('Default BACKFILL_WRITE_CONCURRENCY')
param defaultWriteConcurrency string = '4'

resource backfillJob 'Microsoft.App/jobs@2024-03-01' = {
  name: name
  location: location
  identity: {
    type: 'SystemAssigned,UserAssigned'
    userAssignedIdentities: {
      '${identityId}': {}
    }
  }
  properties: {
    environmentId: environmentId
    configuration: {
      triggerType: 'Manual'
      replicaTimeout: replicaTimeoutSeconds
      replicaRetryLimit: replicaRetryLimit
      manualTriggerConfig: {
        parallelism: parallelism
        replicaCompletionCount: 1
      }
      registries: [
        {
          server: acrLoginServer
          identity: identityId
        }
      ]
      secrets: [
        {
          name: 'pg-password'
          value: pgPassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: name
          image: containerImage
          // Override the default `node dist/index.js` (web server) entrypoint
          // so this container runs the backfill script instead.
          command: [
            'node'
          ]
          args: [
            'dist/scripts/backfillEmbeddings.js'
          ]
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: [
            // ── Azure OpenAI ───────────────────────────────────────────────
            {
              name: 'AZURE_AI_ENDPOINT'
              value: azureAiEndpoint
            }
            {
              name: 'AZURE_AI_EMBEDDING_DEPLOYMENT'
              value: azureAiEmbeddingDeployment
            }
            // ── PostgreSQL ─────────────────────────────────────────────────
            {
              name: 'PGHOST'
              value: pgHost
            }
            {
              name: 'PGDATABASE'
              value: pgDatabase
            }
            {
              name: 'PGUSER'
              value: pgUser
            }
            {
              name: 'PGPASSWORD'
              secretRef: 'pg-password'
            }
            {
              name: 'PGSSLMODE'
              value: 'require'
            }
            // ── Backfill defaults ──
            // To change these per-execution, patch them onto the template
            // with `az containerapp job update --set-env-vars KEY=VALUE …`
            // before `az containerapp job start`. Do NOT use
            // `az containerapp job start --env-vars` — that creates a
            // container override that replaces the entire container spec
            // and drops every other env var below (AZURE_AI_ENDPOINT, all
            // PG* vars, …) plus the command/args, so the execution falls
            // back to the SPA entrypoint.
            {
              name: 'BACKFILL_ENTITY'
              value: defaultEntity
            }
            {
              name: 'BACKFILL_BATCH_SIZE'
              value: defaultBatchSize
            }
            {
              name: 'BACKFILL_CONCURRENCY'
              value: defaultConcurrency
            }
            {
              name: 'BACKFILL_WRITE_CONCURRENCY'
              value: defaultWriteConcurrency
            }
            {
              name: 'BACKFILL_TRACK_PROGRESS'
              value: 'true'
            }
          ]
        }
      ]
    }
  }
}

@description('Resource ID of the backfill job')
output id string = backfillJob.id

@description('Backfill job name')
output name string = backfillJob.name

@description('System-assigned principal id (used for Cognitive Services role assignment)')
output principalId string = backfillJob.identity.principalId
