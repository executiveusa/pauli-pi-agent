# Pauli Control Plane Consolidation

## Outcome

Give Pauli one canonical, chat-first operator surface that can show and control real missions, approvals, agents, integrations, memory/evidence, and long-running execution without exposing privileged secrets to the browser.

## Canonical architecture

```text
Human
  -> Mission Control (Next.js, chat-first)
  -> authenticated server routes
  -> organization membership + permission/approval policy
  -> pauli / pauli_private data plane in Botanic Creations
  -> mission/control service
  -> ops/pauli-control and/or durable worker layer
  -> Pi runtime/tools/integrations
  -> mission events + evidence + memory
  -> Mission Control status/graph/output views
```

## Verified data-plane decision

Botanic Creations already contains the canonical `pauli` and `pauli_private` schemas. The `pauli` application tables are RLS-enabled and already model organizations, memberships, agents, missions, tasks, events, approvals, integrations, memory, documents, evidence, runtime runs, tools, checkpoints, experiments, incidents, evaluations, model routing, and related state.

**Do not create another Supabase project or duplicate Pauli schema.** Wire the product to this existing data plane through authenticated server-side contracts.

See `../../integrations/supabase.md` and `../../integrations/botanic-creations.md`.

## Bounded slices

### Slice 0 — ICM truth map — COMPLETE ON AUDIT BRANCH

- capability domains;
- surface inventory;
- integration inventory;
- history and upstream policy;
- full-stack wiring audit;
- live Botanic Pauli schema reconciliation;
- canonical New Look / wiring / Gauntlet / ICM skills.

Exit: one inspectable map, no runtime path moves.

### Slice 1 — close S0 secret boundary

- remove build-time `.env` credential injection into browser globals;
- broker model/tool calls server-side;
- prove built browser assets contain no provider/service secrets;
- keep local CLI provider use working;
- repair the malformed third-party integration registry source while this code path is under verification.

Exit: security review passes and `npm run check` passes for the code slice.

### Slice 2 — canonical server control contract

- normalize health/agents/run/status/stop/approval endpoints;
- authenticate user identity server-side;
- resolve `organization_id` and role from `pauli.memberships`;
- map plan/read/write/ship to policy and `pauli.approvals`;
- create/read missions, tasks and correlated mission events;
- preserve `ops/pauli-control` compatibility while new server routes are introduced.

### Slice 3 — durable mission state — DATA MODEL EXISTS, WIRING REQUIRED

Use the existing live tables rather than designing another store:

- `pauli.missions`
- `pauli.mission_tasks`
- `pauli.mission_events`
- `pauli.approvals`
- `pauli.runtime_runs`
- `pauli.tool_runs`
- `pauli.checkpoints`
- `pauli.evidence_receipts`
- `pauli.memory_entries`
- `pauli.integration_connections`

Connect the durable-worker/Absurd pattern for long-running execution where appropriate. Preserve event correlation, idempotency, retry policies, budgets/spend, approval scope, evidence, and restart recovery.

Exit proof includes member access, cross-org denial, operator write, reviewer approval, durable restart/resume, evidence readback, and memory readback.

### Slice 4 — wire Mission Control

- replace local/static Mission Control state with real server queries/actions;
- show mission/task progress from durable state;
- stream/refresh correlated events and evidence;
- add explicit approval queue backed by `pauli.approvals`;
- show real agents/runtime/integration state;
- add graph view derived from ICM plus runtime state.

### Slice 5 — absorb chat + memory surfaces

- put Pi chat in the same Mission Control shell;
- route chat intent into mission creation rather than browser-direct privileged execution;
- fold useful second-brain search/note views into supporting panels backed by canonical memory/documents;
- label/deprecate old standalone deployments.

### Slice 6 — New Look + Gauntlet

Run `skills/new-look/` only against the now-truthful control plane:

- repo-truth/capability audit;
- five divergent chat-first candidates;
- English/Spanish/Swahili contract;
- ADHD, accessibility, taste, Apple-level interaction and outcome gates;
- separate Gauntlet builder/critic comparison;
- capability-preserving upgrade spec;
- implement the winning surface only after backend wiring is real.

### Slice 7 — upstream harvest

- port Tier A upstream Pi reliability/security improvements individually;
- record provenance and collision tests;
- defer package-scope/runtime migration to a dedicated compatibility project.

## Definition of done

- one canonical production control URL;
- no privileged browser credentials;
- authenticated organization/role enforcement;
- real mission/approval/status controls using the existing Pauli data plane;
- durable restart/resume for long-running missions;
- evidence-linked and approval-aware second brain;
- ICM graph can answer where every major capability, surface, integration and source of state lives;
- legacy/sibling surfaces are explicitly labeled and no longer ambiguous;
- selected upstream patches are traceable and independently verified.
