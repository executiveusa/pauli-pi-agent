# brain/ — Pauli's Second-Brain & Mental-Models access layer

**Role in the system:** This is the agent's *knowledge-retrieval layer*. Pauli does NOT
hold a giant RAG blob in context. Instead it queries the brain on demand, gets a small
ranked result set back, and reads only what it needs. This matches the ICM principle
("give it access to normal databases" instead of preloading everything) and the existing
`brain-dashboard/app/api/search/route.ts` pattern (Supabase first, local fallback).

**Zero npm dependencies.** Pure Node 24 built-ins. No install step.

## Files
- `search.mjs` — public API `searchBrain(query, {limit})`. CLI: `node brain/search.mjs "query"`.
- `env-loader.mjs` — loads keys from `.env` / Cosmos_Vault without ever echoing values.

## Backends (automatic, in order)
1. **Supabase** (primary, fast, semantic) — calls the existing
   `search_memories_fulltext` / `search_memories_by_vector` RPC on the `second_brain`
   schema. Used automatically when `SUPABASE_URL` + a key are set AND the host is reachable.
2. **Local** (fallback, always works offline) — fuzzy TF-ranked search over the on-disk
   vaults. Used when Supabase is unconfigured, unreachable, or returns nothing.

The result object's `backend` field tells you which one served the query:
`"supabase"` | `"local-unreachable"` (Supabase down, used local) | `"local-empty"`.

## Knowledge sources (vaults)
Configured in `env-loader.mjs → VAULTS`:
- `mental-models` → `E:\MENTAL MODELS`
- `obsidian-second-brain` → `E:\OBSIDIAN SECOND BRAIN`

Edit that list to add/remove vaults. Paths are walked to depth 3; heavy/vendored dirs
(`node_modules`, `.git`, nested repo copies, etc.) are skipped.

## Usage

### As a tool the agent calls
```js
import { searchBrain } from './brain/search.mjs';
const r = await searchBrain('design doctrine luxury minimalism', { limit: 10 });
// r.results[] → { source, vault, path, abspath, title, snippet, score }
```

### From the CLI (good for debugging)
```bash
node brain/search.mjs "pauli repos master analysis"
node brain/search.mjs "second brain" --limit 5
```

### Check what keys are loaded (values never printed)
```bash
node brain/env-loader.mjs
```

## Morning checklist (to flip from local → live Supabase)
1. Put VPS on Tailscale → note its tailnet IP (e.g. `100.x.x.x`).
2. Set in the agent's **gitignored `.env`** (never commit):
   ```
   SUPABASE_URL=http://100.x.x.x:8001
   SUPABASE_SERVICE_ROLE_KEY=<from Cosmos_Vault>
   ```
   (Cosmos_Vault already has `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — env-loader
   picks them up automatically once the host is reachable.)
3. Re-run `node brain/search.mjs "anything"`. `backend` should now read `"supabase"`.

## Security
- Secrets are loaded from disk only, never logged. `env-loader.mjs` is allow-listed to a
  small set of keys.
- The `service_role` key grants full admin on the DB — keep it in `.env` (gitignored) or
  the Cosmos_Vault, never in chat or a committed file.
