---
type: surface
status: active
owner_path: packages/coding-agent
consumes: [operator-prompts, repo-context, tools]
produces: [agent-sessions, code-work, tool-results]
edges: [../domains/02-agent-runtime/CONTEXT.md, ../domains/03-coding/CONTEXT.md]
governance: sensitive
---

# Pi CLI / TUI

Pi's CLI/TUI remains the strongest local engineering/operator surface for direct repository work. It owns sessions, extensions, skills, model/provider selection, and coding interaction through `packages/coding-agent/` and `packages/tui/`.

It is not the desired business/operator Mission Control: it exposes implementation machinery rather than a concise view of missions, approvals, integrations, evidence, and outcomes.

## Canonical role

Keep terminal Pi for engineering and advanced operator workflows. Mission Control should sit above it for outcome-first operation and invoke the same underlying runtime/control services rather than duplicating an agent implementation.
