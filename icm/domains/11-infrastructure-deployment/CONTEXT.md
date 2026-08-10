---
type: domain
status: active
owner_path: packages/secrets
consumes: [runtime-artifacts, secrets, deployment-config]
produces: [deployments, compute, durable-services, observability]
edges: [../../integrations/CONTEXT.md, ../../surfaces/CONTEXT.md]
governance: sensitive
---

# Infrastructure and Deployment

One job: provide secure runtime, storage, compute, deployment, and observability for Pauli capabilities.

## Owners

- `packages/secrets/` — secret schema/resolution.
- `packages/pods/` — compute/pod management.
- `vercel.json` and Vercel-linked projects — hosted web surfaces.
- database/Supabase assets under product packages — durable indexed state where present.
- `ops/` — operator-side services that do not belong in browser bundles.

## Rules

- Deployment READY proves the build/deploy transaction, not end-to-end product wiring.
- Browser artifacts never receive server credentials.
- Datastores must declare tenancy, RLS/authorization, migrations, backup/rollback, and source-of-truth relationship.
- One canonical production surface per product responsibility; previews and historical sibling projects remain labeled.
- Runtime logs and health evidence belong in audits/evidence, not hidden chat history.
