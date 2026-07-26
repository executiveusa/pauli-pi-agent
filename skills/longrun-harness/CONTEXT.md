# Long-running Harness Context

## Route

Use this skill only after reading:

1. `AGENTS.md`
2. `WORKFLOW.md`
3. `icm/CONTEXT.md`
4. `icm/workstreams/digital-student/CONTEXT.md` for learning missions
5. The current mission manifest and checkpoint

## Current implementation

- Runtime package: `packages/longrun-harness/`
- Mock demonstration: `npm run demo --workspace=@pauli/longrun-harness`
- Focused test: `npm run test --workspace=@pauli/longrun-harness`
- ICM outputs: `icm/runs/<mission-id>/`

## Stage routing

| Work | Stage |
|---|---|
| Inspect course and existing harness | `icm/stages/01-inspect/` |
| Define manifest, schemas, budgets, and proof | `icm/stages/02-specify/` |
| Implement one bounded slice | `icm/stages/03-build/` |
| Run failure, duplicate, evidence, and filing checks | `icm/stages/04-verify/` |
| Prepare reviewed handoff | `icm/stages/05-release/` |

## Invariants

- One browser collector by default.
- Parallelize local lesson analysis, not authenticated browser navigation.
- Every completed lesson has one accepted homework packet.
- Every conclusion preserves source evidence.
- Failed jobs cannot silently disappear.
- Course completion requires module and course synthesis.
- Candidate memory is not approved memory.
- The builder cannot approve its own output.

## Stop conditions

Stop when authorization is unclear, the source changes unexpectedly, retry budget is exhausted, duplicate outputs appear, evidence is missing, or the workflow attempts an unapproved external action.
