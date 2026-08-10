---
type: datastore
status: active
owner_path: Supabase project cyxdevcjycmffhmwxojh
consumes: [app-scoped-state]
produces: [isolated-schemas, postgres-state, auth, runtime-hooks]
edges: [supabase.md, ../domains/11-infrastructure-deployment/CONTEXT.md]
governance: sensitive
---

# Botanic Creations

Botanic Creations is the shared Supabase/Postgres platform. It hosts multiple isolated application schemas; schema boundaries are part of the ICM/data ownership model and must not be collapsed into `public` merely for convenience.

## Verified 2026-08-10

Project:

- name: `botanic-creations`
- ref: `cyxdevcjycmffhmwxojh`
- region: `us-west-1`
- status: `ACTIVE_HEALTHY`

Observed application namespaces include dedicated schemas such as `agenix_hive`, `asc3nd`, `creator_studio`, `fanni`, `dosa`, and Pauli's `pauli` / `pauli_private` pair.

## Pauli ownership

Pauli owns only:

- `pauli`
- `pauli_private`

Do not change another application's schema during Pauli work unless that other application is explicitly in scope.

## Shared-platform law

- One product/domain owns its schema and migration history.
- Cross-app relationships use explicit contracts, not implicit table reach-through.
- Raw credentials do not live in product tables.
- Browser clients receive only publishable/browser-safe credentials and RLS-scoped access.
- Privileged runtime/database actions execute server-side.
- Run Supabase security/performance advisors after consequential DDL changes.
- Record live verification dates because deployed database state can diverge from repository migration files.

## Current Pauli decision

Reuse the existing Pauli data plane. No new Supabase project, no new generic public tables, and no duplicate `pauli_v2` schema are justified by the current audit.
