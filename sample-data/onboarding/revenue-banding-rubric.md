# Revenue Banding Rubric

Used by the Revenue Estimation & Case Prioritization Agent to assign one of
four revenue bands to a new onboarding case. The agent is **not** permitted to
set price or commercial terms — it only estimates likely 12-month revenue
contribution and a confidence score, and it must always cite at least one
comparable client.

The bands are intentionally coarse so the analyst queue can be sorted without
implying false precision.

| Band       | Indicative 12-mo revenue | Typical declared monthly volume | Typical profile                                                                                  |
|------------|--------------------------|---------------------------------|---------------------------------------------------------------------------------------------------|
| Low        | < €120,000               | < €2.0m                         | Small remittance providers, niche broker-dealers, consumer wallets with low ARPU.                |
| Medium     | €120,000 – €500,000      | €2.0m – €8.0m                   | Mid-size PSPs in a single corridor, regional acquirers with FX uplift, lightweight marketplace.  |
| High       | €500,000 – €1,500,000    | €8.0m – €20.0m                  | Multi-corridor PSPs, marketplace flows, nested payments, meaningful FX margin.                   |
| Strategic  | > €1,500,000             | > €20.0m                        | Enterprise treasury platforms, embedded finance partners, multi-region, multi-product.           |

## Signals the agent considers

1. **Declared monthly volume** — primary driver, but only a starting point.
2. **Product mix** — card acquiring, SEPA Instant, FX, nested payments, embedded
   finance. Broader mix usually implies higher ARPU.
3. **Corridors & geography** — exotic corridors (LATAM, APAC) raise AML cost
   but also tend to come with higher FX margin.
4. **Client type** — remittance / wallet / PSP / acquirer / treasury platform /
   broker-dealer. Each maps to a default ARPU range.
5. **Nested payments** — explicit signal: nested-payments clients tend to land
   in High or Strategic but extend AML review (see step timings).
6. **Comparability** — the closest 1–3 historical clients in
   `client-profiles.md` are the strongest evidence for a band.

## Confidence

- **High (0.75 – 1.0):** two or more close comparables agree on the band.
- **Medium (0.45 – 0.74):** one close comparable or several loose ones.
- **Low (0.0 – 0.44):** no close comparable, exotic profile, or conflicting
  signals.

## Hard rules

- The agent may **only** output one of: `low`, `medium`, `high`, `strategic`.
- The agent must produce a single paragraph of plain-language rationale that
  names the client type, the corridor(s), the declared volume tier, and the
  comparable client used.
- The agent must not produce pricing, fees, take-rates, or commercial
  recommendations of any kind.
- The team lead always has final say. A manual override is a first-class
  outcome, not an error.
