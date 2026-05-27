# Monorepo Context Scan

## 1. Project Topology
* **Repository Type**: npm workspaces Monorepo
* **Package Manager**: npm (uses `package-lock.json` and workspaces)
* **Primary Languages**: TypeScript (TS/JS modules), JSON config files
* **Workspace Packages**:
  * `packages/ai`: Multi-provider unified LLM API layer.
  * `packages/agent`: Core agent runtime, tool calls, and state configurations.
  * `packages/coding-agent`: Interactive CLI agent.
  * `packages/mom`: Slack synchronization integration.
  * `packages/tui`: Terminal UI engine.
  * `packages/web-ui`: Web component chat widgets.
  * `packages/pods`: vLLM deployment tools.

---

## 2. Command Architecture

### Safe Commands
* **Build**: `npm run build` (builds workspaces in correct dependency order)
* **Type/Format Checks**: `npm run check` (invokes Biome formatter & type checkers)
* **Verify**: `./test.sh` (runs vitest suite, bypassing external APIs)

### Forbidden Commands
* `git reset --hard` / `git checkout .` (destroys work from other collaborative agents)
* `git add -A` / `git add .` (stages files outside our specific task scope)

---

## 3. Implementation Target Map

### Primary App Root
The **PI Agent** core engine lives in `packages/agent`. This is our target package to insert the ZTE smart router `src/lib/llm.ts` and the server-side API chat handlers.

### Paperclip & Postiz Adapters
* **Paperclip Control**: YAML company config under `paperclip/company/` in the workspace root.
* **Postiz Client**: Integrated inside `packages/integrations/postiz/`.
* **Lead Engine**: Structured as a custom npm module inside `packages/lead-engine/`.
* **UGC Character Engine**: Structured inside `packages/ugc-engine/`.
