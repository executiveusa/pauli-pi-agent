# Stage 03 - Build

## Purpose

Implement the smallest approved slice while preserving package boundaries and rollback.

## Inputs

- Approved Stage 02 specification
- Files explicitly listed in scope
- Relevant package README
- Selected skills only

## Process

1. Confirm baseline has not changed materially.
2. Create or use a feature branch.
3. Make minimal isolated edits.
4. Preserve existing interfaces unless the specification authorizes a change.
5. Never expose secrets or store credentials.
6. Add deterministic checks for new behavior.
7. Record each changed path and reason.
8. Stop before external publishing, production deployment, or irreversible actions.

## Outputs

- Implementation changes
- `CHANGES.md`
- focused tests or validation scripts
- updated handoff state

## Acceptance criteria

- Every change maps to an acceptance criterion.
- No unrelated cleanup or rewrite is included.
- Existing code and skill locations remain compatible unless migration was explicitly scoped.
- The work can be rolled back by reverting the branch commits.

## Stop conditions

Stop on unexpected cross-package breakage, unavailable credentials, blocked authentication, unclear external terms, or a requirement to bypass security controls.
