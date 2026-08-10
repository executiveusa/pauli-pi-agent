# ICM Control-Plane Organization Migration

Date: 2026-08-10
Branch: `chore/icm-control-plane-audit`
Baseline: `main` at `0cc2e7b5657dfa4d3da881965c1ce4bb8ffca9b1`

## Purpose

Make the entire Pauli repository navigable through one ICM context graph without breaking existing runtime imports, commands, deployments, or historical paths.

## What changed

Additive context/skill/artifact layer only:

- canonical ICM node schema;
- 13 capability domain shelves;
- control-surface inventory;
- integration inventory and Supabase boundary;
- Pauli evolution timeline;
- selective upstream Pi harvest policy;
- control-plane consolidation workstream;
- dated full-stack wiring audit;
- installed ICM Architect, Full-Stack Wiring Audit, New Look, and Gauntlet Loop skills;
- New Look repo-truth, capability-map, and UI/backend-audit artifacts;
- root/ICM routers and skill catalog updated to point to real shelves.

## Runtime paths deliberately not moved

- `packages/*`
- `ops/*`
- `agents/*`
- `.claude/*`
- `.agents/*`
- `.pi/*`
- `brain-dashboard/*`
- `companies/*`
- `factory/*`

Reason: these paths have imports, workspace/package relationships, deployment roots, commands, skill loaders, or historical consumers. ICM now points to them. A later physical move is allowed only after consumer inventory and verification.

## Runtime defects discovered but not changed in this docs-only slice

1. S0 browser-secret injection architecture in `packages/web-ui/example/vite.config.ts`.
2. Mission Control static/demo state is not connected to the real control bridge.
3. Historical brain-dashboard deployment/search divergence.
4. Brain activity logging policy/client mismatch.
5. `brain-dashboard/next.config.ts` ignores TypeScript build errors.
6. `packages/secrets/src/third-party-integrations.ts` contains a malformed template expression candidate.
7. Long-running control bridge state is not fully restart-durable.

These require code-change slices and the repository's `npm run check` / focused verification gates.

## Supabase migration gate

No live database mutation belongs in this ICM-only branch without first inspecting Botanic Creations. The desired model is an isolated `pauli` schema plus private security helper/state schema, RLS/forced RLS, organization boundaries, migrations, no generic shared `public.*` app tables, and no anonymous privileged access. If compatible Pauli schemas already exist, extend/reconcile rather than duplicate.

## Absurd branch separation

`feat/skool-absurd-durability` remains a separate unmerged code branch. Do not mix it into this organization branch. After its required code check passes, its durability pattern can be reused for the Control Plane workstream.

## Rollback

Because this slice is additive documentation/skill routing:

1. restore the previous root `CONTEXT.md`, `icm/CONTEXT.md`, `icm/MANIFEST.md`, and `skills/CATALOG.md` from baseline;
2. remove the newly added ICM domain/surface/integration/history/upstream/audit/workstream nodes, installed skills, and New Look audit artifacts;
3. no executable runtime rollback is required because runtime files were not changed.

## Next slices

1. Close S0 browser-secret boundary.
2. Define authenticated server-side Mission Control API over `ops/pauli-control`.
3. Inspect and provision/reconcile Botanic Creations Pauli durable state with RLS.
4. Connect Absurd-backed long-running missions.
5. Wire real Mission Control.
6. Run New Look candidate generation + Gauntlet after backend truth is real.
7. Selectively port upstream Pi Tier A reliability/security fixes.
