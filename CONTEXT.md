# PAULI ICM Context Router

This repository uses the Interpretable Context Methodology (ICM): filesystem structure is the orchestration layer, markdown carries stage-specific context, and code remains in its existing package boundaries.

## Start here

1. Read `AGENTS.md` for repository-wide engineering rules.
2. Read `WORKFLOW.md` for delivery gates.
3. Read `icm/CONTEXT.md` to route the current task.
4. For Agent MAXX personal-life requests, read `icm/workstreams/max-personal/CONTEXT.md` and then only the required personal skill context.
5. Read `docs/icm/PI-WORKER-INTEROPERABILITY.md` for Hermes-delegated, cross-repository, portfolio, or financial-signal work.
6. Read only the stage, domain, and skill context required for the active task.
7. Do not load the entire skill library into context.

## Stable architecture

- `packages/` - executable product code and shared libraries. Do not move without an import and deployment blast-radius review.
- `companies/` - company-specific context, briefs, content, and signals.
- `agents/` and `.claude/agents/` - runtime and independent review roles.
- `skills/` and `.agents/skills/` - installed and reference skills.
- `icm/` - canonical routing, stage contracts, manifests, handoffs, evidence, and migration records.
- `factory/` - generated project work and reusable production patterns.
- `docs/` - durable technical and product documentation.

## Operating constraint

The ICM layer organizes and routes existing capabilities. It must not duplicate working implementations, expose secrets, silently change external behavior, or claim a migration is complete without evidence.

This repository is an execution worker, not the authoritative Hermes portfolio brain. Hermes owns cross-portfolio orchestration; Pi executes bounded missions inside explicitly assigned workspaces and returns proof. Inside Agent MAXX, Pi additionally owns the isolated `personal` domain described in `icm/workstreams/max-personal/`, while Hermes retains the `business` domain. Personal memory must not be exposed to Hermes unless an explicit, minimum-necessary handoff is required for a business task. Financial signals return to Hermes for routing to Pauli's Place.

## Current active ICM initiatives

- `icm/workstreams/max-personal/` defines Pi's Agent MAXX personal-assistant role, personal/business routing boundary, privacy boundary, and personal skill map.
- `icm/workstreams/digital-student/` defines the local-first Digital Student browser-agent skill, including a restricted Skool read-only adapter, second-brain ingestion, evidence capture, and human-approved memory updates.
