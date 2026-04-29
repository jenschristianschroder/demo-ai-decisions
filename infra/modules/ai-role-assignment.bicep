@description('Principal ID to grant the Cognitive Services OpenAI User role')
param principalId string

@description('Azure AI Foundry / Cognitive Services account resource ID')
param cognitiveServicesAccountId string

// Cognitive Services OpenAI User role definition ID
var cognitiveServicesOpenAiUserRoleId = '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'

resource cognitiveServicesAccount 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' existing = {
  name: last(split(cognitiveServicesAccountId, '/'))
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(cognitiveServicesAccountId, principalId, cognitiveServicesOpenAiUserRoleId)
  scope: cognitiveServicesAccount
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      cognitiveServicesOpenAiUserRoleId
    )
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}
