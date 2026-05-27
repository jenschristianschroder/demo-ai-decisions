@description('Azure region')
param location string

@description('PostgreSQL server name')
param name string

@description('Administrator login username')
param administratorLogin string = 'pgadmin'

@description('Administrator login password')
@secure()
param administratorLoginPassword string

@description('PostgreSQL version')
param version string = '16'

@description('SKU name (Burstable, GeneralPurpose, MemoryOptimized)')
param skuName string = 'Standard_B1ms'

@description('SKU tier')
param skuTier string = 'Burstable'

@description('Storage size in GB')
param storageSizeGB int = 32

@description('Database name')
param databaseName string = 'musicbrainz'

// ─── PostgreSQL Flexible Server ──────────────────────────────────────────────

resource pgServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: name
  location: location
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    version: version
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    storage: {
      storageSizeGB: storageSizeGB
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// ─── Allow Azure Services access ─────────────────────────────────────────────

resource allowAzureServices 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: pgServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ─── Enable required extensions via server configuration ─────────────────────
// Resources are serialized with explicit dependsOn to avoid ServerIsBusy
// errors — Azure Flexible Server cannot process concurrent operations.

resource azureExtensions 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-12-01-preview' = {
  parent: pgServer
  name: 'azure.extensions'
  properties: {
    value: 'age,pg_trgm,unaccent,vector'
    source: 'user-override'
  }
  dependsOn: [allowAzureServices]
}

resource sharedPreloadLibraries 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-12-01-preview' = {
  parent: pgServer
  name: 'shared_preload_libraries'
  properties: {
    value: 'age'
    source: 'user-override'
  }
  dependsOn: [azureExtensions]
}

// ─── Create the musicbrainz database ─────────────────────────────────────────

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: pgServer
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
  dependsOn: [sharedPreloadLibraries]
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

@description('Fully qualified domain name of the PostgreSQL server')
output fqdn string = pgServer.properties.fullyQualifiedDomainName

@description('PostgreSQL server name')
output serverName string = pgServer.name

@description('Database name')
output databaseName string = database.name
