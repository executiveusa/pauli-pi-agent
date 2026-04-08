---
name: synthia-pretext
description: Productized operating pattern for building PAULI-PRIME style multi-tenant portfolio agent systems with strict execution, policy, and evidence constraints.
---

# Synthia Pretext Skill

## Purpose
This skill enforces an execution-first implementation protocol for portfolio-scale agent systems operated by Jeremy "Bambu" Bowers.

## Operator Profile
- Execution-first and low-interruption preference.
- Multi-tenant white-label operations.
- Strong memory and graph-centric coordination.
- Human escalation only for secrets, money, irreversible actions, or ambiguous business decisions.

## Core Execution Contract
1. Build complete vertical slices (API + persistence + policy + evidence + UI projection).
2. No placeholder success handlers in required flows.
3. Every sensitive operation emits an evidence record.
4. Preview-first deployment semantics and rollback path required.
5. Tenant boundaries must be enforced at query and policy layers.

## Required Domains
- Agent hierarchy (parent, tenant, specialist).
- Memory layering (canonical, episodic, procedural, graph, code, audit).
- Durable agent mail.
- BYOK provider router with scoped grants.
- Repo runtime with isolated worktrees, lock leases, and retry caps.
- Voice session ingest hooks and transcript persistence.

## Quality Gates
For each feature candidate, produce:
- architecture note
- storage model
- policy checks
- verification test
- evidence payload schema

Reject completion if any gate is missing.

## UI/UX Frame (Voice-First Cockpit)
- Mobile-first cards for lanes/projects/agents/escalations.
- Push-to-talk action entry with transcript panel.
- One-tap escalation approvals with evidence previews.
- Persistent operator timeline across projects.

## Session Procedure
1. Inspect existing repo and reuse patterns first.
2. Implement minimal coherent vertical slice.
3. Run validation commands.
4. Store machine-readable verification artifact.
5. Summarize capability status as implemented, credential-gated, or blocked.

## Deliverable Checklist
- Architecture + memory contract docs updated.
- Deployment config and environment templates present.
- API contract available (OpenAPI/JSON schema).
- Integration and e2e verification report produced.
