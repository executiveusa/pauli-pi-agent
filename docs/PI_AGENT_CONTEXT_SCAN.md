# PI Agent Control Plane - Repository Context Scan

**Date**: 2026-05-26  
**Repository**: executiveusa/pauli-pi-agent  
**Branch**: claude/pi-agent-control-plane-hrXuK

## Executive Summary

The Pauli/Pi monorepo is a mature, TypeScript-first LLM infrastructure library with 7 core packages. It provides:
- Multi-provider LLM abstraction with model discovery and cost tracking
- Stateful agent runtime with event streaming and tool execution
- Terminal UI and web UI components for interactive applications
- Deployment automation for GPU pods (vLLM) and Slack bots
- Production pattern for knowledge graph generation (youtube-kg-agent)

**Current State**: Architecture supports extension. The youtube-kg-agent demonstrates a production pattern for knowledge ingestion, embeddings, vector search, and MCP tool exposure. No dedicated control plane or multi-persona coordination system exists yet.

---

## Repository Structure

### Root Configuration
- **Node Version**: ≥20.0.0
- **Package Manager**: npm workspaces (lockstep versioning)
- **TypeScript**: 5.9.2, strict mode
- **Formatter**: Biome 2.3.5
- **Test Runner**: Vitest (with faux provider pattern)
- **Build**: TypeScript compilation per package; no monorepo-wide build script

### Packages

| Package | Exports | Purpose | Status |
|---------|---------|---------|--------|
| `@mariozechner/pi-ai` (packages/ai) | `stream()`, `complete()`, `Context`, `Tool`, `Model` | Unified multi-provider LLM API, cost tracking, model discovery | ✓ Mature |
| `@mariozechner/pi-agent-core` (packages/agent) | `Agent`, event streams | Stateful agent with tool execution and state management | ✓ Mature |
| `@mariozechner/pi-coding-agent` (packages/coding-agent) | CLI `pi`, browser control, file tools | Interactive coding agent with file system and browser tools | ✓ Mature |
| `@mariozechner/pi-mom` (packages/mom) | `SlackMom` | Slack bot with event-driven task automation and CLI integration | ✓ Mature |
| `@mariozechner/pi-tui` (packages/tui) | TUI components (Text, Input, Editor, etc.) | Terminal UI library with differential rendering, no flicker | ✓ Mature |
| `@mariozechner/pi-web-ui` (packages/web-ui) | `ChatPanel`, storage, artifacts | Web components for chat, artifacts, IndexedDB storage | ✓ Mature |
| `@mariozechner/pi-pods` (packages/pods) | `pi pods` CLI | vLLM deployment and management on GPU pods | ✓ Mature |
| YouTube KG Agent (packages/youtube-kg-agent) | CLI, MCP tools | Production pattern: YouTube ingestion → embeddings → vector search → GraphRAG | ✓ Reference Implementation |

---

## Existing LLM Provider System

### pi-ai Package Architecture
**Location**: `packages/ai/src`

**Supported Providers** (21+):
- OpenAI, Azure OpenAI
- Anthropic
- Google (Gemini, Vertex AI, Codex CLI, Antigravity)
- Mistral, Groq, Cerebras, xAI
- OpenRouter, Vercel AI Gateway, MiniMax
- GitHub Copilot (OAuth)
- Amazon Bedrock
- OpenCode Zen/Go
- Any OpenAI-compatible (Ollama, vLLM, LM Studio)

**Core Files**:
- `src/types.ts` - `Api`, `KnownProvider`, `Model`, `StreamOptions`, `Context`, `Message`, `Tool`
- `src/providers/<provider>.ts` - Provider implementation (stream, tool conversion, token counting)
- `src/providers/register-builtins.ts` - Lazy loader registry
- `src/env-api-keys.ts` - Environment credential detection
- `src/index.ts` - Public exports and type re-exports
- `package.json` - Subpath exports for each provider

**Key Patterns**:
- **Token Counting**: Provider-specific; falls back to estimation
- **Cost Tracking**: Provider defines `costPer1kTokens` in model metadata
- **Streaming**: Events emitted: `text`, `tool_call`, `thinking`, `usage`, `stop`
- **Context Serialization**: Messages can be serialized for cross-provider handoff
- **Type Safety**: No `any` types; TypeBox for tool schemas

