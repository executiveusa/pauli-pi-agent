# Pre-PR Quality Gates

## Slash Command: `/pre-pr`

Run before opening a PR or shipping a client deliverable.

## Usage

```text
/pre-pr [deliverable description or file paths]
```

## What This Does

1. Dispatches the `qa-specialist` subagent to independently verify the deliverable against its Acceptance Criteria/Definition of Done. Never the same agent run that produced the work.
2. If the deliverable touches secrets, auth, payments, client PII, or a public deployment, also dispatches `security-engineer`.
3. Waits for both gates to return "Approved for release" before proceeding. If either routes back with blocking issues, fixes them (or asks the user how to proceed) and re-runs the gate — does not skip ahead.
4. Once both gates pass, dispatches `release-shepherd` to run `npm run check`, assemble the evidence bundle, and draft PR metadata.
5. Opens the PR as a draft per this repo's standing PR conventions — final merge stays with the human.

See `WORKFLOW.md` for the full Role Exit States chain this command implements.
