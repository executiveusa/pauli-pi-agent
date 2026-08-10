# Full-Stack Wiring Audit — Pauli Pi Agent

Date: 2026-08-10
Branch baseline: `main` at `0cc2e7b5657dfa4d3da881965c1ce4bb8ffca9b1`
Method: UI → backend → dependency → durable state → live runtime. A code declaration is not counted as a live integration.

## Executive diagnosis

Pauli has accumulated substantial capability, but the control plane has fragmented. The current hosted repo URL is a generic Pi chat example; Mission Control exists in repo but is not proven wired to the real bridge; the strongest actual backend control is `ops/pauli-control`; memory/dashboard deployments have diverged into separate repositories; and the browser build contains a design that can embed privileged service/provider keys.

The durable data plane is **not missing**: live inspection of Botanic Creations verified a mature `pauli` / `pauli_private` schema with organization-scoped RLS, missions, tasks, events, approvals, agents, integrations, memory, evidence, runtime state, checkpoints and private control helpers. The problem is now clearly **wiring and control-surface consolidation**, not database invention.

The correct next move is consolidation, not another standalone dashboard or another database.

## Capability matrix

| Capability | State | Severity | Evidence / reason | Resolution |
|---|---|---:|---|---|
| Hosted Pi chat loads | `COMPLETE` for page delivery, `PARTIAL` as Pauli product | S2 | `pauli-pi-agent.vercel.app` returns 200 but identifies itself as `Pi Web UI - Example`. | Move chat experience into canonical Mission Control shell. |
| Browser credential boundary | `MISWIRED` | **S0** | `packages/web-ui/example/vite.config.ts` reads repo `.env` and injects selected provider/service keys into `window.__AGENT_ENV__`. Current fetched production emitted `{}`, so this audit did not observe a current key leak, but the build path permits one. | Remove browser key injection; use authenticated server-side provider/tool broker; scan built assets. |
| Browser access to server-only capabilities | `PLACEHOLDER` / `PARTIAL` | S1 | Vite aliases/stubs `pg`, data processor, Infisical, tenant loader, migrations, and database modules. | Expose real capabilities through server routes/control service rather than browser stubs. |
| Mission Control UI | `UI_ONLY` / `PARTIAL` | S1 | Repo has Mission Control React UI but inspected core state is local/static; no proven calls to control bridge. | Wire to authenticated mission/approval/control API after contract is defined. |
| Control bridge | `BACKEND_ONLY` | S1 | `ops/pauli-control` provides real health/agents/run/status/stop and write/ship gates. | Promote behind server routes and durable state. |
| Control bridge restart durability | `PARTIAL` | S2 | Job JSON persists, but live child handles are held in an in-memory `Map`. | Use durable mission/runtime state and Absurd-backed long tasks; rehydrate inspectable execution after restart. |
| Botanic Creations Pauli data plane | `COMPLETE` as schema/security foundation, `PARTIAL` as app wiring | S1 | Live project `cyxdevcjycmffhmwxojh` contains `pauli` + `pauli_private`; all inspected Pauli application tables have RLS; policies use membership/role helpers. | Reuse it. Wire authenticated server APIs and run cross-org/write/approval E2E tests. |
| Durable mission model | `BACKEND_ONLY` | S1 | Live tables include `missions`, `mission_tasks`, `mission_events`, `approvals`, `runtime_runs`, `tool_runs`, `checkpoints`, `evidence_receipts`, `memory_entries`. | Make this the Mission Control source of truth rather than demo/local state. |
| Pauli private authorization/control helpers | `BACKEND_ONLY` | S1 | Verified SECURITY DEFINER helpers: `is_org_member`, `has_org_role`, `invoke_supabase_runtime`, `mission_control_tick`, `recover_runtime_blocked_missions`; privileged helpers are not granted to anon. | Invoke only through intended authenticated/server boundaries; test authorization and runtime paths. |
| Second-brain dashboard deployment | `MISWIRED` | S1 | Repo contains `brain-dashboard`, but its historical Vercel project deploys a separate GitHub repo. `/mission-control` there is 404. | Fold desired memory views into this repo's canonical Mission Control and create one deployment owner. |
| Historical brain search | `BROKEN` | S1 | Live `/api/search` returned 500: GitHub API path contains `/repos/undefined/undefined/`. | Replace historical source-of-truth assumptions; require configured server-side search adapters and health checks. |
| Brain activity logging | `MISWIRED` | S2 | Historical migration permits service-role writes; helper client uses anon key for insert and suppresses errors. | Use canonical `pauli.audit_log` / mission events/evidence through authenticated server writes. |
| Brain TypeScript release gate | `PARTIAL` | S2 | `brain-dashboard/next.config.ts` sets `ignoreBuildErrors: true`. | Remove after types/generated Supabase definitions are fixed; CI must type-check. |
| Separate `pauli-dashboard` | `MISWIRED` if treated as this repo control | S2 | Vercel metadata says it deploys `executiveusa/dashboard-agent-swarm`. | Label sibling/fleet module; do not treat as canonical Pauli Pi control UI. |
| Vercel deploy pipeline | `COMPLETE` for deployments | S3 | Main and feature previews reach READY; current main production page returns 200. | Keep, but add product-level E2E and secret scan. |
| Vercel Agent Runs observability | `DEPENDENCY_MISSING` | S3 | Team query returned no Agent Run projects for production in last 30 days. | Use Pauli's own mission/runtime/event/evidence telemetry rather than assuming Vercel Agent Runs exists. |
| Integration registry | `PARTIAL` | S2 | Code declares many providers; AgentMail/Composio/Latitude registry explicitly acknowledges shared-key “spaghetti.” Live `pauli.integration_connections` already supports provider/toolkit/permissions and `secret_ref`. | Route integrations through tenant-scoped records plus secret references; live-verify each provider independently. |
| Third-party integration registry source | `BROKEN` candidate | S1 | `packages/secrets/src/third-party-integrations.ts` ends `report +=` with a malformed template expression in `formatIntegrationReport`, indicating a parse/type failure if included in checks. | Repair on a code-change slice and run `npm run check`; do not hide behind unused path. |
| Supabase workspace advisors | `PARTIAL` / cross-project | S3 | Current security advisor warnings are in other Botanic schemas/public functions, not the Pauli application tables. Performance advisor marks many new/unused Pauli indexes as unused. | Do not mutate unrelated schemas from Pauli work. Retain Pauli indexes until real traffic establishes usage. |
| Upstream Pi parity | `PARTIAL` | S2 | Fork is `@mariozechner/pi-coding-agent` 0.67.2; upstream has crossed scope/runtime/API boundaries. | Selective harvest now; dedicated migration later. |
| ICM routing | `COMPLETE` at logical map level on audit branch | S3 | Root router, 13 domains, surfaces, integrations, workstreams, history, upstream policy and canonical skill catalog now exist without runtime path moves. | Keep logical map; migrate physical paths only with consumer proof. |

