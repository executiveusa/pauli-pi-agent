---
type: domain
status: active
owner_path: companies
consumes: [company-context, market-evidence, capabilities]
produces: [offers, campaigns, delivery-plans, revenue-evidence]
edges: [../05-storytelling-content/CONTEXT.md, ../03-coding/CONTEXT.md]
governance: sensitive
---

# Business and Revenue

One job: convert Pauli capabilities and company context into measurable business outcomes without mixing client facts across companies.

## Owners

- `companies/` — company-specific ICM factory context and product artifacts.
- `factory/` — generated/reusable production work.
- `packages/content-engine/` — signal/content synthesis.
- `agents/monetization/` and revenue-system skills where present.
- company-specific agents and briefs under `companies/*/`.

## Rules

Company facts remain company-scoped. Reusable workflows belong in skills/factory patterns. Client/user secrets and private evidence never become shared templates. Revenue claims require measured evidence; dashboards must not substitute hard-coded demo metrics for real outcomes.