**Extension Point**: Add new provider via:
1. Create `src/providers/newprovider.ts`
2. Register in `register-builtins.ts` (lazy loader)
3. Add subpath export in `package.json`
4. Add credential detection in `env-api-keys.ts`
5. Add tests for streaming, token counting, cross-provider handoff

---

## Existing Agent Runtime

### pi-agent-core Package
**Location**: `packages/agent/src`

**Core Types**:
- `Agent` - Stateful agent with message history and tool execution
- `AgentMessage` - Flexible message type (can be extended via declaration merging)
- `AgentEvent` - Union of event types (agent_start, turn_start, message_start, message_update, etc.)
- `AgentOptions` - Agent initialization config (systemPrompt, model, tools, convertToLlm)

**Event Stream**:
- `agent.subscribe((event) => {...})` for reactive UI updates
- Events: `agent_start`, `turn_start`, `message_start`, `message_update`, `message_end`, `tool_execution_start/update/end`, `turn_end`, `agent_end`
- No external event bus; events are emitted to local subscribers

**Message Flow**:
```
prompt(userMessage)
  → agent.subscribe() emits events
    → transformContext() (optional pruning, context injection)
    → convertToLlm() (filter to LLM-compatible messages)
    → stream() (provider-specific streaming)
  → tool calls collected and executed (with partial result streaming)
  → tool results added to message history
  → loop until stop reason or max turns
```

**Key Patterns**:
- **Stateful**: Full message history maintained in Agent state
- **Tool Result Messages**: Custom toolResult message type, converted to LLM format by convertToLlm()
- **Flexible Messages**: Can add custom message types; only user/assistant/toolResult understood by LLM
- **No Built-in Storage**: Caller manages persistence
- **No Built-in Tool Definitions**: Caller provides tools array

**Extension Point**: Implement custom `convertToLlm()` to filter/transform messages per app needs.

---

## Existing Web UI System

### pi-web-ui Package
**Location**: `packages/web-ui/src`

**Core Components**:
- `ChatPanel` - Full chat UI with message list, input, artifacts, streaming
- `AgentInterface` - Message rendering with streaming text/tool calls
- `ArtifactsPanel` - Interactive HTML, SVG, Markdown artifacts
- `ApiKeyPromptDialog` - Secure API key entry
- `SettingsStore`, `ProviderKeysStore`, `SessionsStore` - IndexedDB-backed storage

**Dependencies**:
- mini-lit (web components)
- Tailwind CSS v4
- TypeScript strict mode

**Pattern**:
- Web components (shadow DOM isolation)
- IndexedDB for browser storage
- CORS proxy for cross-origin fetches
- No server-side rendering; pure client-side

**Extension Point**: Add new storage backend by implementing `StorageBackend` interface.

---

## Existing Knowledge Graph Pattern

### youtube-kg-agent Package (Reference Implementation)
**Location**: `packages/youtube-kg-agent`

**Architecture**:
```
YouTube API (OAuth2)
  ↓ [watch history + metadata]
  ↓
EmbeddingsService (Anthropic 384-dim vectors)
  ↓
SupabaseService (pgvector, HNSW indexes)
  ↓
ConceptService (entity & relationship extraction)
  ↓
SearchService (vector similarity + concept traversal)
  ↓
ReasoningEngine (Claude multi-hop synthesis)
  ↓
GroundingService (citation verification)
  ↓
MCP Tools (CLI + PI Agent integration)
```

**Database Schema** (Supabase with pgvector):
- `youtube_videos` - video metadata, embeddings (384-dim), importance, prerequisites, related_videos
- `knowledge_concepts` - concept name, description, embeddings, parent/child hierarchy, associated videos
- `conversation_history` - session, user/assistant, relevant_video_ids, citation_accuracy

**MCP Tools Exposed**:
- `youtube_search` - semantic search by query
- `youtube_query` - complex multi-hop questions
- `youtube_concept` - concept hierarchy exploration

**Services**:
- `YouTubeClient` - OAuth2 token management
- `EmbeddingsService` - Vector generation and similarity
- `SupabaseService` - CRUD and vector search
- `ConceptService` - Topic extraction
- `ReasoningEngine` - Multi-hop query synthesis
- `GroundingService` - Citation validation
- `SearchService` - Retrieval

