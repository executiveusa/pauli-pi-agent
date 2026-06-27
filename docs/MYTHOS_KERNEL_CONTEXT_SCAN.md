# Mythos Kernel Context Scan

**Date**: 2026-05-28  
**Repository**: executiveusa/pauli-pi-agent  
**Scope**: Step 1 - Context analysis for Mythos Kernel implementation  

---

## Executive Summary

The Pauli PI Agent is a TypeScript monorepo with npm workspaces containing a comprehensive agent runtime system. The codebase provides well-defined integration points for the Mythos Kernel through existing approval gates (`beforeToolCall`/`afterToolCall` hooks), model routing policies, orchestration framework, and database infrastructure. No existing Mythos Kernel code is present. The repository follows strict development practices documented in `AGENTS.md` with emphasis on safety, testing, and secure git operations.

---

## Repository Structure

### Type & Package Management
- **Type**: TypeScript monorepo with npm workspaces
- **Package Manager**: npm (not yarn, not pnpm)
- **Node Version**: >=20.0.0
- **TypeScript Version**: 5.7.3+ (strict mode enforced)
- **Workspaces**: Defined in `/home/user/pauli-pi-agent/package.json`

### Primary Packages
- `packages/agent` - Core agent runtime (@mariozechner/pi-agent-core)
- `packages/ai` - Multi-provider LLM API (@mariozechner/pi-ai)
- `packages/coding-agent` - Interactive coding agent CLI
- `packages/tui` - Terminal UI library
- `packages/web-ui` - Web interface
- `packages/mom` - Slack bot integration
- `packages/pods` - Pod management
- `packages/youtube-kg-agent` - YouTube knowledge graph agent

---

## Agent Runtime Architecture

### Core Files
Located in `/home/user/pauli-pi-agent/packages/agent/src/`:

**agent.ts** (primary entry point)
- Exports `Agent` class with mutable state management
- `AgentOptions` interface defines construction parameters
- **Key integration point**: `beforeToolCall` and `afterToolCall` hooks
  - `beforeToolCall(context, signal)` → `BeforeToolCallResult` (can block tools)
  - `afterToolCall(context, signal)` → `AfterToolCallResult` (can modify results)
- Agent state tracks: systemPrompt, model, thinkingLevel, tools, messages, isStreaming
- Supports streaming via `StreamFn` type from @mariozechner/pi-ai
- Default thinking budget: OFF (configurable via options)

**agent-loop.ts**
- Main execution loop: `agentLoop()` and `agentLoopContinue()` functions
- Returns `EventStream<AgentEvent, AgentMessage[]>`
- Internal `runLoop()` implements:
  - Turn start/end events
  - Message injection via `getSteeringMessages()` and `getFollowUpMessages()` callbacks
  - Tool call execution via `executeToolCalls()` (references not fully visible)
  - Pending message queue management
- **Agent events**: `agent_start`, `turn_start`, `message_start`, `message_end`, `message_update`, `turn_end`, `agent_end`

**types.ts**
- `AgentMessage` interface with role field
- `AgentContext` containing systemPrompt, messages, tools
- `AgentLoopConfig extends SimpleStreamOptions` with:
  - `convertToLlm`: AgentMessage[] → Message[] transformer
  - `transformContext`: Message context pipeline hook
  - `getSteeringMessages`: Intra-run message injection
  - `getFollowUpMessages`: Post-completion message injection
  - `model`: Model selection
- `BeforeToolCallContext` and `AfterToolCallContext` for hook callbacks

---

## Approval Gate & Safety Systems

### Existing Tool Call Gates
**Location**: `packages/agent/src/agent.ts` and `agent-loop.ts`

Tool execution flow:
1. Assistant message generated with `toolCall` content blocks
2. `beforeToolCall(context)` invoked - can block execution
   - Returns `{ block: true, reason?: string }` to prevent tool call
   - Has access to: assistantMessage, toolCall definition, validated args, current context
3. Tool executes (if not blocked)
4. `afterToolCall(context)` invoked - can modify result
   - Can override: content, details, isError flags
   - Runs AFTER execution (sees actual result)

### Secret Redaction System
**Location**: `packages/agent/src/secrets/secret-redaction.ts`

