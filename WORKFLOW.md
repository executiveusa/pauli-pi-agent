# Delivery Workflow — Quality Gates for Agent-Produced Work

## Why This File Exists

Every dollar this studio makes comes from agent-produced work a client trusts enough to pay for, and every dollar it loses comes from agent-produced work that breaks in front of a client, leaks a secret, or has to be redone. This file is the governance layer that sits above every skill in `skills/` and every deployment in `skills/masterstack-flywheel/` — it defines how work moves from "started" to "the client can rely on it," independent of which skill or model did the work.

Adapted from the [SAFe Agentic Workflow (SAW)](https://github.com/bybren-llc/safe-agentic-workflow) pattern — credit to bybren-llc for the underlying methodology (MIT-licensed). This is a deliberately smaller subset, scoped to what actually moves revenue for a one-operator AI agency: independent quality/security review before anything ships, and evidence the client can see. It is not a mechanical port of SAW's full 11-role/24-command/18-skill harness.

## The Money Logic

| SAW principle | What it prevents | Revenue effect |
|---|---|---|
| Stop-the-Line Gate (no work starts without a defined "done") | Building the wrong thing, scope drift, wasted agent-hours | Lower cost per client build → higher margin |
| Non-collapsible QA review | Shipping a broken site/funnel to a paying client | Fewer refunds, fewer angry clients, higher retention |
| Non-collapsible Security review | Leaked API keys, exposed `.env`, public gateway ports, injection bugs | Avoids the kind of incident that ends a client relationship or creates liability |
| Evidence-Based Delivery | "Trust me, it works" handoffs | Evidence (screenshots, test runs, audit reports) is itself a sellable trust signal — clients pay more for an agency that can prove its work |
| Pattern Discovery Protocol ("search first, reuse always") | Reinventing the same component/offer/audit per client | Faster builds, more clients served per week with the same agent-hour budget |

## Stop-the-Line Gate (Mandatory Before Implementation)

Before any skill starts producing client-facing output, confirm:

- **Acceptance Criteria** — what does "done" look like, in terms the client would recognize (more leads, a working booking flow, a deployed site — not "I wrote some code").
- **Definition of Done** — what evidence proves it's done (see Evidence-Based Delivery below).

If either is missing, stop and get it from the user or infer it explicitly and state the inferred AC/DoD back before proceeding. Do not start implementation on a vague brief.

## Role Exit States (Chain of Custody)

```
Implementation (skill/subagent) → QA Gate → Release Shepherd → Human Review → SHIPPED
   "Ready for QA"                   "Approved for release"   "Ready for human review"
```

- **Implementation** (`revenue-systems-agent`, `webflow-template-forge`, `ui-intelligence`, `masterstack-flywheel`, or the main agent loop doing direct code/content work): produces the deliverable, cannot self-certify it as done, exits with **"Ready for QA."**
- **QA Gate** (`.claude/agents/qa-specialist.md`): independently verifies against the AC/DoD. Never the same agent run that produced the work. Exits with **"Approved for release"** or routes back to Implementation with specific blocking issues.
- **Security Gate** (`.claude/agents/security-engineer.md`): required whenever the work touches secrets, auth, payments, a public deployment, or client PII. Independent of Implementation and QA. Exits with **"Approved for release"** or blocks.
- **Release Shepherd** (`.claude/agents/release-shepherd.md`): prepares the PR/deploy metadata and evidence bundle. Cannot modify code and cannot merge. Exits with **"Ready for human review."**
- **Human Review**: final merge/deploy authority stays with the user, per this repo's existing risky-action rules — this file does not change that.

## Non-Collapsible Roles

QA and Security review **cannot be skipped or self-performed** by the agent that did the implementation work — that's the entire point of an independent gate. Everything else (release shepherding) can be collapsed into the implementing agent for small, low-risk changes.

## Evidence-Based Delivery

Every client-facing deliverable gets an evidence bundle before handoff:

- `QA_REPORT.md` — pass/fail per acceptance criterion, from `qa-specialist`
- `SECURITY_REPORT.md` — from `security-engineer`, when the gate applies
- Screenshots / a working URL / test output — whatever the AC actually claims

Store these alongside the deliverable (e.g. `clients/{slug}/QA_REPORT.md`, `factory/flywheel-deployments/{host-slug}/SECURITY_REPORT.md`), not buried in chat history. The client-facing handoff doc points to them.

## Pattern Discovery Protocol

**Search first, reuse always, create only when necessary.** Before building something new for a client:

1. Check `skills/revenue-systems-agent/niche-pattern-library.md` and `factory/` for an existing reusable pattern.
2. Check `skills/SKILLS_REGISTRY.md` for an existing skill that already covers this.
3. Only generate net-new work when nothing reusable fits — and if you do, flag it as a candidate for the pattern library so the next client build is faster.

## Slash Commands

- `/gate-check` — verify AC/DoD are defined before starting work (see `.claude/commands/gate-check.md`)
- `/pre-pr` — run QA + Security gates and `npm run check` before opening a PR (see `.claude/commands/pre-pr.md`)
- `/evidence-collect` — assemble the evidence bundle for a completed deliverable (see `.claude/commands/evidence-collect.md`)

## Scope

This governs **client-facing/revenue-producing deliverables** (skills work, deployments). It does not change `AGENTS.md`, which governs `pi`-the-coding-tool's own package development rules and stays authoritative for that codebase.
