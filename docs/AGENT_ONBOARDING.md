# Agent Onboarding Guide — Cynthia Design Studio

You are joining Cynthia, the autonomous design authority for The Pauli Effect™ AI Design Studio.

This document tells you everything you need to know to operate effectively.

## Step 1: Understand Your Context

Read these files in order:
1. `STUDIO_MANIFEST.md` — What Cynthia is and how she operates
2. `studio/ops/OPERATING_MODEL.md` — The 8-layer operating model
3. `studio/agents/AGENT_ROLES.md` — All agent definitions and contracts
4. `studio/index/task-routing.yaml` — How tasks flow to agents
5. `studio/doctrine/DESIGN_LAWS.md` — The non-negotiable design laws

### Skill Files (read when relevant to your role)
| Skill | When to Load |
|-------|-------------|
| `studio/doctrine/luxury-psychology-SKILL.md` | Any premium-market brief |
| `studio/doctrine/pass-framework-SKILL.md` | Any copy production task |
| `studio/doctrine/behavioral-design-laws-SKILL.md` | All frontend work |
| `studio/doctrine/kupuri-frontend-SKILL.md` | Kupuri/Querencia web work |
| `studio/doctrine/motion-SKILL.md` | Any animated component |
| `studio/doctrine/udec-scorer-SKILL.md` | Any scoring task |
| `studio/doctrine/emerald-tablets-SKILL.md` | Architectural decisions |

## Step 2: Know Your Role

Every agent has:
- A **purpose** (what you do)
- A **scope** (what you own)
- **Inputs** (what triggers your work)
- **Outputs** (what you deliver)
- **Tools** (what you can use)
- **Constraints** (what you cannot do)
- **Escalation rules** (when to ask for help)
- **Memory write permissions** (what you can record)

Find your role definition in `studio/agents/{your-role}/AGENT.md`

## Step 3: Understand the Quality Gate

All design work is scored on 14 axes (UDEC Framework):

| Axis | Weight | Blocker? |
|------|--------|----------|
| VHR — Visual Hierarchy | 12% | No |
| TYP — Typography Mastery | 10% | No |
| SPA — Spatial Composition | 8% | No |
| CLR — Color System | 8% | No |
| MOT — Motion & Interaction | 12% | **YES (≥7.0)** |
| MAT — Material & Surface | 8% | No |
| COM — Component Architecture | 8% | No |
| INF — Information Architecture | 6% | No |
| MOB — Mobile Responsiveness | 8% | No |
| PER — Performance Discipline | 6% | No |
| ATM — Atmospheric Depth | 6% | No |
| CON — Content Quality | 4% | No |
| ACC — Accessibility | 2% | **YES (≥7.0)** |
| ORI — Originality | 2% | No |

**Floor: 8.5 weighted composite. No exceptions.**

### LUX Gate (Premium-Market Deliverables)
For briefs targeting Affluent, HNW, VHNW, or UHNW audiences, a supplementary
**LUX (Luxury Psychology Conversion)** checklist is applied by LENA after standard
UDEC scoring. LUX < 7.0 routes to BASS for copy revision before delivery.

LUX checklist (9 points):
1. Wealth category identified before execution
2. A.R.E. formula applied in primary copy
3. Psychology triggers calibrated to wealth tier
4. Language register correct (luxury transforms applied)
5. Social proof type matches category
6. Scarcity mechanism appropriate (absent for UHNW)
7. Price/investment framing correct
8. CTA language calibrated to category
9. P.A.S.S.™ structure present in sales copy

See `studio/doctrine/luxury-psychology-SKILL.md` for complete framework.

## Step 4: Understand the Build Protocol (Karpathy Council)

```
BRIEF arrives
    ↓
ROUND 1 — POSITION
  Builder produces 3 parallel variations

ROUND 2 — REBUTTAL
  Reviewer scores all 14 axes
  Below 8.5 → ITERATION_REQUIRED → Synthesist

ROUND 3 — SYNTHESIS
  Synthesist writes improvement brief
  Builder iterates → back to Round 2

APPROVAL
  Score ≥ 8.5, no blockers → APPROVED
  Packaging agent prepares deliverable
```

## Step 5: Respect the Boundaries

### You CAN autonomously:
- Read any file in the repo
- Execute design/copy/motion/3D/audit work within your scope
- Score outputs against rubrics
- Write to your designated memory areas
- Create artifacts in jobs/ and exemplars/

### You CANNOT autonomously:
- Accept or sign contracts
- Move money or create payouts
- Publish to external platforms
- Modify doctrine files (version-locked)
- Create credentials or API keys
- Accept work that violates quality floor

### Escalation triggers:
- Any action involving money, contracts, or credentials → human approval
- Any score dispute → Design Review Board
- Any ambiguity about scope → Studio Concierge
- Any doctrine conflict → Design Librarian

## Step 6: Use the Index

Find anything in the studio via:
- `studio/index/studio-catalog.md` — Everything that exists
- `studio/index/studio-taxonomy.yaml` — Classification system
- `studio/index/component-registry.yaml` — All components
- `studio/index/doctrine-map.yaml` — All doctrine files
- `studio/index/workflow-map.yaml` — All workflows
- `studio/index/task-routing.yaml` — Task → agent mapping
- `studio/index/agent-observability-map.yaml` — Agent monitoring

## Step 7: Leave the Studio Better

After every completed job:
1. Record what worked in `studio/memory/approved-patterns/`
2. Record what failed in `studio/memory/failed-attempts/`
3. Record lessons in `studio/memory/lessons/`
4. If you found a reusable pattern, add it to `studio/patterns/`
5. If you found an anti-pattern, add it to `studio/anti-patterns/`

The studio compounds knowledge. Your work makes the next agent better.
