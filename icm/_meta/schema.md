# Pauli ICM Schema

This file defines the closed node vocabulary for the Pauli repository context map. Runtime code remains in its existing paths; ICM nodes point to implementations instead of duplicating them.

## Node types

| `type` | Purpose | Canonical shelf |
|---|---|---|
| `domain` | A coherent capability family such as coding, design, or video | `icm/domains/` |
| `surface` | A human or machine control interface | `icm/surfaces/` |
| `integration` | An external platform, API, data store, or runtime dependency | `icm/integrations/` |
| `workflow` | Ordered work with explicit inputs, outputs, and gates | `icm/stages/`, `icm/workstreams/` |
| `skill` | Reusable agent instructions | `skills/` plus compatibility locations |
| `runtime` | Executable package or service | implementation path under `packages/`, `ops/`, or `agents/` |
| `datastore` | Durable state system | implementation path plus integration node |
| `risk` | Verified architecture, security, or operability gap | `icm/audits/` |
| `history` | Evidence-backed evolution or upstream decision record | `icm/history/`, `icm/upstream/` |

## Required node fields

Every detailed node should declare enough frontmatter to answer:

```yaml
type: domain | surface | integration | workflow | skill | runtime | datastore | risk | history
status: active | partial | legacy | blocked | unknown
owner_path: relative/repo/path
consumes: []
produces: []
edges: []
governance: internal | sensitive | external
```

Use only fields that are actually queried. Do not add decorative metadata.

## Status law

- `active` — implementation exists and current use is evidenced.
- `partial` — useful implementation exists but an important edge is missing or unverified.
- `legacy` — retained for compatibility/history but not canonical.
- `blocked` — intended path cannot operate until a named dependency or approval is resolved.
- `unknown` — code or documentation exists but live state has not been verified.

## Capability audit states

Full-stack wiring audits use exactly:

`COMPLETE`, `UI_ONLY`, `BACKEND_ONLY`, `MISWIRED`, `DEPENDENCY_MISSING`, `PARTIAL`, `PLACEHOLDER`, `BLOCKED_BY_APPROVAL`, `BROKEN`, `UNTESTABLE`.

Severity uses `S0` through `S4`, where `S0` can expose secrets, lose data, or cause uncontrolled spend and `S1` blocks a primary outcome.

## Graph law

- One home per fact; link instead of copying.
- `owner_path` points to executable truth.
- `consumes`, `produces`, and `edges` draw the graph.
- A domain node catalogs only its direct children and runtime owners; it does not restate their internals.
- Runtime packages remain source of truth for code behavior.
- Deployment state is evidence, not architecture; record dated observations in audits/history.
- Generated file maps, when added, must be script-generated and never hand-edited.

## Naming

- ICM ordered domains: `NN-kebab-case`.
- Other node files: `kebab-case.md`.
- Meta/system folders use `_` prefix.
- Existing runtime paths are not renamed solely for aesthetics.
