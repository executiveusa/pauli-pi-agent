# ArchonX Mercury Voice Chatbot Architecture

## System Overview

The Mercury Voice Chatbot is a portable, white-label chatbot shell built on the existing pi-agent-core and pi-web-ui foundations. It supports three deployment tiers and integrates with the ArchonX control plane for all policy decisions, tenant configuration, and security gates.

```text
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT WIDGET                          │
│  (Webflow, NextJS, or any HTML container)                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Voice Orb          Chat UI         Tool Dock         │  │
│  │  (STT input)    (Visual + Diffusion)  (Permission-gated) │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  No secrets exposed | No direct provider calls             │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/WSS
┌──────────────────────▼──────────────────────────────────────┐
│              ARCHONX CONTROL PLANE                          │
│              (Agent Server - Node.js)                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes (No secrets in responses)               │  │
│  │  ├─ POST /v1/agent/chat                            │  │
│  │  ├─ POST /v1/agent/voice/session                   │  │
│  │  ├─ POST /v1/agent/voice/transcribe (STT)          │  │
│  │  ├─ POST /v1/agent/voice/speak (TTS)               │  │
│  │  ├─ POST /v1/agent/tool-call (permission-gated)    │  │
│  │  ├─ GET /v1/tenant/config (public parts)           │  │
│  │  └─ GET /v1/tenant/usage (safe metrics)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tenant Configuration & Routing                      │  │
│  │  ├─ TenantConfig (plan, permissions, billing)       │  │
│  │  ├─ Model Router (Mercury 2, Fallback)             │  │
│  │  ├─ Tool Registry (name, schema, permissions)      │  │
│  │  └─ Usage Tracker (tokens, cost, audit)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Voice Processing Pipeline                           │  │
│  │  ├─ Stability Gate (for TTS output)                 │  │
│  │  │  └─ Buffers text, detects sentence boundaries   │  │
│  │  ├─ Two Output Lanes:                               │  │
│  │  │  ├─ Visual Lane (streams to UI, diffusion ok)   │  │
│  │  │  └─ Voice Lane (stable chunks only to TTS)      │  │
│  │  └─ Provider Bridge (STT/TTS)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Security & Audit                                    │  │
│  │  ├─ RBAC (permission checks on all actions)         │  │
│  │  ├─ Circuit Breakers (cost, rate limits)            │  │
│  │  ├─ Approval Workflow (high-risk actions)           │  │
│  │  ├─ Audit Logging (immutable action trail)          │  │
│  │  └─ Secret Redaction (automatic on all logs)        │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ Provider APIs (Server-side only)
┌──────────────────────▼──────────────────────────────────────┐
│                   PROVIDERS                                 │
│  ├─ Inception Labs Mercury API (chat)                      │
│  ├─ OpenAI (STT, TTS)                                      │
│  ├─ Anthropic Claude (fallback chat)                       │
│  └─ Other configured providers                             │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Tenant Configuration (`packages/agent/src/tenants/`)

**Files:**
- `tenant-config.ts` - Runtime instance managing current tenant config
- `tenant-schema.ts` - Validation and type definitions

**Responsibilities:**
- Load tenant config from environment or database
- Validate against schema
- Enforce plan-based feature gating
- Provide permission lookups
- Track usage and billing state

**Key Types:**

```typescript
interface TenantConfig {
  tenantId: string;
  clientName: string;
  plan: "clean" | "voice" | "mercury_diffusion";
  branding: BrandingConfig;
  routing: RoutingConfig;
  billing: BillingConfig;
  permissions: PermissionMatrix;
}
```

### 2. Mercury Client (`packages/agent/src/mercury/`)

**Files:**
- `mercury-client.ts` - Main client and factory
- `mercury-stream.ts` - Streaming response handling
- `mercury-types.ts` - Type definitions

**Responsibilities:**
- Create OpenAI-compatible client for Inception Labs Mercury API
- Handle streaming chat completions
- Support diffusion and reasoning effort parameters
- Map Mercury-specific response metadata

**Key Functions:**

```typescript
export function createMercuryClient(apiKey: string): OpenAI;

