---
type: integration
status: unknown
owner_path: brain-dashboard
consumes: [memory-index, control-plane-state]
produces: [durable-rows, query-state]
edges: [../domains/08-memory-knowledge/CONTEXT.md, ../domains/01-control-plane/CONTEXT.md]
governance: sensitive
---

# Supabase

## Existing repo assets

`brain-dashboard/supabase-migration.sql` defines `public.vault_index` and `public.agent_log` with anon reads and service-role writes. This is a historical brain-dashboard model, not the target ICM control-plane tenancy model.

## Target for Pauli Control Plane

If Botanic Creations is used, Pauli should follow an isolated app-schema pattern rather than add more generic `public.*` tables:

- `pauli` — organization-scoped, RLS-protected control-plane state;
- `pauli_private` — privileged helpers/internal state with no anonymous access;
- explicit `organization_id` ownership on tenant data;
- membership/role helper functions;
- forced RLS where appropriate;
- migrations and rollback tracked in repository;
- no raw secrets in application tables.

## Mutation gate

Before creating or altering anything, inspect the live Botanic Creations project and reconcile existing schemas/tables/policies. Never assume an earlier proposal was actually applied. If compatible `pauli` schemas already exist, migrate/extend them rather than create duplicates.
