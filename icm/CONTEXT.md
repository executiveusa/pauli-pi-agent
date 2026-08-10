# ICM Task Router

## Purpose

Route one Pauli agent through a small, inspectable context set. Each task loads only the relevant stage, domain, workstream, skills, and evidence.

## First route by outcome

| Outcome | Load first |
|---|---|
| Operate Pauli, missions, approvals, or job state | `domains/01-control-plane/CONTEXT.md`, `surfaces/CONTEXT.md` |
| Agent/runtime/model/session work | `domains/02-agent-runtime/CONTEXT.md` |
| Coding or repo change | `domains/03-coding/CONTEXT.md` |
| Frontend/UI/New Look | `domains/04-design/CONTEXT.md`, `../skills/new-look/SKILL.md` |
| Story/copy/content | `domains/05-storytelling-content/CONTEXT.md` |
| Video/media | `domains/06-video-media/CONTEXT.md` |
| Research/course learning | `domains/07-research-learning/CONTEXT.md` |
| Memory/second brain/graph | `domains/08-memory-knowledge/CONTEXT.md` |
| Browser/authenticated workflow | `domains/09-browser-automation/CONTEXT.md`, relevant policy |
| API/MCP/SaaS connection | `domains/10-integrations/CONTEXT.md`, `integrations/CONTEXT.md` |
| Vercel/database/secrets/compute | `domains/11-infrastructure-deployment/CONTEXT.md` |
| QA/security/audit/release | `domains/12-security-governance/CONTEXT.md` |
| Company/revenue/client delivery | `domains/13-business-revenue/CONTEXT.md` |
| Restructure architecture into ICM | `../skills/icm-architect/SKILL.md`, `domains/CONTEXT.md` |
| Diagnose UI↔backend wiring | `../skills/full-stack-wiring-audit/SKILL.md` |
| Adversarial quality iteration | `../skills/gauntlet-loop/SKILL.md` |

## Required stage sequence

1. `stages/01-inspect/CONTEXT.md` — baseline, references, blast radius.
2. `stages/02-specify/CONTEXT.md` — outcome, acceptance criteria, risk, rollback.
3. `stages/03-build/CONTEXT.md` — smallest reversible implementation.
4. `stages/04-verify/CONTEXT.md` — independent evidence and safety checks.
5. `stages/05-release/CONTEXT.md` — release evidence and human decision.

A documentation-only inspection can stop after Inspect/Specify when no runtime change is authorized or needed.

## Context budget

- One active workstream.
- One active stage.
- One primary domain; add a secondary domain only for a real edge.
- Three to seven selected skills maximum.
- Load routers/manifests before full source.
- Persist intermediate state as files rather than hidden conversational memory.

## Canonical maps

- `MANIFEST.md` — repository/runtime map.
- `domains/` — capability graph.
- `surfaces/` — control/interface graph.
- `integrations/` — external connection graph.
- `skills/CATALOG.md` — reusable capability routing.
- `workstreams/` — bounded initiatives.
- `audits/` — verified gaps.
- `history/` — evolution/provenance.
- `upstream/` — upstream Pi decisions.
- `migration/` — path/compatibility/rollback records.
