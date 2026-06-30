# Skills Registry — Lazy-Load Reference

> **Source:** `E:\ACTIVE PROJECTS-PIPELINE\ACTIVE PROJECTS-PIPELINE\pauli-pi-agent-main\Skills Agent Library Report.md`
> **Rule:** Do NOT clone these into the agent. Reference them by name; load only when a task matches the trigger. This is ICM — one agent, many folders, markdown = architecture.
> **Count:** 76 skills across 47 categories. Default stack picks 3–7 per repo, never the whole library.

---

## How to use this file

1. **Inspect the repo first** — detect package managers, languages, framework, DB, test setup, agent config.
2. **Classify the lane** — frontend / backend / full-stack / MCP / agent-harness / content-media / docs / data-infra / security-sensitive.
3. **Score skills** — repo fit × leverage × safety × reversibility × token savings × confidence.
4. **Install minimally** — pick 3–7 skills, not the whole library.
5. **Gate risk** — secrets, payments, destructive migrations, production deploys, private user data → **human approval required**.
6. **Write back memory** — `repo-manifest.json`, `skill-scorecard.json`, `install-plan.md`, `risk-log.md`, `handoff.md`.

---

## Repo Skill Router — Default Stack (unknown repos)

| Skill | Why | Load |
|-------|-----|------|
| `jcodemunch-mcp` | Token-efficient repo indexing (tree-sitter, precise symbols) | MCP server — always |
| `ast-grep-mcp` | Structural code search + safe codemods | MCP server — always |
| `Understand-Anything` | Turn complex repos into explainable maps/wikis | clone/reference — Phase 0 |
| `files.md` | Compact repo/file summarization format | clone/reference — intake |
| `claude-handoff` | Transfer state/decisions/next-actions across sessions | clone/reference — handoff |

---

## Practical Repo Presets

| Repo type | Recommended skills |
|-----------|-------------------|
| Unknown repo | `jcodemunch-mcp`, `ast-grep-mcp`, `Understand-Anything`, `files.md`, `claude-handoff` |
| Frontend app | `pauli-taste-skill`, `impeccable`, `native-feel-skill`, `design-skills`, `e2e-test`, `GSAP` (motion-heavy) |
| Full-stack Supabase | `supabase-mcp`, `context7`, `ast-grep-mcp`, `e2e-test`, `stage-cli` |
| Agent repo | `ralphy`, `claude-code-harness`, `skrun`, `open-agents`, `agent-rules-books`, `vibe_cockpit` |
| MCP/tooling repo | `modelcontextprotocol/ext-apps`, `mcp2cli`, `context7`, `browser-harness`, `OpenHarness` |
| Content/media repo | `postiz-app`, `agent-media`, `content-ideas`, `my-podcast`, `no_ai_slop_writing_rules` |
| Docs/training repo | `codebase-to-course`, `dox`, `dictionary-of-ai-coding`, `book-to-skill`, `files.md` |
| High-risk backend/state | `stateright`, `stage-cli`, `adamsreview`, `Keeper Security`, `agent-rules-books` |

---

## Full Skill Catalog (by category)

### Agent Conversion / Engineering
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `e2a` | engineering→agent conversion | verify first | 7 | low |

### Agent Harness / Autonomous Loop
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `ralphy` | PRD, long-running build, coding-agent loop, context rot | clone | 9 | high |
| `space-agent` | agent workspace, autonomous agent, tasks | clone/reference | 8 | medium |
| `ponytail` | coding agent, workflow, automation | verify first | 6 | low |

### Agent Harness / Multi-Model Deployment
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `masterstack-flywheel` (local: `skills/masterstack-flywheel/`) | deploy agent stack, VPS, LiteLLM gateway, masterstack, flywheel, Hermes orchestrator, Infisical secrets | clone/reference — see skill folder | 9 | high |

### Agent Harness / Claude Code
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `claude-code-harness` | claude code, builder harness, multi-agent, sandbox | clone/reference | 8 | medium |
| `free-claude-code` | Claude Code, free, dev environment | verify/license first | 6 | medium |

### Agent Harness / Evaluation
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `OpenHarness` | agent eval, benchmark, harness, multi-agent | clone/reference | 8 | medium |

### Agent Rules / Governance
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `agent-rules-books` | AGENTS.md, rules, coding standards, agent behavior | clone/reference | 9 | high |

### Agent Runtime / Toolkit
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `rtk` | runtime toolkit, agents, tools, orchestration | clone/reference | 8 | medium |

