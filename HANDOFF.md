# Handoff: Centralize PAULI memory config & ICM separation

**Generated**: 2026-06-25
**Branch**: feat/pauli-memory-config
**Status**: In Progress

## Goal
Centralize memory path resolution, enforce ICM separation between `pi-agent` and THE PAULI EFFECT site, update Notion sync scripts to use repo-relative config, and prepare a handoff so another agent can continue and push changes.

## Completed
- [x] Added `pauli-memory-config.js` to centralize `PAULI_MEMORY_ROOT` resolution and per-agent overrides
- [x] Added `pi-agent-config.js` defining `pi-agent` role and `getAgentMemoryRoot()`
- [x] Added `ICM_MANIFEST.md` documenting separation rules and skills conventions
- [x] Updated `sync-to-notion.js` and `notion-bridge-sync.js` to use the centralized config
- [x] Saved implementation plan to `/memories/session/plan.md`

## Not Yet Done
- [ ] Replace remaining documentation/install scripts that reference `C:\PAULI\memory` with env-driven instructions
- [ ] Implement `library-registry` indexer skill to auto-discover library folders
- [ ] Run integration tests against Notion (requires `NOTION_API_KEY`) and verify runtime with `PAULI_MEMORY_ROOT` set
- [ ] Push branch and open PR for review (pending user approval to push)

## Failed Approaches (Don't Repeat These)
- Previously hard-coded `C:\PAULI\memory` paths across scripts. Attempting to change only a subset caused confusion; current approach centralizes resolution into `pauli-memory-config.js` and uses per-agent overrides via `PAULI_MEMORY_ROOT_<AGENT>` env vars.

## Key Decisions
| Decision | Rationale |
|----------|-----------|
| Central config file (`pauli-memory-config.js`) | Single source of truth for memory path resolution, supports env overrides and repo-local `.env` for portability |
| Per-agent memory roots (`getMemoryRootForAgent`) | Enforces ICM isolation—each agent can have its own memory folder under the main root |
| Keep site repo out of `pi-agent`'s `managedRepos` | Prevent accidental site-content writes by agent logic |

## Current State
**Working**: Scripts run locally when `PAULI_MEMORY_ROOT` points to a writable directory; Notion sync code uses the config but requires valid `NOTION_API_KEY`.

**Broken / Blockers**:
- Notion integration cannot be fully tested until `NOTION_API_KEY` is provided in a local `.env` (do NOT commit secrets).
- Several docs and install helpers still reference the old Windows path and need updates.

**Uncommitted Changes**: New files added in `THE PAULI FILES/pauli-memory-installer-v1.0/pauli-memory-installer/scripts/` plus this `HANDOFF.md`.

## Files to Know
| File | Why It Matters |
|------|----------------|
| THE PAULI FILES/pauli-memory-installer-v1.0/pauli-memory-installer/scripts/pauli-memory-config.js | Central resolver for memory root and dotenv loading |
| THE PAULI FILES/pauli-memory-installer-v1.0/pauli-memory-installer/scripts/pi-agent-config.js | PI Agent manifest and memory helper |
| THE PAULI FILES/pauli-memory-installer-v1.0/pauli-memory-installer/scripts/sync-to-notion.js | Notion sync: updated to use central config |
| THE PAULI FILES/pauli-memory-installer-v1.0/pauli-memory-installer/scripts/notion-bridge-sync.js | Bidirectional sync: updated to use central config |
| THE PAULI FILES/pauli-memory-installer-v1.0/pauli-memory-installer/ICM_MANIFEST.md | ICM separation rules and usage |

## Code Context (key signatures)
`getMemoryRootForAgent(agentName: string): string` — returns resolved path for agent-scoped memory

## Resume Instructions
1. Ensure your environment has working git credentials (SSH key loaded) and Node.js installed.
2. From repo root run:

```bash
git checkout -b feat/pauli-memory-config
# Stage only the files you changed (example):
# git add "THE PAULI FILES/pauli-memory-installer-v1.0/pauli-memory-installer/scripts/pauli-memory-config.js"
# git add "THE PAULI FILES/pauli-memory-installer-v1.0/pauli-memory-installer/scripts/pi-agent-config.js"
# git add "THE PAULI FILES/pauli-memory-installer-v1.0/pauli-memory-installer/ICM_MANIFEST.md"
# git add "THE PAULI FILES/pauli-memory-installer-v1.0/pauli-memory-installer/scripts/sync-to-notion.js"
# git add "THE PAULI FILES/pauli-memory-installer-v1.0/pauli-memory-installer/scripts/notion-bridge-sync.js"
# Then add this HANDOFF.md
git add HANDOFF.md

git commit -m "feat: centralize pauli memory config and enforce ICM separation"

# Push branch (requires SSH / GH auth configured)
git push -u origin feat/pauli-memory-config
```

3. Open a PR on GitHub using the branch `feat/pauli-memory-config`. In the PR description reference this `HANDOFF.md` and link to `ICM_MANIFEST.md`.

4. Post-merge tasks: run `npm run check` in package roots that changed and run integration verification with `PAULI_MEMORY_ROOT` pointing to a test dir and `NOTION_API_KEY` set.

## Setup Required
- Environment variables: `PAULI_MEMORY_ROOT` (optional), `NOTION_API_KEY` (for Notion tests)
- Do NOT commit any `.env` with secrets

## Edge Cases & Error Handling
- If `PAULI_MEMORY_ROOT` is not a valid path, scripts fall back to platform-specific default (Windows: C:\PAULI\memory; Unix: ~/pauli-memory). Override using `PAULI_MEMORY_ROOT`.

## Warnings
- Never commit secrets. Keep `.env` out of git.
- When committing, only stage files you modified in this session to avoid overwriting other agents' work.

