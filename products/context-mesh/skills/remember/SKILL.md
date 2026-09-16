---
name: remember
description: Store verified decisions, outcomes, changes, and facts in Context Mesh so future agents can recall them with chronology and provenance.
---

# Context Mesh: Remember

Use `brain_remember` only for durable information that will matter across sessions.

Good memories:
- a verified deployment completed
- a project changed hosting providers
- the owner approved a specific architecture
- a task was completed or blocked
- a canonical repository or domain changed
- an important decision superseded an older decision

Do not store:
- passwords
- API keys or tokens
- cookies/session material
- authentication exports
- payment credentials
- speculative conclusions
- transient chain-of-thought

## Recommended fields

- `kind`: `decision`, `event`, `fact`, `outcome`, `blocker`, or `handoff`
- `project`: canonical project name when applicable
- `tags`: short machine-friendly labels
- `source`: agent/runtime/source system identifier
- `text`: concise fact with enough context to remain understandable later

Before writing a high-impact memory, verify the outcome from the authoritative source when possible. Preserve history; add a new event instead of editing away an old state.
