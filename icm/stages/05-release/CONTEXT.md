# Stage 05 - Release

## Purpose

Prepare an approved change for human review, merge, deployment, or client handoff.

## Preconditions

- Stage 04 verdict allows release.
- Required QA and security reports exist.
- Rollback steps are executable.
- Ownership of code, credentials, domains, data, and infrastructure remains clear.

## Process

1. Assemble the evidence bundle.
2. Summarize changed paths and user-visible behavior.
3. State what was not changed or verified.
4. Confirm migration and rollback notes.
5. Prepare branch or pull-request metadata.
6. Leave merge, production deployment, public publishing, and external communication to the authorized human unless explicitly approved.

## Required handoff

```text
DECISION
CHANGES
PROOF
STATUS
COMMERCIAL IMPACT
RISKS
ROLLBACK
NEXT
HUMAN APPROVAL
```

## Outputs

- `HANDOFF.md`
- evidence links
- release notes
- rollback instructions
- one recommended next action

## Acceptance criteria

- No “done” claim exceeds the evidence.
- Production and deployment state are stated precisely.
- Human approval items are explicit.
- The next action is bounded and commercially aligned.
