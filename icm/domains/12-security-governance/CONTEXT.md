---
type: domain
status: active
owner_path: WORKFLOW.md
consumes: [implementation-evidence, permissions, secrets, risk]
produces: [qa-decisions, security-decisions, approvals, release-gates]
edges: [../../../AGENTS.md, ../../../WORKFLOW.md, ../../audits/2026-08-10-full-stack-wiring.md]
governance: sensitive
---

# Security and Governance

One job: stop unsafe or unproven work from being treated as complete.

## Owners

- `AGENTS.md` — repository engineering law.
- `WORKFLOW.md` — stop-the-line, QA, security, release, human review.
- `.claude/agents/qa-specialist.md`, `security-engineer.md`, `release-shepherd.md`.
- `agents/judge/`, `agents/watcher/` — independent evaluation/monitoring roles where used.
- `skills/full-stack-wiring-audit/` and `skills/gauntlet-loop/` — evidence and adversarial verification workflows.

## Current priority

The browser build path that can inject provider/service credentials from `.env` into `window.__AGENT_ENV__` is an S0 architecture risk even though the currently fetched production page exposed an empty object. The fix belongs before cosmetic frontend convergence.

## Rules

No self-certification for consequential work. Evidence must name what was tested, where, with what inputs, and what remains unverified. Security, auth, payments, secrets, public deployments, and private data trigger independent review.
