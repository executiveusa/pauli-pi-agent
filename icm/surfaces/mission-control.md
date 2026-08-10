---
type: surface
status: partial
owner_path: brain-dashboard/components/mission-control
consumes: [mission-state, approvals, agents, providers, integrations]
produces: [operator-intent, approvals, control-actions]
edges: [../domains/01-control-plane/CONTEXT.md, control-bridge.md]
governance: sensitive
---

# Mission Control

## Role

This is the intended operator cockpit: missions, agents, approvals, integrations, status, evidence, and chat-first control.

## Current repo reality

The current `brain-dashboard` contains Mission Control UI code, but the inspected implementation uses local/static demo state for core cards and controls. No evidence currently proves that its run/stop/approval controls call `ops/pauli-control` or durable mission storage.

The historical Vercel project associated with the old brain dashboard comes from a separate repository and returns 404 at `/mission-control`, so it cannot be treated as this repo's live Mission Control.

## Canonical direction

Promote a server-backed Next.js Mission Control inside this repository. It should:

1. receive operator intent through chat or explicit controls;
2. resolve identity/tenant and permissions server-side;
3. create/inspect durable missions and approvals;
4. call the control bridge or durable worker layer;
5. stream status/evidence back into the UI;
6. expose graph views as supporting context, not as a second control system.

New Look iteration begins only after this backend contract and S0 browser-secret boundary are fixed/spec'd.
