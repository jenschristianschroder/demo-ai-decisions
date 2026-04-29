@description('Azure region')
param location string

@description('Container App name')
param name string

@description('Container Apps Environment resource ID')
param environmentId string

@description('Container image reference')
param containerImage string

@description('ACR login server')
param acrLoginServer string

@description('Managed Identity resource ID (used for ACR pull)')
param identityId string

@description('Azure AI Foundry endpoint URL')
param azureAiEndpoint string = ''

@description('Azure AI Foundry model deployment name')
param azureAiDeployment string = 'gpt-4o'

resource spaApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: name
  location: location
  identity: {
    type: 'SystemAssigned,UserAssigned'
    userAssignedIdentities: {
      '${identityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
      }
      registries: [
        {
          server: acrLoginServer
          identity: identityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: name
          image: containerImage
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'AZURE_AI_ENDPOINT'
              value: azureAiEndpoint
            }
            {
              name: 'AZURE_AI_DEPLOYMENT'
              value: azureAiDeployment
            }
            {
              name: 'PORT'
              value: '3000'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

output fqdn string = spaApp.properties.configuration.ingress.fqdn
output principalId string = spaApp.identity.principalId
