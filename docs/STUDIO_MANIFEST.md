# Cynthia Design Studio — Studio Manifest
# Version: 1.0.0
# Date: 2026-04-04
# Authority: Canonical

## What Is Cynthia

Cynthia is the autonomous design authority and production runtime for The Pauli Effect™ AI Design Studio.

She is not a template library. She is not a component dump. She is not a SaaS dashboard.

She is a **production-grade design company** that operates through AI agents, governed by design doctrine, measured by the UDEC quality framework, and orchestrated through Paperclip.

## Architecture

```
PAPERCLIP (Control Plane)
    ├── Org structure, budgets, governance, ticketing
    ├── Multi-agent coordination, heartbeats
    └── Task assignment and auditability

CYNTHIA (Design Authority + Runtime)
    ├── Design doctrine, laws, principles
    ├── Component systems, patterns, workflows
    ├── Quality rubrics (UDEC 14-axis, 8.5 floor)
    ├── Agent workspace and memory
    ├── Job intake → execution → review → delivery
    └── Commercial operations

HERMES / EXECUTION AGENTS (Workers)
    ├── Design agents (frontend, copy, motion, 3D)
    ├── Review agents (scoring, critique)
    ├── Operations agents (audit, packaging, heartbeat)
    └── Specialized workers (Pope-class task execution)

RUST INFRASTRUCTURE (Production Services)
    ├── Event bus, task routing, heartbeat relay
    ├── Validators, indexers, packagers
    └── Mobile bridge, payment state, knowledge graph
```

## Quality Floor

**UDEC 8.5** — Nothing ships below this. Ever.

- MOT (Motion & Interaction) ≥ 7.0 or full rejection
- ACC (Accessibility) ≥ 7.0 or full rejection
- Overall weighted composite ≥ 8.5 or iterate

## Core Capabilities

| Domain | What Cynthia Produces |
|--------|----------------------|
| Web | Landing pages, marketing sites, product UI |
| Dashboard | Analytics dashboards, ops dashboards |
| App | Product interfaces, mobile-responsive apps |
| Copy | UX microcopy, newsletters, bulletins, blog audits |
| Motion | Animation systems, transitions, interaction design |
| 3D | Scene specifications, asset briefs, spatial storytelling |
| Brand | Voice systems, messaging, visual identity |
| Audit | Site audits, content audits, design refactoring |
| Delivery | Client packages, portfolio pieces, case studies |

## Non-Negotiable Rules

1. Shadcn is forbidden by default. Isolate any dependency.
2. Rust is preferred for all infrastructure tooling.
3. UDEC 8.5 is the quality floor. No exceptions.
4. No Inter, Roboto, Arial, Helvetica, or Open Sans.
5. No purple. No generic card grids. No AI slop.
6. All financial/legal/publishing actions require human approval gates.
7. All design doctrine is version-controlled and locked.
8. Every output is scored before delivery.
9. Every approved output enters structured memory.
10. The studio improves with every project.

## How to Onboard

For AI agents: Read `AGENT_ONBOARDING.md`
For humans: Read `studio/ops/OPERATING_MODEL.md`
For developers: Read `docs/CONTRIBUTING.md`

## Repository Map

```
/studio          — The living design studio
/rust            — Rust-first infrastructure
/apps            — VS Code extension, headless runner
/src             — VS Code extension source
/web             — Next.js public site
/migration       — Analysis artifacts from canonical restructure
/archive         — Deprecated materials preserved for reference
/tests           — Test suites
/docs            — Developer documentation
```
