targetScope = 'resourceGroup'

// ─── Parameters ──────────────────────────────────────────────────────────────

@description('Azure region for all resources (defaults to resource group location)')
param location string = resourceGroup().location

@description('Base name used to derive resource names')
param appName string = 'ai-decisions'

@description('Container image tag (typically the git SHA)')
param imageTag string

// ─── Derived names ───────────────────────────────────────────────────────────

var acrName = '${replace('${appName}acr', '-', '')}${uniqueString(resourceGroup().id)}'
var envName = '${appName}-env'
var identityName = '${appName}-identity'
var spaAppName = '${appName}-spa'

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

module spaApp 'modules/aca-spa.bicep' = {
  name: 'aca-spa'
  params: {
    location: location
    name: spaAppName
    environmentId: environment.outputs.id
    containerImage: '${acr.outputs.loginServer}/${spaAppName}:${imageTag}'
    acrLoginServer: acr.outputs.loginServer
    identityId: identity.outputs.id
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

@description('Public URL of the SPA')
output spaUrl string = 'https://${spaApp.outputs.fqdn}'

@description('ACR login server')
output acrLoginServer string = acr.outputs.loginServer
