---
type: domain
status: active
owner_path: packages/secrets
consumes: [integration-intent, secrets, tenant-context]
produces: [provider-clients, connection-status, tool-capabilities]
edges: [../../integrations/CONTEXT.md, ../11-infrastructure-deployment/CONTEXT.md]
governance: sensitive
---

# Integrations

One job: expose external systems to Pauli through explicit, typed, least-privilege adapters.

## Owners

- `packages/secrets/` — environment/schema and secret-resolution contracts.
- integration registries under agent/runtime packages.
- MCP/CLI references in `skills/SKILLS_REGISTRY.md`.
- provider-specific packages and external plugin adapters where installed.

## Integration law

A key name or client implementation is not proof that a service is live. Every integration is classified independently as:

1. `CODE_DECLARED`
2. `DEPLOYMENT_CONFIGURED`
3. `LIVE_VERIFIED`
4. `LEGACY`
5. `UNKNOWN`

Prefer server-side brokered integrations. Never move long-lived provider credentials into browser bundles. Record human approval requirements next to write-capable integrations.
