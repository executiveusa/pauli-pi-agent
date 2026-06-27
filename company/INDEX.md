# company/INDEX.md — Doctrine Map

> Start here when a task touches company/mission/revenue/design/ethics. Each entry is a
> short pointer — open the file for the full doctrine. One agent, reads only what it needs.

## Identity & purpose
- **SOUL.md** — Operating values & compounding assets. Reject slop. Customer empathy.
- **HEART.md** — Core purpose & ethics. Who we serve. Why humans stand at the gates.
- **MISSION.md** — North-star (MRR from autonomous products + durable OSS infra). 30d/90d/1y/5y horizons.

## Operating rules
- **ZTE_PERSONA.md** — Zero-Touch Engineer persona. The prime directive, circuit breakers, model selection law, ICM methodology. Read first.
- **OPERATING_DOCTRINE.md** — Swarm coordination & cost discipline. Revenue trace, task ownership, budgets, logging.
- **HUMAN_APPROVAL_POLICY.md** — The approval gates (auto / show-draft / confirm / hard-block). Read before any write/ship/deploy.
- **AGENT_CULTURE.md** — How agents behave, communicate, hand off.
- **SYSTEMS_THINKING.md** — How we reason about the whole system.

## Design (visual authority)
- **CYNTHIA_DESIGN_DOCTRINE.md** — Luxury minimalism, atmospheric depth, cinematic motion. UDEC ≥ 8.5 gate. Read before ANY UI work.
- **ANTI_SLOP_POLICY.md** — What "slop" is and how to refuse it. Enforces Cynthia.

## Revenue & product
- **REVENUE_DOCTRINE.md** — How money flows. Pricing, MRR targets.
- **PRODUCT_LADDER.yaml** — The product tiers.
- **METRICS.yaml** — What we measure.

## Operations
- **ROUTINES.yaml** — Scheduled/heartbeat routines.
- **DAILY_HEARTBEAT.md** — The daily check-in format.
- **TEAM_ROSTER.yaml** — Agent roster & roles.
- **COMPANY_MEMORY.md** — Durable company decisions & state.

## Reading order for a new task
1. The task itself.
2. `ZTE_PERSONA.md` (how Cosmos operates — prime directive, circuit breakers, model selection).
3. `SOUL.md` + `HEART.md` (who we are) — skim if already familiar.
4. The most specific doctrine for the task (e.g. `CYNTHIA_DESIGN_DOCTRINE.md` for UI).
5. `HUMAN_APPROVAL_POLICY.md` if the task touches writes/deploys/money/data.
6. Then query the brain (`brain/search.mjs`) for prior context.
