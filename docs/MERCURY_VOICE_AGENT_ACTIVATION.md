# Mercury Voice Agent — Activation Guide

## Prerequisites

- Node.js 20+
- `INCEPTION_API_KEY` from [Inception Labs](https://inceptionlabs.ai)
- Pi Agent runtime running (`npm run dev` in the repo root)

---

## 1. Environment Setup

Copy `.env.example` to `.env` and fill in the required values:

```bash
# Required — server-side only, never expose to browser
INCEPTION_API_KEY=sk-...

# Mercury model config
MERCURY_MODEL=mercury-2
MERCURY_BASE_URL=https://api.inceptionlabs.ai/v1

# Tenant config
ARCHONX_TENANT_CONFIG_MODE=local
ARCHONX_DEFAULT_TENANT_ID=client_demo
```

---

## 2. Tenant Config

### Local mode (development)

The demo tenant is loaded automatically from `packages/agent/src/tenants/demo-tenant.ts`.

To add a real client:
1. Copy `.agents/skills/mercury-voice-chatbot/examples/tenant-config.mercury-diffusion.example.json`
2. Save as `.agents/tenants/<your_tenant_id>.json`
3. Set `ARCHONX_DEFAULT_TENANT_ID=<your_tenant_id>` in `.env`
4. Restart the agent

### Remote mode (production)

```bash
ARCHONX_TENANT_CONFIG_MODE=remote
ARCHONX_CONTROL_PLANE_URL=https://control.archonx.ai
ARCHONX_DEFAULT_TENANT_ID=<client_id>
```

The agent fetches tenant config from `ARCHONX_CONTROL_PLANE_URL/tenants/<id>` and
caches it in memory. Call `invalidateTenantCache()` to refresh.

### Disabling the skill

```bash
ARCHONX_TENANT_CONFIG_MODE=disabled
```

All tenant-gated routes will return appropriate errors. No tenant config is loaded.

---

## 3. Verifying Each Mode

### Clean mode

- Text chat renders correctly
- No VoiceOrb visible
- No diffusion bubble visible
- No tool dock visible

### Voice mode

- VoiceOrb renders in footer
- Push-to-talk activates listening state
- TTS output fires via stability gate only — raw diffusion never reaches TTS
- Interruption (new speech) cancels current TTS and clears queue

### Mercury Diffusion mode

- Mercury diffusion bubble appears above input
- Text replaces in-place on each stream chunk (not typewriter append)
- Content locks at stream completion (state=final)
- Noise/scanline overlay visible during diffusing state
- Tool dock visible with permitted tools only
- Asset panel visible when assets are present
- Usage meter shows client-safe data (no internal secrets)

---

## 4. Security Verification

Run these checks before going live:

- [ ] `INCEPTION_API_KEY` does NOT appear in browser DevTools → Network tab
- [ ] `INCEPTION_API_KEY` does NOT appear in page source / JS bundles
- [ ] Tool calls for restricted scopes return permission errors
- [ ] Money-movement tools prompt for approval (not auto-executed)
- [ ] Usage logs do not contain API keys (check server console output)

---

## 5. Embedding in a Website

See `.agents/skills/mercury-voice-chatbot/examples/webflow-embed.html` for a
drop-in Webflow / plain HTML embed.

For Next.js: `.agents/skills/mercury-voice-chatbot/examples/nextjs-demo-client.md`

---

## 6. Adding a New Client

1. Create `.agents/tenants/<client_id>.json` using the schema:
   `.agents/skills/mercury-voice-chatbot/tenant.schema.json`
2. Set `INCEPTION_API_KEY=<client_key>` in the client's environment (BYOK)
3. Set `ARCHONX_DEFAULT_TENANT_ID=<client_id>`
4. Restart the agent
5. Run through the mode verification checklist above

---

## Troubleshooting

| Symptom | Check |
|---|---|
| 401 from Inception API | `INCEPTION_API_KEY` not set or invalid |
| Tenant not found | `ARCHONX_DEFAULT_TENANT_ID` does not match a file in `.agents/tenants/` |
| Voice mode not showing | Tenant plan must be `voice` or `mercury_diffusion`; `voiceEnabled: true` |
| Tool call rejected | Check `permissions` block in tenant config and `tool-permissions.yaml` |
| TTS not firing | Stability gate may be waiting for sentence boundary; try longer input |
| Diffusion text appending instead of replacing | Ensure `setDelta(text, "replace")` is called, not `"append"` |
