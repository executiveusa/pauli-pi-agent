# SKILL: LAND THE PLANE™ — GitHub Actions Deployment Harness
# The Pauli Effect™ × Akash Engine
# Version: 1.0 | Authority: Emerald Tablets™

**Use this skill whenever:** the user says "land the plane", asks to add CI, wire GitHub
Actions, deploy to Vercel, deploy to Railway, or harden any repo's automation.

**Activation phrase:** "land the plane" — these three words trigger the full installation.

**What this installs:** 12 GitHub Actions workflows + Lighthouse budget + reusable skill
templates. Everything needed to go from code → tested → previewed → deployed → notified
with zero human intervention after the first push.

---

## WHAT LANDS

| # | Workflow | Trigger | Purpose |
|---|----------|---------|---------|
| 01 | `ci.yml` | Every push | Parallel: typecheck + lint + test + build |
| 02 | `quality-gate.yml` | Every PR | Blocking: TS + Biome + Vitest + GEO + stubs + secrets |
| 03 | `deploy-vercel-web.yml` | Push to main | Vercel production — apps/web |
| 04 | `deploy-vercel-preview.yml` | Every PR | Vercel preview URL + PR comment |
| 05 | `deploy-railway.yml` | Push to main | Railway production — FastAPI backend |
| 06 | `deploy-railway-preview.yml` | Every Python PR | Railway preview env + PR comment |
| 07 | `auto-merge.yml` | Gates green | Squash-merge bot PRs automatically |
| 08 | `lighthouse.yml` | Vercel deploy | Lighthouse CI — fails if score < 90 |
| 09 | `beads-checkpoint.yml` | Push to main | Tag `bead-N` savepoints + update beads_log.md |
| 10 | `semver-tag.yml` | Push to main | Auto-bump semver: feat→minor, fix→patch, BREAKING→major |
| 11 | `docker-publish.yml` | Push to main | Build + push Docker image for Python API |
| 12 | `secret-rotation-reminder.yml` | 1st of month | Telegram reminder to rotate API keys |

Plus:
- `.github/lighthouse-budget.json` — Performance floor: 90
- `skills/land-the-plane/workflows/` — Reusable copies for future projects
- `skills/land-the-plane/SECRETS.md` — Required secrets documentation

---

## REQUIRED SECRETS

Set once in: GitHub → Settings → Secrets and variables → Actions

| Secret | Source | Used by |
|--------|--------|---------|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens | Workflows 03, 04 |
| `VERCEL_ORG_ID` | vercel.com → Team Settings → General | Workflows 03, 04 |
| `VERCEL_PROJECT_ID_WEB` | Vercel project → Settings | Workflow 03, 04 |
| `VERCEL_PROJECT_ID_DASH` | Vercel project → Settings | Dashboard deploy (optional) |
| `RAILWAY_TOKEN` | railway.com → Account → Tokens | Workflows 05, 06 |
| `RAILWAY_PROJECT_ID` | Railway project settings | Workflow 06 |
| `RAILWAY_SERVICE_ID` | Railway service settings | Workflow 05 |
| `TELEGRAM_TOKEN` | @BotFather on Telegram | Workflows 03, 05, 11, 12 |
| `TELEGRAM_CHAT_ID` | @userinfobot on Telegram | Workflows 03, 05, 11, 12 |
| `DOCKERHUB_USERNAME` | hub.docker.com | Workflow 11 |
| `DOCKERHUB_TOKEN` | hub.docker.com → Security | Workflow 11 |

---

## STACK ASSUMPTIONS

These workflows are tuned for the Pauli Effect™ / Akash Engine stack:
- **Runtime:** Bun 1.3.10
- **Linter:** Biome (`bun run check`)
- **Types:** TypeScript (`bun run typecheck`)
- **Tests:** Vitest (`bun run test`)
- **Frontend:** Next.js in `apps/web/` and `apps/dashboard/`
- **Backend:** FastAPI in `apps/api/`
- **Agents:** Python in `agents/` and `harness/`
- **Monorepo:** Turborepo (`bun run build --filter=web`)
- **Deployment:** Vercel (frontend) + Railway (backend)

For other stacks, adapt the `bun run` commands to `npm run` or `pnpm run` as needed.

---

## GEO GATE REQUIREMENTS

The `quality-gate.yml` includes a GEO (Generative Engine Optimization) compliance check.
Before this gate will pass, the repo needs:

1. `apps/web/public/llms.txt` — non-empty (> 100 bytes), describing the app for LLM crawlers
2. `apps/web/app/[locale]/robots.ts` — must allow GPTBot, ClaudeBot, PerplexityBot
3. `apps/web/app/[locale]/layout.tsx` — must include `application/ld+json` JSON-LD schema

If the repo does not have a `[locale]` routing structure, adjust paths in `quality-gate.yml`.

---

## BEADS INTEGRATION

The `beads-checkpoint.yml` workflow auto-tags commits when the message contains `bead(N)`:

```bash
# Trigger a bead checkpoint:
git commit -m "bead(7): complete user authentication flow"
# → creates tag: bead-7-complete-user-authentication
# → appends to memory/beads_log.md
```

---

## INSTALLATION EXECUTION

When this skill fires, execute in this order:

```bash
# 1. Create directories
mkdir -p .github/workflows
mkdir -p skills/land-the-plane/workflows

# 2. Write all workflow YAML files (see individual files below)

# 3. Create lighthouse budget
# (.github/lighthouse-budget.json)

# 4. Validate all YAML
for f in .github/workflows/*.yml; do
  python -c "import yaml; yaml.safe_load(open('$f'))" && echo "✅ $f" || echo "❌ $f"
done

# 5. Copy to reusable skills location
cp -r .github/workflows/ skills/land-the-plane/workflows/
cp .github/lighthouse-budget.json skills/land-the-plane/

# 6. Commit + tag
git add -A
git commit -m "[LANE][LAND-001] feat: Land the Plane™ v1.0 — full GitHub Actions harness | UDEC 9.0+"
git tag land-the-plane-v1.0
git push origin HEAD --tags
```

---

## QUALITY FLOOR

SYNTHIA™ 8.5/10 floor applies to this harness:
- All YAML files must be valid (validated with `python yaml.safe_load` before commit)
- All Lighthouse scores must pass 90/100 floor
- Zero secrets in source (enforced by `secret-scan` job)
- Zero stubs in production code (enforced by `stub-scan` job)
- Telegram notifications fire on every production deploy (observability)

**The plane doesn't land until the runway is clear.**

---

## WORKFLOW FILES

All 12 workflow files live at:
- `.github/workflows/` — active in current repo
- `skills/land-the-plane/workflows/` — reusable template copies

See individual YAML files written during installation for full content.
This skill document is the routing and activation layer —
the actual workflow YAML lives in the files installed by the skill.
