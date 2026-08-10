# Skool Assisted Study Runner

Human-in-the-loop study runner for authorized Skool classroom material, backed by Absurd durable execution.

This package intentionally does **not** automate login, crawl the classroom, copy cookies, bypass access controls, or post to Skool. The user opens the classroom and lessons manually in their normal logged-in browser. The runner turns those authorized snapshots into durable, resumable AI study work.

## Target test

`https://www.skool.com/the-ai-automation-circle/classroom`

## Durability model

One classroom is one Absurd task:

```text
digital-student-course:v1
```

Postgres stores workflow state, completed steps, retries, and cached events. Local JSON files are exports, not the execution source of truth.

A worker crash, Node restart, terminal disconnect, or temporary LLM/network failure does not discard completed lesson steps. When the task runs again, Absurd replays cached checkpoints and continues from the next unfinished step.

## Prerequisites

- Node.js 20+
- PostgreSQL reachable through `ABSURD_DATABASE_URL` or standard PG environment variables
- `absurdctl`
- an OpenAI-compatible LLM endpoint

Install dependencies from the repository root:

```bash
npm install
```

Install the Absurd CLI if needed, then initialize a controlled database and queue:

```bash
absurdctl init
absurdctl create-queue digital-student
```

Do not run schema initialization against an ambiguous or shared production database.

The official Absurd Pi skill is installed in this repository at:

```text
.pi/skills/absurd/SKILL.md
```

## Environment

Configure the model endpoint:

```bash
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=<your-key>
LLM_MODEL=<your-model-id>
```

Configure Absurd/Postgres:

```bash
ABSURD_DATABASE_URL=postgresql://user:password@host:5432/database
SKOOL_ABSURD_QUEUE=digital-student
```

Optional runner tuning:

```bash
SKOOL_ABSURD_CONCURRENCY=1
SKOOL_ABSURD_CLAIM_TIMEOUT=900
SKOOL_STUDY_POLL_MS=2000
SKOOL_STUDY_INPUT=./skool-study/input
SKOOL_STUDY_OUTPUT=./skool-study/output
```

Do not commit keys or database credentials.

## 1. Start the durable runner

```bash
npm run run -w @pauli/skool-study-runner
```

The process starts an Absurd worker and a local event gateway.

Default folders:

```text
skool-study/input/
skool-study/output/
```

## 2. Capture the classroom manifest

1. Log into Skool yourself.
2. Open the target classroom page.
3. Make sure the classroom lesson list is visible.
4. Open DevTools Console.
5. Run `capture/capture-classroom-manifest.js`.
6. Review the number of discovered lesson links before confirming.
7. Move the downloaded `course-manifest.json` into `skool-study/input/`.

The manifest is the completion authority. A single lesson snapshot cannot declare the course complete.

When the runner sees the manifest it:

- emits a cached `course.manifest:<course-id>:v1` event;
- spawns or resumes `digital-student-course:v1`;
- uses an idempotency key so a launcher restart does not duplicate the course mission.

## 3. Capture each lesson

For every authorized lesson in manifest order:

1. Open the lesson manually.
2. Open DevTools Console.
3. Run `capture/capture-current-lesson.js`.
4. Enter the lesson number from the manifest.
5. Move `lesson-###.json` into `skool-study/input/`.

The local gateway emits:

```text
lesson.ready:<course-id>:<lesson-index>:v1
```

Absurd caches the event. If the worker is offline, the lesson remains available when the task resumes.

## Checkpoint sequence

Each lesson uses stable, versioned durable operations conceptually equivalent to:

```text
lesson:NNN:await-source:v1
lesson:NNN:validate-source:v1
lesson:NNN:compile:v2
checkpoint:progress:NNN:v2
```

The model output includes provenance:

- source SHA-256 hash;
- model;
- provider base URL;
- prompt version;
- generation time.

If the compilation step is already checkpointed, ordinary Absurd task retries reuse it instead of spending tokens to recompute it.

## First-three checkpoint

After the first three manifest lessons are successfully checkpointed, the task writes:

```text
skool-study/output/first-three-actionable-knowledge.json
```

The task does **not** finish there. It waits for and processes the remaining manifest lessons.

## Course completion

The task becomes complete only after every lesson listed in the accepted manifest has a completed lesson result.

Then it writes:

```text
skool-study/output/course-complete-actionable-knowledge.json
```

and the launcher exits after confirming that final export belongs to the active course and has `courseComplete: true`.

## Recovery behavior

If the runner is interrupted:

1. restart the same command;
2. the manifest and lesson files can be re-read locally;
3. cached Absurd events ignore duplicate emission;
4. the same idempotency key resolves to the existing course task;
5. completed checkpoints are replayed from Postgres;
6. the workflow continues at the next incomplete lesson/step.

Do not delete the Absurd database if you expect durable resume behavior.

## Inspect progress with Absurd

```bash
absurdctl list-queues
absurdctl list-tasks --queue=digital-student --limit=20
absurdctl list-tasks --queue=digital-student --status=failed --limit=20
absurdctl list-tasks --queue=digital-student --status=sleeping --limit=20
absurdctl dump-task --task-id=<task-id>
```

`dump-task` is the authoritative way to inspect completed checkpoints, waits, retries, and failures.

## Retry policy

The course task is configured for up to 100 attempts using exponential backoff capped at five minutes. Completed lesson checkpoints are reused on every retry.

If a task eventually reaches a terminal failure, inspect it before retrying:

```bash
absurdctl dump-task --task-id=<task-id>
absurdctl retry-task <task-id> --max-attempts 100
```

## Code-change rule for long-running tasks

Durable checkpoints can outlive the code that created them. If the meaning or shape of a completed step changes, use a new versioned step name such as:

```text
lesson:017:compile:v3
```

Do not silently change the meaning of an old checkpoint name.

## Safety boundary

The runner remains read-only with respect to Skool. It does not:

- fill credentials;
- read MFA codes;
- export cookies or tokens;
- bypass CAPTCHA or access control;
- join groups;
- purchase;
- post, comment, react, reply, or message;
- scrape members;
- bulk crawl unrelated pages.

See `icm/workstreams/digital-student/policies/skool.com.yaml`.
