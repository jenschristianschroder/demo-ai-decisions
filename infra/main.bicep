targetScope = 'resourceGroup'

// ─── Parameters ──────────────────────────────────────────────────────────────

@description('Azure region for all resources (defaults to resource group location)')
param location string = resourceGroup().location

@description('Base name used to derive resource names')
param appName string = 'ai-decisions'

@description('Container image tag (typically the git SHA)')
param imageTag string

@description('Azure AI Foundry endpoint URL (e.g. https://<resource>.openai.azure.com)')
param azureAiEndpoint string = ''

@description('Azure AI Foundry model deployment name')
param azureAiDeployment string = 'gpt-4o'

@description('Resource ID of the Cognitive Services account for role assignment')
param cognitiveServicesAccountId string = ''

@description('PostgreSQL administrator password')
@secure()
param pgAdminPassword string = ''

// ─── Derived names ───────────────────────────────────────────────────────────

var acrName = '${replace('${appName}acr', '-', '')}${uniqueString(resourceGroup().id)}'
var envName = '${appName}-env'
var identityName = '${appName}-identity'
var spaAppName = '${appName}-spa'
var pgServerName = '${appName}-pg'
var pgDatabaseName = 'musicbrainz'

// ─── Modules ─────────────────────────────────────────────────────────────────

module acr 'modules/acr.bicep' = {
  name: 'acr'
  params: {
    location: location
    name: acrName
  }
}

module environment 'modules/aca-environment.bicep' = {
  name: 'aca-environment'
  params: {
    location: location
    name: envName
  }
}

module identity 'modules/identity.bicep' = {
  name: 'identity'
  params: {
    location: location
    name: identityName
    acrId: acr.outputs.id
  }
}

module postgresql 'modules/postgresql.bicep' = if (!empty(pgAdminPassword)) {
  name: 'postgresql'
  params: {
    location: location
    name: pgServerName
    administratorLoginPassword: pgAdminPassword
    databaseName: pgDatabaseName
  }
}

module spaApp 'modules/aca-spa.bicep' = {
  name: 'aca-spa'
  params: {
    location: location
    name: spaAppName
    environmentId: environment.outputs.id
    containerImage: '${acr.outputs.loginServer}/${spaAppName}:${imageTag}'
    acrLoginServer: acr.outputs.loginServer
    identityId: identity.outputs.id
    azureAiEndpoint: azureAiEndpoint
    azureAiDeployment: azureAiDeployment
    pgHost: postgresql.?outputs.?fqdn ?? ''
    pgDatabase: pgDatabaseName
    pgUser: 'pgadmin'
    pgPassword: pgAdminPassword
  }
}

// Cognitive Services OpenAI User role for the Container App's system-assigned identity
module aiRoleAssignment 'modules/ai-role-assignment.bicep' = if (!empty(cognitiveServicesAccountId)) {
  name: 'ai-role-assignment'
  params: {
    principalId: spaApp.outputs.principalId
    cognitiveServicesAccountId: cognitiveServicesAccountId
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

@description('Public URL of the SPA')
output spaUrl string = 'https://${spaApp.outputs.fqdn}'

@description('ACR login server')
output acrLoginServer string = acr.outputs.loginServer

@description('PostgreSQL server FQDN')
output pgFqdn string = postgresql.?outputs.?fqdn ?? ''
