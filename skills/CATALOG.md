# Canonical Skill Catalog

This file organizes installed and referenced skills without duplicating or prematurely moving their implementations.

## Loading law

- Select 3-7 skills for a task.
- Load only their `SKILL.md`, stage-relevant support files, and required tool definitions.
- Do not load the entire registry.
- Installed skills take precedence over external references with the same purpose.
- A skill cannot approve its own output.
- Route through `icm/domains/CONTEXT.md` before selecting skills when the capability owner is ambiguous.

## Canonical categories

### 1. Architecture, governance, safety, and release

| Capability | Current location |
|---|---|
| ICM Architect | `skills/icm-architect/` |
| Full-stack wiring audit | `skills/full-stack-wiring-audit/` |
| Gauntlet quality loop | `skills/gauntlet-loop/` |
| Repository engineering rules | `AGENTS.md` |
| Stop-the-line workflow | `WORKFLOW.md` |
| QA specialist | `.claude/agents/qa-specialist.md` |
| Security engineer | `.claude/agents/security-engineer.md` |
| Release shepherd | `.claude/agents/release-shepherd.md` |
| Judge and watcher roles | `agents/judge/`, `agents/watcher/` |

### 2. Browser, vision, and authenticated workflows

| Capability | Current location |
|---|---|
| Browser harness reference | `skills/SKILLS_REGISTRY.md` |
| UI intelligence | `skills/ui-intelligence/` |
| Online shopper | `.agents/skills/online-shopper/` |
| Browser QA role | `agents/browser-qa/` |
| Video watch | `skills/video-watch/` |
| Digital Student and Skool policy | `icm/workstreams/digital-student/` |

### 3. Knowledge, research, and second brain

| Capability | Current location |
|---|---|
| Deep research runtime | `packages/deep-research/` |
| Durable imports | `packages/data-processor/` |
| YouTube knowledge graph | `packages/youtube-kg-agent/` |
| Shockwave graph operator | installed skill referenced by PR history and registry |
| Emerald Tablets prime directive | installed skill referenced by PR history and registry |
| Research and knowledge references | `skills/SKILLS_REGISTRY.md` |

### 4. Agent runtime and orchestration

| Capability | Current location |
|---|---|
| Core agent | `packages/agent/` |
| Coding agent | `packages/coding-agent/` |
| Mythos Kernel | package implementation under `packages/` |
| Masterstack flywheel | `skills/masterstack-flywheel/` |
| External harness references | `skills/SKILLS_REGISTRY.md` |

### 5. Content, media, and publishing

| Capability | Current location |
|---|---|
| Content engine | `packages/content-engine/` |
| Video watch | `skills/video-watch/` |
| Podcast and media references | `skills/SKILLS_REGISTRY.md` |
| Postiz publishing reference | `skills/SKILLS_REGISTRY.md` |
| Company content contexts | `companies/*/content/` |

### 6. Revenue, product, and delivery

| Capability | Current location |
|---|---|
| Revenue systems agent | existing local skill referenced by `WORKFLOW.md` and registry |
| Unfinished project productionizer | existing local skill referenced by PR history |
| Monetization role | `agents/monetization/` |
| Company briefs | `companies/*/briefs/` |
| Factory patterns | `factory/` |

### 7. Design and frontend quality

| Capability | Current location |
|---|---|
| New Look — chat-first capability-preserving frontend redesign | `skills/new-look/` |
| UI intelligence | `skills/ui-intelligence/` |
| Design role | `agents/design/` |
| Taste and design references | `skills/SKILLS_REGISTRY.md` |
| Browser QA | `agents/browser-qa/` |
| Gauntlet quality loop | `skills/gauntlet-loop/` |

### 8. Infrastructure, secrets, and deployment

| Capability | Current location |
|---|---|
| Secrets package | `packages/secrets/` |
| Masterstack flywheel | `skills/masterstack-flywheel/` |
| GPU/pod manager | `packages/pods/` |
| Deployment references | `skills/SKILLS_REGISTRY.md` |

## Skill folder contract

Every installed skill should converge on:

```text
<skill>/
├── SKILL.md
├── CONTEXT.md
├── README.md
├── workflow.md
├── policy.md
├── examples/
├── templates/
├── scripts/
├── tests/
└── evidence/
```

Only `SKILL.md` is mandatory. Empty folders should not be added without a current use.

## Frontmatter contract

```yaml
---
name: skill-name
description: Concrete triggers and outcome
category: capability-family
status: active
risk: low | medium | high
requires_human_approval: true | false
tools: []
inputs: []
outputs: []
---
```

## Core composition patterns

### ICM architecture / repo restructuring

`icm-architect` → `full-stack-wiring-audit` when live wiring affects the target tree → relevant domain skills.

### Frontend/control-plane redesign

`full-stack-wiring-audit` → `new-look` → `ui-intelligence` / taste skills → `gauntlet-loop` → independent QA/security/release gates.

### Long-running learning

Digital Student workstream → `video-watch` → memory/knowledge skills → durable execution layer when available.

## Registry relationship

- `skills/SKILLS_REGISTRY.md` remains the legacy full external/lazy-load library.
- `skills.md` remains a compatibility index.
- This file is the canonical logical catalog for installed capabilities and category routing.
- New reusable skills should eventually be reflected in the full registry, but do not edit that large legacy registry without reading it completely and verifying its consumers.
