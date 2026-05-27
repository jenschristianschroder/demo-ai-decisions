@description('Azure region')
param location string

@description('Container Apps Environment name')
param name string

@description('Log Analytics workspace name (defaults to <env name>-logs)')
param logAnalyticsWorkspaceName string = '${name}-logs'

@description('Log Analytics workspace retention in days')
param logAnalyticsRetentionInDays int = 30

// Log Analytics workspace backing the Container Apps Environment so that
// container console logs (and system logs) are searchable from the portal
// and via `az containerapp logs show` / `az containerapp job logs show`.
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: logAnalyticsRetentionInDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

resource environment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: name
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

output id string = environment.id
output logAnalyticsWorkspaceId string = logAnalytics.id