**Deployment**: Docker + docker-compose.yml for self-hosting

**Key Takeaway**: This is a production pattern that can be adapted for:
- Multi-source ingestion (not just YouTube)
- Persona extraction from source material
- Multi-persona reasoning coordination
- Citation-grounded outputs

---

## Existing Test Patterns

### Location
- `packages/ai/test/` - Provider tests with faux provider pattern
- `packages/agent/test/` - Agent event stream tests
- `packages/youtube-kg-agent/test/` - Service tests
- No integration tests with live APIs

### Faux Provider Pattern
**File**: `packages/ai/test/faux-provider.test.ts`

Implements fake provider that:
- Returns predictable tool calls and text
- Tracks token usage
- Validates streaming event order
- Used across all provider tests to avoid live API calls

### Key Rule
- **NEVER call paid APIs in tests**
- **NEVER hardcode API keys**
- **Always use mocked/fixture responses**

### Test Organization
- Unit tests: `<service>.test.ts`
- Regression tests: `regressions/<issue-number>.test.ts`
- Test data: `data/` directory with fixture files

---

## Existing Storage & Database

### pi-web-ui IndexedDB Pattern
- `SettingsStore` - User preferences
- `ProviderKeysStore` - Encrypted API keys (client-side only)
- `SessionsStore` - Chat sessions and metadata
- `StorageBackend` interface allows custom implementations

**No Server-Side Database**: Web UI stores only in browser.

### youtube-kg-agent Supabase Pattern
- Primary: PostgreSQL (hosted on Supabase)
- Vector extension: pgvector for HNSW indexes
- Service key for server-side migrations and admin operations
- No secrets stored in database

### Migration Approach
- Hand-written SQL migrations
- Run manually before deployment
- No auto-migration on app startup

---

## Existing Deployment & Infrastructure

### Docker Patterns

**youtube-kg-agent**:
- Location: `packages/youtube-kg-agent/ops/deployment/`
- Single `Dockerfile` for Node.js app
- `docker-compose.yml` with service definitions
- Environment variables via `.env` file

**No Existing Coolify Integration**: Ready for new implementation.

### Environment Variables

**Existing Patterns**:
- `.env.example` or inline docs (not secrets)
- Platform-specific: HF_TOKEN, YOUTUBE_CLIENT_ID, etc.
- Credential detection in `env-api-keys.ts`

**No Existing Infisical Integration**: All credentials from environment or browser storage.

---

## Existing Security Patterns

### API Key Management
- `packages/ai/src/env-api-keys.ts` - Detects and validates credentials
- `packages/web-ui/` - Client-side IndexedDB encryption optional
- No RBAC or audit logging currently

### Test Isolation
- Faux providers (no live API calls)
- Fixture data (no real videos/documents)
- No secret logging (verified by test patterns)

### Validation
- TypeBox schemas for tool parameters
- No input validation at system boundaries (user input in chat, etc.)

---

## Existing CLI Patterns

### pi-coding-agent CLI
- Location: `packages/coding-agent/src/cli/`
- Entry: `src/cli.ts`
- Commands: `pi`, `pi agent`, etc.
- Argument parsing: Yargs-like pattern

### Slack Integration (mom)
- Location: `packages/mom/src/`
- Socket Mode for real-time messages
- Event-driven message handling

### No Existing General-Purpose CLI
- Ready for `pi-agent` CLI with subcommands

---

## Code Quality Rules (MANDATORY)

1. **TypeScript Strict**: No `any` unless commented
2. **No Inline Imports**: All imports top-level
3. **No Dynamic Imports for Types**: Use standard imports
4. **No Key Checks**: All keybindings/configs in configuration objects
5. **No Backward Compatibility Hacks**: Delete unused code
6. **No `git add -A` or `git add .`**: Explicit file-by-file adds only
7. **No Destructive Git Ops**: No reset --hard, checkout ., clean -fd, stash
8. **No Secrets in Logs**: Secrets must be redacted
9. **No Paid API Calls in Tests**: Always use faux providers or fixtures
10. **Biome + TypeScript**: `npm run check` must pass before commit

### Validation Commands
```bash
npm run check                    # Lint, format, type check (required)
npm run build                    # Compile (may be needed first)
npm test                         # Run tests (workspace-aware)
cd packages/<pkg> && npm test   # Run specific package tests
```

