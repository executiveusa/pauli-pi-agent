# Secret Boundary Evidence — 2026-08-10

Branch: `fix/control-plane-secret-boundary`
Parent: `chore/icm-control-plane-audit`

## Goal

Close the S0 path that could copy repository/server provider credentials from root `.env` into the public Vite browser bundle.

## Changes

### `packages/web-ui/example/vite.config.ts`

- removed `node:fs` / `node:path` secret-file loading;
- removed `loadAgentEnv()`;
- removed provider/service key allowlist and `window.__AGENT_ENV__` HTML injection;
- removed the `inject-agent-env` transform plugin;
- restricted browser-exposed env prefixes to:
  - `PAULI_PUBLIC_*` — values explicitly classified as public;
  - `VITE_DEEP_RESEARCH_API` — retained compatibility for a public endpoint URL only.

### `packages/web-ui/example/index.html`

- removed the agent-env injection placeholder.

### `packages/secrets/src/third-party-integrations.ts`

- repaired the malformed closing template expression in `formatIntegrationReport()` so the registry is syntactically valid when checked/imported.

## Compatibility behavior

The generic Pi Web UI remains a compatibility/BYOK surface. It already has `ApiKeyPromptDialog` and provider-key storage for a user-provided browser key when a selected model needs one. No server/repository credential should be injected into the compiled application.

This is intentionally **not** the final Mission Control security architecture. The canonical product still needs authenticated server-side model/tool/control brokering before privileged organization integrations are exposed through Mission Control.

## Deployment evidence

Vercel preview for commit `c1606e2ee1b02eaffe112f92b43448ebc192e5f6` reached `READY`.

Fetched preview HTML returned HTTP 200 and contained no `window.__AGENT_ENV__` script. The later commit `fb3556f419403e5fd42c70f4cf1fe62a8b715c99` also reached Vercel `READY`; its only additional runtime change is the integration-registry syntax repair.

## Verification gap

Repository law requires `npm run check` after code changes. The available local container could not clone GitHub because DNS resolution for `github.com` failed, so the full repository check has **not** been executed in this environment.

Therefore:

- Vercel build: PASS
- preview HTML secret injection check: PASS
- source diff inspection: PASS
- full `npm run check`: BLOCKED by local network/DNS
- merge/release: NOT APPROVED

Keep this branch unmerged until the full check can run and any resulting errors are resolved.
