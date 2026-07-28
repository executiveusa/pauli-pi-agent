# ICM Task Router

## Purpose

Route one agent through a small, inspectable context set. Each task should load only the relevant workstream, stage contract, skill category, and evidence files.

## Routing table

| Task | Load |
|---|---|
| Repository inspection or architecture | `stages/01-inspect/CONTEXT.md`, `skills/categories/repo-intelligence/CONTEXT.md` |
| Specification or planning | `stages/02-specify/CONTEXT.md`, relevant workstream |
| Implementation | `stages/03-build/CONTEXT.md`, relevant package README, selected skills only |
| Browser or authenticated-site work | `stages/03-build/CONTEXT.md`, `skills/categories/browser-learning/CONTEXT.md`, domain policy |
| Knowledge ingestion or second brain | `stages/04-verify/CONTEXT.md`, `skills/categories/knowledge-memory/CONTEXT.md` |
| QA, security, or release | `stages/04-verify/CONTEXT.md`, `stages/05-release/CONTEXT.md`, `WORKFLOW.md` |
| Client or revenue delivery | `stages/02-specify/CONTEXT.md`, `stages/04-verify/CONTEXT.md`, commercial brief |

## Required stage sequence

1. `01-inspect` - record baseline and blast radius.
2. `02-specify` - define outcome, constraints, proof, rollback, and selected skills.
3. `03-build` - make the smallest isolated change.
4. `04-verify` - run independent evidence and safety checks.
5. `05-release` - prepare handoff; human retains merge and production authority.

Stages may be skipped only when the stage contract explicitly allows it and the reason is recorded in the task handoff.

## Context budget

- One active workstream.
- One active stage.
- Three to seven selected skills maximum.
- Load summaries and manifests before full source documents.
- Store intermediate state as files, not hidden conversational memory.

## Canonical manifests

- `MANIFEST.md` - repository domain map.
- `skills/CATALOG.md` - installed and referenced skill routing.
- `workstreams/` - active bounded initiatives.
- `handoffs/` - durable task state.
- `evidence/` - verification artifacts and reports.
- `migration/` - path changes, compatibility notes, and rollback records.