---

## Package Dependencies & Versions

### Node Modules Status
- Root `node_modules/` exists
- Package `node_modules/` exist (monorepo workspaces)
- `package-lock.json` in version control
- `npm install` restores all dependencies

### Key Dependencies
- **TypeScript**: 5.9.2 (strict mode mandatory)
- **Biome**: 2.3.5 (code formatting and linting)
- **TypeBox**: Re-exported from pi-ai
- **mini-lit**: Web component framework
- **Tailwind**: CSS v4 for web-ui
- **Vitest**: Test runner (implied by test patterns)

---

## Extension Points & Hooks

### pi Directory Structure
**Location**: `.pi/`
- `.pi/extensions/` - Runtime extensions (TUI widgets, etc.)
- `.pi/prompts/` - Prompt templates
- `.pi/git/`, `.pi/npm/` - Config directories

### No Existing Hooks
- Ready for SessionStart/build hooks
- Ready for custom validation hooks

---

## Known Limitations & Gaps

1. **No Database Abstraction**: Direct SQL or SupabaseService only
2. **No Multi-Provider Reasoning**: Agent calls single model at a time
3. **No Persona System**: youtube-kg-agent has concept extraction but no persona builder
4. **No Video Analysis**: YouTube agent uses metadata only, not visual frames
5. **No Circuit Breakers**: No high-risk action guards
6. **No Feedback Loop**: No rating/correction mechanism
7. **No Dashboard Control Room**: Only web UI for chat, no ops dashboard
8. **No Voice Interface**: No speech-to-text or text-to-speech
9. **No Infisical Integration**: No centralized secret management
10. **No Coolify Deployment**: No existing deployment template

---

## Recommended Implementation Strategy

### Phase 0 (Documentation) ✓
- **Output**: This context scan + PRD YAML + Architecture docs

### Phase 1 (Data Model)
- Extend youtube-kg-agent schema with:
  - sources (URLs, videos, documents, PDFs, EPUBs)
  - personas (name, domain, expertise, traits, agent_prompt)
  - reasoning_runs (query, selected_personas, synthesis, evidence_refs)
  - feedback_events, audit_events, model_calls, approval_requests
  - secrets_references (never store actual secrets)
- **Test**: Migration rollback, schema validation

### Phase 2 (Secret Management)
- Create `packages/agent/src/secrets/` with Infisical client
- Implement `SecretResolver` for local .env fallback
- Add secret redaction utility
- Update `env-api-keys.ts` to use SecretResolver
- **Test**: Verify secrets never logged; missing-secret errors

### Phase 3 (Model Router)
- Extend pi-ai with routing policy system
- Create mode-based provider selection (free/balanced/premium/local_only)
- Implement budget tracking
- Block silent paid fallback
- **Test**: Faux provider with routing decisions

### Phase 4-5 (Scraping & Video Analysis)
- Create `packages/agent/src/ingestion/` with adapters (Firecrawl, Playwright, etc.)
- Implement video frame extraction and multimodal analysis
- Store observations with evidence links
- **Test**: Fixture URLs, fixture videos

### Phase 6 (Knowledge Graph)
- Create `packages/agent/src/graph/` with GraphRAG interface
- Implement entity/claim/relation extraction
- Add evidence linking
- Use youtube-kg-agent as reference
- **Test**: Fixture sources → graph output

### Phase 7 (Persona Builder)
- Create persona extractor from knowledge graph
- Implement persona CRUD operations
- Add prompt template generation
- **Test**: Fixture personas with evidence links

### Phase 8 (Multi-Persona Reasoning)
- Implement coordinator agent
- Add persona selection logic
- Implement critic pass
- Add synthesis and trace output
- **Test**: Mock personas, faux models

### Phase 9 (Voice Interface)
- Create speech-to-text and text-to-speech adapters
- Add voice chat API endpoint
- Create voice CLI commands
- **Test**: Mock audio, fixture transcripts

### Phase 10 (Dashboard)
- Extend pi-web-ui with control room pages
- Add real-time updates (SSE or WebSocket)
- Implement logs, approvals, costs, graph visualization
- **Test**: Mocked data, no live API calls

### Phase 11-14 (Feedback, MCP, Deployment, Tests)
- Implement feedback loop
- Expose MCP tools
- Create Coolify/Docker assets
- Write comprehensive tests

