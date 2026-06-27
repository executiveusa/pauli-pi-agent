# ArchonX Mercury Voice Chatbot

A portable, white-label, voice-first chatbot shell built on the Pi Agent runtime,
powered by Mercury 2 (Inception Labs) diffusion reasoning.

## What This Skill Provides

| Component | Location |
|---|---|
| Mercury client + stream | `packages/agent/src/mercury/` |
| Voice stability gate | `packages/agent/src/voice/stability-gate.ts` |
| Tenant config system | `packages/agent/src/tenants/` |
| Tool registry + router | `packages/agent/src/tools/` |
| Web UI shell components | `packages/web-ui/src/components/Mercury*.ts`, `VoiceOrb.ts`, `ToolDock.ts`, `UsageMeter.ts`, `AssetPanel.ts` |
| Skill config + examples | `.agents/skills/mercury-voice-chatbot/` |
| Documentation | `docs/MERCURY_*.md` |

## Quick Start

```bash
# 1. Set required env vars in .env
INCEPTION_API_KEY=your_key_here
MERCURY_MODEL=mercury-2
MERCURY_BASE_URL=https://api.inceptionlabs.ai/v1

# 2. Set tenant mode
ARCHONX_TENANT_CONFIG_MODE=local
ARCHONX_DEFAULT_TENANT_ID=client_demo

# 3. Run the agent
npm run dev
```

## Plans

| Plan | Voice | Diffusion | Tool Dock | Asset Panel |
|---|---|---|---|---|
| `clean` | ✗ | ✗ | ✗ | ✗ |
| `voice` | ✓ | ✗ | ✗ | ✗ |
| `mercury_diffusion` | ✓ | ✓ | ✓ | ✓ |

## Web Embed (Webflow / any site)

See: `.agents/skills/mercury-voice-chatbot/examples/webflow-embed.html`

## Adding a New Client Tenant

1. Copy `.agents/skills/mercury-voice-chatbot/examples/tenant-config.mercury-diffusion.example.json`
2. Save as `.agents/tenants/<client_id>.json`
3. Set `ARCHONX_DEFAULT_TENANT_ID=<client_id>` in client's env
4. Set `INCEPTION_API_KEY=<client_key>` (BYOK)

## Architecture

See: `docs/MERCURY_VOICE_CHATBOT_ARCHITECTURE.md`

## Activation

See: `docs/MERCURY_VOICE_AGENT_ACTIVATION.md`
