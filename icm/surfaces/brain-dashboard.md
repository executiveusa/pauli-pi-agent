---
type: surface
status: partial
owner_path: brain-dashboard
consumes: [vault-index, agent-log, github-vault]
produces: [search-results, note-views, activity-views]
edges: [../domains/08-memory-knowledge/CONTEXT.md, ../integrations/supabase.md]
governance: sensitive
---

# Second Brain Dashboard

## Current repo implementation

`brain-dashboard/` is a Next.js second-brain UI with Supabase index/log support and GitHub/Tailscale-oriented vault access code.

## Verified historical deployment state

The Vercel project recorded by the local `.vercel/project.json` deploys from the separate `executiveusa/pauli-my-brain-is-full-crew` repository, not the current Pauli Pi repo. Its root renders, but `/mission-control` returns 404 and `/api/search` currently returns HTTP 500 because the GitHub repository variables resolve to undefined.

## Data-model concern

The repo migration creates public `vault_index` and `agent_log` tables with anon read. Its Supabase client uses the anon key for `logAgentAction()`, while the migration grants writes only to `service_role`; the function also swallows errors. Treat activity logging as miswired until a server-side write path or matching authenticated policy is proven.

## Decision

Keep the useful note/search UI concepts, but fold them into the canonical Mission Control rather than maintaining a separate operator product. Memory remains an ICM/domain capability with database indexes, not a second control plane.
