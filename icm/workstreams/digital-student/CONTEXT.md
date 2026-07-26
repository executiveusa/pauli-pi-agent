# Digital Student Workstream

## Classification

- Type: bounded experiment and shared skill capability
- Status: specification and integration preparation
- Replaces: premature Agent Campus SaaS build
- Primary proof: one authorized lesson becomes evidence-backed ICM knowledge and an audio briefing

## Outcome

Create a local-first digital student that uses a user-controlled browser session to read authorized educational material, extract evidence, classify knowledge by subject, connect it to the second brain, and propose actions or memory changes for human approval.

## Architecture reuse

- Browser and authenticated navigation: existing browser harness or a Playwright-compatible adapter.
- Agent runtime: `packages/agent/` and `packages/coding-agent/`.
- Durable processing: `packages/data-processor/`.
- Video and transcript capability: `skills/video-watch/` and existing video-analysis packages.
- Knowledge graph: YouTube KG, graph, and second-brain components already in the repository.
- Voice delivery: Mercury voice components and VisionClaw adapter to be added later.
- Model routing: existing free/balanced/premium/local routing; cheapest passing model wins.

## Required skill set

Load only:

1. Browser harness
2. Video watch
3. Data processor / second-brain ingestion
4. Knowledge graph or graph operator
5. Model routing / which-model guidance
6. QA specialist
7. Security engineer when authentication or private content is involved

## Workflow

1. Inspect source and authorization.
2. Define one learning mission.
3. Attach to a visible local browser profile.
4. User completes authentication manually.
5. Inventory only user-selected material.
6. Capture text, available transcript, and source metadata.
7. Extract concepts, claims, procedures, examples, and actions.
8. Verify evidence and distinguish inference.
9. Classify by subject and related topic.
10. Link to existing second-brain knowledge.
11. Generate written and audio briefings.
12. Propose memory changes; do not commit without approval.

## Skool boundary

Skool is a restricted read-only adapter:

- Manual user login only.
- No password, MFA code, cookie, token, or local-storage extraction.
- No CAPTCHA bypass or stealth evasion.
- No posting, commenting, reacting, messaging, joining, purchasing, point farming, member harvesting, or account changes.
- One visible browser session, low volume, user-selected lessons.
- Pause on authentication expiry, access denial, locked content, or platform warning.

See `policies/skool.com.yaml`.

## ICM subject output

```text
second-brain/subjects/<subject>/
├── CONTEXT.md
├── sources/
├── concepts/
├── claims/
├── procedures/
├── examples/
├── contradictions/
├── applications/
├── briefings/
├── evidence/
└── audit/
```

Source hierarchy may preserve course/module/lesson layout, but durable knowledge is organized by meaning and linked back to source evidence.

## First slice

Using one user-authorized lesson:

- verify session without reading credentials;
- capture lesson text and available transcript;
- create at least five evidence-backed knowledge units;
- place them in one subject workspace;
- create one cross-topic link;
- generate one five-minute audio briefing script;
- propose one memory patch;
- demonstrate pause, resume, stop, and rollback;
- perform no write action on the learning platform.

## Proof required

- Browser action log
- Permission record
- Source manifest
- Lesson checkpoint
- Transcript or transcript limitation
- Evidence-backed knowledge units
- ICM placement
- Cross-topic link
- Briefing output
- Proposed memory patch
- Human approval state
- No-secret and no-platform-write verification

## Commercial path

Initial offer: Digital Student Setup Sprint for operators, agencies, and owners of authorized course libraries. SaaS billing and multi-tenancy remain parked until the single-user workflow proves repeatable value.
