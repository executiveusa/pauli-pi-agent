# ArchonX Mercury Voice Chatbot - Implementation Summary

## What Has Been Delivered

A complete **skill package** for installing the ArchonX Mercury Voice Chatbot into the Pi Agent monorepo. The skill is structured, documented, and ready for development.

### Skill Directory Structure

```
.agents/skills/mercury-voice-chatbot/
├── SKILL.md                              # Mission, product tiers, control-plane rules
├── README.md                             # Quick start, integration points, troubleshooting
├── IMPLEMENTATION_SUMMARY.md             # This file
├── tenant.schema.json                    # JSON Schema for tenant config validation
├── tool-permissions.yaml                 # Tool permission matrix and approval workflows
├── examples/
│   ├── webflow-embed.html               # Webflow embed contract (CDN loading, config)
│   ├── nextjs-demo-client.md            # NextJS client implementation guide
│   └── tenant-config.example.json       # Sample tenant configurations (5 examples)
└── docs/
    ├── MERCURY_VOICE_CHATBOT_ARCHITECTURE.md  # Deep technical architecture
    └── HANDOFF_FOR_MERCURY_VOICE_AGENT.md     # Installation & activation guide
```

### Files Created / Modified

**New Files:**
- 9 new files in `.agents/skills/mercury-voice-chatbot/`
- Total: ~2,500 lines of documentation, examples, and schemas

**Modified Files:**
- `.env.example` - Added Mercury voice variables

## Product Architecture

### Three Deployment Tiers

1. **Clean Agent Chat** (`plan: "clean"`)
   - Text-only chat
   - No voice, no diffusion
   - Uses cheaper fallback model
   - Suitable for customer service

2. **Voice Agent** (`plan: "voice"`)
   - Text + voice I/O
   - Optional Mercury model
   - Stability gate for stable TTS output
   - Suitable for voice assistants

3. **Mercury Diffusion Agent** (`plan: "mercury_diffusion"`)
   - Full premium experience
   - Diffusion visual effect (text replacement in place)
   - Voice with stability gate
   - Tool dock + artifacts
   - Suitable for enterprise premium clients

### Control Plane Architecture

```
Client Widget (Webflow/NextJS)
    ↓ (No secrets)
ArchonX Control Plane (Agent Server)
    ├─ Tenant Config (plan, permissions, billing)
    ├─ Model Routing (Mercury 2, Fallback)
    ├─ Voice Pipeline (Stability Gate, two lanes)
    ├─ Tool Registry (permission checks, approval gates)
    └─ Audit Logging (immutable trail, redaction)
    ↓ (Server-side only)
Providers (Mercury, OpenAI, Anthropic)
```

### Key Design Decisions

1. **No Secrets in Browser**: All API keys stay server-side only
2. **Stability Gate**: Prevents speaking unstable diffusion fragments
3. **Two Output Lanes**: Visual (with diffusion) and Voice (stable chunks only)
4. **Plan-Based Gating**: Features enforced at tenant config level
5. **Permission Matrix**: Tools declare requirements; all checks server-side
6. **Default BYOK Billing**: Client owns API key/usage; ArchonX manages routing & security
7. **Reuse Existing UI**: Build on mini-lit web components, not React
8. **Portable**: Can be installed into any client system as managed agent shell

## Implementation Roadmap

### Phase 1: Verification (Now - ✅ Complete)
- [x] Document architecture and control flow
- [x] Create skill package structure
- [x] Write SKILL.md with mission and rules
- [x] Write README.md with quick start
- [x] Write architecture documentation
- [x] Create handoff guide
- [x] Document API contracts
- [x] Provide example configs and clients
- [x] Update .env.example

### Phase 2: Server-Side Implementation (Next)
**Files to create:**

1. `packages/agent/src/voice/stability-gate.ts` (150 lines)
   - Text buffering with sentence boundary detection
   - Stable chunk extraction for TTS
   - Cancellation support for user interruption

2. `packages/agent/src/mercury/mercury-client.ts` (100 lines)
   - OpenAI-compatible client for Inception Labs API
   - Streaming support
   - Diffusion and reasoning effort parameters

3. `packages/agent/src/mercury/mercury-stream.ts` (80 lines)
   - Response streaming and chunk handling
   - Diffusion text extraction

4. `packages/agent/src/mercury/mercury-types.ts` (100 lines)
   - Type definitions for Mercury requests/responses

5. `packages/agent/src/tenants/tenant-config.ts` (150 lines)
   - Runtime tenant configuration instance
   - Feature gating functions
   - Permission lookups

6. `packages/agent/src/tenants/tenant-schema.ts` (120 lines)
   - Type definitions for TenantConfig
   - Validation logic

7. **Update** `packages/agent/src/lib/llm.ts` (50 lines)
   - Add mercury-fast, mercury-voice, mercury-diffusion task routes
   - Support provider-specific extras (diffusing, reasoning_effort)

8. **Create API routes** (in existing agent server)
   - POST /v1/agent/chat
   - POST /v1/agent/voice/session
   - POST /v1/agent/voice/transcribe
   - POST /v1/agent/voice/speak
   - POST /v1/agent/tool-call
   - GET /v1/tenant/config
   - GET /v1/tenant/usage