## Highest-priority findings

### S0 — remove browser secret injection

The current build configuration is structurally capable of placing provider/service credentials into public JS/HTML. This must be closed before the frontend is promoted or expanded. Current live HTML showed an empty `__AGENT_ENV__`, which reduces evidence of an active leak but does not make the architecture safe.

### S1 — choose and wire one control tower

Canonical owner:

- Interface: **Mission Control**, chat-first.
- Server execution bridge: `ops/pauli-control` during migration.
- Agent runtime: `packages/agent` / `packages/coding-agent`.
- Durable long-running execution: Absurd/durable worker pattern after its code gate passes.
- Durable control state: existing Botanic Creations `pauli` / `pauli_private` schemas.
- Memory/search: `pauli.memory_entries` / `documents` plus evidence-aware supporting views, not another headquarters.

### S1 — wire the existing database instead of replacing it

The live schema already models the desired operating system:

- organizations and roles;
- agents/persona/skill/runtime policies;
- mission intent and requested outcomes;
- dependent tasks with acceptance/retry contracts;
- correlated/idempotent mission events;
- scoped approvals with spend/use limits;
- integrations with permissions and secret references;
- runtime/tool runs with cost/token/latency/error data;
- checkpoints and recovery;
- evidence receipts;
- approved/safe memory.

Mission Control should expose this real state through server-side authorization rather than maintain local dashboard state or resurrect the historical public brain tables.

## New Look readiness

The canonical New Look skill is installed on the audit branch. Candidate generation should begin only after the S0 browser-secret contract and canonical server API are specified. Until then, styling the current SPA or demo Mission Control would optimize an interface around false backend assumptions.

## Release evidence required for the control-plane build

- browser bundle secret scan;
- authenticated member and cross-organization RLS tests;
- operator mission/task write tests;
- reviewer approval tests;
- correlated/idempotent mission-event tests;
- plan/read/write/ship approval tests;
- kill/restart/resume durable mission test;
- runtime invocation and error-path tests;
- evidence and memory readback;
- Mission Control E2E against real control state;
- legacy URL/deployment map;
- `npm run check` with no ignored errors for touched runtime packages.
