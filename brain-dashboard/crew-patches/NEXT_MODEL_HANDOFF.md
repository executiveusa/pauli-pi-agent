# Handoff Note — Next Model / Next Session

**Date:** 2026-06-03  
**Status:** Dashboard built and pushed to `pauli-my-Brain-Is-Full-Crew`. Vercel build pending user action.

---

## What Was Built

Full Next.js 15 App Router dashboard in `brain-dashboard/` (pauli-pi-agent) and copied to root of `pauli-my-Brain-Is-Full-Crew`:

| File | Purpose |
|---|---|
| `app/page.tsx` | Three-panel layout: NoteTree / NoteViewer / AgentLog |
| `lib/vault.ts` | Dual vault source: GitHub API or Tailscale local proxy |
| `lib/supabase.ts` | Supabase typed client — vault_index + agent_log |
| `lib/parse.ts` | gray-matter frontmatter + wiki-link extraction |
| `app/api/search/route.ts` | Supabase FTS → Fuse.js fallback |
| `app/api/agent-log/route.ts` | Read/write agent activity log |
| `tailscale-proxy/server.mjs` | Run on Windows to expose `E:\MENTAL MODELS` via Tailscale Funnel |
| `supabase-migration.sql` | Create vault_index + agent_log tables in Supabase |

---

## PENDING — Must Be Done Locally (Cannot Be Done From Cloud Session)

### 1. Finish the git push to pauli-my-Brain-Is-Full-Crew
The commit `38bcfb5` exists locally at `E:\REPOS\pauli-my-Brain-Is-Full-Crew` but was never pushed.
The push kept hanging because GitHub credentials weren't configured.

```powershell
cd "E:\REPOS\pauli-my-Brain-Is-Full-Crew"

# Option A — GitHub CLI (recommended)
gh auth login
git push origin main

# Option B — PAT in remote URL
git remote set-url origin https://executiveusa:<YOUR_PAT>@github.com/executiveusa/pauli-my-Brain-Is-Full-Crew.git
git push origin main
```

Once pushed, Vercel auto-detects Next.js and rebuilds. The 404 dies.

### 2. Set Vercel environment variables
In Vercel dashboard → Project `pauli-my-brain-is-full-crew` → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `VAULT_SOURCE` | `github` |
| `VAULT_GITHUB_OWNER` | `executiveusa` |
| `VAULT_GITHUB_REPO` | `mental-models` |
| `VAULT_GITHUB_BRANCH` | `main` |
| `VAULT_GITHUB_TOKEN` | Fine-grained PAT, Contents: Read-only on mental-models repo |
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |

### 3. Run Supabase migration
In Supabase SQL editor, run the contents of `supabase-migration.sql`.
Creates: `vault_index` (FTS-indexed), `agent_log`, RLS policies.

### 4. Apply crew-patches to pauli-my-Brain-Is-Full-Crew
```
brain-dashboard/crew-patches/CLAUDE.md.patch  → edit CLAUDE.md in brain repo
brain-dashboard/crew-patches/agents/emerald-tablets.md → copy to .claude/agents/ in brain repo
```
The patch adds Emerald Tablets (priority 0 constitutional agent) above wellness-guide in the routing table.

### 5. (Optional) Start Tailscale proxy for private vault
Run on Windows if you want `E:\MENTAL MODELS` served privately (not via GitHub):
```powershell
cd "E:\REPOS\pauli-pi-agent\brain-dashboard\tailscale-proxy"
npm install
$env:VAULT_ROOT = "E:\MENTAL MODELS"
$env:PROXY_SECRET = "your-secret-here"
node server.mjs
# Then: tailscale funnel 3001
```
Then set `VAULT_SOURCE=tailscale` and `TAILSCALE_PROXY_HOST=your-machine.ts.net:3001` in Vercel.

---

## Identity Stack (Do Not Break)

| Layer | Name | Role |
|---|---|---|
| 1 | ArchonX | Strategic mothership |
| 2 | Pi Agent | Execution layer |
| 3 | Brain Crew | 10-agent vault team + Emerald Tablets (priority 0) |
| 4 | Shockwave | Local markdown console |
| 5 | `E:\MENTAL MODELS` | Canonical memory |

---

## Repos in Play

- `executiveusa/pauli-pi-agent` — main dev repo (this file lives here)
- `executiveusa/pauli-my-Brain-Is-Full-Crew` — brain crew + Next.js dashboard (Vercel target)
- `executiveusa/mental-models` — private vault (read-only via PAT or Tailscale)
