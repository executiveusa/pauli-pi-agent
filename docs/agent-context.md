# Agent Context — Pauli Pi Agent

> Compressed memory for future Cosmos / agent work. Update after meaningful changes.

## Repo purpose
Pi-mono fork (from `badlogic/pi`) extended into **THE PAULI EFFECT** — a faceless social-purpose software factory run by one pi agent ("Cosmos") with many folders (ICM methodology). Target: public portfolio of positive projects backed by a self-hosted second brain + Obsidian vault, controlled via Tailscale.

## Stack
- **Monorepo:** npm workspaces, TypeScript, Node 24
- **Agent core:** `@mariozechner/pi-agent-core` (pi-coding-agent CLI)
- **Web UI:** Lit + Tailwind + Vite (`packages/web-ui`)
- **Brain:** Self-hosted Supabase (Postgres + pgvector) on VPS `pauli-vps` (Tailscale `100.122.224.55:8001`), local Fuse fallback
- **Control:** `ops/pauli-control/` Express bridge on port 8787 (mode-gated: plan/read/write/ship)
- **Knowledge vaults:** `E:\MENTAL MODELS`, `E:\OBSIDIAN SECOND BRAIN`
- **Secrets:** `E:\THE PAULI FILES\Cosmos_Vault.env` (gitignored, never committed)

## Key directories
- `PAULI.md` — operational identity (the pi-agent shell)
- `COSMOS.md` — engineering lead identity (locked globally)
- `company/` — doctrine (SOUL, HEART, MISSION, CYNTHIA_DESIGN_DOCTRINE, INDEX.md)
- `brain/` — knowledge layer (`search.mjs` → Supabase + local vaults)
- `skills/` — ICM skills library
- `scripts/` — notion-sync, library-catalog, repo inventory
- `ops/pauli-control/` — control bridge (server.js, openapi.yaml)
- `packages/agent/` — pi-agent-core (server, uses fetch/Response)
- `packages/web-ui/` — browser UI (Lit + Tailwind)
- `packages/data-processor/` — postgres importer (Node-only, breaks browser bundle)

## Build / test commands
- `npm run build` — build all workspace packages ✅ green
- `npm run check` — lint + typecheck + browser smoke ✅ green
- `npm test` — 527 tests ✅ green
- `npm run dev` (in `packages/web-ui/example`) — vite dev server (starts, but browser render blocked — see Known Issues)

## Conventions
- Pre-commit hook runs `biome check --write` + `tsgo --noEmit` + browser smoke
- DOM libs live in package-level tsconfig, NOT base (base is Node-only)
- Secrets in `.env` only (gitignored); `.env.example` has placeholders
- ICM methodology: one agent, many folders, markdown = architecture

## Current branch state
`feat/pauli-brain-icm` (local, not pushed) — 7 commits ahead of `main`:
- `bd3e91fa` Pauli identity + brain layer
- `e5992a2b` live Supabase over Tailscale
- `f17218d8` repo inventory + Notion sync + COSMOS identity
- `6351a376` lock Cosmos identity + fix tsconfig DOM-lib regression
- `894d6ca4` fix npm optional-deps cycling + standardwebhooks
- `974a5fa2` wip: web-ui browser rendering (pg/Buffer polyfills)
- `16c61085` Notion sync + library catalog + control bridge scripts

## Known Issues (the real gaps)
1. **Web UI browser rendering blocked** — `packages/web-ui/example` imports `@mariozechner/pi-agent-core` which re-exports `data-processor` (postgres server code) into the browser bundle. Vite aliases + Buffer polyfill added but `@mariozechner/pi-data-processor` workspace package still unresolved in browser. Fix: proper `vite-plugin-node-polyfills` config OR refactor example to not import full agent core OR externalize data-processor in vite config. Dev server starts (HTTP 200) but page is blank.
2. **VPS needs reboot** — `*** System restart required ***` on `pauli-vps`, 20 zombie processes. Non-urgent, services healthy.
3. **3 critical vulns** in pi-mono deps (next@15.3.3 has CVE-2025-66478). Run `npm audit fix` before any public exposure.
4. **Supabase service-role key** in plaintext Downloads file since March — rotate before agent does anything public.
5. **`@mariozechner/pi-coding-agent` deprecated** → successor is `@earendil-works/pi-coding-agent`. Switch before depending on it.

## Decisions made
- **ICM over multi-agent frameworks** — per Van Clief paper, one agent + folders + markdown, not 64-agent chess crews
- **Factory grows bottom-up** — ship one repo, then the octopus emerges; don't pre-build Archon X top-down
- **Tailscale for all private access** — no public ports; VPS joined to tailnet as `pauli-vps`
- **Cosmos identity locked** — engineering lead, anti-sycophant, tells Bambu when ideas are traps

## Next recommended steps (priority order)
1. **Fix web-ui browser rendering** — the one blocking gap. Try `vite-plugin-node-polyfills` or externalize data-processor. ~1-2 hrs focused.
2. **Push `feat/pauli-brain-icm` to origin** — 7 commits local only. Push when ready to share/backup.
3. **Triage 179 dormant repos** — score by revenue-potential × readiness, surface top 10 build-first candidates.
4. **Ship ONE directory** — Puerto Vallarta luxury directory (MISSION.md 90-day goal) → first MRR, proves factory loop.
5. **Ingest vaults into Supabase** — brain has ~1 test memory; real knowledge still only on E:\.

## Files changed this session
- `COSMOS.md` (new) — global identity anchor
- `PAULI.md` — reference to Cosmos
- `tsconfig.base.json` — removed DOM libs (CodeRabbit regression fix)
- `packages/agent/tsconfig.build.json` — added DOM libs (uses fetch/Response)
- `packages/web-ui/tsconfig.json` — added DOM libs (browser package)
- `package.json` + `package-lock.json` — standardwebhooks optional dep, clean reinstall
- `packages/web-ui/example/vite.config.ts` — pg/data-processor aliases (WIP)
- `packages/web-ui/example/index.html` — Buffer polyfill (WIP)
- `scripts/*.mjs` — Notion sync, library catalog, amentis clone
- `ops/pauli-control/openapi.yaml` + `package.json` — control bridge schema