---

## Context Summary (JSON Format)

```json
{
  "repo_type": "TypeScript monorepo with npm workspaces",
  "package_manager": "npm (lockstep versioning)",
  "node_version": ">=20.0.0",
  "typescript_version": "5.9.2",
  "existing_packages": [
    "pi-ai (unified LLM provider API)",
    "pi-agent-core (stateful agent with tool execution)",
    "pi-coding-agent (coding agent CLI)",
    "pi-mom (Slack bot)",
    "pi-tui (terminal UI library)",
    "pi-web-ui (web chat components)",
    "pi-pods (vLLM pod management)",
    "youtube-kg-agent (knowledge graph reference impl)"
  ],
  "existing_agent_runtime": {
    "package": "pi-agent-core",
    "type": "stateful agent with event streaming",
    "supports": "tool_execution, context_persistence, cross_provider_handoff",
    "no_external_event_bus": true
  },
  "existing_model_router": {
    "package": "pi-ai",
    "providers": 21,
    "capabilities": ["model_discovery", "cost_tracking", "token_counting", "tool_calling"],
    "supports_custom_openai_compatible": true
  },
  "existing_tool_system": {
    "approach": "agent_receives_tool_array",
    "streaming_partial_results": true,
    "no_builtin_tool_definitions": true
  },
  "existing_web_ui": {
    "package": "pi-web-ui",
    "framework": "mini-lit web components",
    "storage": "IndexedDB",
    "css": "Tailwind v4"
  },
  "existing_storage": {
    "web_ui": "IndexedDB (client-side only)",
    "youtube_kg_agent": "Supabase PostgreSQL + pgvector",
    "no_server_side_database_for_web_ui": true
  },
  "existing_test_commands": [
    "npm run check (biome + tsc, must pass)",
    "npm run build (TypeScript compilation)",
    "npm test (workspace-aware vitest)"
  ],
  "safe_commands": [
    "git status",
    "git fetch origin <branch>",
    "git pull --rebase origin <branch>",
    "git add <specific-files>",
    "git commit -m",
    "npm install",
    "npm run check",
    "npm run build",
    "cd packages/<pkg> && npm test"
  ],
  "forbidden_commands": [
    "git reset --hard",
    "git checkout .",
    "git clean -fd",
    "git stash",
    "git add -A",
    "git add .",
    "npm run dev (agents only)",
    "npm test at root (use workspace)",
    "npm run build without check first"
  ],
  "extension_points": [
    "add_new_provider (pi-ai: register, env-api-keys, tests)",
    "custom_convertToLlm (pi-agent-core: message filtering)",
    "storage_backend (pi-web-ui: implement StorageBackend)",
    "knowledge_graph_service (youtube-kg-agent pattern)",
    "cli_subcommands (pi-coding-agent pattern)"
  ],
  "recommended_patch_plan": [
    "Phase 1: Extend PostgreSQL schema for control plane (sources, personas, reasoning_runs, feedback)",
    "Phase 2: Infisical integration + secret redaction",
    "Phase 3: Model router with free/paid budget control",
    "Phase 4-5: Scraping adapters + video analysis with frames",
    "Phase 6: Knowledge graph (entity/claim/relation/evidence)",
    "Phase 7: Persona builder from knowledge graph",
    "Phase 8: Multi-persona coordinator with circuit breakers",
    "Phase 9: Voice interface (STT/TTS adapters)",
    "Phase 10: Dashboard control room (extend pi-web-ui)",
    "Phase 11-14: Feedback loop, MCP tools, Coolify deployment, tests"
  ]
}
```

---

## Next Steps

1. Create `docs/PI_AGENT_PRD.yaml` with product requirements
2. Create `docs/PI_AGENT_ARCHITECTURE.md` with system design
3. Create `docs/PI_AGENT_SECURITY_MODEL.md` with security guardrails
4. Create `docs/PI_AGENT_MODEL_ROUTING.md` with free-mode routing logic
5. Create `docs/PI_AGENT_DEPLOYMENT_COOLIFY.md` with deployment instructions
6. Create `docs/PI_AGENT_TEST_PLAN.md` with testing strategy
7. Begin Phase 1: Data model implementation

---

**Scan completed**: All key files examined, no blocking issues identified. Architecture is ready for extension.
