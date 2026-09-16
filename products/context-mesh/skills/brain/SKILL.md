---
name: brain
description: Query Context Mesh whenever the user asks about prior decisions, project history, relationships, source provenance, architecture context, or anything that may already exist in the shared Second Brain.
---

# Context Mesh: Brain

Use Context Mesh before manually scanning large archives or repeatedly rereading project history.

## Routing

1. Use `brain_context` for an ordinary natural-language question needing compact context.
2. Use `brain_search` when you need broader matching nodes/events.
3. Use `brain_entity` for one known project, person, repo, agent, tool, or concept.
4. Use `brain_path` for relationship or dependency questions between two entities.
5. Use `brain_sources` before making an important claim that needs provenance.
6. Use `brain_recent` for recent decisions/events, optionally scoped to a project.

## Rules

- Treat graph facts as evidence-bearing context, not unquestionable truth.
- Prefer relationships and source provenance over similarity-only retrieval.
- Distinguish explicit/extracted relationships from inferred ones when provenance is present.
- If the graph has no support for an important claim, say so and use the original source system.
- Do not load raw archive files unless the graph/context route is insufficient.
- Never put passwords, tokens, cookies, authentication exports, payment credentials, or other secrets into durable memory.
- When a newer event supersedes an older decision, preserve the chronology instead of overwriting history.
