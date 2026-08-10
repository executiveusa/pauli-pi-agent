# Full-Stack Wiring Audit — Pauli Pi Agent

Date: 2026-08-10
Branch baseline: `main` at `0cc2e7b5657dfa4d3da881965c1ce4bb8ffca9b1`
Method: UI → backend → dependency → durable state → live runtime. A code declaration is not counted as a live integration.

## Executive diagnosis

Pauli has accumulated substantial capability, but the control plane has fragmented. The current hosted repo URL is a generic Pi chat example; Mission Control exists in repo but is not proven wired to the real bridge; the strongest actual backend control is `ops/pauli-control`; memory/dashboard deployments have diverged into separate repositories; and the browser build contains a design that can embed privileged service/provider keys.

The correct next move is consolidation, not another standalone dashboard.

## Capability matrix

| Capability | State | Severity | Evidence / reason | Resolution |
|---|---|---:|---|---|
| Hosted Pi chat loads | `COMPLETE` for page delivery, `PARTIAL` as Pauli product | S2 | `pauli-pi-agent.vercel.app` returns 200 but identifies itself as `Pi Web UI - Example`. | Move chat experience into canonical Mission Control shell. |
| Browser credential boundary | `MISWIRED` | **S0** | `packages/web-ui/example/vite.config.ts` reads repo `.env` and injects selected provider/service keys into `window.__AGENT_ENV__`. Current fetched production emitted `{}`, so this audit did not observe a current key leak, but the build path permits one. | Remove browser key injection; use authenticated server-side provider/tool broker; scan built assets. |
| Browser access to server-only capabilities | `PLACEHOLDER` / `PARTIAL` | S1 | Vite aliases/stubs `pg`, data processor, Infisical, tenant loader, migrations, and database modules. | Expose real capabilities through server routes/control service rather than browser stubs. |
| Mission Control UI | `UI_ONLY` / `PARTIAL` | S1 | Repo has Mission Control React UI but inspected core state is local/static; no proven calls to control bridge. | Wire to authenticated mission/approval/control API after contract is defined. |
| Control bridge | `BACKEND_ONLY` | S1 | `ops/pauli-control` provides real health/agents/run/status/stop and write/ship gates. | Promote behind server routes and durable state. |
| Control bridge restart durability | `PARTIAL` | S2 | Job JSON persists, but live child handles are held in an in-memory `Map`. | Move long missions to Absurd-backed durable tasks; rehydrate inspectable state after restart. |
| Second-brain dashboard deployment | `MISWIRED` | S1 | Repo contains `brain-dashboard`, but its historical Vercel project deploys a separate GitHub repo. `/mission-control` there is 404. | Fold desired memory views into this repo's canonical Mission Control and create one deployment owner. |
| Historical brain search | `BROKEN` | S1 | Live `/api/search` returned 500: GitHub API path contains `/repos/undefined/undefined/`. | Require GitHub repo env server-side; add health/config checks and error UI. |
| Brain activity logging | `MISWIRED` | S2 | Migration permits service-role writes; browser/helper client uses anon key for insert and suppresses errors. | Write through authenticated server route/service role or matching user-scoped RLS; never swallow failed audit writes silently. |
| Brain TypeScript release gate | `PARTIAL` | S2 | `brain-dashboard/next.config.ts` sets `ignoreBuildErrors: true`. | Remove after types/generated Supabase definitions are fixed; CI must type-check. |
| Separate `pauli-dashboard` | `MISWIRED` if treated as this repo control | S2 | Vercel metadata says it deploys `executiveusa/dashboard-agent-swarm`. | Label sibling/fleet module; do not treat as canonical Pauli Pi control UI. |
| Vercel deploy pipeline | `COMPLETE` for deployments | S3 | Main and feature previews reach READY; current main production page returns 200. | Keep, but add product-level E2E and secret scan. |
| Vercel Agent Runs observability | `DEPENDENCY_MISSING` | S3 | Team query returned no Agent Run projects for production in last 30 days. | Add explicit mission/agent observability rather than assuming Vercel Agent Runs exists. |
| Integration registry | `PARTIAL` | S2 | Code declares many providers; AgentMail/Composio/Latitude registry explicitly acknowledges shared-key “spaghetti.” | Move to tenant-scoped server-side integration records + secret references; live-verify independently. |
| Third-party integration registry source | `BROKEN` candidate | S1 | `packages/secrets/src/third-party-integrations.ts` ends `report +=` with a malformed template expression in `formatIntegrationReport`, indicating a parse/type failure if included in checks. | Repair on a code-change slice and run `npm run check`; do not hide behind unused path. |
| Supabase control-plane state | `UNTESTABLE` in this repo audit until live project inspection | S1 | Repo has only historical public brain tables; no current repo evidence alone proves Botanic Creations Pauli schemas. | Inspect Botanic live; reuse compatible isolated Pauli schemas or create RLS-protected schemas only after reconciliation. |
| Upstream Pi parity | `PARTIAL` | S2 | Fork is `@mariozechner/pi-coding-agent` 0.67.2; upstream has crossed scope/runtime/API boundaries. | Selective harvest now; dedicated migration later. |
| ICM routing | `PARTIAL` → improving on audit branch | S2 | Existing ICM router referenced skill-category paths that were not the new domain map. | Replace with canonical domain/surface/integration routing; keep runtime paths stable. |

## Highest-priority findings

### S0 — remove browser secret injection

The current build configuration is structurally capable of placing provider/service credentials into public JS/HTML. This must be closed before the frontend is promoted or expanded. Current live HTML showed an empty `__AGENT_ENV__`, which reduces evidence of an active leak but does not make the architecture safe.

### S1 — choose and wire one control tower

Canonical owner:

- Interface: **Mission Control**, chat-first.
- Server execution bridge: `ops/pauli-control` during migration.
- Agent runtime: `packages/agent` / `packages/coding-agent`.
- Durable long-running execution: Absurd pattern after its code gate passes.
- Durable control state: isolated, RLS-protected database schema after live Supabase inspection.
- Memory/search: supporting Mission Control view, not another headquarters.

### S1 — fix database/audit truth

Current brain logging/search paths are not reliable enough to be authoritative mission state. Mission and approval state must have explicit tenancy, write identity, errors, and durable checkpoints.

## New Look readiness

New Look can begin candidate generation after the S0 browser-secret contract and canonical server API are specified. Until then, styling the current SPA or demo Mission Control would optimize an interface around false backend assumptions.

## Release evidence required for the control-plane build

- browser bundle secret scan;
- authenticated control API tests;
- plan/read/write/ship approval tests;
- kill/restart/resume durable mission test;
- RLS tests for cross-organization access denial;
- Mission Control E2E against real control state;
- legacy URL/deployment map;
- `npm run check` with no ignored errors for touched runtime packages.
