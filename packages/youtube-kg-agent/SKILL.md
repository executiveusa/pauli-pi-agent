---
name: youtube-kg-agent
description: Transforms YouTube watch history into a semantic knowledge graph with multi-hop reasoning, concept extraction, and AI-powered second brain capabilities
keywords:
  - youtube
  - knowledge-graph
  - semantic-search
  - second-brain
  - mcp-server
  - ai-agent
---

# YouTube Knowledge Graph Agent

## Overview

MCP server that ingests your complete YouTube watch history and enables conversational access to your learning through semantic search, concept graphs, and multi-hop reasoning.

## Architecture

```
YouTube API (OAuth2) → Anthropic Embeddings (384-dim) → Supabase (vector + FTS)
    → Concept Graph (extraction & relationships)
    → Reasoning Engine (Claude multi-hop synthesis)
    → Citation Grounding (verify against source)
    → MCP Tools (PI Agent integration)
```

## Feedback Loops (Meadows Framework)

1. **Quality Gate** (Balancing): Citation accuracy maintained ≥95%
2. **Learning Loop** (Reinforcing): User ratings improve concept importance scores
3. **Circuit Breaker** (Balancing): Stops hallucination cascade
4. **Observation**: Daily metrics export to `ops/reports/`

## Usage

### CLI
```bash
node dist/cli.js ingest   # load YouTube history
node dist/cli.js chat     # interactive Q&A
```

### MCP (PI Agent)
```json
{
  "mcpServers": {
    "youtube": {
      "command": "node",
      "args": ["packages/youtube-kg-agent/dist/mcp/server.js"]
    }
  }
}
```

## Quality Metrics

- Citation Accuracy: ≥95%
- Response Quality: ≥4.5/5 stars
- SYNTHIA™ 8.5/10 minimum
- All tests pass, zero TypeScript errors
