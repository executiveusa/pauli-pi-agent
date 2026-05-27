# PI Agent Control Plane - System Architecture

**Version**: 0.0.4  
**Date**: 2026-05-26

---

## Overview

The PI Agent Control Plane is a modular, layered system designed to ingest knowledge from diverse sources, extract source-grounded reasoning profiles (personas), coordinate multi-persona synthesis, and provide a unified dashboard for monitoring, control, and audit.

```
┌────────────────────────────────────────────────────────────────┐
│                    INTERFACE LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Voice      │  │   Web Chat   │  │  Dashboard   │  CLI    │
│  │  (STT/TTS)   │  │  (pi-web-ui) │  │(Control Room)│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────────────────────────────────────────┘
                              │
┌────────────────────────────────────────────────────────────────┐
│                  ORCHESTRATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PI Coordinator: Query → Personas → Synthesis → Trace   │  │
│  │  ├─ Task Graph Composer (planning, skill selection)     │  │
│  │  ├─ Persona Dispatcher (route to relevant agents)       │  │
│  │  ├─ Critic Pass (validate reasoning)                    │  │
│  │  ├─ Approval Manager (circuit breakers, human gates)    │  │
│  │  └─ Workflow State Machine (run tracking, recovery)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
┌────────────────────────────────────────────────────────────────┐
│                      TOOL LAYER                                │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐ │
│  │  Ingestion   │ │   Browser    │ │  Knowledge Graph       │ │
│  │  ├─Firecrawl │ │   ├─Playwrgt │ │  ├─Entity Extractor   │ │
│  │  ├─BrightData│ │   └─Headless │ │  ├─Claim Linker       │ │
│  │  └─Readabilty│ │                │  ├─Relation Builder    │ │
│  │              │ │                │  └─Evidence Indexer    │ │
│  ├─ Scraper    │ │                │                        │ │
│  ├─ PDF Parser │ └──────────────┘ └────────────────────────┘ │
│  ├─ Video      │                                             │
│  │  Analyzer   │  ┌──────────────┐ ┌────────────────────────┐ │
│  │ ├─Transcript│  │   Persona    │ │  MCP Tools             │ │
│  │ ├─Frames    │  │   ├─Extractor│ │  ├─pi.ingest.*        │ │
│  │ └─OCR       │  │   ├─Builder   │ │  ├─pi.persona.*       │ │
│  └─ Document  │  │   └─Updater   │ │  ├─pi.reason.*        │ │
│     Extractor │  └──────────────┘ │  └─pi.graph.*          │ │
│               │                    └────────────────────────┘ │
└──────────────┘────────────────────────────────────────────────┘
                              │
┌────────────────────────────────────────────────────────────────┐
│                      MODEL LAYER                               │
│  ┌────────────────────────────────────────────────────────────┐
│  │  Model Router (pi-ai extended)                            │
│  │  ├─ Free Mode (Ollama, OpenRouter free, NVIDIA NIM)      │
│  │  ├─ Balanced Mode (low-cost providers)                    │
│  │  ├─ Premium Mode (OpenAI, Anthropic, Google)             │
│  │  └─ Local Only Mode (no internet provider calls)          │
│  ├─ Budget Enforcement (daily, monthly, per-run limits)      │
│  ├─ Provider Adapters (OpenAI, Anthropic, Google, etc.)     │
│  └─ Cost Tracking (input tokens, output tokens, estimate)    │
│  └─ Cross-Provider Handoff (context serialization)           │
│  └─ Fallback Policy (explicit, logged, never silent)         │
└────────────────────────────────────────────────────────────────┘
                              │
┌────────────────────────────────────────────────────────────────┐
│                      MEMORY LAYER                              │
│  ┌────────────────────────────────────────────────────────────┐
│  │  PostgreSQL 15+ (primary database)                        │
│  ├─ sources, source_items (ingestion sources)                │
│  ├─ entities, claims, relations, evidence_spans (graph)      │
│  ├─ embeddings (pgvector, HNSW indexes)                      │
│  ├─ personas, persona_traits (reasoning profiles)            │
│  ├─ reasoning_runs, reasoning_votes, reasoning_syntheses    │
│  ├─ video_assets, video_observations (visual analysis)       │
│  ├─ transcripts, documents (ingested content)                │
│  ├─ feedback_events (user ratings, corrections)              │
│  ├─ audit_events (complete action trail)                     │
│  ├─ model_calls (provider, tokens, cost, latency)           │
│  └─ approval_requests (high-risk action gates)               │
│                                                               │
│  Vector Search: pgvector HNSW indexes on:                    │
│  ├─ entity embeddings (semantic entity search)               │
│  ├─ claim embeddings (reasoning context retrieval)           │
│  └─ evidence embeddings (source grounding)                   │
└────────────────────────────────────────────────────────────────┘
                              │
┌────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYER                              │
│  ┌────────────────────────────────────────────────────────────┐
│  │  Infisical Client (centralized secret management)         │
│  │  ├─ OpenAI API keys                                       │
│  │  ├─ OpenRouter API keys                                   │
│  │  ├─ Firecrawl API keys                                    │
│  │  ├─ Database credentials                                  │
│  │  ├─ Speech provider keys                                  │
│  │  └─ Custom API keys (user-configured)                     │
│  │  Local fallback: .env (development only)                  │
│  │                                                            │
│  │  RBAC: admin, reviewer, user (extensible)                │
│  │  ├─ admin: full control                                  │
│  │  ├─ reviewer: approval workflows                          │
│  │  └─ user: query, feedback, view logs                      │
│  │                                                            │
│  │  Circuit Breakers:                                        │
│  │  ├─ Loop limit (max 10 reasoning turns)                  │
│  │  ├─ Budget limit (stop if cost exceeds threshold)        │
│  │  ├─ Evidence gap warning (sparse sources)                │
│  │  ├─ Secret exposure guard (redact leak attempts)         │
│  │  └─ High-risk action guard (approval required)           │
│  │                                                            │
│  │  Audit Logging:                                           │
│  │  ├─ All model calls (provider, tokens, cost)            │
│  │  ├─ All persona operations (create, update, delete)      │
│  │  ├─ All reasoning runs (query, persona selection, result) │
│  │  ├─ All user actions (login, feedback, approvals)        │
│  │  ├─ All circuit breaker triggers                         │
│  │  └─ No secrets ever logged (redaction enforced)          │
│  │                                                            │
│  │  Secret Redaction:                                        │
│  │  ├─ Utility: redactSecrets(text) → string                │
│  │  ├─ Patterns: API keys, bearer tokens, credentials       │
│  │  ├─ Applied to: logs, audit events, error messages       │
│  │  └─ Test: verify no API keys in log output               │
│  └────────────────────────────────────────────────────────────┘
└────────────────────────────────────────────────────────────────┘
                              │
┌────────────────────────────────────────────────────────────────┐
│                   DEPLOYMENT LAYER                             │
│  ┌────────────────────────────────────────────────────────────┐
│  │  Hostinger VPS (typical: 2GB RAM, 2 vCPU, 50GB SSD)      │
│  │  ├─ Docker image (Node.js 20+ runtime)                   │
│  │  ├─ PostgreSQL service (or RDS external)                 │
│  │  └─ Coolify orchestration (auto-deploy, rollback)        │
│  │                                                            │
│  │  Optional CDN Layer:                                      │
│  │  └─ Cloudflare DNS + edge caching for dashboard          │
│  │                                                            │
│  │  Health Checks:                                           │
│  │  ├─ /health (simple liveness probe)                      │
│  │  └─ /ready (readiness, includes DB connectivity)         │
│  │                                                            │
│  │  Persistence:                                             │
│  │  ├─ PostgreSQL volumes (persistent storage)              │
│  │  ├─ Backup strategy (daily snapshots)                    │
│  │  └─ Restore procedure (documented, tested)               │
│  └────────────────────────────────────────────────────────────┘
└────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### 1. Interface Layer

**Provides user access points for the control plane.**

- **Voice Interface**: Speech-to-text → question → text-to-speech response
  - Streaming conversation state
  - Session history
  - Provider-pluggable adapters (local Whisper, OpenAI, ElevenLabs fallback)

- **Web Chat**: Text-based chat (extends pi-web-ui ChatPanel)
  - Message history
  - Artifact rendering (code, HTML, markdown)
  - Real-time updates

- **Dashboard (Control Room)**: Operational view
  - Active runs, personas, graph, costs, approvals
  - Real-time status via SSE/WebSocket
  - Audit log browser
  - Model router mode display
  - Budget tracking

- **CLI**: Machine-callable and developer-friendly
  - `pi-agent ingest <url|video|file>`
  - `pi-agent persona create|list|show|delete`
  - `pi-agent reason <query>`
  - `pi-agent graph export|search`
  - `pi-agent voice ask|transcribe|chat`

**Technology**: mini-lit web components, terminal UI (pi-tui), Node.js CLI

---

### 2. Orchestration Layer

**Coordinates multi-step workflows and high-level control flow.**

- **PI Coordinator**: Routes user queries through persona selection, reasoning, and synthesis
  - Stateful workflow (begin → retrieve context → select personas → dispatch → collect → critique → synthesize → end)
  - Event emission for real-time UI updates
  - Error recovery and retry logic

- **Task Graph Composer**: Planning and skill selection for complex queries
  - Decomposes multi-step tasks
  - Selects tools and personas per step
  - Tracks dependencies

- **Persona Dispatcher**: Determines which personas are relevant to a query
  - Vector similarity search on knowledge graph
  - Expertise matching
  - Load balancing across personas

- **Critic Pass**: Validates persona responses
  - Disagreement detection
  - Confidence scoring
  - Fact-checking against evidence

- **Approval Manager**: Circuit breakers for high-risk actions
  - Requires human approval for irreversible operations
  - Enforces budget limits
  - Detects secret exposure attempts

- **Workflow State Machine**: Run tracking, recovery, resume
  - Persists run state to database
  - Implements timeout and retry logic
  - Allows resumption of interrupted runs

**Technology**: Extended pi-agent-core, custom event bus (or pi-agent event stream), PostgreSQL for state

---

### 3. Tool Layer

**Implements concrete ingestion, analysis, and knowledge operations.**

#### 3a. Ingestion Tools
- **Firecrawl Adapter**: Web scraping with metadata extraction
- **BrightData Adapter**: Enterprise scraping with proxies
- **Playwright Browser**: Dynamic content, DOM inspection, network control
- **HTTP + Readability**: Fallback for simple pages
- **PDF Parser**: Extract text and metadata from PDFs
- **Document Extractor**: DOCX, XLSX, PPTX extraction
- **Video Analyzer**: Transcript, frames, OCR, multimodal analysis
  - Frame sampling at configurable intervals
  - Scene change detection
  - Visual concept extraction
  - Speaker claim linking

#### 3b. Knowledge Graph Tools
- **Entity Extractor**: Identifies named entities from text
  - Person, Organization, Concept, Tool, Location, etc.
  - Links to embeddings
  - Source tracking

- **Claim Linker**: Extracts factual claims and arguments
  - Subject-predicate-object structure
  - Evidence reference
  - Confidence scoring

- **Relation Builder**: Discovers relationships between entities
  - Dependency, similarity, causality, hierarchy, etc.
  - Weighting by evidence strength

- **Evidence Indexer**: Maps text spans to extracted facts
  - Token offsets
  - Multi-fact spans (one span → multiple entities/claims)

#### 3c. Persona Builder
- **Persona Extractor**: Distills reasoning profiles from knowledge graphs
  - Domain identification
  - Expertise mapping
  - Trait extraction from claims
  - Decision rule generation
  - Evidence grounding

- **Persona Agent Config Generator**: Creates system prompts and tool permissions
  - Dynamic prompt template
  - Tool allowlist per persona
  - Model policy assignment

**Technology**: TypeScript services, GraphQL or REST APIs, PostgreSQL ORM

---

### 4. Model Layer

**Abstracts LLM providers and enforces cost/budget policies.**

Extended from existing pi-ai with:

- **Router**: Selects provider + model based on policy and budget
  - Free Mode: Only free providers (Ollama, OpenRouter free tier, NVIDIA NIM)
  - Balanced Mode: Prefer low-cost providers (OpenRouter cheap, Groq, Cerebras)
  - Premium Mode: Allow expensive models (OpenAI, Anthropic, Google)
  - Local Only Mode: No internet provider calls
  - Never silent fallback from free to paid

- **Budget Enforcement**: Tracks tokens and costs per run/day/month
  - Blocks requests exceeding policy threshold
  - Logged circuit breaker event
  - Prevents accidental overspend

- **Cost Tracking**: Records every model call
  - Provider, model, input/output tokens
  - Estimated cost (provider-supplied or estimated)
  - Actual cost (when available)
  - Latency and stop reason

- **Cross-Provider Handoff**: Context serialization for handing off between models
  - Standardized message format (pi-ai Context)
  - Token limit management
  - Reasoning trace preservation

- **Fallback Policy**: Explicit and logged
  - Never silently switch from free to paid
  - Always requires policy override or manual approval
  - Audit log event for every fallback decision

**Technology**: Extends pi-ai providers (OpenAI, Anthropic, Google, OpenRouter, etc.), TypeScript strict mode

---

### 5. Memory Layer

**Persistent storage for all data: sources, knowledge graph, personas, runs, feedback, audit.**

**Primary Database**: PostgreSQL 15+ with pgvector extension

**Schema Groups**:

1. **Source Ingestion**
   - `sources` - URLs, videos, documents, raw text
   - `source_items` - Chapters, pages, paragraphs
   - `ingestion_runs` - Tracking extraction jobs

2. **Knowledge Graph**
   - `entities` - Named entities with embeddings (384-dim via Anthropic)
   - `claims` - Factual statements linking entities
   - `relations` - Typed edges in the entity graph
   - `evidence_spans` - Text locations for each fact
   - `embeddings` - Dense vectors for similarity search (pgvector, HNSW index)

3. **Personas**
   - `personas` - Profile metadata
   - `persona_traits` - Individual extracted traits
   - `persona_sources` - Many-to-many source contributors
   - `persona_agent_configs` - Prompt templates and tool permissions

4. **Reasoning Runs**
   - `reasoning_runs` - Multi-persona query execution
   - `reasoning_votes` - Per-persona responses and confidence
   - `reasoning_syntheses` - Coordinator's final synthesis

5. **Ingestion & Analysis**
   - `video_assets` - Video metadata and transcript
   - `video_observations` - Frame-by-frame observations
   - `transcripts` - Extracted and manual transcripts
   - `documents` - Parsed document content

6. **Feedback & Audit**
   - `feedback_events` - User ratings, corrections, preferences
   - `audit_events` - Complete action trail (secrets redacted)
   - `model_calls` - Every provider call logged
   - `model_budgets` - Period-based budget tracking
   - `approval_requests` - High-risk action workflow

7. **Security**
   - `secrets_references` - Metadata only (actual secrets in Infisical)

**Vector Search**: HNSW indexes on entity, claim, and evidence embeddings for fast semantic retrieval

**Backup Strategy**: Daily snapshots, encryption at rest, point-in-time recovery

**Technology**: PostgreSQL 15+, pgvector, psycopg2 (Node.js: pg + sql.js or Drizzle ORM)

---

### 6. Security Layer

**Protects secrets, enforces access control, and logs all actions.**

#### Secret Management
- **Infisical Client**: Centralized secret store
  - API keys (OpenAI, OpenRouter, Firecrawl, etc.)
  - Database credentials
  - OAuth tokens
  - Speech provider keys
- **Local Fallback**: `.env` file (development only, never committed)
- **No Hardcoded Secrets**: Validated at startup; clear error messages

#### RBAC
- **Roles**: admin, reviewer, user (extensible)
  - `admin`: Full control, approve high-risk actions
  - `reviewer`: Review and approve pending decisions
  - `user`: Query, provide feedback, view logs
- **Scoped Permissions**: Per resource (persona, run, feedback)
- **Audit Trail**: Every permission check logged

#### Circuit Breakers
1. **Loop Limit**: Max 10 reasoning turns (prevents infinite loops)
2. **Budget Limit**: Stop if estimated cost exceeds policy (prevents overspend)
3. **Evidence Gap Warning**: Flag queries with sparse sources (quality signal)
4. **Secret Exposure Guard**: Detect and redact secret-like patterns from synthesis
5. **Irreversible Action Guard**: Require approval before database deletes, code deployments
6. **Production Deploy Guard**: Require approval before applying persona agent changes to production

#### Audit Logging
- **Logged Events**:
  - `ingest_start`, `ingest_success`, `ingest_failure` (source ingestion)
  - `persona_created`, `persona_updated`, `persona_deleted` (persona operations)
  - `reasoning_run_started`, `reasoning_run_completed` (query execution)
  - `model_call_made` (provider, model, tokens, cost estimate)
  - `circuit_breaker_triggered` (which limit, reason)
  - `approval_requested`, `approval_granted`, `approval_denied` (workflow)
  - `user_login`, `user_logout`, `user_action` (user activities)
  - `secret_access_attempt` (Infisical reads, for compliance)
- **Never Logged**: Actual secret values, bearer tokens, API keys
- **Searchable**: Audit log browser in dashboard with filters

#### Secret Redaction
- **Utility Function**: `redactSecrets(text: string): string`
- **Patterns**:
  - API key prefixes (sk-, pk-, Bearer, etc.)
  - Common credential formats (xxx:yyy, username=..., password=...)
  - OAuth tokens (long alphanumeric sequences)
- **Applied To**: All logs, audit events, error messages, debug output
- **Test Coverage**: Test that API keys are never in log output

**Technology**: Infisical SDK, bcrypt for password hashing, JWT for session tokens, PostgreSQL RBAC

---

### 7. Deployment Layer

**Orchestrates deployment to Hostinger VPS via Coolify.**

#### Containerization
- **Dockerfile**: Node.js 20+ runtime, build stage with TypeScript compilation
- **docker-compose.coolify.yml**: Services (app + PostgreSQL) with volume persistence
- **Health Checks**: `/health` (liveness), `/ready` (readiness with DB check)

#### PostgreSQL Service
- **Options**:
  1. PostgreSQL container in docker-compose (recommended for quick start)
  2. External Supabase or AWS RDS (recommended for production)
- **Migrations**: `npm run migrate` (apply .sql files in migrations/)
- **Backup**: Daily snapshots to persistent storage or cloud backup service
- **Restore**: Documented process, tested regularly

#### Secrets Management
- **Infisical Setup**: Create project, define secrets, generate API key
- **Coolify Integration**: Set Infisical API key as environment variable
- **Runtime**: Infisical client loads secrets on app startup
- **Fallback**: `.env` file as local development fallback (never in production)

#### Deployment Process
1. Push code to branch
2. Coolify detects update (GitHub webhook or manual trigger)
3. Coolify builds Docker image
4. Coolify runs migrations (safe: non-blocking, with rollback)
5. Coolify starts new container (zero-downtime with health check)
6. Coolify monitors health check endpoint

#### Scaling Considerations
- **Stateless API**: Coordinator and services are stateless (state in DB)
- **Horizontal Scaling**: Multiple instances can run if needed
- **Session Affinity**: Not required (state in PostgreSQL)
- **Database**: Single PostgreSQL instance is bottleneck (can scale with read replicas)

#### Optional CDN
- **Cloudflare**: DNS + edge caching for dashboard assets
- **Benefits**: Faster asset delivery, DDoS protection
- **Setup**: Update DNS records, enable full-page cache where applicable

**Technology**: Docker, docker-compose, Coolify, PostgreSQL, Node.js 20+

---

## Data Flow Examples

### Example 1: Ingest a Web Page

```
User → CLI: pi-agent ingest "https://example.com/article"
  ↓
