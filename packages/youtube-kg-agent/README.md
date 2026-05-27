# YouTube Knowledge Graph Agent

Production-ready MCP server that transforms your complete YouTube watch history into an intelligent second brain.

## Features

- YouTube OAuth2 authentication & token refresh
- Complete watch history ingestion (1000+ videos)
- Semantic embeddings via Anthropic (384-dim)
- Vector similarity search
- Concept extraction & relationship graph
- Multi-hop reasoning across topics
- Citation-grounded answers (≥95% accuracy target)
- MCP server for PI Agent integration
- CLI interface for local use
- Docker deployment ready

## Quick Start

```bash
cd packages/youtube-kg-agent
npm install
npm run build

# Set environment variables
export YOUTUBE_CLIENT_ID=...
export YOUTUBE_CLIENT_SECRET=...
export SUPABASE_URL=...
export SUPABASE_SERVICE_KEY=...
export ANTHROPIC_API_KEY=...

# Run database migration (ops/migrations/001_init_schema.sql) in Supabase first

# Ingest your YouTube history
node dist/cli.js ingest

# Start chatting
node dist/cli.js chat
```

## Architecture

```
YouTube API (OAuth2)
    ↓ metadata + watch order
EmbeddingsService (Anthropic 384-dim)
    ↓ vectors
SupabaseService (vector + full-text store)
    ↓ concept extraction
ConceptService (entities & relationships)
    ↓ graph traversal
ReasoningEngine (Claude multi-hop synthesis)
    ↓ citation check
GroundingService (verify against source videos)
    ↓
MCP Tools (PI Agent integration)
```

## Services

| Service | Purpose |
|---|---|
| `YouTubeClient` | OAuth2, watch history fetch, token persistence |
| `EmbeddingsService` | Anthropic vectors + cosine similarity |
| `SupabaseService` | CRUD, vector search, full-text search |
| `ConceptService` | Topic/entity extraction from video metadata |
| `ReasoningEngine` | Multi-hop queries, Claude synthesis |
| `GroundingService` | Citation verification against source videos |
| `SearchService` | Vector similarity retrieval |

## MCP Tools

| Tool | Description |
|---|---|
| `youtube_search` | Semantic search across your watch history |
| `youtube_query` | Complex multi-hop question answering |
| `youtube_concept` | Explore concept hierarchy |

## Environment Variables

```env
YOUTUBE_CLIENT_ID=your-client-id
YOUTUBE_CLIENT_SECRET=your-client-secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/oauth/callback
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
ANTHROPIC_API_KEY=your-api-key
```

## Database

Run `ops/migrations/001_init_schema.sql` in your Supabase SQL editor.
Requires the `pgvector` extension.

## Docker

```bash
cd ops/deployment
cp ../../.env .env   # or set env vars inline
docker-compose up -d
```

## Testing

```bash
npm test          # all tests
npm run check     # type check only
npm run build     # compile
```

## Quality Targets

- Citation accuracy: ≥95%
- Response quality: ≥4.5/5 stars
- SYNTHIA™ 8.5/10 minimum
- Zero TypeScript errors

## License

MIT
