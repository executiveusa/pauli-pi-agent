---
type: integration
status: active
owner_path: Botanic Creations / pauli schema
consumes: [missions, approvals, agent-state, memory, evidence, integrations, runtime-state]
produces: [durable-control-state, authorized-queries, mission-events, evidence-receipts]
edges: [../domains/08-memory-knowledge/CONTEXT.md, ../domains/01-control-plane/CONTEXT.md, botanic-creations.md]
governance: sensitive
---

# Supabase — Canonical Pauli Data Plane

## Live verification

Verified 2026-08-10 against Supabase project `botanic-creations` (`cyxdevcjycmffhmwxojh`, `us-west-1`, ACTIVE_HEALTHY).

The live project already contains the intended isolated architecture:

- `pauli` — organization-scoped application/control-plane state.
- `pauli_private` — privileged authorization/runtime helpers.

Do **not** create another Supabase project or duplicate Pauli schema for this agent.

## Live Pauli tables

All inspected `pauli` application tables have RLS enabled:

- identity/tenancy: `organizations`, `memberships`, `agents`;
- missions: `missions`, `mission_tasks`, `mission_events`, `checkpoints`;
- approval/governance: `approvals`, `audit_log`, `incidents`, `agent_evaluations`;
- execution: `runtime_providers`, `runtime_runs`, `tool_runs`, `compute_sessions`, `model_route_decisions`;
- memory/evidence: `memory_entries`, `documents`, `evidence_receipts`;
- integrations/workflows: `integration_connections`, `workflow_definitions`;
- experimentation/economics/world state: `experiments`, `treasury_entries`, `world_locations`, `world_presence`.

The schema already has the fields needed for the Mission Control contract, including original/normalized intent, requested outcome, task dependencies/capabilities, policy snapshots, budgets/spend, approval scopes/limits, event correlation/idempotency, evidence manifests, runtime cost/token data, safe/approved memory, and secret references for integrations.

## Authorization model

`pauli` policies use authenticated membership/role helpers in `pauli_private`.

Verified private `SECURITY DEFINER` helpers include:

- `is_org_member(target_org uuid)` — executable by authenticated users for RLS decisions;
- `has_org_role(target_org uuid, allowed_roles text[])` — executable by authenticated users for role decisions;
- `bootstrap_allowlisted_membership()` — postgres only;
- `invoke_supabase_runtime(jsonb)` — postgres only;
- `mission_control_tick()` — postgres only;
- `recover_runtime_blocked_missions()` — postgres only.

No anonymous/authenticated table grants were observed on `pauli_private.owner_allowlist` in the grant inspection. Keep privileged runtime/control helpers out of public browser paths.

## Historical repo assets

`brain-dashboard/supabase-migration.sql` defines old `public.vault_index` and `public.agent_log` tables. Those are a historical dashboard model and must **not** become the Mission Control source of truth.

Canonical state is the live `pauli` / `pauli_private` data plane. Useful brain-dashboard UI concepts can be adapted to it through authenticated server routes.

## Integration rule

Mission Control should use:

`authenticated human -> server route -> organization/role authorization -> pauli mission/approval/event state -> runtime/control service -> evidence/readback`

Do not expose service-role keys or privileged database functions to the browser. `integration_connections.secret_ref` should point to the secret manager rather than store raw credentials.

## Advisors

A 2026-08-10 Supabase advisor pass did not surface a Pauli-specific security warning. Workspace-level warnings exist in other Botanic schemas and should be handled by their owning projects rather than altered from the Pauli branch.

Performance advisor output currently marks a number of Pauli indexes as unused. Because this data plane is newly/partially wired, do not remove those indexes based on low usage alone; re-evaluate after Mission Control traffic exists.

## Next proof

Before production Mission Control is declared connected:

1. test authenticated member read;
2. test cross-organization denial;
3. test operator mission/task write;
4. test reviewer approval decision;
5. test event correlation/idempotency;
6. test server-side runtime invocation path;
7. test evidence and memory write/readback;
8. prove no browser bundle contains privileged credentials.
