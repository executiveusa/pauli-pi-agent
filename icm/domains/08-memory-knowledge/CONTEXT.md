---
type: domain
status: partial
owner_path: packages/data-processor
consumes: [evidence, imports, knowledge-units]
produces: [indexed-memory, graph-links, retrieval-context]
edges: [../../surfaces/brain-dashboard.md, ../07-research-learning/CONTEXT.md]
governance: sensitive
---

# Memory and Knowledge

One job: turn evidence-backed artifacts into a durable, deduplicated, navigable second brain.

## Owners

- `packages/data-processor/` — imports, processing, durable data work.
- `packages/youtube-kg-agent/` — knowledge-graph capability where present.
- `brain/` — brain configuration/content references.
- `brain-dashboard/` — browser UI/search implementation.
- graph/second-brain skills referenced by `skills/SKILLS_REGISTRY.md`.

## Current condition

The repository contains multiple memory approaches: filesystem/ICM, database-backed indexing, GitHub/Tailscale vault access, and graph tooling. The ICM filesystem remains the inspectable knowledge architecture; databases are indexes/state stores, not the only source of truth.

The deployed historical brain dashboard currently returns HTTP 500 for search because its GitHub source configuration resolves to undefined values. Treat that deployment as `partial`, not proof of a healthy memory system.

## Rule

Raw private evidence and shareable abstractions must remain separable. Durable memory changes should be proposed, reviewed, then committed with source links and provenance.
