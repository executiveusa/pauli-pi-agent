# Context Mesh Agent Contract

Context Mesh is the shared memory interface for this product.

## First rule

Query the brain before crawling large archives or reconstructing old project history manually.

For codebase questions, query Graft before manually exploring the repository.

## Tool routing

### Historical / business / decision memory

- `brain_context` — default question answering context
- `brain_search` — broad recall
- `brain_entity` — one entity and its relationships
- `brain_path` — connection/path reasoning
- `brain_sources` — provenance
- `brain_recent` — newest durable events
- `brain_remember` — append a verified durable event
- `brain_status` — health/configuration

### Live code context

When the Graft MCP server is connected, prefer its callable code tools before broad file crawling:

- `graft_find_code` — locate code relevant to a task
- `graft_find_all` — exhaustive indexed search
- `graft_file_api` — inspect a file's API surface without reading full bodies
- `graft_trace_calls` — callers/callees and dependency paths

Use Graft for current code structure. Use Context Mesh for historical decisions, people, projects, events, and provenance. When a question crosses both domains, query both and reconcile through source evidence.

## Memory classes

- M0 Identity — durable principles and standing rules
- M1 Entities — people, projects, repos, agents, organizations
- M2 Decisions — time-bound choices and approvals
- M3 Events — append-only changes and outcomes
- M4 Sources — immutable evidence locations

## ICM laws

- One home per fact.
- Link instead of copying.
- Keep routing files small.
- Load context only when needed.
- Generated indexes are preferred over hand-maintained duplicate lists.
- Preserve chronology when a newer decision supersedes an older one.
- Separate raw evidence from derived knowledge.

## Security

Default-deny ingestion of credentials, authentication exports, cookies, tokens, private keys, payment credentials, and other secrets.

Never use Context Mesh durable memory as a secret store.

## Proof

Important operational claims should be traceable to a source artifact or verified event. If no provenance exists, state that the graph does not currently prove the claim.

For code changes, use Graft to inspect the likely blast radius before editing and run the repository's normal verification after editing.