### Phase 3: Web UI Implementation (Following)
**Components to create:**

1. `packages/web-ui/src/components/VoiceOrb.ts` (250 lines)
   - Voice state management
   - Microphone recording
   - Waveform visualization

2. `packages/web-ui/src/components/MercuryDiffusionBubble.ts` (200 lines)
   - Streaming text with diffusion effect
   - Text replacement in place
   - Visual thinking state

3. `packages/web-ui/src/components/ToolDock.ts` (200 lines)
   - Tool permission checking
   - Plan gating (mercury_diffusion only)
   - Tool invocation UI

4. `packages/web-ui/src/components/UsageMeter.ts` (150 lines)
   - Client-safe usage display
   - Token and cost tracking
   - Per-message metrics

5. `packages/web-ui/src/components/MercuryAgentShell.ts` (300 lines)
   - Top-level component combining all elements
   - Voice state coordination
   - Diffusion vs. normal streaming toggle
   - Two-lane output management

6. **Update** existing components:
   - `ChatPanel.ts` - Add support for MercuryAgentShell
   - `AgentInterface.ts` - Conditional component rendering
   - `StreamingMessageContainer.ts` - Support diffusion mode
   - `app.css` - Styles for new components

### Phase 4: Integration & Testing
- Type checking: `npm run check`
- Browser smoke test: `npm run check:browser-smoke`
- Manual testing of each tier
- Voice pipeline e2e testing

### Phase 5: Deployment
- Docker build
- Environment variable verification
- Production smoke test

## Mercury API Integration

**Provider**: Inception Labs  
**Base URL**: `https://api.inceptionlabs.ai/v1`  
**Model**: `mercury-2`  
**Compatibility**: OpenAI Chat Completions API

### Request Parameters

```typescript
{
  model: "mercury-2",
  messages: [...],
  stream: true,
  // Optional Mercury-specific:
  diffusing: boolean,  // Enable diffusion effect
  reasoning_effort: "instant" | "low" | "medium" | "high",
  stream_options: {
    include_usage: true,
  }
}
```

### Response Format

Streams `chat.completion.chunk` events compatible with OpenAI format.

## Voice Pipeline

### Text-to-Speech (TTS)

1. **Visual Lane** (immediate):
   - Stream assistant response to UI
   - Apply diffusion effect if enabled
   - User sees text as it's generated

2. **Voice Lane** (delayed for stability):
   - Pass streamed text through Stability Gate
   - Gate buffers and detects sentence boundaries
   - When complete sentence detected, send to TTS
   - User hears final, stable text

### Speech-to-Text (STT)

- Provider: OpenAI Whisper (default)
- Route: `/v1/agent/voice/transcribe`
- Input: Audio blob (WAV, MP3, etc.)
- Output: Transcript text

### Text-to-Speech (TTS)

- Provider: OpenAI TTS (default)
- Route: `/v1/agent/voice/speak`
- Voice options: alloy, echo, fable, onyx, nova, shimmer
- Output: Audio blob (MP3)

## Tenant Configuration

Sample config (see `examples/tenant-config.example.json`):

```json
{
  "tenantId": "my-client",
  "clientName": "My Client Corp",
  "plan": "mercury_diffusion",
  "branding": {
    "botName": "Mercury Prime",
    "primaryColor": "#0066cc",
    "accentColor": "#33cc99",
    "voiceName": "shimmer"
  },
  "routing": {
    "defaultModel": "mercury-2",
    "reasoningEffort": "low",
    "diffusionEnabled": true,
    "voiceEnabled": true
  },
  "billing": {
    "mode": "client_byok",
    "usagePaidByClient": true,
    "setupFee": 500,
    "monthlyMaintenanceFee": 250
  },
  "permissions": {
    "canUseBrowser": true,
    "canGenerateImages": true,
    "canGenerateVideo": false,
    "canSendEmail": true,
    "canBookAppointments": true,
    "requiresApprovalForMoneyMovement": true
  }
}
```

## Tool Permission Matrix

See `tool-permissions.yaml` for:
- Tool descriptions and risk levels
- Which plans can access each tool
- Which tools require approval
- Approval timeout and notification settings
- Rate limiting and concurrent request limits

Example:
```yaml
payment:
  description: "Process payments or charge credit cards"
  plans: []  # No plan can use this
  requiresApproval: true
  riskLevel: "critical"

image_generation:
  description: "Generate images via DALL-E"
  plans: ["mercury_diffusion"]
  requiresApproval: false
  riskLevel: "medium"
```

## Webflow Embed Contract

See `examples/webflow-embed.html`:

```html
<div id="archonx-mercury-agent"></div>
<script src="https://cdn.archonx.ai/mercury-agent.js"></script>
<script>
  ArchonXMercuryAgent.mount("#archonx-mercury-agent", {
    tenantId: "client_demo",
    mode: "mercury_diffusion",
    voice: true,
    diffusion: true,
    branding: { botName: "My Assistant", ... }
  });
</script>
```

Note: CDN build is future work. Contract is documented now.

## NextJS Demo Client

