---
name: mercury-voice-chatbot
description: ArchonX Mercury Voice Agent — white-label, voice-first chatbot shell with Mercury 2 diffusion reasoning, tenant isolation, BYOK billing, and premium UI modes.
---

# Mercury Voice Chatbot Skill

## Purpose
Activates the ArchonX Mercury Voice Agent inside the Pi Agent runtime.
Provides three sellable tiers: Clean Chat, Voice Agent, and Mercury Diffusion Agent.

## Product: ArchonX Mercury Voice Agent

**Business model:**
- Clients pay their own token/API usage (BYOK via INCEPTION_API_KEY)
- ArchonX charges setup, monthly management, monitoring, and managed-agent support
- The client widget is the shell; ArchonX/ConX is the control plane

## Plans

### clean
- Text chat only
- No voice, no diffusion visual, no tool dock
- Basic lead capture if `canUseBrowser` is granted

### voice
- Text chat + VoiceOrb (push-to-talk)
- TTS output via stability-gated sentence chunks
- No diffusion visual unless demo override is explicitly enabled

### mercury_diffusion
- Text chat + voice + Mercury diffusion visual
- Tool dock (permission-gated per tenant)
- Asset panel
- Premium usage meter
- All features available per tenant config

## Mercury 2 Integration

Provider: Inception Labs
API: OpenAI-compatible chat completions
Base URL: https://api.inceptionlabs.ai/v1
Model: mercury-2

Three stream modes:
1. **mercury-fast** — reasoning_effort: low, diffusing: false
2. **mercury-voice** — reasoning_effort: instant (maps to low), diffusing: false
3. **mercury-diffusion** — reasoning_effort: low, diffusing: true
4. **mercury-operator** — reasoning_effort: medium, diffusing: optional

## Voice Safety Rule

The stability gate (`packages/agent/src/voice/stability-gate.ts`) MUST be
used between the diffusion stream and any TTS call. Raw diffusion text MUST
NEVER be passed directly to TTS.

## Activation

See: docs/MERCURY_VOICE_AGENT_ACTIVATION.md

## Tenant Config

See: .agents/skills/mercury-voice-chatbot/tenant.schema.json
Demo tenant: packages/agent/src/tenants/demo-tenant.ts

## Security Requirements

- INCEPTION_API_KEY resolved server-side only
- No provider keys in browser code
- All tool calls pass through tenant permission checks
- Money movement requires approval gate
