# Contoso Payments Inc. — Canonical Onboarding Process

Every prospect moves through the same seven-step pipeline. Each step has an
owning team, a target SLA and a typical handoff to the next step.

| # | Step                       | Id                     | Owner                          | Target SLA (business days) |
|---|----------------------------|------------------------|--------------------------------|----------------------------|
| 1 | Intake                     | `intake`               | Onboarding Analyst Pool        | 1                          |
| 2 | KYC                        | `kyc`                  | Financial Crime — KYC team     | 3                          |
| 3 | AML review                 | `aml`                  | Financial Crime — AML team     | 5                          |
| 4 | Technical integration      | `tech-integration`     | Solutions Engineering          | 10                         |
| 5 | Signatory verification     | `signatory-verification` | Legal Operations             | 3                          |
| 6 | Product configuration      | `product-configuration` | Implementation Managers       | 4                          |
| 7 | Go-live                    | `go-live`              | Implementation Managers        | 1                          |

## Step descriptions

### 1. Intake
The analyst captures declared business model, declared volumes, corridors,
product mix and public registry information. Output of this step is a
case record that can be ranked.

### 2. KYC
Identity verification of the legal entity and ultimate beneficial owners.
Standard cases clear in ~3 days; complex ownership structures take longer
and are surfaced by the duration agent.

### 3. AML
Risk assessment of the prospect's business model, corridors and transaction
patterns. **Nested payments** clients consistently spend 2.4× longer here
than the baseline because they require enhanced due diligence on downstream
PSPs (see `step-timings.json`).

### 4. Technical integration
API key issuance, sandbox testing, payload validation, certification of
production endpoints. This is the longest step by design.

### 5. Signatory verification
Verification that the named signatories on the master agreement match the
authorised representatives in the corporate registry. Always human-reviewed.
The agent never confirms or rejects a signatory.

### 6. Product configuration
Settlement accounts, scheme connectivity (e.g. SEPA Instant scheme join),
FX configuration, reporting feeds.

### 7. Go-live
Final smoke-test transaction, switch to production, monitoring activation.

## Bottleneck definitions

A case is **blocked** when it has been in the same step for >150% of the
target SLA for that step. The duration agent surfaces blocked cases first.
