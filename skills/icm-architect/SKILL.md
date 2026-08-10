---
name: icm-architect
description: Design or restructure a process, repo, vault, company, or body of knowledge into Interpretable Context Methodology (ICM): folders as agent architecture, scoped CONTEXT contracts, plain-file state, explicit graph edges, and human gates. Trigger on ICM, context map, second brain, workspace architecture, organize this repo, or structure this for agents.
category: architecture
status: active
risk: medium
requires_human_approval: true
---

# ICM Architect

Build workspaces where the filesystem does the orchestration. One agent should be able to enter cold, read a small router, find the current shelf/stage, perform one bounded job, persist an artifact, and leave the workspace more inspectable than it found it.

Method source: Interpretable Context Methodology. This installed skill is adapted from the user-provided `icm-architect-main` package.

## Ten invariants

1. **One folder, one job.**
2. **Small stable entry router.** Root `CONTEXT.md`/`AGENTS.md` points; it does not carry the library.
3. **Numbering encodes sequence** where order matters.
4. **Folder contracts are explicit.** Working folders use `CONTEXT.md` with inputs, process, outputs, human check.
5. **Factory and product are separate.** Stable references/templates do not mix with per-run artifacts.
6. **Outputs are edit surfaces.** Persist intermediate state as plain inspectable files.
7. **Load only current context.** Prefer router + one domain/stage + exact inputs over repo-wide stuffing.
8. **Plain text is graphable.** Markdown/YAML links and frontmatter create edges; one home per fact.
9. **Filesystem is state.** Derive progress from artifacts/checkpoints rather than hidden chat memory.
10. **Instantiate by copying stable templates**, not by recreating structure from memory.

## Modes

### Build mode

Use when a new repeatable workflow/body of knowledge is being designed.

1. Extract the real repeating unit, start/end, pauses, checks, stable references, and deliverable.
2. Choose/combine forms:
   - Pipeline — repeated sequence producing a deliverable.
   - Umbrella — several pipelines sharing references/governance.
   - Record Library — accumulating records.
   - Knowledge Bundle — navigable knowledge as product.
   - Context Map — organization/system nodes and edges.
3. Scaffold only real stages/shelves.
4. Write routers/contracts.
5. Validate with the walk test.

### Restructure mode

Use for an existing repo/folder/vault.

1. Inventory before touching. Do not move/delete in the inspection pass.
2. Infer the hidden form and real work entry/exit.
3. Classify files as:
   - Catalog — routing/identity.
   - Contract — how a step/node works.
   - Factory — stable reference/template/schema.
   - Product — run/record artifact.
   - Dead — stale/duplicate; propose archive, never silently delete.
4. Propose target tree and old→new migration map.
5. Migrate only after consumer/blast-radius verification.
6. Validate cold.

## Pauli-specific architecture law

For `pauli-pi-agent`, use a composite **Umbrella + Context Map**:

- `icm/domains/` = capability nodes.
- `icm/surfaces/` = human/machine interfaces.
- `icm/integrations/` = external systems.
- `icm/stages/` = reusable delivery pipeline.
- `icm/workstreams/` = bounded active missions.
- `icm/history/`, `icm/upstream/`, `icm/audits/` = provenance/evidence.
- `packages/`, `ops/`, `agents/` remain executable owners.

Do **not** physically reorganize runtime packages just to mirror the ICM shelves. Add pointers first; move only after imports, scripts, deployment roots, docs, skills, and external consumers are verified.

## Walk test

From a cold start:

- Can the root router answer where to go in at most two more reads?
- Does the active node contract name exact owner/input/output paths?
- Is state visible in files/checkpoints?
- Is any router carrying content payload that belongs on a shelf?
- Is any fact duplicated rather than linked?
- Is the context set narrow enough that irrelevant domains stay unloaded?

If the walk fails, fix structure rather than adding more prose.

## Guardrails

Do not over-structure one-off work. ICM is strongest for sequential, inspectable, human-reviewed knowledge work; high-concurrency runtime coordination still belongs in code/durable workflow systems. Do not move, delete, or deprecate existing paths without a migration map and human gate.
