# Context Mesh Product Definition

## Product

Context Mesh is a shared context graph and durable memory layer for AI agents.

It is sold as the memory/control plane that sits between a customer's sources and their agents.

## Customer problem

Teams are accumulating conversations, repositories, documents, meetings, Drive folders, emails, and agent sessions faster than humans or agents can reliably recall them. Traditional vector RAG often returns similar text without preserving relationships, chronology, source authority, or superseded decisions.

## Promise

Connect your sources once. Give every agent one callable brain.

## Primary user journey

1. Connect or point Context Mesh at normalized source data.
2. Build/update the structural graph.
3. Start the MCP server.
4. Connect Claude Code, Pi, or another MCP client.
5. Ask about prior decisions, projects, people, architecture, dependencies, and current state.
6. Store verified outcomes as temporal events.
7. Trace important answers back to source evidence.

## Editions

### Community

- local Graphify graph
- local append-only event memory
- MCP stdio server
- Claude Code plugin
- generic MCP client support
- ICM organization templates

### Sovereign

- self-hosted graph backend
- ingestion workers
- tenant/workspace authentication
- Drive/GitHub/Gmail connectors
- admin/graph console
- backup/restore
- audit/provenance controls

### Cloud

- managed hosting
- team workspaces
- hosted MCP endpoint
- automatic ingestion/sync
- usage analytics
- managed backups

## Commercial wedge

Do not sell "RAG." Sell continuity:

> Your agents stop forgetting what your business already knows.

Best initial customers:

- AI-heavy agencies
- software teams using multiple coding agents
- founders with large Claude/ChatGPT histories
- consulting firms with repeated project handoffs
- organizations running internal agent fleets

## Product moat

- graph-first retrieval rather than similarity-only retrieval
- chronology instead of overwrite-style memory
- provenance to original sources
- agent-neutral MCP contract
- ICM normalization and governance
- portable local-first mode plus hosted/self-hosted upgrades

## Definition of done for v0.1

- one executable MCP server
- Claude Code loads it as a plugin
- any MCP agent can call the same tools
- Graphify graph can be queried without re-reading source files
- durable events survive agent sessions
- paths and provenance are queryable
- no secret ingestion by design guidance
- install/use documentation exists

## v0.2 target

Add a true temporal graph storage adapter and ingestion pipeline while preserving the v0.1 MCP API.
