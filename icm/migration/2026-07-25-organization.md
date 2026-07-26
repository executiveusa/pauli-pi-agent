# ICM Organization Migration - 2026-07-25

## Decision

Add a canonical ICM routing and catalog layer without physically moving executable packages or installed skills in the first pass.

## Why

The repository currently has working consumers across several conventions:

- `skills/`
- `.agents/skills/`
- `agents/`
- `.claude/agents/`
- `.claude/commands/`
- `.pi/prompts/`
- `companies/*/agent/`

A mass move would risk broken prompt discovery, command routing, imports, documentation links, CI, and deployment scripts. The new layer organizes all capabilities logically while preserving current paths.

## Added

- Root `CONTEXT.md`
- `icm/CONTEXT.md`
- `icm/MANIFEST.md`
- Five stage contracts under `icm/stages/`
- Canonical `skills/CATALOG.md`
- Digital Student workstream and Skool policy
- This migration ledger

## Not changed

- No package path
- No imports
- No runtime code
- No secrets
- No authentication code
- No existing skill implementation
- No deployment configuration
- No production branch

## Compatibility rule

Existing paths remain canonical for execution until each skill is individually inspected and migrated. New work should route through `CONTEXT.md` and `skills/CATALOG.md` while loading the implementation from its current location.

## Next migration slices

1. Inventory every installed folder containing `SKILL.md`.
2. Normalize frontmatter and add missing `CONTEXT.md` files.
3. Consolidate duplicate indexes while retaining compatibility pointers.
4. Migrate one low-risk skill and verify all consumers.
5. Repeat only after proof.

## Proof

This migration is documentation-only and additive. Rollback is deletion of the files listed under Added.

## Rollback

Revert the commits on branch `chore/icm-agent-skill-organization` or delete the additive files before merge. No runtime behavior requires restoration.
