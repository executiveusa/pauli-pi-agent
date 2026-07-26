# Canonical Skill Catalog

This file organizes installed and referenced skills without duplicating or prematurely moving their implementations.

## Loading law

- Select 3-7 skills for a task.
- Load only their `SKILL.md`, stage-relevant support files, and required tool definitions.
- Do not load all 76 registry entries.
- Installed skills take precedence over external references with the same purpose.
- A skill cannot approve its own output.

## Canonical categories

### 1. Governance, safety, and release

| Capability | Current location |
|---|---|
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
| Digital Student and Skool adapter | `icm/workstreams/digital-student/` |

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
| Long-running course harness | `packages/longrun-harness/`, `skills/longrun-harness/` |
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
| UI intelligence | `skills/ui-intelligence/` |
| Design role | `agents/design/` |
| Taste and design references | `skills/SKILLS_REGISTRY.md` |
| Browser QA | `agents/browser-qa/` |

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
category: browser-learning
status: active
risk: low | medium | high
requires_human_approval: true | false
tools: []
inputs: []
outputs: []
---
```

## Registry relationship

- `skills/SKILLS_REGISTRY.md` remains the full external and lazy-load library.
- `skills.md` remains a compatibility index.
- This file is the canonical logical catalog for installed capabilities and category routing.
- New skills must be added here and to the full registry when they are intended for reuse.