export async function streamMercuryChat(
  client: OpenAI,
  messages: Message[],
  options: MercuryStreamOptions
): Promise<AssistantMessageEventStream>;

export function streamMercuryDiffusion(
  stream: AssistantMessageEventStream
): AsyncGenerator<DiffusionChunk>;

export function mapReasoningEffort(
  level: "instant" | "low" | "medium" | "high"
): "low" | "medium" | "high";

export function buildMercuryPayload(opts: {
  diffusing?: boolean;
  reasoning_effort?: string;
  stream?: boolean;
}): Record<string, any>;
```

### 3. Stability Gate (`packages/agent/src/voice/stability-gate.ts`)

**Responsibility:** Prevent speaking unstable diffusion text fragments

**Key Methods:**

```typescript
class StabilityGate {
  // Buffer generated text
  enqueue(text: string): void;

  // Try to extract a stable sentence chunk
  flush(force?: boolean): string | null;

  // Cancel pending text (when user interrupts)
  cancel(): void;

  // Subscribe to stable chunks ready for TTS
  onStableChunk(callback: (text: string) => void): () => void;
}

// Sentence boundary detection
function detectSentenceBoundary(text: string): number | -1;
```

**Algorithm:**

1. Buffer generated tokens as they arrive
2. After each token, check for sentence boundary (., !, ?, \n)
3. When boundary detected, yield complete sentence to TTS
4. If diffusion modifies previous text, cancel pending TTS for that chunk
5. If user speaks again, call `cancel()` to stop voice playback

### 4. LLM Routing (update `packages/agent/src/lib/llm.ts`)

**Changes:**
- Add Mercury task routes: `mercury-fast`, `mercury-voice`, `mercury-diffusion`
- Support provider-specific extras: `diffusing`, `reasoning_effort`, `stream_options`
- Keep existing proxy behavior intact

**New Task Routes:**

```typescript
const TASK_ROUTES: Record<TaskType, RouteConfig> = {
  // ... existing routes ...
  "mercury-fast": {
    model: "mercury-2",
    direct: true,
    provider: "https://api.inceptionlabs.ai/v1",
    apiKeyEnv: "INCEPTION_API_KEY",
    maxTokens: 2048,
  },
  "mercury-voice": {
    model: "mercury-2",
    direct: true,
    provider: "https://api.inceptionlabs.ai/v1",
    apiKeyEnv: "INCEPTION_API_KEY",
    maxTokens: 1024,
  },
  "mercury-diffusion": {
    model: "mercury-2",
    direct: true,
    provider: "https://api.inceptionlabs.ai/v1",
    apiKeyEnv: "INCEPTION_API_KEY",
    maxTokens: 4096,
  },
};
```

### 5. API Routes (Server Implementation)

**POST /v1/agent/chat**

```typescript
interface ChatRequest {
  tenantId: string;
  message: string;
  history?: Message[];
  stream?: boolean;
}

interface ChatResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  diffusionEnabled: boolean;
}
```

**POST /v1/agent/voice/session**

```typescript
interface VoiceSessionRequest {
  tenantId: string;
}

interface VoiceSession {
  sessionId: string;
  tenantId: string;
  expiresAt: number;
}
```

**POST /v1/agent/voice/transcribe**

```typescript
// Form data with audio blob
interface TranscribeResponse {
  text: string;
  confidence: number;
  language: string;
}
```

**POST /v1/agent/voice/speak**

```typescript
interface SpeakRequest {
  tenantId: string;
  text: string;
  voiceName?: string;
}

// Returns audio/mpeg blob
```

**POST /v1/agent/tool-call**

```typescript
interface ToolCallRequest {
  tenantId: string;
  toolName: string;
  input: Record<string, any>;
}

