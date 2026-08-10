---
type: surface
status: partial
owner_path: packages/web-ui/example
consumes: [browser-input, model-provider-config]
produces: [chat-events, tool-intent]
edges: [../domains/02-agent-runtime/CONTEXT.md, ../domains/12-security-governance/CONTEXT.md]
governance: sensitive
---

# Hosted Pi Web Chat

## Verified live surface

`pauli-pi-agent.vercel.app` currently serves the Vite example from `packages/web-ui/example/`, titled `Pi Web UI - Example`.

## Strengths

- real hosted chat surface;
- reuses Pi web UI and smart routing;
- current main deployment returns HTTP 200.

## Gaps

- it is an example shell rather than Pauli Mission Control;
- Node-only data processor, database, tenant, migrations, and secret modules are stubbed for browser bundling;
- its Vite configuration can read repository `.env` and build selected provider/service credentials into `window.__AGENT_ENV__`;
- no production Agent Runs telemetry is currently exposed through Vercel Agent Runs for this team/project.

## Decision

Retain as a compatibility/reference surface while moving chat UX into the canonical server-backed Mission Control shell. Do not add more browser-secret capability to this SPA.
