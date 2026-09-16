# Context Mesh Agent Contract

Context Mesh is the shared memory interface for this product.

## First rule

Query the brain before crawling large archives or reconstructing old project history manually.

## Tool routing

- `brain_context` — default question answering context
- `brain_search` — broad recall
- `brain_entity` — one entity and its relationships
- `brain_path` — connection/path reasoning
- `brain_sources` — provenance
- `brain_recent` — newest durable events
- `brain_remember` — append a verified durable event
- `brain_status` — health/configuration

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
