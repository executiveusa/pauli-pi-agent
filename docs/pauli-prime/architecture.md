# PAULI-PRIME Architecture Baseline

## Scope
This document defines a production-ready baseline for a Rust-first multi-tenant portfolio agent system integrated into the existing monorepo.

## Planes
- Edge Control Plane (Cloudflare worker ingress, auth boundary, event fanout).
- Worker Plane (Rust services for orchestration, memory, repo runtime, policy).
- Cockpit Plane (installable PWA for operator controls and approvals).

## Core Services
- Agent Kernel: lifecycle, spawn templates, state machine, escalation routing.
- Mail Service: mailbox/thread/message persistence with evidence linking.
- Memory Service: layered memory with promotion jobs.
- Policy Service: decision engine with allow/deny/approval outcomes.
- Provider Router: BYOK model routing by tenant profile and budget.
- Repo Runtime: worktree leases, bounded execution loops, evidence capture.

## Data Backbone
Persistence should be normalized and tenant-scoped with immutable evidence rows for sensitive events. Every task run writes:
- run metadata
- policy decisions
- output evidence pointers
- memory promotion events

## Guardrails
- tenant_id required in every mutable operation
- irreversible action requires approval token
- retry limit enforced by task policy
- external connector operations require capability grant

## Implementation Notes
This repo currently ships TypeScript-first packages. The recommended integration path is to introduce Rust services under `services/pauli-prime-*` while exposing typed API contracts for existing `packages/web-ui` and `packages/coding-agent` consumers.
