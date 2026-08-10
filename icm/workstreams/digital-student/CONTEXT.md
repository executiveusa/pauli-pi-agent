# Digital Student Workstream

## Classification

- Type: bounded experiment and shared skill capability
- Status: executable assisted runner with durable-workflow integration
- Replaces: premature Agent Campus SaaS build
- Primary proof: an authorized course can survive worker/process interruption and still produce evidence-backed agent knowledge from every manifest lesson

## Outcome

Create a local-first digital student that uses a user-controlled browser session to read authorized educational material, extract evidence, classify knowledge by subject, connect it to the second brain, and propose actions or memory changes for human approval.

## Architecture reuse

- Browser and authenticated navigation: user-controlled visible browser; no credential automation.
- Agent runtime: `packages/agent/` and `packages/coding-agent/`.
- Durable execution: Absurd (`earendil-works/absurd`) through `packages/skool-study-runner/`; workflow state and checkpoints live in Postgres.
- Durable knowledge processing: `packages/data-processor/` for downstream second-brain ingestion.
- Video and transcript capability: `skills/video-watch/` and existing video-analysis packages.
- Knowledge graph: YouTube KG, graph, and second-brain components already in the repository.
- Voice delivery: Mercury voice components and VisionClaw adapter to be added later.
- Model routing: existing free/balanced/premium/local routing; cheapest passing model wins.

## Required skill set

Load only:

1. Absurd durable workflow skill (`.pi/skills/absurd/SKILL.md`)
2. Browser harness
3. Video watch
4. Data processor / second-brain ingestion
5. Knowledge graph or graph operator
6. Model routing / which-model guidance
7. QA specialist
8. Security engineer when authentication or private content is involved

## Durable execution contract

One classroom run is one Absurd task:

```text
digital-student-course:v1
```

The course manifest is the completion authority. Each lesson is delivered as a cached Absurd event and processed through stable, versioned checkpoint names.

```text
course.manifest:<course-id>:v1
lesson.ready:<course-id>:<lesson-index>:v1
```

Rules:

- Postgres task/checkpoint state is execution authority.
- Local JSON files are exports and can be re-materialized from checkpointed results during replay.
- Completed compilation steps are never intentionally recomputed on ordinary task retry.
- Long model work extends the worker lease before compilation.
- Task retry uses exponential backoff.
- Course task spawning uses a stable idempotency key so restarting the launcher does not create duplicate course missions.
- Step names are versioned when meaning or result shape changes.
- Course completion is derived from processing every lesson in the accepted manifest, not from a single lesson snapshot flag.

## Workflow

1. Inspect source and authorization.
2. Define one learning mission.
3. Attach to a visible local browser profile.
4. User completes authentication manually.
5. Capture the currently visible classroom manifest once.
6. Spawn or resume the idempotent Absurd course task.
7. Capture authorized lesson text, available transcript, and source metadata one lesson at a time.
8. Emit each lesson as a durable cached event.
9. Validate source identity against the manifest.
10. Compile evidence into concepts, claims, procedures, examples, actions, decision rules, and tool rules.
11. Persist each completed compilation as an Absurd checkpoint with model/source/prompt provenance.
12. Re-materialize lesson and progress JSON exports.
13. After lesson three, write the first-three actionable-knowledge checkpoint and continue.
14. Continue until every manifest lesson is checkpointed.
15. Generate final course knowledge JSON.
16. Propose downstream second-brain memory changes; do not commit them without approval.

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

## Current proof slice

Using one user-authorized classroom:

- capture a visible course manifest;
- initialize an Absurd queue in a controlled Postgres database;
- spawn one idempotent durable course task;
- process lessons 1-3 and generate `first-three-actionable-knowledge.json`;
- interrupt the worker after at least one completed checkpoint;
- restart the worker and verify completed steps are replayed from Postgres rather than recomputed;
- continue from the next missing lesson;
- process the entire accepted manifest;
- generate final actionable knowledge JSON;
- perform no write action on the learning platform.

## Proof required

- Absurd task ID
- Queue name
- Course manifest
- `absurdctl dump-task` showing completed checkpoints and waits
- Browser action log
- Permission record
- Lesson checkpoints
- Transcript or transcript limitation
- Evidence-backed knowledge units
- Source/model/prompt provenance
- First-three export
- Final course export
- Restart/resume evidence
- Human approval state for downstream durable memory
- No-secret and no-platform-write verification

## Commercial path

Initial offer: Digital Student Setup Sprint for operators, agencies, and owners of authorized course libraries. SaaS billing and multi-tenancy remain parked until the single-user workflow proves repeatable value.
