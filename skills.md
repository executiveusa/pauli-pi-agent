# Core Skills & MCP Repository Directory

This directory maps and indexes the specialized skills, tools, and Model Context Protocol (MCP) integrations available to this agent workspace. It establishes optimization protocols to conserve context window tokens and enforces high-performance execution patterns.

---

## 1. Primary Token Savers & Compilers (Always Active)

These tools must be utilized in every coding and agent execution session to compress codebase layouts and reduce raw token costs.

### jcode-munch MCP
* **Repository**: `https://github.com/jgravelle/jcodemunch-mcp.git`
* **Purpose**: Compresses source code trees, removes verbose comments during staging, and prepares minimal diff blocks.
* **Session Usage**: Enabled by default via localized `.claude/settings.json` stdio tools.

### RTK (Reasoning & Token Optimization)
* **Repository**: `https://github.com/rtk-ai/rtk.git`
* **Purpose**: Performs cost-aware model pruning, reduces context payload sizes, and structures intermediate chain-of-thought tokens.
* **Session Usage**: Invoked during multi-step reasoning runs to optimize system prompts.

---

## 2. Global Graphing & Discovery

### Vercel OpenSrc Grapher
* **Repository**: `https://github.com/vercel-labs/opensrc.git`
* **Purpose**: Generates interactive visual graphs of project dependencies and directories.
* **Session Usage**: Triggered at the beginning of each coding session to map blast radius and imports.

### Graphify
* **Repository**: `https://github.com/safishamsi/graphify.git`
* **Purpose**: Converts markdown files, schemas, and directories into structured graphical nodes.

---

## 3. Comprehensive Skill Mapping Directory

| Repository / Source | Scope / Category | Lazy-Load Condition |
| --- | --- | --- |
| `executiveusa/pauli-Uncodixfy` | Text / Code Simplifier | When converting rich specifications to basic layouts |
| `executiveusa/pauli-taste-skill` | Style / Aesthetics Engine | Active for any Next.js or React UI design work |
| `executiveusa/pauli-blog` | Content / Social Publishing | Used by the UGC Character and Postiz distribution agents |
| `executiveusa/paulsuperpowers` | Meta-Agent Abilities | Loaded when executing advanced CLI tasks |
| `mattpocock/skills` | TS / JS Quick Coding | During complex TypeScript type alignments |
| `mattpocock/dictionary-of-ai-coding` | Terminology & Protocols | Loaded during agent onboarding |
| `mattpocock/agent-rules-books` | Operating Doctrine | Injected during daily heartbeat evaluations |
| `willseltzer/claude-handoff` | Teammate Communication | Triggered when building role handoffs (Phase 16) |
| `Lum1104/Understand-Anything` | Deep Comprehension Engine | Loaded during initial Phase 0 workspace parsing |
| `supabase-community/supabase-mcp` | DB Integration | Used when verifying local or remote database tables |
| `browser-use/browser-harness` | Browser Automation | Enabled for automated UI testing and Playwright runs |
| `Alishahryar1/free-claude-code` | Local API Proxy | Manages local API connections to open-source models |
| `perplexityai/modelcontextprotocol`| Search MCP Integration | Used when doing external web searches |
| `upstash/context7` | Distributed Agent Context | Loaded during cross-agent memory transfers |
| `pbakaus/impeccable` | Mobile Design QA | Invoked during Synthia quality gates (UDEC checks) |
| `gsd-build/get-shit-done` | Work velocity engine | Active for tracking routine execution speeds |

---

## 4. Operational Protocols

### Token Optimization Policy
* **Compression**: Before feeding files into LLM reasoning contexts, use `jcodemunch` or `rtk` command wrappers.
* **Graphing**: Run the `vercel-labs/opensrc` graph tool on every new workspace branch or subfolder.
* **Lazy Loading**: Do not load all skill libraries simultaneously. Parse `skills.md` at session start, then dynamically import only the specific tool needed for the current active task.
* **Synthia Collaboration**: When working on visual design, always combine `pauli-taste-skill` and Synthia UI brief parameters to achieve premium spatial card layouts.

<!-- BEGIN FREE-LLM-PROXY-SETUP -->

# Free LLM Proxy + Smart Router

## free-llm-proxy

Routes LLM calls through a local multi-provider proxy.

* Proxy URL: `http://localhost:8082`
* Proxy token env: `LLM_PROXY_TOKEN`
* Project client:
  * TypeScript: `src/lib/llm.ts`
  * Python: `lib/llm.py`
* Toggle:
  * React/Next: `LLMProxyToggle`
* Config:
  * Local proxy config: `~/.fcc/.env`
  * Project env: `.env.local` or `.env`
  * Safe template: `.env.example`

## task routing

| Task           | Route               | Provider             |
| -------------- | ------------------- | -------------------- |
| `fast`         | `claude-haiku-4-5`  | Groq via proxy       |
| `code`         | `claude-haiku-4-5`  | Groq via proxy       |
| `balanced`     | `claude-sonnet-4-5` | Mistral via proxy    |
| `reasoning`    | `claude-opus-4-5`   | OpenRouter via proxy |
| `long-context` | direct              | Gemini 2.5 Flash     |
| `vision`       | direct              | Gemini 2.5 Flash     |
| `github-free`  | direct              | GitHub Models        |

## browser verification

Use Chrome DevTools MCP to:
* open local dev server
* take screenshots
* inspect console errors
* inspect network failures
* verify visible UI state

Project MCP config:
* `.claude/settings.json`

## operating rules

* Secrets stay in local ignored env files.
* Source code reads secrets from env.
* Browser code never sees provider keys.
* Existing LLM routes must preserve request/response contracts.
* Use server-side API routes for LLM calls.
* Report exact provider failures.

<!-- END FREE-LLM-PROXY-SETUP -->