interface ToolCallResponse {
  result: any;
  requiresApproval?: boolean;
  approvalId?: string;
}
```

**GET /v1/tenant/config**

```typescript
// Returns public parts of TenantConfig only
// No secrets, no internal state
interface PublicTenantConfig {
  plan: string;
  branding: BrandingConfig;
  routing: { voiceEnabled: boolean; diffusionEnabled: boolean };
  permissions: PermissionMatrix;
}
```

**GET /v1/tenant/usage**

```typescript
interface UsageMetrics {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  model: string;
  timestamp: number;
}
```

### 6. Web UI Components

**MercuryDiffusionBubble** (`packages/web-ui/src/components/MercuryDiffusionBubble.ts`)

- Renders assistant message with diffusion effect
- Text replaces in place instead of appending
- Shows "thinking" state while generating
- Smooth transition when diffusion updates

**VoiceOrb** (`packages/web-ui/src/components/VoiceOrb.ts`)

- States: idle, listening, thinking, speaking, interrupted, error
- Click to start recording
- Visual waveform animation while listening
- Pulsing animation while thinking
- Shows transcription when ready

**ToolDock** (`packages/web-ui/src/components/ToolDock.ts`)

- Only visible for `mercury_diffusion` plan
- Shows available tools with permission checks
- Displays icons and descriptions
- Never shows approval requirements or internal details

**UsageMeter** (`packages/web-ui/src/components/UsageMeter.ts`)

- Shows client-safe usage (tokens and estimate only)
- Respects `usagePaidByClient` flag
- Updates after each message
- Shows cost per message (if billed)

**MercuryAgentShell** (`packages/web-ui/src/components/MercuryAgentShell.ts`)

- Top-level component combining all elements
- Manages voice state and diffusion state
- Routes messages to correct output lane
- Coordinates speech input/output

### 7. Plan-Based Feature Gating

```typescript
// In route handlers and components

if (tenantConfig.plan === "clean") {
  // Text chat only
  disable(voiceOrb, toolDock, diffusionBubble);
  enableTextChat();
}

if (tenantConfig.plan === "voice") {
  // Voice enabled, diffusion optional
  enable(voiceOrb);
  disable(toolDock);
  if (tenantConfig.routing.diffusionEnabled) {
    enable(diffusionBubble);
  } else {
    use(normalStreamingBubble);
  }
}

if (tenantConfig.plan === "mercury_diffusion") {
  // All features enabled
  enable(voiceOrb, toolDock, diffusionBubble);
}
```

## Data Flow Examples

### Example 1: Clean Text Chat (Tier 1)

```text
User Types Message
    ↓
Client sends: POST /v1/agent/chat { tenantId, message, history }
    ↓
ArchonX routes to fallback model (cheaper)
    ↓
Stream response back to client
    ↓
Normal streaming bubble appends text
    ↓
Display in chat history
    ↓
Log usage and cost (user pays)
```

### Example 2: Voice Agent (Tier 2)

```text
User Clicks Voice Orb
    ↓
Client: Start STT session
    ↓
User speaks
    ↓
Client: POST /v1/agent/voice/transcribe { audio }
    ↓
ArchonX transcribes using OpenAI Whisper
    ↓
Client sends: POST /v1/agent/chat { tenantId, message, stream: true }
    ↓
ArchonX: Route to Mercury-2 model
    ↓
Stream response with stability gate
    ↓
Client feeds text to Stability Gate
    ↓
When stable sentence extracted:
    ├─ Display in visual lane
    └─ Send to TTS: POST /v1/agent/voice/speak
    ↓
ArchonX: Generate speech with OpenAI TTS
    ↓
Return audio blob to client
    ↓
Client plays audio
```

### Example 3: Mercury Diffusion Agent (Tier 3)

```text
User Clicks Voice Orb
    ↓
User speaks
    ↓
Transcribe via OpenAI
    ↓
POST /v1/agent/chat { message, stream: true }
    ↓
ArchonX routes to Mercury-2 with diffusing: true
    ↓
Stream response (text is continuously refined)
    ↓
Client Stability Gate:
    ├─ Buffer incoming chunks
    ├─ Update Visual Lane (diffusion effect) immediately
    ├─ Extract sentence boundaries
    └─ Queue to Voice Lane when stable
    ↓
