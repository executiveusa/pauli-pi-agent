# Repository Domain Manifest

## Runtime and product code

| Domain | Canonical location | Rule |
|---|---|---|
| LLM providers and model APIs | `packages/ai/` | Preserve package API and lazy registration conventions. |
| Core agent runtime | `packages/agent/` | Approval, tool, tenant, voice, and orchestration logic. |
| Coding agent | `packages/coding-agent/` | CLI and coding-agent behavior. |
| Data ingestion and second brain | `packages/data-processor/` | Durable imports, evidence, embeddings, and knowledge storage. |
| Deep research | `packages/deep-research/` | Durable external research workflow. |
| Content engine | `packages/content-engine/` | Signals, scoring, and synthesis. |
| Interfaces | `packages/tui/`, `packages/web-ui/`, `packages/mom/` | User-facing control surfaces. |
| Infrastructure | `packages/pods/`, `packages/secrets/` | Compute and secret resolution. |

## Agent context

| Domain | Current locations | ICM treatment |
|---|---|---|
| Repository rules | `AGENTS.md`, `WORKFLOW.md`, `WIKI.md` | Root governance; load before consequential work. |
| Runtime agents | `agents/` | Executable or configuration-backed agent roles. |
| Claude review agents | `.claude/agents/` | Independent QA, security, and release roles. |
| Company agents | `companies/*/agent/` | Company-scoped identity and market context. |
| Commands | `.claude/commands/`, `.pi/prompts/` | Surface-specific entry points; route to canonical skills. |

## Skills

The repository currently uses more than one skill convention:

- `skills/<skill>/` - PI-native and shared skills.
- `.agents/skills/<skill>/` - portable agent skills.
- `agents/<role>/SKILL.md` - role agents packaged as skills.
- `.claude/agents/*.md` - Claude-specific review roles.
- `skills/SKILLS_REGISTRY.md` - 76 lazy-load references across 47 categories.
- `skills.md` - legacy top-level directory and routing notes.

No mass physical move is allowed until consumers and path references are verified. `skills/CATALOG.md` is the canonical logical index during migration.

## Company context

`companies/` remains the canonical company partition. Each company should converge on:

```text
companies/<slug>/
├── CONTEXT.md
├── agent/
├── briefs/
├── knowledge/
├── content/
├── _signals/
├── evidence/
└── archive/
```

Existing files remain valid while missing folders are added as needed.

## Migration policy

1. Add logical routing first.
2. Inventory every consumer before moving a path.
3. Move one skill or domain at a time.
4. Add compatibility references when a tool expects a legacy location.
5. Verify loading, tests, and commands.
6. Record rollback in `icm/migration/`.
