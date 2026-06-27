# Handoff: ArchonX Mercury Voice Agent

## What Was Built

A complete white-label voice chatbot shell inside the Pi Agent runtime, branded as the
**ArchonX Mercury Voice Agent**. It exposes three sellable tiers powered by Mercury 2
(Inception Labs diffusion reasoning model).

---

## New Files

### `packages/agent/src/mercury/`
| File | Purpose |
|---|---|
| `mercury-types.ts` | Core types: MercuryMode, MercuryCallOptions, MercuryResponseMeta |
| `mercury-reasoning.ts` | Reasoning effort mapping, route tag defaults |
| `mercury-client.ts` | `createMercuryModel()` — wraps `openai-completions` provider with Inception compat |
| `mercury-stream.ts` | `streamMercury()`, `streamMercuryDiffusion()` — server-only, key never in browser |

### `packages/agent/src/voice/`
| File | Purpose |
|---|---|
| `stability-gate.ts` | TTS safety buffer — sentence-boundary detection, debounce, cancel |

### `packages/agent/src/tenants/`
| File | Purpose |
|---|---|
| `tenant-schema.ts` | `TenantConfig` interface, `TenantPlan` enum, `PLAN_FEATURES` |
| `demo-tenant.ts` | `DEMO_TENANT` — `mercury_diffusion` plan, local dev default |
| `tenant-config.ts` | `setActiveTenant()`, `getActiveTenant()` |
| `tenant-loader.ts` | `loadTenantConfig()` — local file or remote control plane |
| `tenant-permissions.ts` | `assertVoiceEnabled()`, `assertToolPermitted()`, `requiresApproval()` |
| `usage-ledger.ts` | `recordUsage()`, `getClientSummary()` — strips secrets from logs |

### `packages/agent/src/tools/`
| File | Purpose |
|---|---|
| `tool-types.ts` | `ToolDefinition`, `ToolResult`, `ToolPermissionScope` |
| `tool-registry.ts` | `registerTool()`, `listTools()`, built-in stubs |
| `tool-router.ts` | `routeToolCall()` — permission + approval gate |

### `packages/web-ui/src/components/`
| File | Purpose |
|---|---|
| `VoiceOrb.ts` | `<voice-orb>` — push-to-talk, 7 states, CSS animations |
| `MercuryDiffusionBubble.ts` | `<mercury-diffusion-bubble>` — in-place replace, scanlines |
| `UsageMeter.ts` | `<usage-meter>` — client-safe token/usage display |
| `ToolDock.ts` | `<tool-dock>` — permission-gated tool buttons |
| `AssetPanel.ts` | `<asset-panel>` — image/video/document/audio assets |
| `MercuryAgentShell.ts` | `<mercury-agent-shell>` — plan-aware compositor |

### `.agents/skills/mercury-voice-chatbot/`
| File | Purpose |
|---|---|
| `SKILL.md` | Skill definition, plan docs, security rules |
| `README.md` | Quick start, component table, adding clients |
| `tenant.schema.json` | JSON Schema for tenant config files |
| `tool-permissions.yaml` | Tool permission matrix per plan |
| `activation-checklist.md` | Pre-activation env vars + per-mode verification |
| `examples/webflow-embed.html` | Drop-in Webflow / plain HTML embed |
| `examples/tenant-config.clean.example.json` | Clean plan example |
| `examples/tenant-config.voice.example.json` | Voice plan example |
| `examples/tenant-config.mercury-diffusion.example.json` | Full diffusion plan example |
| `examples/nextjs-demo-client.md` | Next.js integration guide |
| `examples/vercel-showroom-later.md` | Future showroom placeholder |

### `docs/`
| File | Purpose |
|---|---|
| `MERCURY_VOICE_CHATBOT_ARCHITECTURE.md` | Full architecture, data flow, security invariants |
| `MERCURY_VOICE_AGENT_ACTIVATION.md` | Step-by-step activation and troubleshooting |
| `HANDOFF_FOR_MERCURY_VOICE_AGENT.md` | This file |

---

## Modified Files

| File | Change |
|---|---|
| `packages/ai/src/types.ts` | Added `"inception"` to `KnownProvider` union |
| `packages/ai/src/env-api-keys.ts` | Added `inception: "INCEPTION_API_KEY"` to env map |
| `packages/web-ui/src/index.ts` | Exported new Mercury UI components |
| `.env.example` | Added Mercury + ArchonX env vars |

---

## Critical Invariants (Do Not Break)

1. **`INCEPTION_API_KEY` is server-only.** It is resolved in `mercury-client.ts` via
   `env-api-keys.ts`. It must never appear in any browser bundle or network request.

2. **Raw diffusion text must never reach TTS.** The voice lane must always pass stream
   output through `createStabilityGate()` before calling any TTS function.

3. **All tool calls pass through `routeToolCall()`.** Never call `tool.execute()` directly
   from a request handler — the permission and approval checks are in the router.

4. **Money-movement tools require explicit approval.** The `approval_gates.money_tools`
   list in `tool-permissions.yaml` defines which tool names are gated. Adding new
   payment/financial tools must update this list.

5. **Tenant plan enforces UI visibility.** `MercuryAgentShell` reads `tenant.plan` and
   hides components the plan doesn't include. Never override this with CSS `!important`.

---

## Billing Model

- **BYOK (Bring Your Own Key):** Client provides their own `INCEPTION_API_KEY`. ArchonX
  does not pay for inference.
- **Managed pass-through:** ArchonX holds the key, bills the client, and marks up usage.
- Billing mode is set in `billing.mode` in the tenant config.
- ArchonX charges: setup fee + monthly management fee (see example tenant configs).

---

## Next Steps

- [ ] Wire `streamMercuryDiffusion()` into the Pi Agent API request handler
- [ ] Implement actual STT integration in `VoiceOrb` (currently stub state machine)
- [ ] Implement actual TTS call in `MercuryAgentShell.onStableChunk()`
- [ ] Write integration tests for the full voice → stability-gate → TTS pipeline
- [ ] Deploy Vercel showroom (see `examples/vercel-showroom-later.md`)
- [ ] Add Stripe or usage-based billing integration to `usage-ledger.ts`
- [ ] Rate limiting on `/api/mercury` proxy route

---

## Architecture Reference

`docs/MERCURY_VOICE_CHATBOT_ARCHITECTURE.md`

## Activation Reference

`docs/MERCURY_VOICE_AGENT_ACTIVATION.md`
