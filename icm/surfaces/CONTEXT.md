# Pauli Control Surfaces

One job: distinguish canonical, partial, and legacy interfaces so the operator knows where Pauli is actually controlled.

| Surface | Status | Runtime/source | Role |
|---|---|---|---|
| Pi Web Chat | `partial` | `packages/web-ui/example/` → `pauli-pi-agent.vercel.app` | Current hosted chat surface; generic example shell, browser-first execution. |
| Mission Control | `partial` | `brain-dashboard/components/mission-control/` | Candidate canonical operator UI; current repo implementation is not proven wired to the control bridge. |
| Second Brain Dashboard | `legacy` / `partial` | `brain-dashboard/`; historical separate deployment | Memory/search UI; historical deployment search currently fails. |
| Pi CLI/TUI | `active` | `packages/coding-agent/`, `packages/tui/` | Strong local/operator coding surface. |
| Pauli Control Bridge | `active` / backend-only | `ops/pauli-control/` | Real run/status/stop backend and safest current control primitive. |
| Static Agent Graph | `legacy` | `agent-graph.html` | Historical architecture visualization, useful as evidence not live state. |
| `pauli-dashboard` Vercel project | `legacy` for this repo | separate `dashboard-agent-swarm` repo | Adjacent dashboard, not this repository's canonical UI. |

## Canonical target

Converge on one operator product:

`Mission Control Next.js shell + Pi chat intent surface + server-side control/API broker + durable mission state + evidence/approval views`.

Do not independently polish the generic Pi SPA, historical brain dashboard, and sibling dashboard into three competing products.
