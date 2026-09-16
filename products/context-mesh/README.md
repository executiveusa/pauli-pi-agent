# Context Mesh

Context Mesh is a shared, graph-first Second Brain for AI agents.

It gives Claude Code, Pi, Codex, Cursor, custom agents, and any MCP-capable runtime one callable memory surface without requiring classic chunk-and-vector RAG.

## What it does

- queries a Graphify `graph.json`
- resolves entities and direct relationships
- traces bounded graph paths
- returns source/provenance references
- keeps append-only temporal memory events
- assembles compact just-in-time context packs
- exposes all of the above over MCP

## Why this product exists

Agents should not repeatedly crawl Google Drive, reread giant chat exports, or rely on stale prompt summaries. Context Mesh separates:

- raw source ownership
- normalized human-readable ICM knowledge
- structural graph knowledge
- temporal agent memory
- callable agent context

## Current MVP storage

- Structural graph: `graphify-out/graph.json`
- Temporal event log: `~/.contextmesh/events.jsonl`

Both paths are configurable:

```bash
export CONTEXT_MESH_GRAPH=/absolute/path/to/graphify-out/graph.json
export CONTEXT_MESH_EVENTS=/absolute/path/to/events.jsonl
```

The MVP deliberately has no database requirement. A later storage adapter can move structural and temporal data into a graph database without changing the MCP tool contract.

## Run directly

```bash
node bin/context-mesh.mjs --self-test
node bin/context-mesh.mjs
```

The second command starts an MCP stdio server.

## Claude Code

This directory is a Claude Code plugin. For local development:

```bash
claude --plugin-dir ./products/context-mesh
```

The plugin contributes:

- MCP server: `context-mesh`
- skill: `brain`
- skill: `remember`

Claude Code plugins can package skills and MCP servers, so the same product can be distributed through a plugin marketplace.

## Any other agent

Point the agent's MCP configuration at:

```bash
node /absolute/path/to/context-mesh/bin/context-mesh.mjs
```

No Claude-specific code is required.

## MCP tools

- `brain_status`
- `brain_search`
- `brain_context`
- `brain_entity`
- `brain_path`
- `brain_sources`
- `brain_recent`
- `brain_remember`

## Graphify workflow

Build or update a graph with Graphify, then point Context Mesh to the result:

```bash
graphify /path/to/normalized-second-brain --update
export CONTEXT_MESH_GRAPH=/path/to/normalized-second-brain/graphify-out/graph.json
```

Context Mesh does not replace Graphify. Graphify builds the structural graph; Context Mesh makes that graph and temporal memory consistently callable by agents.

## Security

Use allowlist-based ingestion. Do not graph or remember secrets, authentication exports, cookies, tokens, payment credentials, or unrestricted financial records.

## Product path

The current slice proves the agent-neutral contract. Next product layers are:

1. temporal graph backend adapter
2. Drive/GitHub/Gmail ingestion workers
3. tenant isolation and auth
4. hosted + sovereign self-hosted editions
5. visual graph/admin console
6. billing/licensing and installer

See `PRODUCT.md` and `ICM.md`.
