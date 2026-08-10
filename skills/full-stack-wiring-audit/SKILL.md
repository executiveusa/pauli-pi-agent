---
name: full-stack-wiring-audit
description: Diagnose whether a product capability is actually connected end to end. Trace UI through backend, external dependency, durable state, and live runtime; classify every finding with exact wiring states and severity. Trigger on full-stack audit, wiring audit, why doesn't this work, what is actually connected, control tower diagnosis, integration audit, or production readiness.
category: qa-architecture
status: active
risk: high
requires_human_approval: false
---

# Full-Stack Wiring Audit

Audit reality, not intention. A component name, mock dashboard, API client, environment variable, migration file, or READY deployment is not proof of a working outcome.

Installed from the user-provided Full Stack Wiring Audit skill.

## Required trace

For each capability trace:

`human/UI intent -> frontend handler -> server/backend contract -> dependency/provider -> durable state -> observable result -> live runtime evidence`

At every hop identify the exact file/route/function/table/service and whether the next edge is real.

## Allowed states

Use exactly one primary state per capability:

- `COMPLETE`
- `UI_ONLY`
- `BACKEND_ONLY`
- `MISWIRED`
- `DEPENDENCY_MISSING`
- `PARTIAL`
- `PLACEHOLDER`
- `BLOCKED_BY_APPROVAL`
- `BROKEN`
- `UNTESTABLE`

## Severity

- `S0` — can leak secrets, lose/corrupt data, create uncontrolled spend, or violate an explicit safety boundary.
- `S1` — blocks a primary user outcome/control path.
- `S2` — major reliability/operability/quality gap with a workaround.
- `S3` — secondary capability/polish/observability gap.
- `S4` — cleanup or low-impact debt.

## Audit sequence

1. **Inventory user-visible outcomes.** What should a human be able to accomplish?
2. **Map UI controls.** Buttons, chat intents, forms, pages, commands, states.
3. **Trace handlers.** Verify each control calls a real function/route, not local/demo state.
4. **Trace server contracts.** Auth, input validation, permissions, approval, error handling.
5. **Trace dependencies.** API/CLI/MCP/database/worker existence and configuration.
6. **Trace durable state.** Identify authoritative data store, tenancy, RLS/authorization, migrations, idempotency, checkpointing.
7. **Trace runtime.** Inspect deployment/process/worker/queue/log evidence where available.
8. **Test the edge.** Prefer one controlled happy path and one failure/permission path.
9. **Record proof.** Exact evidence, not “looks wired.”
10. **Rank fixes.** S0/S1 first; avoid cosmetic work over broken contracts.

## Security checks

Always inspect for:

- provider/service keys shipped to browser bundles;
- credentials in repository or generated artifacts;
- authorization performed only in UI;
- public/anon database access inconsistent with intended privacy;
- unscoped service-role/admin tokens;
- browser automation extracting auth material;
- write endpoints without approval/idempotency/audit state.

Never print secret values. Record names/locations/state only.

## Mock/demo detection

Look for:

- `DEMO_*`, fixture arrays, sample metrics;
- local `useState` pretending to approve/run/retry;
- TODO/placeholder comments;
- API functions that swallow errors;
- frontend calls with no matching server route;
- backend routes with no frontend/control entry;
- migrations not proven applied;
- deployment projects sourced from a different repository.

## Output contract

Create/update a dated audit under `icm/audits/` with:

| Capability | State | Severity | Evidence | Missing edge | Resolution | Verification |
|---|---|---|---|---|---|---|

Then summarize:

- canonical control path;
- S0/S1 blockers;
- real vs demo surfaces;
- live vs declared integrations;
- durable-state truth;
- release proof required.

## Rule

Do not fix everything during inspection. First make the graph true. Runtime fixes move through Inspect → Specify → Build → Verify → Release and the repository's independent QA/security gates.
