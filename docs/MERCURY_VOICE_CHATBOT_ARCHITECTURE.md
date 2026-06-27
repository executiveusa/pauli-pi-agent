# Mercury Voice Chatbot — Architecture

## Overview

The ArchonX Mercury Voice Agent is a white-label, multi-tier chatbot shell built on the
Pi Agent runtime. It uses Mercury 2 (Inception Labs) as its reasoning engine and supports
three sellable tiers:

| Tier | Voice | Diffusion UI | Tool Dock | Asset Panel |
|---|---|---|---|---|
| `clean` | — | — | — | — |
| `voice` | ✓ | — | — | — |
| `mercury_diffusion` | ✓ | ✓ | ✓ | ✓ |

---

## Data Flow

```
User
 │
 ▼
[Browser / Embed]
 │  text input OR voice (push-to-talk)
 ▼
[Web UI Components]
 │  renders via LitElement web components
 │  never holds INCEPTION_API_KEY
 ▼
[Server-Side Proxy / Pi Agent API]
 │  resolves INCEPTION_API_KEY from environment
 │  loads tenant config (local file or remote control plane)
 ▼
[Mercury Stream Layer]  packages/agent/src/mercury/
 │  streamMercuryChat()    — text + voice tier
 │  streamMercuryDiffusion() — diffusion tier
 │    └── injects diffusing:true via onPayload hook
 ▼
[Inception Labs API]   https://api.inceptionlabs.ai/v1
 │  OpenAI-compatible completions, SSE stream
 ▼
[Two Output Lanes]
 │
 ├── Visual Lane ──────────────────────────────────────────────────────┐
 │    full raw stream                                                   │
 │    MercuryDiffusionBubble.setDelta(text, "replace")                 │
 │    in-place replace on each chunk (not append)                      │
 │    state: idle → diffusing → stabilizing → final                    │
 │                                                                      ▼
 │                                                          [Browser: MercuryDiffusionBubble]
 │
 └── Voice Lane ──────────────────────────────────────────────────────┐
      StabilityGate buffers text                                       │
      detects sentence boundaries via regex                            │
      min chunk = 20 chars, debounce = 300ms                           │
      NEVER passes raw diffusion fragments to TTS                      │
      fires onStableChunk(text) → TTS call                             │
                                                                        ▼
                                                            [Browser: TTS audio output]
```

---

## Package Layout

```
packages/
├── agent/
│   └── src/
│       ├── mercury/
│       │   ├── mercury-types.ts       MercuryMode, MercuryCallOptions, MercuryResponseMeta
│       │   ├── mercury-reasoning.ts   mapReasoningEffort(), resolveReasoningEffort()
│       │   ├── mercury-client.ts      createMercuryModel() → Model<"openai-completions">
│       │   └── mercury-stream.ts      streamMercury(), streamMercuryDiffusion()
│       ├── voice/
│       │   └── stability-gate.ts      createStabilityGate() — TTS safety buffer
│       ├── tenants/
│       │   ├── tenant-schema.ts       TenantConfig, TenantPlan, PLAN_FEATURES
│       │   ├── demo-tenant.ts         DEMO_TENANT for local dev
│       │   ├── tenant-config.ts       setActiveTenant(), getActiveTenant()
│       │   ├── tenant-loader.ts       loadTenantConfig() — local file or remote API
│       │   ├── tenant-permissions.ts  assertVoiceEnabled(), assertToolPermitted(), etc.
│       │   └── usage-ledger.ts        recordUsage(), getClientSummary() (client-safe only)
│       └── tools/
│           ├── tool-types.ts          ToolDefinition, ToolResult, ToolPermissionScope
│           ├── tool-registry.ts       registerTool(), listTools()
│           └── tool-router.ts         routeToolCall() — permission + approval gates
│
└── web-ui/
    └── src/
        └── components/
            ├── VoiceOrb.ts               <voice-orb> push-to-talk, 7 states
            ├── MercuryDiffusionBubble.ts <mercury-diffusion-bubble> in-place replace
            ├── UsageMeter.ts             <usage-meter> client-safe token display
            ├── ToolDock.ts               <tool-dock> permission-gated tool buttons
            ├── AssetPanel.ts             <asset-panel> image/video/document/audio
            └── MercuryAgentShell.ts      <mercury-agent-shell> plan-aware compositor
```

