# PAULI ICM Context Router

This repository uses the Interpretable Context Methodology (ICM): filesystem structure is the orchestration layer, markdown carries scoped context, and runtime code stays in stable package boundaries until its consumers are verified.

## Start here

1. Read `AGENTS.md` — repository engineering law.
2. Read `WORKFLOW.md` — QA, security, release, and human gates.
3. Read `icm/CONTEXT.md` — canonical task router.
4. Load one active stage, one primary domain, and only the required skills.
5. Follow links to runtime owners; do not load the whole repository or skill library.

## Canonical ICM shelves

- `icm/stages/` — inspect → specify → build → verify → release.
- `icm/domains/` — capability graph: control, runtime, coding, design, story/content, video, research, memory, browser, integrations, infrastructure, governance, business.
- `icm/surfaces/` — operator/control interfaces and their real wiring state.
- `icm/integrations/` — external systems and live-verification status.
- `icm/workstreams/` — bounded initiatives such as Control Plane and Digital Student.
- `icm/audits/` — evidence-backed wiring/security/operability findings.
- `icm/history/` — Pauli evolution and provenance.
- `icm/upstream/` — selective upstream Pi harvest decisions.
- `skills/` — reusable agent instructions; `skills/CATALOG.md` is the logical index.

## Runtime truth

- `packages/` — executable product code and shared libraries.
- `ops/` — operator/server-side services such as `ops/pauli-control/`.
- `agents/`, `.claude/agents/` — specialized runtime/review roles.
- `companies/` — company-scoped context and products.
- `factory/` — generated work and reusable production patterns.

## Active initiatives

- `icm/workstreams/control-plane/` — consolidate Pauli into one real Mission Control and server-side control plane.
- `icm/workstreams/digital-student/` — authorized learning and evidence-backed knowledge conversion.

## Operating constraint

ICM organizes and routes existing capability. It must not duplicate working implementations, expose secrets, silently change external behavior, or claim a connection/migration is complete without evidence.
