# Stage 02 - Specify

## Purpose

Convert the inspected baseline into one bounded, testable change.

## Inputs

- Stage 01 outputs
- User outcome and constraints
- Relevant workstream context
- Selected skill summaries

## Process

1. Define measurable acceptance criteria.
2. Define required proof.
3. Define files allowed to change.
4. Define files and behaviors that must not change.
5. Define permissions and human approval points.
6. Define rollback.
7. Select 3-7 skills maximum.
8. Break work into one verifiable slice.

## Required specification header

```text
MODE:
OUTCOME:
TARGET:
CONSTRAINTS:
PROOF:
COMMERCIAL VALUE:
FILES IN SCOPE:
ROLLBACK:
HUMAN APPROVAL:
```

## Outputs

- `SPEC.md`
- `acceptance-criteria.md`
- `install-plan.md` or `change-plan.md`
- `rollback.md`

## Acceptance criteria

- The change can be independently tested.
- Scope is smaller than the full vision.
- No net-new framework is introduced when an existing capability suffices.
- Consequential actions have explicit approval gates.

## Stop conditions

Stop when the requested outcome cannot be proven, the task replaces outreach with speculative engineering, or the work creates a fourth active workstream.