---

## Mercury 2 Provider Registration

Mercury reuses the existing `openai-completions` provider infrastructure:

```typescript
// packages/agent/src/mercury/mercury-client.ts
createMercuryModel() → {
  api: "openai-completions",
  provider: "inception",
  baseUrl: MERCURY_BASE_URL,
  // Compat overrides (packages/ai/src/types.ts OpenAICompletionsCompat):
  supportsStore: false,
  supportsDeveloperRole: false,
  maxTokensField: "max_tokens",
}
```

`INCEPTION_API_KEY` is resolved via `packages/ai/src/env-api-keys.ts`:
```typescript
inception: "INCEPTION_API_KEY"
```

The key is looked up server-side. It is never sent to the browser.

---

## Diffusion Streaming

Mercury 2 supports `diffusing: true` in the request body. This is not part of the
OpenAI spec, so it is injected via the `onPayload` hook in `streamOpenAICompletions`:

```typescript
streamMercuryDiffusion(options) {
  return streamMercuryChat({
    ...options,
    onPayload: (body) => ({ ...body, diffusing: true }),
  });
}
```

Each SSE chunk during diffusion contains the full message-so-far (replace semantics),
not a delta. `MercuryDiffusionBubble.setDelta(text, "replace")` handles this.

---

## Voice Safety Gate

Raw diffusion output MUST NOT reach TTS. The stability gate sits between the stream
and any TTS call:

```
stream chunk → StabilityGate.enqueueText(chunk)
                 ↓ (sentence boundary detected OR debounce fires)
             onStableChunk(stableText) → TTS
```

Sentence boundary regex: `/[.!?…]+[\s"')\]]*$/`  
Minimum chunk length: 20 characters  
Debounce: 300ms (configurable)  
Cancel: `gate.cancel()` — clears buffer, no TTS fired (interruption)

---

## Tenant System

```
ARCHONX_TENANT_CONFIG_MODE=local
  └── loads from .agents/tenants/<ARCHONX_DEFAULT_TENANT_ID>.json
  └── falls back to packages/agent/src/tenants/demo-tenant.ts

ARCHONX_TENANT_CONFIG_MODE=remote
  └── fetches from ARCHONX_CONTROL_PLANE_URL/tenants/<id>
  └── cached in memory, invalidated via invalidateTenantCache()

ARCHONX_TENANT_CONFIG_MODE=disabled
  └── all tenant-gated routes return errors
```

Tenant config schema: `.agents/skills/mercury-voice-chatbot/tenant.schema.json`

---

## Tool Permission Model

All tool calls pass through `routeToolCall()` in `packages/agent/src/tools/tool-router.ts`:

1. `assertToolPermitted(tenant, toolName)` — checks plan + permission flags
2. `requiresApproval(tool, tenant)` — checks approval gates (money movement)
3. `tool.execute(input)` — runs the tool handler

Tool definitions: `.agents/skills/mercury-voice-chatbot/tool-permissions.yaml`

---

## Security Invariants

| Invariant | Enforcement |
|---|---|
| INCEPTION_API_KEY server-only | `env-api-keys.ts` lookup; no client export |
| No raw diffusion text to TTS | `stability-gate.ts` required in voice lane |
| Money tools require approval | `routeToolCall()` approval gate |
| Tool calls respect tenant plan | `assertToolPermitted()` throws on violation |
| Usage logs strip API keys | `sanitizeEntry()` redacts `sk-`/`Bearer ` patterns |
