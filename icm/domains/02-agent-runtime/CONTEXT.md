---
type: domain
status: active
owner_path: packages/agent
consumes: [model-runtime, skills, tools, tenant-context]
produces: [agent-events, tool-calls, session-state]
edges: [../03-coding/CONTEXT.md, ../10-integrations/CONTEXT.md, ../12-security-governance/CONTEXT.md]
governance: sensitive
---

# Agent Runtime

One job: own Pauli's model/tool/session execution behavior.

## Runtime owners

- `packages/agent/` — core agent framework and Pauli-specific runtime extensions.
- `packages/ai/` — provider/model APIs and routing primitives.
- `packages/coding-agent/` — Pi coding harness, CLI, extensions, sessions.
- `packages/tui/` — terminal rendering and interaction.
- `.pi/`, `.agents/`, `.claude/` — surface-specific resources and compatibility loaders.

## Rules

Keep core runtime minimal. Add behavior through skills, extensions, prompts, and explicit adapters where possible. Do not load the full skill library into one session. Provider credentials remain server/local secrets, never browser payload.

## Upstream edge

This fork trails current `@earendil-works/pi-*` releases and must harvest upstream selectively. See `../../upstream/SELECTIVE-HARVEST.md` before changing Pi internals.