- `SecretRedactor` class with pattern-based detection
- Built-in patterns: OpenAI keys, Anthropic, AWS, Bearer tokens, JWT, passwords, API keys
- Public methods: `redact()`, `containsSecrets()`, `detectSecrets()`
- Used for: audit logs, trace storage, message history sanitization

### Model Policy Enforcement
**Location**: `packages/agent/src/models/policy.ts`

- `PolicyEnforcer` class validates model selection
- Policies define: mode (free/balanced/premium/local_only), budget, providers, context requirements
- Enforces constraints based on mode:
  - `free`: Limited models, no reasoning, rate limited
  - `premium`: Full access, reasoning, priority queue

---

## Model Routing System

**Location**: `packages/agent/src/models/router.ts`

- `RoutingMode`: free | balanced | premium | local_only
- `RoutingRequest` interface: prompt, maxTokens, mode, userId, contextWindow, requiresReasoning
- `RoutedModel` interface: provider, modelId, costPerMToken, contextWindow, reasoning, rateLimitPerMinute
- `RoutingDecision` interface: model, estimatedCost, reasoning, appliedPolicy, timestamp
- `ModelRouter` class: manages model catalog and routing logic
- Method: `initializeModelCatalog()` sets up free/balanced/premium tiers

**Integration Point for Mythos**: Router can be extended with depth-aware model selection where:
- instant/fast depths → lightweight free-tier models
- normal/deep depths → balanced/premium models
- mythic depth → premium reasoning models

---

## Orchestration Framework

**Location**: `packages/agent/src/orchestration/`

### Types (orchestration/types.ts)
- `TaskStatus` enum: pending, running, completed, failed, skipped, retrying
- `WorkflowStatus` enum: idle, running, paused, completed, failed, cancelled
- `Task` interface: id, name, type, status, startedAt, completedAt, result, error, retries
- `Workflow` interface: id, name, status, tasks[], steps[], timing
- `WorkflowDefinition` interface: name, tasks[], config (timeout, maxRetries, onFailure)
- `ExecutionContext` interface: workflowId, taskId, inputs, outputs, metadata
- `ExecutionResult` interface: workflowId, status, tasksCompleted, tasksFailed, totalDuration, results, errors

### Executor (orchestration/executor.ts)
- `WorkflowExecutor` class manages workflow execution
- Supports:
  - Task dependency resolution
  - Retry logic with exponential backoff (1000ms initial, 2x multiplier)
  - Failure policies: stop | continue
  - Task handler registration
  - Workflow state tracking

**Integration Point for Mythos**: Executor provides foundation for loop phases:
- Each phase (understand, retrieve, structure, route, critique, simulate, decide, verify, package) as task
- Dependencies enforce phase ordering
- Failure handling aligns with halt policies

---

## Database System

**Location**: `packages/agent/src/database/`

### Types (database/types.ts)
Defines PostgreSQL schema mappings:
- `Source` interface: sourceType, url, title, ingestedAt, ingestionStatus, metadata
- `SourceItem` interface: itemType, content, mediaUrls
- `IngestionRun` interface: sourceId, status, timing, entity/claim/relation counts
- `VideoAsset`, `VideoObservation` interfaces
- `Transcript`, `Document` interfaces
- `Entity`, `Relation`, `Claim` interfaces for knowledge graph

### Migrations (database/migrations.ts)
- `MigrationRunner` class handles schema versioning
- `runMigrations()` function applies pending migrations
- Used in startup sequence

**Integration Point for Mythos**: Database schema extended with:
- `mythos_traces` table for storing execution traces
- `mythos_decisions` table for depth/routing decisions
- `mythos_metrics` table for token budgeting and performance metrics

---

## Testing Infrastructure

### Test Structure
- Framework: Vitest 3.2.4
- Command: `npm test` (runs `vitest --run` from package root)
- Test files: `packages/agent/test/` directory mirrors src structure
- Naming: `*.test.ts` convention

### Test Files Examined
- `test/agent.test.ts` (13.6 KB) - Agent state and streaming tests
- `test/agent-loop.test.ts` (22.4 KB) - Loop execution and event tests
- `test/interfaces/websocket.test.ts` - Real-time communication tests
- `test/orchestration/executor.test.ts` - Workflow execution tests
- `test/scrapers/web.test.ts` - Web scraping tests
- `test/scrapers/ingestor.test.ts` - Source ingestion tests

