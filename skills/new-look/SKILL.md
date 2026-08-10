---
name: new-look
description: Reframe an existing product or backend into a chat-first, outcome-based interface without erasing functioning capability. Inspect repo truth, map capabilities and UI/backend disconnects, generate divergent interactive candidates, apply ADHD/accessibility/taste/multilingual gates, and use Gauntlet comparison before implementation. Trigger on new look, simplify this app, redesign frontend, chat-first dashboard, wireframe this backend, or make the interface the product.
category: design-frontend
status: active
risk: medium
requires_human_approval: true
---

# New Look

New Look is an interface-architecture loop, not a cosmetic reskin. It starts from repository truth and ends with a winning, evidence-backed chat-first control surface that preserves backend capability while reducing human cognitive load.

Installed from the user-provided `new-look-skill` package.

## Non-negotiable order

1. **Repo truth.** Read the real backend, routes, packages, data models, integrations, auth, approvals, jobs, and existing UIs.
2. **Domain inference.** State what product this actually is and what the primary user is trying to accomplish.
3. **Capability map.** Record what the system can really do, what is partial, and who owns each function.
4. **UI ↔ backend audit.** Use `full-stack-wiring-audit`; do not design around fake controls or missing dependencies.
5. **Resolve ownership ambiguity.** Decide which surface is canonical and which are support/admin/legacy.
6. **Chat-first contract.** Human expresses outcome in natural language; the machine routes tools/workflows; supporting views expose context, progress, evidence, approvals, graphs, and outputs.
7. **Generate five divergent candidates.** They must differ structurally, not just in color/theme.
8. **Create an interactive HTML artifact** covering desktop, mobile, empty/loading/error/approval/success states.
9. **Apply quality gates.** ADHD/cognitive load, accessibility, hierarchy, taste, anti-AI-slop, multilingual behavior, responsive behavior, no hidden dangerous action.
10. **Run Gauntlet.** Compare the real artifact blind against a named fetchable bar; iterate until ours wins or a real blocker is documented.
11. **Write upgrade plan/spec.** Preserve capability coverage and identify KEEP / REFRAME / MOVE UNDER CHAT / SUPPORTING VIEW / ADMIN ONLY / REMOVE WITH EVIDENCE / FIX CONNECTION.
12. **Only then implement.**

## Required audit artifacts

Write:

- `artifacts/new-look/repo-truth.json`
- `artifacts/new-look/capability-map.json`
- `artifacts/new-look/ui-backend-audit.json`

After candidate generation:

- `artifacts/new-look/index.html`
- `artifacts/new-look/upgrade-plan.html`
- `artifacts/new-look/upgrade-spec.json`

## Chat-first product law

The chat is the intent surface, not necessarily the only visible element. Avoid nav-heavy CRUD exposure when the same outcome can be expressed directly. The system should infer which capability/tool/workflow to call under the hood, while the interface surfaces only the information needed to choose, approve, inspect, correct, and receive results.

Supporting views may include:

- mission/progress timeline;
- approvals;
- graph/state visualization;
- evidence/artifacts;
- integrations/connection status;
- memory/search;
- settings/admin when genuinely required.

## Multilingual contract

Natural-language intent must not assume English-only command syntax. Preserve meaning, confirmation, and safety gates across languages. Generated UI copy should be separable from workflow/tool identifiers.

## Safety/ownership rules

- Do not put privileged provider/service credentials in browser code.
- Do not make a browser-only mock look like a real control plane.
- Do not remove backend functionality merely to simplify a screenshot.
- Do not duplicate a second agent runtime inside a new dashboard.
- Consequential writes, deployment, spending, publishing, messaging, account changes, and destructive actions retain explicit approvals.

## Pauli application

For `pauli-pi-agent`, New Look targets the canonical Mission Control workstream only after the S0 browser-secret boundary and server control contract are defined. Existing generic Pi web chat and second-brain concepts should be absorbed as supporting capabilities rather than independently polished into competing products.

## Done

A New Look cycle is complete only when repo truth, domain, capability graph, disconnect audit, five candidates, interactive artifact, mobile/states, quality gates, Gauntlet result, capability-preserving upgrade spec, and unresolved risks are all explicit.
