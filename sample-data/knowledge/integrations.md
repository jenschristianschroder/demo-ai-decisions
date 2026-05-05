# Data Integrations and Connectivity

**Last Reviewed:** February 3, 2026
**Owner:** Marcus Rivera, VP of Engineering
**Approved Use:** May be referenced in RFP responses, technical proposals, and pre-sales architecture discussions. Beta features should be clearly identified as such in any customer-facing materials.

---

## Native Database Connectors

Northstar provides certified, production-grade connectors for the following relational databases:

| Database | Versions Supported | Connection Methods | Notes |
|----------|-------------------|-------------------|-------|
| Microsoft SQL Server | 2016, 2019, 2022 | Direct connect, linked server | Includes Azure SQL Database and Azure SQL Managed Instance |
| PostgreSQL | 12, 13, 14, 15, 16 | Direct connect | Includes Amazon RDS for PostgreSQL and Azure Database for PostgreSQL |
| Oracle Database | 19c, 21c, 23c | Direct connect, Oracle Net | Requires Oracle Instant Client on gateway |
| MySQL | 8.0, 8.1 | Direct connect | Includes Amazon RDS for MySQL and Azure Database for MySQL |

All native connectors support:
- Connection pooling and query timeout configuration
- SSL/TLS encrypted connections
- Kerberos and Active Directory authentication where supported by the database
- Read-only connection enforcement to protect source systems
- Schema auto-detection and incremental metadata refresh

## REST API Ingestion

The Northstar Ingest API allows customers to push data into the platform from any system capable of making HTTP requests. Key features:

- **RESTful endpoints** for batch and micro-batch data loading
- **JSON and CSV** payload formats supported
- **Authentication** via API key or OAuth 2.0 client credentials
- **Rate limiting:** 1,000 requests/minute per tenant (standard); 5,000 requests/minute (Enterprise tier)
- **Payload size:** Up to 50 MB per request
- **Idempotent upserts** supported via configurable primary key columns
- **OpenAPI 3.0 specification** published for all endpoints

## File Import

Users with appropriate permissions can manually upload data files through the Northstar web interface:

- **Supported formats:** CSV, TSV, Microsoft Excel (.xlsx, .xls), JSON
- **File size limits:** 500 MB per file (standard); 2 GB per file (Enterprise tier)
- **Schema inference:** Column types are automatically detected on upload with manual override options
- **Scheduled file ingestion:** Files placed in designated SFTP or cloud storage locations (Azure Blob, S3) can be automatically ingested on a schedule

## Certified Integration Partners

### Azure Data Factory (ADF)
Northstar provides a **certified custom connector** for Azure Data Factory, enabling customers to orchestrate data pipelines that load data into the Northstar optimized data store. The connector supports:
- Copy activity (source and sink)
- Parameterized datasets
- Managed Identity authentication
- Integration runtime support for hybrid scenarios

### SQL Server Integration Services (SSIS)
A **certified SSIS component** is available for customers using on-premises ETL workflows. The component includes:
- Source and destination adapters for the Northstar data store
- Connection manager with encrypted credential storage
- Support for SSIS 2019 and 2022 runtimes
- Package deployment and project deployment models

## Real-Time Streaming — Kafka Connector

Northstar is developing a native **Apache Kafka connector** for real-time data streaming into the platform.

| Attribute | Detail |
|-----------|--------|
| Current Status | **Beta** (available to Enterprise customers upon request) |
| GA Target | **v8.3** (planned Q2 2026) |
| Supported Kafka Versions | 3.4, 3.5, 3.6 |
| Managed Services | Confluent Cloud, Amazon MSK, Azure Event Hubs (Kafka protocol) |
| Serialization | Avro, JSON, Protobuf |
| Consumer Group | Configurable, supports multi-partition consumption |
| Throughput (Beta) | Up to 10,000 events/second per connector instance |

**Beta Limitations:**
- Schema evolution is supported for backward-compatible changes only
- Exactly-once delivery semantics are not yet guaranteed; at-least-once is supported
- Administrative UI for connector management is not yet available; configuration is via REST API only
- Beta customers must sign a Beta Program Agreement

## Data Catalog and Metadata Discovery

The Northstar Data Catalog provides a centralized inventory of all data assets available in the platform:

- **Automated metadata discovery:** When a new data source is connected, Northstar scans and catalogs tables, columns, data types, and relationships automatically
- **Business glossary:** Administrators can define business terms, descriptions, and tags for data assets, supporting the NLQ semantic model
- **Lineage tracking:** Visual data lineage shows how data flows from source systems through transformations to dashboards and reports
- **Impact analysis:** Before modifying a dataset or column, users can see which dashboards, reports, and scheduled jobs would be affected
- **Search:** Full-text search across table names, column names, descriptions, and tags
- **Classification:** Automated PII detection flags columns that may contain personally identifiable information

---

## Constraints and Caveats

- Native connectors require network connectivity between the Northstar cloud environment and customer data sources. For on-premises databases, a Northstar Gateway agent must be deployed inside the customer network.
- The Kafka connector is in beta and should not be positioned as a GA feature in binding proposals. Performance and reliability SLAs do not apply to beta features.
- REST API rate limits are enforced at the tenant level. Customers with high-volume ingestion needs should discuss dedicated ingestion capacity with their account team.
- Automated PII detection in the Data Catalog uses heuristic pattern matching and should not be relied upon as a sole compliance control.
- Oracle connector requires customer-provided Oracle Instant Client licenses.

---

## Suggested RFP Response Language

> Northstar Analytics Platform provides native, certified connectors for SQL Server, PostgreSQL, Oracle, and MySQL, along with a RESTful Ingest API for custom data sources and support for CSV/Excel file imports. Certified integrations with Azure Data Factory and SSIS enable enterprise ETL orchestration. A real-time streaming connector for Apache Kafka is currently in beta with general availability planned for Q2 2026 (v8.3). The platform includes an automated Data Catalog with metadata discovery, business glossary, data lineage, and impact analysis capabilities to help organizations govern and understand their data assets.
