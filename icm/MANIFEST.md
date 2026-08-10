# PAULI ICM Manifest

## Architecture rule

ICM is the canonical context and navigation architecture. Executable code remains in stable runtime paths; ICM nodes point to it. Physical moves require a consumer inventory, import/deployment review, verification, and rollback plan.

## Root planes

| Plane | Canonical location | What it owns |
|---|---|---|
| Engineering law | `AGENTS.md`, `WORKFLOW.md` | repo rules, QA/security/release gates |
| Context architecture | `icm/` | routing, domains, surfaces, integrations, workstreams, evidence/history |
| Runtime | `packages/`, `ops/`, `agents/` | executable behavior |
| Skills | `skills/`, compatibility skill roots | reusable instructions |
| Company context | `companies/` | company-scoped facts, briefs, signals, products |
| Product/factory outputs | `factory/`, workstream outputs | generated artifacts and reusable patterns |

## ICM shelves

```text
icm/
├── _meta/             # graph/schema rules
├── stages/            # 01 inspect → 05 release
├── domains/           # 13 capability families
├── surfaces/          # chat, mission control, brain, terminal, control bridge
├── integrations/      # external platform/data connection inventory
├── workstreams/       # bounded initiatives
├── audits/            # evidence-backed wiring/security findings
├── history/           # Pauli evolution/provenance
├── upstream/          # selective Pi harvest decisions
├── migration/         # compatibility/path migration records
├── handoffs/          # durable task continuation state when used
└── evidence/          # verification artifacts when used
```

## Capability domains

1. Control Plane
2. Agent Runtime
3. Coding
4. Design
5. Storytelling & Content
6. Video & Media
7. Research & Learning
8. Memory & Knowledge
9. Browser Automation
10. Integrations
11. Infrastructure & Deployment
12. Security & Governance
13. Business & Revenue

Route through `domains/CONTEXT.md`.

## Canonical control-plane direction

One operator product should converge on:

`Mission Control (chat-first) → authenticated server routes → permission/approval → mission/control service → Pi runtime/tools → durable state/evidence`.

Current surfaces are catalogued under `surfaces/`; they must not be treated as equally canonical.

## Runtime owners that remain in place

- `packages/agent/` — core agent/runtime extensions.
- `packages/ai/` — model/provider layer.
- `packages/coding-agent/` — Pi coding CLI/session runtime.
- `packages/tui/` — terminal UI.
- `packages/web-ui/example/` — existing hosted compatibility chat SPA.
- `brain-dashboard/` — second-brain/Mission Control UI source to be consolidated.
- `ops/pauli-control/` — current real backend run/status/stop bridge.
- `packages/data-processor/`, `packages/deep-research/`, `packages/content-engine/`, `packages/youtube-kg-agent/`, `packages/pods/`, `packages/secrets/` — domain runtimes.

## Skill locations

The logical catalog is `skills/CATALOG.md`. Existing compatible loaders may still discover skills under:

- `skills/<name>/`
- `.agents/skills/<name>/`
- `.pi/skills/<name>/`
- `.claude/skills/<name>/`
- `.claude/agents/`
- `.claude/commands/`

Canonical reusable skills should converge under `skills/`; compatibility copies/pointers may remain until every consumer is verified.

## Active workstreams

- `workstreams/control-plane/` — consolidate control surfaces, secret boundary, durable mission state, New Look, upstream harvest.
- `workstreams/digital-student/` — authorized learning and second-brain ingestion.

## Migration law

1. Inventory current consumers.
2. Add canonical ICM node/path.
3. Update routing/consumers.
4. Verify old and new entry points.
5. Remove/move legacy paths only when evidence proves safety.
6. Record rollback.

No folder is moved merely to make the tree prettier.