### Backend / Data / Infra
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `supabase-mcp` | Supabase, database, auth, storage | MCP server | 9 | high |
| `InsForge` | backend, infra, database, app scaffold | clone/reference | 8 | medium |

### Browser / Web Automation
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `browser-harness` | browser, CDP, web task, login flow | clone/install | 10 | high |

### Cloud Agent Platform
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `open-agents` | background coding agent, Vercel, GitHub integration, cloud agent | fork/deploy | 9 | high |

### Content / Growth
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `content-ideas` | content calendar, ideas, marketing, posts | clone/reference | 6 | medium |

### Content / Media / Publishing
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `agent-media` | agent media, social assets, content publishing, media generation | `npx skills add gitroomhq/agent-media` | 8 | high |
| `my-podcast` | podcast, audio, media workflow, show notes | clone/reference | 7 | medium |

### Content / Publishing Automation
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `postiz-app` | social scheduling, content publishing, campaigns, Postiz | fork/deploy | 9 | high |

### Core Skill Library
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `mattpocock/skills` | skill library, SKILL.md, agent skills, coding patterns | clone/copy selected | 10 | high |
| `greptileai/skills` | code review, repo intelligence, skills | clone/copy selected | 9 | high |
| `gemma-skills` | Gemma, skills, open model, agent skills | clone/copy selected | 8 | high |
| `michaelshimeles/skills` | skills, Claude Code, agent loop | clone/copy selected | 8 | medium |

### Decision / Optimization
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `optio` | options, decision, optimization, choice | verify first | 6 | low |

### Design Taste / Review
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `pauli-taste-skill` | design review, taste, Apple-level polish, visual QA | clone/copy skill | 10 | high |
| `design-skills` | design skill, visual system, UI review, brand | clone/copy selected | 9 | high |
| `impeccable` | design QA, web polish, UX review, frontend quality | clone/reference | 9 | medium |
| `design-ui-ux` | UX principles, design reference, interface review | clone/reference | 7 | medium |

### Docs / Current Code Context
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `context7` | current docs, library version, API docs, framework docs | MCP server/CLI | 10 | high |

### Docs / Document Generation
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `docx` | docx, word document, report generation, proposal | npm package/reference | 7 | high |

### Docs / Knowledge / Training
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `codebase-to-course` | documentation, onboarding, course, training | clone/reference | 8 | medium |
| `dox` | docs, documentation, dox, repo docs | clone/reference | 8 | medium |
| `dictionary-of-ai-coding` | terminology, training, coding agents, docs | clone/reference | 7 | high |

### Docs / Repo Summaries
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `files.md` | file tree, repo summary, files markdown, documentation | clone/reference | 8 | medium |

### Execution / Project Management
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `get-shit-done` | execution plan, ship, todo, project closeout | clone/reference | 8 | medium |

### Execution / Task Routing
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `fungible` | fungible tasks, substitute tools, routing | verify first | 6 | low |

### Handoff / Context Compression
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `claude-handoff` | handoff, context transfer, session summary, next agent | clone/reference | 9 | high |

### Human / Avatar / Social AI
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `openhuman` | human avatar, persona, digital human, companion | clone/reference | 8 | medium |
| `skills-for-humanity` | humanity, avatar, human-centered skills, assistants | clone/copy selected | 7 | medium |
| `comimi` | character, companion, conversation UI, avatar | verify first | 5 | low |

### Knowledge Graph / Repo Map
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `graphify` | graph, knowledge map, dependencies, architecture | clone/reference | 8 | medium |

### LLM Provider / Model Routing
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `awesome-ai-gateways` | AI gateway, provider routing, model gateway, cost control | clone/reference | 9 | high |
| `awesome-free-llm-apis` | free models, provider options, API routing, budget | clone/reference | 8 | high |
| `whichllm` | choose model, routing, model selection, cost | clone/reference | 8 | medium |

### MCP / Interactive Apps
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `modelcontextprotocol/ext-apps` | mcp, interactive ui, chat app, forms | clone/reference | 9 | high |

### MCP / Research Tools
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `perplexityai/modelcontextprotocol` | Perplexity, research, search MCP, citations | MCP server | 8 | high |

### MCP / Tool Bridges
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `mcp2cli` | MCP to CLI, tool bridge, terminal, command wrapper | clone/install | 9 | high |

### Observability / Agent Collaboration
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `hivemind` | multi-agent, collaboration, wandb, observability | clone/reference | 8 | high |

