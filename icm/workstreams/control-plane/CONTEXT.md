# Pauli Control Plane Consolidation

## Outcome

Give Pauli one canonical, chat-first operator surface that can show and control real missions, approvals, agents, integrations, memory/evidence, and long-running execution without exposing privileged secrets to the browser.

## Canonical architecture

```text
Human
  -> Mission Control (Next.js, chat-first)
  -> authenticated server routes
  -> permission + approval policy
  -> mission/control service
  -> ops/pauli-control and/or durable worker layer
  -> Pi runtime/tools/integrations
  -> durable state + evidence
  -> Mission Control status/graph/output views
```

## Bounded slices

### Slice 0 — ICM truth map

- capability domains;
- surface inventory;
- integration inventory;
- history and upstream policy;
- full-stack wiring audit.

Exit: one inspectable map, no runtime path moves.

### Slice 1 — close S0 secret boundary

- remove build-time `.env` credential injection into browser globals;
- broker model/tool calls server-side;
- prove built browser assets contain no provider/service secrets;
- keep local CLI provider use working.

Exit: security review passes.

### Slice 2 — canonical server control contract

- normalize health/agents/run/status/stop/approval endpoints;
- define authenticated user/org identity;
- map plan/read/write/ship to policy/approval records;
- preserve `ops/pauli-control` compatibility while new server routes are introduced.

### Slice 3 — durable mission state

- inspect Botanic Creations live schema before mutation;
- use isolated Pauli schemas with RLS if compatible/needed;
- connect missions, tasks, events, approvals, evidence and integrations;
- connect Absurd durable tasks for long-running execution where appropriate.

### Slice 4 — wire Mission Control

- replace local/static Mission Control state with real queries/actions;
- stream progress/evidence;
- add explicit approval queue;
- add graph view derived from ICM/runtime state.

### Slice 5 — absorb chat + memory surfaces

- put Pi chat in the same Mission Control shell;
- fold useful second-brain search/note views into supporting panels;
- label/deprecate old standalone deployments.

### Slice 6 — New Look + Gauntlet

- run repo-truth/capability audit;
- create five divergent chat-first candidates;
- apply ADHD, accessibility, taste, multilingual and outcome gates;
- run blind Gauntlet comparisons;
- implement winning surface only after backend wiring is real.

### Slice 7 — upstream harvest

- port Tier A upstream Pi reliability/security improvements individually;
- defer package-scope/runtime migration to a dedicated compatibility project.

## Definition of done

- one canonical production control URL;
- no privileged browser credentials;
- real mission/approval/status controls;
- durable restart/resume for long-running missions;
- evidence-linked second brain;
- ICM graph can answer where every major capability, surface, integration and source of state lives;
- legacy/sibling surfaces are explicitly labeled and no longer ambiguous.
