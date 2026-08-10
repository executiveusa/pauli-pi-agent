---
type: domain
status: active
owner_path: skills/ui-intelligence
consumes: [capability-map, product-outcomes, design-system]
produces: [wireframes, interface-specs, visual-qa]
edges: [../../surfaces/CONTEXT.md, ../../../skills/new-look/SKILL.md]
governance: internal
---

# Design

One job: translate backend capability into low-friction, outcome-first interfaces without deleting functionality.

## Owners

- `skills/ui-intelligence/` — existing UI analysis/polish capability.
- `agents/design/` — design role.
- `skills/new-look/` — repo-truth-first chat-first redesign workflow.
- design/taste references in `skills/SKILLS_REGISTRY.md`.
- `brain-dashboard/` and `packages/web-ui/example/` — current Pauli UI implementations.

## Product law

Do not style first. Reconcile backend truth with current UI, resolve safety/approval boundaries, then design. Chat is the primary intent surface; supporting views show context, progress, evidence, approvals, graphs, and outputs.

## Current Pauli priority

The next New Look iteration should target the canonical control plane after server-side secret handling and control-bridge wiring are specified. Current competing frontends must not be polished independently into three products.