### Testing Patterns
- Mocking with `vi.fn()` from Vitest
- Using `beforeEach()` for test setup
- No real API calls in tests (mocked fetch, database)
- Tests verify: success/failure paths, error handling, state mutations, async behavior

**Safety Rule**: AGENTS.md explicitly forbids real provider APIs in tests. All external services mocked.

---

## Interface & Entry Points

### API Route (app/api/chat/route.ts)
- Next.js POST endpoint at `/api/chat`
- Accepts: messages, task, systemPrompt
- Uses `llmChat()` from `lib/llm`
- Response: { reply } or { error }

### CLI Entry Points
**studio-cli.ts** (`bin/studio-cli.ts`):
- Commands: upload, status, publish
- Uses OpusClipService for video clip generation
- Integrates with Postiz scheduler

**Integration Point for Mythos**: 
- CLI could expose depth control: `--depth fast|normal|deep|mythic`
- API route could accept `depth` parameter

---

## Configuration & Environment

### .env.example
Defined variables (location-specific setup):
- `LLM_PROXY_*` - Proxy configuration (localhost:8082)
- `*_API_KEY` - Provider keys (OpenRouter, Gemini, Groq, Anthropic, OpenAI, etc.)
- `GITHUB_TOKEN`, `CLOUDFLARE_*`, `HUGGINGFACE_TOKEN`
- `FIRECRAWL_API_KEY`, `NOTION_API_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`

**No existing MYTHOS_* flags** - these need to be added to .env.example

---

## Development Rules (from AGENTS.md)

### Critical Constraints for Mythos Implementation
1. **Git Safety**: Never use `git reset --hard`, `checkout .`, `clean -fd`, `stash`
2. **File Operations**: Read files before editing; use `git add <specific-files>`, never `git add -A`
3. **Linting**: Run `npm run check` (NOT `npm run dev`, `build`, or `test` on repo root)
4. **Testing**: Run from package root: `cd packages/agent && npm test`
5. **API Calls**: No real provider APIs in tests - mock all external services
6. **Code Quality**: TypeScript strict mode enforced

### Commit Message Format
Include session URL: `https://claude.ai/code/session_01X9vPZ5o7o8FtreHAjpqfoU` (from context)

---

## Identified Integration Points for Mythos Kernel

### 1. Task Classification (beforeToolCall Hook)
- **Hook**: `Agent.beforeToolCall(context)`
- **Input**: assistantMessage, toolCall, validated args
- **Action**: Classify task type deterministically (no LLM calls)
- **Output**: Block if classification fails or constraints violated

### 2. Goal Packet Creation (transformContext Hook)
- **Hook**: `AgentLoopConfig.transformContext(messages)`
- **Action**: Extract user goal, constraints, evidence requirements
- **Output**: Immutable GoalPacket for session
- **Safety**: Validate against cost/scope limits before returning

### 3. Depth Determination (beforeToolCall Hook)
- **Hook**: Pre-LLM in `Agent.beforeToolCall()`
- **Input**: GoalPacket, task classification, model policy
- **Action**: Select depth level (instant/fast/normal/deep/mythic)
- **Output**: Depth flag attached to context

### 4. Token Budgeting (beforeToolCall + afterToolCall Hooks)
- **Hook**: `beforeToolCall` - reserve tokens for depth
- **Hook**: `afterToolCall` - track actual consumption
- **Database**: Store metrics per session for budget enforcement

### 5. Loop Phase Enforcement (orchestration/executor)
- **Pattern**: Each Mythos phase (understand, retrieve, structure, etc.) as orchestration Task
- **Dependencies**: Enforce sequential phase ordering
- **Failure Handling**: Halt on confidence threshold, fallback to simpler depth

### 6. Evidence Policy Validation (afterToolCall Hook)
- **Hook**: `afterToolCall` after tool execution
- **Action**: Validate evidence gathered vs. requirements
- **Cap Confidence**: If evidence insufficient, reduce confidence score
- **Output**: Modified tool result with evidence metadata

### 7. Persona Routing (beforeToolCall Hook)
- **Hook**: Check depth level
- **Action**: For deep/mythic only, route to expert personas
- **Safety**: Never route simple tasks to expensive models
- **Fallback**: Degraded response if persona call fails