Ingestion Tool: Firecrawl (or Playwright if key unavailable)
  ├─ Scrape HTML
  ├─ Extract title, author, date, text, links, media
  ├─ Store in `sources` table
  └─ Emit event: ingest_success
  ↓
Knowledge Graph: Extract Entities, Claims, Relations
  ├─ Tokenize and parse text
  ├─ Generate embeddings via Anthropic
  ├─ Insert entities, claims, evidence_spans
  ├─ Upsert relations
  └─ Emit event: graph_update
  ↓
Dashboard: Show ingestion status and entity count
```

### Example 2: Create a Persona from Ingested Knowledge

```
User → Dashboard: Create persona from entities about "Machine Learning"
  ↓
Persona Builder:
  ├─ Query graph: SELECT entities WHERE topic ~ 'machine learning'
  ├─ Extract expertise: top entity clusters
  ├─ Generate traits: claims + confidence from evidence
  ├─ Create decision rules: from claims and relations
  ├─ Generate agent prompt: domain-specific system prompt
  ├─ Insert into `personas` table
  └─ Emit event: persona_created
  ↓
Dashboard: Show persona profile with evidence links
```

### Example 3: Multi-Persona Reasoning

```
User → Chat: "Compare supervised and unsupervised learning approaches for medical imaging"
  ↓
