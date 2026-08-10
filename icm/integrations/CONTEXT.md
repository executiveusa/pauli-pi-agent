# Integration Inventory

Presence in a schema or source file is not proof of a live connection. This inventory separates code declaration from verified deployment/live evidence.

| System | Code owner / evidence | State | Notes |
|---|---|---|---|
| GitHub | repository, control/search code, deployment metadata | `LIVE_VERIFIED` | Canonical source repository is active; historical brain deployment has missing repo env and broken search. |
| Vercel | `vercel.json`, current deployments | `LIVE_VERIFIED` | `pauli-pi-agent` main and preview deployments verified; several adjacent Pauli Vercel projects are separate repos. |
| Supabase | `brain-dashboard/`, `packages/secrets/` | `CODE_DECLARED` | Existing brain migration exists; Botanic Creations target must be inspected live before any Pauli schema mutation. |
| OpenAI | `packages/secrets/`, Pi provider stack | `CODE_DECLARED` | Browser injection path must be removed before treating hosted use as safe. |
| Anthropic | provider stack / secret schema | `CODE_DECLARED` | Live credential state not inferred from code. |
| OpenRouter | secret schema/router | `CODE_DECLARED` | Used by several repo workflows historically; current live credential state not asserted. |
| Gemini / Google | secret schema/provider stack | `CODE_DECLARED` | Same. |
| Groq | secret schema/provider stack | `CODE_DECLARED` | Same. |
| Mistral | secret schema/provider stack | `CODE_DECLARED` | Same. |
| ZAI / GLM | secret schema/router | `CODE_DECLARED` | Same. |
| Cohere | secret schema | `CODE_DECLARED` | Same. |
| Cerebras | secret schema | `CODE_DECLARED` | Same. |
| Aion | secret schema | `CODE_DECLARED` | Same. |
| Firecrawl | secret schema/research tooling | `CODE_DECLARED` | Deep-research dependency; hosted runtime wiring must be tested separately. |
| Bright Data | web/research configuration | `CODE_DECLARED` | Same. |
| Notion | secret schema/brain integrations | `CODE_DECLARED` / historical | Historical sync work exists; current connection not live-tested here. |
| Inception / Mercury | secret schema, voice work | `CODE_DECLARED` / historical | Voice runtime capability; current deployment not live-tested here. |
| ElevenLabs | web env list/media references | `CODE_DECLARED` | Must remain server-side if used. |
| HeyGen | web env list/media references | `CODE_DECLARED` | Must remain server-side if used. |
| Cloudflare | secret schema | `CODE_DECLARED` | Current live use unknown. |
| Hugging Face | secret schema | `CODE_DECLARED` | Current live use unknown. |
| AgentMail | integration registry/history | `CODE_DECLARED` / historical | Do not assume current connection. |
| Composio | integration registry/history | `CODE_DECLARED` / historical | Candidate integration broker; write actions still use approval boundaries. |
| Latitude | integration registry/history | `CODE_DECLARED` / historical | Current live state unverified. |
| Infisical | secrets/masterstack code | `CODE_DECLARED` | Browser build stubs this capability; server/local use is separate. |
| Tailscale | brain/vault history | `LEGACY` / `UNKNOWN` | Historical topology only until live state is reverified. |

## Required per-integration node

Create a dedicated file only when an integration has active build work or a live verification record. Store secrets nowhere in ICM; store only secret names, ownership, permissions, and verification state.
