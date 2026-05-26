# Contoso Payments Inc. — Client Onboarding FAQ

Use this document as the grounding source for the Client-Facing Guidance &
Support Agent. Everything here is intended to be shareable with prospective
clients. Internal-only information (revenue banding, comparable clients,
case prioritisation) must **never** appear in answers to clients.

---

## Documentation requirements

### What documents do I need to start onboarding?

You will need:

1. Certificate of incorporation (or local equivalent) for the legal entity
   you wish to contract with.
2. Up-to-date register of directors and ultimate beneficial owners (UBOs).
3. Most recent audited financial statements (or last 12 months of management
   accounts for early-stage entities).
4. Regulatory license(s) relevant to the products you intend to use (e.g.
   Payment Institution or Electronic Money Institution license for EU
   activity).
5. AML / counter-terrorist-financing policy document.
6. Sanctions screening and PEP policy.

### What documents do I need for KYC on individual signatories?

Each signatory must submit a government-issued photo ID and a recent proof
of address (≤ 3 months old). Both documents are reviewed by Contoso Payments
Inc.'s Financial Crime team. The Client Guidance Agent cannot confirm or
reject any individual signatory.

---

## Process status and timing

### How long does onboarding usually take?

The end-to-end median is about 5–6 business weeks. Your case will move
through seven steps: Intake → KYC → AML → Technical integration →
Signatory verification → Product configuration → Go-live.

### How long does each step take?

Typical waits, in business days:

- Intake: 1 day
- KYC: 3 days
- AML: 5 days
- Technical integration: 10 days
- Signatory verification: 3 days
- Product configuration: 4 days
- Go-live: 1 day

Some segments are slower than the baseline — for example, clients with
nested-payments flows spend roughly 2.4× longer in AML because we run
enhanced due diligence on downstream PSPs.

### Where is my case right now?

The agent will read your current case state from the onboarding system
and tell you the current step, who owns it inside Contoso Payments, and
the typical wait at that step. It will not change your case status —
only the responsible team can do that.

---

## Product configuration

### How do I configure a settlement account for SEPA Instant?

1. Open the **Product configuration** step in your onboarding portal.
2. Add a IBAN that you control and that supports SEPA Instant. Your house
   bank can confirm reachability.
3. Submit the IBAN for scheme verification. Verification is automatic and
   typically clears within minutes.
4. Once verified, set the account as your default settlement destination
   for SEPA Instant flows.

### What cut-off times apply to SEPA Instant?

SEPA Instant is 24/7/365. There are no cut-off times. Funds settle within
10 seconds at the scheme level.

### Can I have multiple settlement accounts per currency?

Yes. You can configure one default settlement account per currency and an
unlimited number of additional accounts that you can route to by API.

### How is FX configured?

FX is configured per currency pair. Each pair has a default markup that
your account team agrees with you. The Client Guidance Agent cannot confirm
or change markup levels — commercial terms are out of scope.

---

## Signatories and master agreement

### Who should sign the master agreement?

Anyone who appears on the register of directors as having authority to bind
the entity, or any individual to whom that authority has been delegated by a
board resolution. The Client Guidance Agent cannot judge whether a specific
person is an authorised signatory; that is decided by Legal Operations after
signatory verification.

### Can we use electronic signature?

Yes. Contoso Payments Inc. accepts qualified electronic signatures (QES)
and DocuSign envelopes. Your account team will dispatch the envelope after
approval routing completes.

---

## Out-of-scope topics

The Client Guidance Agent will hand off to a human contact for any of the
following:

- Anything that requires **compliance judgement** (KYC outcome, AML risk
  rating, sanctions hit assessment).
- Anything that requires **signatory verification or legal sign-off**.
- Anything related to **pricing, fees, take-rates or commercial terms**.
- Anything that would **change case status** (forcing a step to complete,
  reordering steps, skipping reviews).

See `escalation-contacts.md` for the named contacts the agent can route to.
