---
type: domain
status: partial
owner_path: ops/pauli-control
consumes: [missions, approvals, agent-runtime-state]
produces: [job-state, control-actions, operator-evidence]
edges: [../../surfaces/control-bridge.md, ../../surfaces/mission-control.md]
governance: sensitive
---

# Control Plane

One job: expose Pauli's real operating state and approved actions through one canonical control path.

## Runtime owners

- `ops/pauli-control/` — real server-side bridge for agent listing, run, status, and stop.
- `packages/agent/` — runtime behavior, approvals, tenant and tool execution.
- `brain-dashboard/` — candidate operator UI, currently not the canonical wired control plane.
- `packages/web-ui/example/` — current deployed chat surface, not a full control tower.

## Current condition

The backend control bridge exists, but no production UI is proven to call it. Mission Control UI code exists separately and is largely presentation/demo state. Treat control as `partial` until UI → authenticated server route → `ops/pauli-control` → durable mission state is proven.

## Target contract

`chat/operator intent -> permission/approval -> mission record -> durable execution -> evidence -> status/control UI`

The human keeps approval for write, ship, spend, destructive, credential, and external-communication actions.
