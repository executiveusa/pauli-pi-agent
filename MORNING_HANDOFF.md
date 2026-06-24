# MORNING HANDOFF — Bambu

**From:** the overnight build session (2026-06-23/24)
**Branch:** `feat/pauli-brain-icm` in `C:\Users\execu\repos\pauli-pi-agent` (local only, NOT pushed)
**TL;DR:** Pauli now has an identity (`PAULI.md`), a doctrine map (`company/INDEX.md`), and a
working brain that searches your `E:\` vaults from disk — verified live. The control bridge
now runs jobs *as Pauli*. **One thing left that only you can do: put the VPS on Tailscale.**

---

## ✅ What got built tonight

### 1. Brain — `brain/` (zero npm deps, pure Node 24)
- **`brain/search.mjs`** — `searchBrain(query, {limit})`. Tries **Supabase RPC first**
  (`search_memories_fulltext`), **falls back to local fuzzy search** over your vaults on disk.
  Result object tells you which backend served it.
- **`brain/env-loader.mjs`** — loads keys from `.env` / `Cosmos_Vault.env` into `process.env`.
  Allow-listed to a small key set. **Never echoes values.**
- **`brain/README.md`** — usage + the morning checklist to flip Supabase on.

**✅ Self-tested live** — `node brain/search.mjs "design doctrine luxury minimalism"` returned
12 ranked hits from `E:\OBSIDIAN SECOND BRAIN` + `E:\MENTAL MODELS` (incl. the right docs:
Luxury Copywriting, PAULI_REPOS_MASTER_ANALYSIS). Backend reported `local-unreachable`
(Supabase VPS down → local fallback worked, exactly as designed).

### 2. Identity — ICM top-level files
- **`PAULI.md`** (repo root) — the agent's first-read identity + navigation map. Who Pauli is,
  what it believes, how to navigate, approval gates, current state.
- **`company/INDEX.md`** — doctrine map (SOUL/HEART/MISSION/CYNTHIA/etc.) with reading order.

### 3. Control bridge identity injection
- **`ops/pauli-control/server.js`** — `buildPrompt()` now opens with the Pauli identity block
  (no slop, humans at gates, memory-first, points to `PAULI.md` + `company/`). Syntax-checked.

### 4. Secret hygiene
- `.gitignore` — added guards for `Cosmos_Vault.env`, `*secrets*.env`, `.superpowers/`.
- `.env.example` — appended brain/Tailscale keys (placeholders only).

## 🗺️ Where this fits (ICM / "1 agent, many folders")
```
PAULI.md (identity) ──▶ company/ (doctrine) ──▶ brain/ (knowledge query)
        └──▶ skills.md (capabilities) ──▶ AGENTS.md (repo rules)
                    └──▶ ops/pauli-control (the control bridge runs jobs AS Pauli)
```
Per the arXiv ICM paper you shared: one agent + structured folders + on-demand context =
no multi-agent framework needed. Tonight wired the identity + knowledge layers.

---

## 🔴 The ONE thing only you can do (morning)

**Put the VPS on Tailscale so Supabase becomes reachable.** Right now the brain works on
local-only because your VPS (31.220.58.212) has Supabase **firewalled from the public
internet** (only ports 22 + 80 are open — verified). SSH in and:

```bash
ssh root@31.220.58.212            # (key: ~/.ssh/bambu_key wasn't found last time — use password or fix key path)
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up                       # approve the device in https://login.tailscale.com/admin/machines
tailscale ip -4                    # → note this 100.x.x.x IP, tell me
```

Then **you** drop the real keys into the agent's gitignored `.env` (Cosmos_Vault already has
`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — but the URL points at the *public* IP which is
blocked; change it to the tailnet IP). After that, re-run:
```bash
node brain/search.mjs "anything"
# expect: "backend": "supabase"
```

⚠️ Also: **rotate the Supabase service-role key** before/after. The connection-details file in
`Downloads` (with the live service-role key + JWT secret in plaintext) has been sitting there
since March; if it was ever shared/uploaded, treat those keys as compromised.

---

## 🔵 Optional nice-to-haves (whenever)
- VPS says `*** System restart required ***` + has 20 zombie procs — a `reboot` when convenient.
- `@mariozechner/pi-coding-agent` is deprecated → `@earendil-works/pi-coding-agent` (from your installer log).
- 3 critical npm vulns in the pi-mono repo → `npm audit fix`.

## ▶️ Suggested next session (pick one)
1. **Tailscale done → flip Supabase live** + build the brain-indexer that ingests your vaults into `second_brain` (so Supabase is the real primary, not just local-fallback).
2. **Start the public portfolio frontend** (the animated avatar world — Option B's Q2).
3. **Prune pi-mono baggage** via code-simplifier + ponytail (strip unused `packages/*`).

## 📂 Files changed on branch `feat/pauli-brain-icm`
- `PAULI.md` (new) — identity
- `company/INDEX.md` (new) — doctrine map
- `brain/search.mjs`, `brain/env-loader.mjs`, `brain/README.md` (new) — brain layer
- `ops/pauli-control/server.js` (edited) — identity injection
- `.env.example`, `.gitignore` (edited) — secret hygiene

Sleep well. 🌙