### 8. Stability Guard (beforeToolCall Hook)
- **Check**: Detect scope expansion (new tool types not in original goal)
- **Check**: Detect cost explosion (cumulative tokens > budget)
- **Action**: Block execution, emit warning, suggest halt
- **Safety**: Prevent runaway reasoning loops

### 9. Trace Recording (afterToolCall Hook)
- **Hook**: Post-execution trace storage
- **Safety**: Never log chain-of-thought, only decisions and evidence
- **Database**: `mythos_traces` table with sanitized content
- **Redaction**: Use `SecretRedactor` on all logged content

### 10. Approval Gate Passthrough (beforeToolCall Hook)
- **Critical**: Never bypass existing `Agent.beforeToolCall` if configured
- **Pattern**: Mythos blocks are in addition to, not replacement of, user hooks
- **Implementation**: Stack hooks via decorator pattern

---

## Safe Integration Patterns

### Never Bypass Existing Gates
```typescript
// WRONG - would lose user-configured approval gates
const myBeforeToolCall = async (ctx) => { /* mythos logic */ };
agent.beforeToolCall = myBeforeToolCall; // OVERWRITES user hook!

// RIGHT - stack the hooks
const originalHook = agent.beforeToolCall;
agent.beforeToolCall = async (ctx, signal) => {
  const mythosResult = await myMythosHook(ctx, signal);
  if (mythosResult?.block) return mythosResult;
  return originalHook ? await originalHook(ctx, signal) : undefined;
};
```

### Token Budget Overflow Prevention
- Pre-calculate max tokens for depth level
- Reserve before tool execution
- Rollback/fail if exceeded
- Never allow budget expansion mid-session

### Model Router Respect
- Query existing PolicyEnforcer before depth selection
- Never promote to premium if policy blocks it
- Use `RoutingDecision` for cost estimation
- Log routing rationale in trace

### Proof of Redaction
- Run all traces through `SecretRedactor` before database
- Test with mock secrets (sk-test-*, password=secret, etc.)
- Verify in unit tests that redaction occurs

---

## Recommended Files to Create

### New Package Structure
```
packages/reasoning/
├── mythos-kernel/
│   ├── src/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── task-classifier.ts
│   │   ├── goal-packet.ts
│   │   ├── depth-policy.ts
│   │   ├── token-budgeter.ts
│   │   ├── loop-phases.ts
│   │   ├── halt-policy.ts
│   │   ├── stability-guard.ts
│   │   ├── persona-router.ts
│   │   ├── evidence-policy.ts
│   │   ├── coda-validator.ts
│   │   ├── trace-recorder.ts
│   │   └── mythos-kernel.controller.ts
│   ├── test/
│   │   ├── task-classifier.test.ts
│   │   ├── goal-packet.test.ts
│   │   ├── depth-policy.test.ts
│   │   ├── token-budgeter.test.ts
│   │   ├── loop-phases.test.ts
│   │   ├── halt-policy.test.ts
│   │   ├── stability-guard.test.ts
│   │   ├── persona-router.test.ts
│   │   ├── evidence-policy.test.ts
│   │   ├── coda-validator.test.ts
│   │   ├── trace-recorder.test.ts
│   │   ├── mythos-kernel.test.ts
│   │   └── integration.test.ts
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── MYTHOS_KERNEL.md
│   ├── MYTHOS_KERNEL_POLICY.md
│   ├── MYTHOS_KERNEL_TRACE_SCHEMA.md
│   └── MYTHOS_KERNEL_TEST_PLAN.md
└── reports/
    └── mythos-kernel-build-report.json
```

### Root Documentation
- `docs/MYTHOS_KERNEL_CONTEXT_SCAN.md` (this file)
- `docs/MYTHOS_KERNEL.md` - User-facing implementation guide
- `docs/MYTHOS_KERNEL_POLICY.md` - Safety policies and constraints
- `docs/MYTHOS_KERNEL_TRACE_SCHEMA.md` - Database trace schema definition
- `docs/MYTHOS_KERNEL_TEST_PLAN.md` - 20 test case specifications

