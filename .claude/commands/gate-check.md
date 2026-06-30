# Stop-the-Line Gate Check

## Slash Command: `/gate-check`

Run before starting implementation on any client-facing or revenue-producing task.

## Usage

```text
/gate-check [task description]
```

## What This Does

1. States the Acceptance Criteria for the task — what "done" looks like, in terms the client would recognize.
2. States the Definition of Done — what evidence will prove it ("a deployed URL", "a passing QA_REPORT.md", "a working booking flow screenshot").
3. If either is missing or vague, stops and asks the user to clarify before any implementation work begins, per `WORKFLOW.md`.
4. Runs the Pattern Discovery Protocol: checks `skills/revenue-systems-agent/niche-pattern-library.md`, `skills/SKILLS_REGISTRY.md`, and `factory/` for an existing reusable pattern before allowing net-new work.
5. Only after AC/DoD are confirmed and pattern discovery is done, proceeds to implementation.

See `WORKFLOW.md` for the full Stop-the-Line Gate rationale.
