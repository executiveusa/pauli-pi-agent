---
type: domain
status: active
owner_path: packages/coding-agent
consumes: [repository-context, specifications, tests]
produces: [code-changes, verification-evidence, release-candidates]
edges: [../02-agent-runtime/CONTEXT.md, ../12-security-governance/CONTEXT.md]
governance: internal
---

# Coding

One job: change software safely from inspected repo truth through verified release evidence.

## Runtime and skill owners

- `packages/coding-agent/` — Pi coding CLI/session behavior.
- `packages/ai/`, `packages/agent/`, `packages/tui/` — supporting core.
- `AGENTS.md` — non-negotiable engineering rules.
- `WORKFLOW.md` — QA/security/release chain of custody.
- `agents/backend/`, `agents/frontend/`, `agents/judge/`, `agents/watcher/` — specialized roles where present.
- `skills/masterstack-flywheel/` and repository-intelligence references — reusable build/release patterns.

## Standard workflow

`inspect -> specify -> smallest reversible build -> verify -> release gate`.

Do not conflate a Vercel READY build with repository correctness. Code changes still require the repo's prescribed checks.
