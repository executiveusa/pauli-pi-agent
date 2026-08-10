---
type: surface
status: partial
owner_path: ops/pauli-control + Supabase pauli-control Edge Function
consumes: [operator-commands, authenticated-user-intent, approval-decisions]
produces: [mission-state, agent-runs, job-json, status, stop-actions]
edges: [../domains/01-control-plane/CONTEXT.md, mission-control.md, ../integrations/supabase.md]
governance: sensitive
---

# Pauli Control Bridges

Pauli currently has **two distinct control bridges**. They must remain explicitly separated until a canonical contract absorbs their useful behavior.

## 1. Local Pi process bridge — `ops/pauli-control/`

This is the strongest verified repo-local execution primitive. It exposes bearer-protected HTTP operations for health, agent listing, run, run status, and stop, and launches Pi as a child process.

Strengths:

- explicit plan/read/write/ship modes;
- separate `ALLOW_WRITE` and `ALLOW_SHIP` gates;
- job JSON persisted under `ops/pauli-control/jobs/`;
- real process stop/status behavior while the bridge remains alive;
- bounded repository path handling.

Durability gap:

- the running-process map is in memory;
- persisted job files survive restart, but live child handles do not rehydrate into a durable execution engine.

Canonical role:

Keep it as a **local/owned-compute executor adapter**, not as the browser-facing Mission Control API.

## 2. Cloud control API — Supabase Edge Function `pauli-control`

Live verification on 2026-08-10 found an ACTIVE Supabase Edge Function named `pauli-control` with JWT verification enabled.

It currently provides:

- `overview` — organization metrics, missions, agents, approvals, runtime providers and incidents;
- `create_mission` — inserts an `INTENT` mission and event;
- `decide_approval` — approves/denies a pending approval.

It verifies the Supabase user, resolves organization membership, then performs direct Postgres writes.

### Security mismatch found

The cloud function is **not yet the canonical write API** because its role checks are broader than the table RLS contract:

- `create_mission` checks membership but does not require owner/admin/operator;
- `decide_approval` allows owner/admin/operator/reviewer, while Pauli RLS reserves approval writes to owner/admin/reviewer.

Because the function connects directly to Postgres, those manual checks are the real authorization boundary for the function. Until they are hardened, Mission Control should not route privileged writes through it.

Canonical role for now:

- useful cloud-control reference and read/overview adapter;
- candidate for a hardened `pauli-control-v2` contract;
- do not silently replace stricter JWT/RLS Mission Control writes with it.

## 3. Deterministic state machine — `pauli_private.mission_control_tick()`

This is the durable cloud orchestration owner, scheduled every 10 seconds.

Observed state progression:

`INTENT → UNDERSTOOD → PLANNED → STAFFED → PROVISIONED → EXECUTING`

It:

- normalizes accepted intent;
- selects `agentforge-production-loop-v1`;
- materializes sequential durable mission tasks;
- verifies the canonical Pauli agent exists;
- requires a healthy governed runtime before provisioning;
- emits mission events and incidents instead of silently failing.

New Mission Control conversational intake deliberately saves new drafts as `WAITING_APPROVAL` so this scheduler cannot consume them until an authorized human explicitly releases the mission to `INTENT`.

## 4. Runtime worker — `pauli-runtime-v2`

The private runtime Edge Function is invoked through `pauli_private.invoke_supabase_runtime()` using a token stored in Supabase Vault. Its health is checked every minute and blocked missions are evaluated for recovery every minute.

Current verified provider state: `supabase-openai` is `offline` because no model-provider credential is configured in the Edge Function environment. Internal Pauli runtime URL/token configuration exists; model provider configuration does not.

## Canonical target

```text
Mission Control
  -> authenticated user JWT + role/RLS
  -> durable pauli mission/approval/event state
  -> deterministic mission_control_tick
  -> governed runtime provider registry
  -> local/cloud executor adapter
  -> evidence + checkpoints + memory
```

Browser code never receives privileged control tokens or service-role credentials.