Visual Lane (MercuryDiffusionBubble):
    ├─ Replace text in place
    └─ Show denoising animation
    ↓
Voice Lane:
    ├─ Waits for stable chunks from gate
    ├─ Sends to TTS when complete sentences available
    └─ User sees final text before it's spoken (preview effect)
    ↓
Tool Dock visible (plan-gated, permission-gated)
    ├─ User can invoke available tools
    ├─ Tool calls route through POST /v1/agent/tool-call
    └─ Approval workflow for high-risk tools
```

## Security Model

### Secret Isolation

- **Browser**: Zero secrets. Only receives tenant ID and public config
- **Server**: Manages all API keys (Mercury, OpenAI, fallback providers)
- **Network**: HTTPS/TLS for all communication
- **Logs**: Automatic redaction of secrets in all outputs

### Permission Model

1. **Tenant Config** defines base permissions (can email, can book, etc.)
2. **Tool Registry** declares which permissions each tool needs
3. **Before tool call**: Check tenant config + tool permissions
4. **High-risk tools** (money, email): Approval workflow
5. **All checks logged** with immutable audit trail

### Approval Workflow

```text
Tool Call Request
    ↓
Check Permissions
    ├─ If permission denied: 403 Forbidden (logged)
    └─ If permission granted and not high-risk: Execute
    ├─ If high-risk: Create approval record
    ├─ Notify admins
    ├─ Wait for approval (30s timeout default)
    ├─ If approved: Execute and log
    └─ If denied: Reject and log
```

## Deployment Architecture

### Local Development

```bash
# Terminal 1: Start agent server
cd packages/agent
npm run dev

# Terminal 2: Start web UI dev server
cd packages/web-ui
npm run dev

# Terminal 3: Open browser
http://localhost:5173
```

### Production (Docker)

```yaml
# docker-compose.yml
services:
  agent:
    image: archonx-agent:latest
    environment:
      INCEPTION_API_KEY: ${INCEPTION_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      MERCURY_MODEL: mercury-2
      MERCURY_BASE_URL: https://api.inceptionlabs.ai/v1
    ports:
      - "3000:3000"

  web-ui:
    image: archonx-web-ui:latest
    environment:
      NEXT_PUBLIC_API_URL: http://agent:3000/v1
    ports:
      - "3001:3000"
    depends_on:
      - agent
```

## Testing Strategy

### Unit Tests

- Stability gate logic (sentence boundary detection)
- Tenant config validation
- Permission checks
- Route mapping (Mercury → OpenAI-compatible calls)

### Integration Tests

- Voice pipeline end-to-end (without real speech)
- Diffusion text handling and visual lane updates
- Tool call permission enforcement
- Approval workflow

### E2E Tests (with real API keys)

- Text chat through Mercury
- Voice chat (transcribe → Mercury → speak)
- Diffusion visual updates
- Tool execution and approval

### Security Tests

- No API keys in logs (redaction verification)
- No secrets in error messages
- Permission enforcement
- CORS and origin validation

## Future Extensions

### 1. Advanced Persona System

- Custom voice characteristics
- Domain-specific system prompts
- Fine-tuning on customer data

### 2. Analytics Dashboard

- Real-time conversation metrics
- Cost tracking per tenant
- User engagement analytics
- Tool usage heatmaps

### 3. Multi-Language Support

- Automatic language detection
- STT/TTS in 50+ languages
- Prompt translation for different markets

### 4. Custom Tool Builder

- No-code tool creation UI
- Webhook-based tool handlers
- Tool marketplace / sharing

### 5. Advanced Approval Workflows

- Multi-step approvals
- Role-based approval chains
- Approval templates and presets

## References

- Mercury API: https://api.inceptionlabs.ai/v1
- OpenAI Compatibility: https://platform.openai.com/docs/api-reference/chat/create
- pi-agent-core: `/packages/agent`
- pi-web-ui: `/packages/web-ui`
- Tenant Config Schema: `/packages/agent/src/tenants/tenant-schema.ts`
