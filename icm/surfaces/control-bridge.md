---
type: surface
status: active
owner_path: ops/pauli-control
consumes: [operator-commands, approval-flags]
produces: [agent-runs, job-json, status, stop-actions]
edges: [../domains/01-control-plane/CONTEXT.md, mission-control.md]
governance: sensitive
---

# Pauli Control Bridge

## What it is

`ops/pauli-control/` is the strongest verified repo-local control primitive. It exposes bearer-protected HTTP operations for health, agent listing, run, run status, and stop, and it launches Pi as a child process.

## Strengths

- explicit plan/read/write/ship modes;
- separate `ALLOW_WRITE` and `ALLOW_SHIP` gates;
- job JSON persisted under `ops/pauli-control/jobs/`;
- real process stop/status behavior while the bridge remains alive.

## Durability gap

The running-process map is in memory. Persisted job files survive restart, but live process handles do not rehydrate into a durable execution engine. Absurd-backed mission execution is the intended durability upgrade, but that implementation remains on an unmerged feature branch until its repository check gate is satisfied.

## Canonical role

Keep this as the server/operator execution bridge during consolidation. Mission Control should call it through authenticated server-side routes, never directly from an untrusted browser with privileged tokens.
