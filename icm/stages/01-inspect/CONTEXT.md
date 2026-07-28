# Stage 01 - Inspect

## Purpose

Establish the brownfield baseline before changing code, agent behavior, skills, paths, data, or deployment.

## Inputs

- Root `CONTEXT.md`
- `AGENTS.md`
- Relevant package or skill README
- Current task request
- Existing tests, workflows, and deployment configuration

## Allowed tools

Read, search, repository mapping, static analysis, safe status checks, and non-mutating browser inspection.

## Process

1. State mode, outcome, target, constraints, proof, commercial value, and rollback requirement.
2. Inventory relevant files and consumers.
3. Record current behavior and known failures.
4. Identify conventions and duplicate capabilities.
5. Estimate blast radius.
6. Select the smallest set of skills needed for specification.

## Outputs

- `baseline.md`
- `repo-map.md` or a scoped map
- `risk-log.md`
- `candidate-skills.md`
- recommendation: proceed, merge, park, or archive

## Acceptance criteria

- No implementation changes made.
- Relevant files and consumers identified.
- Existing behavior distinguished from assumptions.
- Rollback boundary is known.

## Stop conditions

Stop when ownership, authorization, production state, or destructive impact is unclear.