### Observability / Agent Hooks
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `claude-code-hooks-multi-agent-observability` | Claude Code hooks, observability, multi-agent, logs | clone/reference | 9 | high |

### Observability / Control Surface
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `vibe_cockpit` | agent fleet, monitoring, dashboard, Claude | clone | 9 | high |

### QA / Code Review
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `adamsreview` | review, PR, critique, quality gate | clone/reference | 7 | medium |

### QA / Formal Verification
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `stateright` | distributed system, state machine, concurrency, protocol | cargo/reference | 8 | high |

### QA / Review Workflow
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `stage-cli` | review stage, approval, visual QA, stage | cli | 7 | medium |

### QA / Testing
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `e2e-test` | e2e, playwright, user journey, browser test | copy skill | 8 | high |

### Refactor / Code Simplification
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `code-simplifier` | simplify code, refactor, reduce complexity, cleanup | copy/reference | 9 | high |

### Repo Company / Work Memory
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `paperclip` | repo as company, work memory, tasks, agent ledger | clone/reference | 9 | medium |

### Repo Intelligence / Code Search
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `ast-grep-mcp` | AST, codemod, safe refactor, search replace | MCP server | 10 | high |
| `jcodemunch-mcp` | large repo, token budget, tree-sitter, symbols | MCP server | 10 | high |
| `greploop` | grep loop, search loop, code discovery | identify source first | 7 | low |

### Repo Intelligence / Knowledge Extraction
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `Understand-Anything` | understand repo, wiki, map anything, docs extraction | clone/reference | 10 | high |

### Repo Intelligence / Open Source
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `opensrc` | open source analysis, repo map, source discovery, metadata | clone/reference | 8 | medium |

### Security / Secrets
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `Keeper Security` | secrets, vault, passwords, credentials | select repo after review | 8 | medium |

### Skill Creation / Knowledge Distillation
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `book-to-skill` | book, convert to skill, knowledge distillation, SKILL.md | clone/reference | 9 | high |

### Skill Runtime / API
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `skrun` | SKILL.md, AGENTS.md, api endpoint, run skill | clone/deploy | 10 | high |

### Studio-Owned Skills / Pauli Stack
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `synthia-gateway` | Synthia, gateway, studio backend, agent API | clone/private | 10 | high |
| `pauli-Uncodixfy` | simplify code, uncodixfy, token saving, cleanup | clone/private | 8 | medium |
| `pauli-blog` | blog, SEO, content ops, publishing | clone/private | 7 | medium |
| `paulsuperpowers` | personal operating system, superpowers, studio ops | clone/private | 7 | medium |

### Studio-Owned Skills / Vision
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `VisionClaw` | vision, image analysis, visual browser, multimodal | clone/private | 8 | medium |

### UI / Design Canvas
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `kanwas` | canvas, design editor, wireframe, UI generation | clone/reference | 8 | medium |

### UI / Frontend / Components
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `hyperframes-helper` | hyperframes, frontend, components, layout | clone/reference | 7 | medium |

### UI / Frontend / Design Systems
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `native-feel-skill` | native feel, mobile UI, app polish, frontend UX | clone/copy skill | 9 | high |

### UI / Frontend / Generation
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `uigen` | OpenAPI, UI generation, dashboard, forms | clone/reference | 9 | medium |

### UI / Frontend / Rendering
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `html-in-canvas` | canvas, html rendering, visual editor, graphics | reference | 7 | medium |

### UI / Motion
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `GSAP` | animation, motion, landing page, hero | npm package | 8 | high |

### Voice / Realtime Assistant
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `poc-realtime-ai-assistant` | realtime, voice, assistant, streaming | clone/reference | 7 | medium |

### Workflow Engine / Durable State
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `absurd` | durable workflows, postgres, state, agents | clone/reference | 9 | medium |

### Writing / Quality Rules
| Skill | Trigger | Action | Leverage | Confidence |
|-------|---------|--------|----------|------------|
| `no_ai_slop_writing_rules` | copywriting, AI slop, tone, writing QA | clone/reference | 9 | high |

---

## Confidence Policy

- **high** — safe to install on match.
- **medium** — inspect repo internals before installing.
- **low** — treat as candidate source; verify before any integration.
- **verify first** — do NOT install until the repo is inspected and the integration is understood.

## Risk Gate (human approval required)

Any skill touching these categories requires explicit human approval before live execution:
- auth / secrets
- payments
- destructive migrations
- production deploys
- private user data
- production databases