PI Coordinator:
  ├─ Retrieve graph context: entities/claims related to query
  ├─ Select personas: "Machine Learning Researcher", "Medical Imaging Expert"
  ├─ Persona 1: Dispatch reasoning request with graph context
  │   └─ ML Researcher Agent: Analyzes supervised vs unsupervised (using pi-ai)
  ├─ Persona 2: Dispatch reasoning request with graph context
  │   └─ Medical Imaging Expert Agent: Analyzes imaging-specific tradeoffs
  ├─ Collect responses: Persona 1 confidence=0.9, Persona 2 confidence=0.85
  ├─ Critic pass: Any disagreements? Validate claims against graph evidence.
  ├─ Synthesize: Final answer integrating both perspectives
  ├─ Link evidence: All claims traced back to source URLs or documents
  ├─ Record run: Insert reasoning_run, reasoning_votes, reasoning_syntheses
  └─ Emit event: reasoning_completed
  ↓
Dashboard: Show reasoning trace, selected personas, synthesis, evidence links
```

### Example 4: Cost Tracking and Budget Blocking

```
User → Query through Coordinator
  ↓
Model Router:
  ├─ Policy: "free" mode
  ├─ Provider selection:
  │   1. Check Ollama (local): Available? Yes. Use.
  │   2. If not, try OpenRouter free models
  │   3. If not available, return MODEL_ROUTE_BLOCKED
  ├─ Estimate tokens: ~200 input, ~300 output
  ├─ Estimate cost: $0.00 (free provider)
  └─ Proceed if cost < daily_budget_remaining
  ↓
