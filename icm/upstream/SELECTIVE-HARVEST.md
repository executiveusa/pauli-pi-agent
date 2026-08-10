# Selective Upstream Pi Harvest

## Baseline

The Pauli fork currently identifies its coding-agent package as `@mariozechner/pi-coding-agent` version `0.67.2`. Current upstream Pi uses the `@earendil-works/*` scope and has moved materially beyond that baseline. The package-scope migration itself landed upstream around the 0.74 line, so this is not a safe blanket branch merge.

## Rule

Treat upstream as a capability feed. Never merge upstream `main` wholesale into Pauli without an explicit migration project.

For every candidate change:

1. identify the user-visible or reliability outcome;
2. locate exact upstream commit(s)/release note;
3. inspect changed files and APIs;
4. map collisions against Pauli custom code;
5. port/cherry-pick the smallest compatible slice;
6. run repo checks and focused tests;
7. record provenance and rollback here or in a dated harvest record.

## Harvest tiers

### Tier A — harvest first

Low-collision reliability and tooling fixes where the implementation can be ported without accepting the package-scope/runtime migration:

- session lifecycle/retry and corruption safeguards;
- package/skill discovery correctness;
- update/package reconciliation fixes;
- HTTP/network timeout/idle robustness;
- terminal/rendering fixes with isolated package impact;
- supply-chain/install hardening that does not alter Pauli extension contracts.

### Tier B — evaluate individually

Useful capabilities with provider/UI/API surface impact:

- new provider integrations and auth flows;
- image-generation APIs;
- package self-update infrastructure;
- new model/runtime conveniences;
- TUI feature upgrades.

Each requires a Pauli-specific compatibility test.

### Tier C — dedicated migration project

Do not opportunistically cherry-pick:

- `@mariozechner/*` → `@earendil-works/*` package migration;
- Node runtime floor changes;
- broad `ModelRuntime` / provider-auth API migrations;
- changes that rewrite session schemas, extension APIs, or core package boundaries.

These belong in a dedicated branch with a compatibility matrix and rollback.

## Pauli protection checklist

Before accepting an upstream patch, verify it does not break:

- Pauli identity/ICM loading;
- custom agent/tool/approval behavior;
- Mercury/voice integrations;
- data processor, research, content, or company packages;
- `.pi`, `.agents`, `.claude` skill compatibility;
- `ops/pauli-control` invocation;
- Vercel/browser build constraints;
- existing session data.

## Current recommendation

First harvest reliability/security fixes that can be ported as patches. Plan the scope/runtime migration only after Mission Control, server-side secret brokering, and ICM control ownership are stabilized; otherwise upstream churn and local control-plane consolidation will collide in the same blast radius.
