# Evidence Collection

## Slash Command: `/evidence-collect`

Assemble the evidence bundle for a completed client deliverable — the artifact that lets the studio prove its work instead of just claiming it, per `WORKFLOW.md`'s Evidence-Based Delivery rule.

## Usage

```text
/evidence-collect [client slug or deliverable path]
```

## What This Does

1. Locates `QA_REPORT.md` (and `SECURITY_REPORT.md`, if the gate applied) for the deliverable.
2. Gathers supporting evidence the AC actually requires: screenshots, a working URL, test/build output, before/after comparisons.
3. Writes a single client-facing handoff doc (e.g. `clients/{slug}/CLIENT_HANDOFF.md`, matching the contract already used by `skills/webflow-template-forge`) that links every piece of evidence rather than asserting "this works."
4. Flags anything the AC promised but the evidence doesn't yet cover — this is itself a finding, not something to paper over.

Use this as the last step before telling a client (or the user) that something is done.