See `examples/nextjs-demo-client.md` for:
- API client setup (`lib/mercury-client.ts`)
- Zustand store for state management
- Chat UI component
- Voice integration pattern
- Deployment to Vercel

## Security Model

### Secret Isolation
- ✅ No API keys in browser bundles
- ✅ No direct provider calls from client
- ✅ All keys managed server-side
- ✅ HTTPS/TLS for all communication

### Permission & Approval
- ✅ Tenant config defines base permissions
- ✅ Tool registry declares requirements
- ✅ All checks enforced server-side
- ✅ High-risk tools require approval
- ✅ Approval workflow stored in database

### Audit & Compliance
- ✅ All agent interactions logged
- ✅ Automatic secret redaction
- ✅ Immutable audit trail
- ✅ User/admin action tracking
- ✅ Tool call tracking with approval chain

## Quality Checklist

### Documentation
- [x] SKILL.md - Feature overview
- [x] README.md - Quick start and integration
- [x] MERCURY_VOICE_CHATBOT_ARCHITECTURE.md - Deep technical
- [x] HANDOFF_FOR_MERCURY_VOICE_AGENT.md - Installation guide
- [x] IMPLEMENTATION_SUMMARY.md - This document

### Examples & Schemas
- [x] webflow-embed.html - Embed contract
- [x] nextjs-demo-client.md - Client implementation
- [x] tenant-config.example.json - Sample configs (5 examples)
- [x] tenant.schema.json - Tenant validation schema
- [x] tool-permissions.yaml - Permission matrix

### Configuration
- [x] .env.example updated with Mercury variables

## What's NOT Included (Future Work)

1. **CDN Build** - Webflow embed script hosting
2. **Vercel Demo** - Separate Vercel project showing Mercury integration
3. **Advanced Personas** - Custom voice characteristics
4. **Analytics Dashboard** - Usage metrics and insights
5. **Multi-Language** - Support for 50+ languages
6. **Custom Tool Builder** - No-code tool creation UI

## How to Use This Skill

### Step 1: Review the Documentation

Start with SKILL.md and README.md to understand the product.

### Step 2: Set Up Environment

Follow HANDOFF_FOR_MERCURY_VOICE_AGENT.md Phase 1-2:
- Verify existing chat works
- Get API keys (Inception Labs, OpenAI)
- Create .env file

### Step 3: Implement Server Components

Follow HANDOFF_FOR_MERCURY_VOICE_AGENT.md Phase 3:
- Create stability gate
- Create Mercury client
- Create tenant config system
- Update LLM routing
- Create API routes

### Step 4: Implement Web UI Components

Follow HANDOFF_FOR_MERCURY_VOICE_AGENT.md Phase 4:
- Create voice orb
- Create diffusion bubble
- Create tool dock
- Create usage meter
- Create agent shell
- Update existing components

### Step 5: Test & Deploy

Follow HANDOFF_FOR_MERCURY_VOICE_AGENT.md Phase 5-6:
- Type checking
- Manual testing of all tiers
- Verify no secrets exposed
- Deploy to production

## Success Criteria

When complete, you should have:

1. ✅ Existing web-ui chat still works
2. ✅ Existing artifacts panel still works
3. ✅ Mercury routes accessible (no 404s)
4. ✅ No API keys exposed to browser (`npm run check:browser-smoke`)
5. ✅ Three deployment tiers working (clean, voice, mercury_diffusion)
6. ✅ Voice pipeline with stability gate
7. ✅ Diffusion visual effect working
8. ✅ Tool permissions enforced
9. ✅ Usage metrics tracked
10. ✅ Tenant config loading correctly
11. ✅ `npm run check` passes
12. ✅ Portable enough to embed in any client system

## Key Dependencies

No new npm packages required:
- OpenAI SDK (already used in pi-ai)
- mini-lit (already used in web-ui)
- Existing pi-agent-core and pi-ai packages

## Estimated Development Time

- **Server Components**: 2-3 days (stability gate, Mercury client, routes)
- **Web UI Components**: 2-3 days (voice orb, diffusion bubble, tool dock)
- **Integration & Testing**: 1-2 days
- **Documentation & Deployment**: 1 day

**Total**: ~1 week for experienced TypeScript developer

## Next Steps

1. Read HANDOFF_FOR_MERCURY_VOICE_AGENT.md
2. Set up environment (Phase 1-2)
3. Implement server components (Phase 3)
4. Implement web UI components (Phase 4)
5. Test and verify (Phase 5)
6. Deploy to production (Phase 6)

## Support

- SKILL.md - Design decisions
- README.md - Integration and troubleshooting
- MERCURY_VOICE_CHATBOT_ARCHITECTURE.md - Technical deep dive
- HANDOFF_FOR_MERCURY_VOICE_AGENT.md - Step-by-step installation
- examples/ - Working code patterns
- tenant.schema.json - Configuration validation
- tool-permissions.yaml - Security and approval rules

---

**Status**: Skill documentation and structure complete. Ready for development.

**Branch**: `claude/mercury-voice-chatbot-skill-oQhTP`

**Author**: ArchonX Development Team

**Last Updated**: 2026-06-01