Model Call:
  ├─ Stream response via pi-ai
  ├─ Count actual tokens
  ├─ Record to `model_calls` table
  ├─ Update `model_budgets` table
  └─ Emit event: model_call_completed
  ↓
If cost would exceed budget:
  ├─ Circuit breaker: budget_limit triggered
  ├─ Stop reasoning
  ├─ Emit audit event: circuit_breaker_triggered
  └─ Return error: "Daily budget exceeded"
```

---

## Extension Points

### Adding a New Ingestion Source Type
1. Create `packages/agent/src/ingestion/adapters/<source-type>.ts`
2. Implement `IngestionAdapter` interface
3. Register in `packages/agent/src/ingestion/register.ts`
4. Add tests using fixtures (no live API calls)
5. Add CLI command: `pi-agent ingest --type=<source-type> <input>`

### Adding a New Tool to Personas
1. Define tool in `packages/agent/src/tools/<tool-name>.ts`
2. Register in `packages/agent/src/tools/register.ts`
3. Add to persona `allowed_tools` array in database
4. Add tests using faux providers

### Adding a New Model Provider
1. Follow existing pi-ai pattern (see `packages/ai/README.md`)
2. Ensure provider supports tool calling
3. Add to model router's provider registry
4. Add cost tracking for new models
5. Add tests (faux provider, no live API calls)

### Adding a New Dashboard Page
1. Create web component in `packages/web-ui/src/pages/<page-name>.ts`
2. Register route in main app
3. Use mocked data for development
4. Add to navigation menu
5. Connect to dashboard API endpoints

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Interface** | mini-lit, Tailwind CSS, pi-tui, Node.js CLI |
| **Orchestration** | TypeScript, pi-agent-core, event emitters |
| **Tools** | Playwright, Firecrawl SDK, PDF.js, canvas, OpenCV (frames) |
| **Models** | pi-ai (Anthropic, OpenAI, OpenRouter, local Ollama) |
| **Memory** | PostgreSQL 15+, pgvector, HNSW indexes |
| **Security** | Infisical SDK, bcrypt, JWT, PostgreSQL RBAC |
| **Deployment** | Docker, Coolify, Node.js 20+, PostgreSQL |
| **Testing** | Vitest, faux providers, fixtures |

---

## Non-Functional Requirements

| Requirement | Target | Mechanism |
|-------------|--------|-----------|
| **Availability** | 99.9% uptime | Health checks, auto-restart, multi-region failover (optional) |
| **Performance** | <500ms query response | Vector HNSW indexes, caching, async processing |
| **Scalability** | 10,000+ entities, 1,000+ personas | PostgreSQL partitioning, connection pooling, async jobs |
| **Security** | No secret leakage | Redaction utility, Infisical, RBAC, audit logs |
| **Auditability** | Complete action trail | PostgreSQL audit table, immutable event log |
| **Compliance** | GDPR-ready | Data retention policies, export/delete APIs, consent tracking |

---

## Known Limitations & Future Work

1. **Single Coordinator Instance**: No distributed coordination yet (suitable for <100 concurrent users)
2. **In-Memory Agent State**: Agents hold message history in memory (limit ~10k messages before serialization)
3. **No Fine-Tuning**: No persona fine-tuning on feedback data (manual updates only)
4. **No Real-Time Collaboration**: Single-user or serial user mode
5. **Limited Graphing**: No real-time graph updates in dashboard (polling-based)
6. **No Automatic Bias Detection**: Personas may reflect source bias (manual review recommended)

---

## Conclusion

The PI Agent Control Plane combines the mature pi-ai and pi-agent-core foundations with new knowledge graph, persona, and reasoning coordination layers. It emphasizes source grounding, transparency (via audit logs and traceability), cost awareness (free-first model routing), and human control (approval gates, circuit breakers). The modular, layered design allows for incremental development and extension without disrupting existing packages.