### Root Configuration
- Update `.env.example` with MYTHOS_* flags:
  - `MYTHOS_KERNEL_ENABLED=true`
  - `MYTHOS_DEFAULT_DEPTH=normal`
  - `MYTHOS_MAX_LOOPS=7`
  - `MYTHOS_TRACE_ENABLED=true`
  - `MYTHOS_PERSONA_ROUTER_ENABLED=true`
  - `MYTHOS_EVIDENCE_POLICY=strict`

---

## Recommended Files to Modify

### packages/agent/package.json
- Add workspace reference: `"@mariozechner/mythos-kernel": "*"`
- Update scripts if CLI integration needed

### packages/agent/src/agent.ts
- Add integration example in comments
- Document Mythos hook stacking pattern

### packages/agent/src/database/types.ts
- Add Mythos schema interfaces:
  - `MythosTrace`
  - `MythosDecision`
  - `MythosMetric`
  - `GoalPacket` (schema definition)

### packages/agent/src/database/migrations.ts
- Add migration for Mythos tables (if using PostgreSQL)

### .env.example
- Add all MYTHOS_* configuration variables

### packages/agent/src/lib/llm.ts (if exists)
- Document depth-aware routing for LLM provider selection

---

## Known Risks & Mitigations

### Risk 1: Infinite Loop Prevention
- **Risk**: Mythos loops could exceed max depth if halt policy fails
- **Mitigation**: Hard limit on loop count + token budget + time limit
- **Test**: Generate runaway scenario, verify halt fires

### Risk 2: Approval Gate Override
- **Risk**: New Mythos gate could shadow existing user approvals
- **Mitigation**: Always stack hooks, never overwrite
- **Test**: Verify existing gate still fires with Mythos enabled

### Risk 3: Secret Exposure in Traces
- **Risk**: Chain-of-thought logs could expose API keys or passwords
- **Mitigation**: Run all trace content through SecretRedactor, explicit audit
- **Test**: Inject sk-test-* and verify redaction in database

### Risk 4: Model Router Policy Violation
- **Risk**: Depth escalation could violate user's cost/provider policy
- **Mitigation**: Query PolicyEnforcer before depth selection, fallback if blocked
- **Test**: Set free-tier policy, verify mythic depth downgrades to normal

### Risk 5: Token Budget Explosion
- **Risk**: Token counting errors could lead to context bloat
- **Mitigation**: Pre-reserve budget, strict accounting per phase, rollback on overflow
- **Test**: Track tokens across phases, verify budget enforcement

---

## Build Readiness Checklist

- [ ] Task classifier deterministic without LLM calls (except when flagged)
- [ ] GoalPacket immutable after creation with validation
- [ ] DepthPolicy respects existing ModelRouter and PolicyEnforcer
- [ ] TokenBudgeter prevents context overflow (hard limit + warnings)
- [ ] LoopPhases map to orchestration Tasks with dependency ordering
- [ ] HaltPolicy enforces confidence thresholds and loop limits
- [ ] StabilityGuard blocks scope/cost/permission expansion
- [ ] PersonaRouter only routes deep/mythic tasks
- [ ] EvidencePolicy tracks requirements and caps confidence
- [ ] CodaValidator sanitizes output before return
- [ ] TraceRecorder redacts secrets from all logged content
- [ ] MythosKernelController orchestrates all components
- [ ] Integration with Agent beforeToolCall/afterToolCall hooks working
- [ ] No chain-of-thought exposed in traces or UI
- [ ] No bypassing of existing approval gates
- [ ] No real API calls in test suite
- [ ] All 20 test cases passing
- [ ] Database migrations ready
- [ ] Configuration flags in .env.example
- [ ] Documentation complete and examples provided
- [ ] Build report generated

---

## Next Steps

Upon context scan completion:
1. Create `packages/reasoning/mythos-kernel/` directory structure
2. Implement type definitions (`types.ts`)
3. Implement each component module in dependency order
4. Create comprehensive test suite (20 test cases)
5. Integrate with `Agent` class via hook stacking
6. Add database migrations
7. Document in MYTHOS_KERNEL.md
8. Verify safety constraints with integration tests
9. Generate build report
10. Create PR for review

---

**Context Scan Completed**: 2026-05-28 12:15 UTC  
**Ready for Implementation**: Yes - all integration points identified, no blockers found
