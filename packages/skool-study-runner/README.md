# Skool Assisted Study Runner

Human-in-the-loop study runner for authorized Skool classroom material.

This package intentionally does **not** automate login, crawl the classroom, copy cookies, bypass access controls, or post to Skool. The user opens each lesson manually in their normal logged-in browser and captures the current lesson locally. The runner then processes lesson snapshots durably until the course is marked complete.

## Target test

`https://www.skool.com/the-ai-automation-circle/classroom`

## Why assisted mode

The repository policy at `icm/workstreams/digital-student/policies/skool.com.yaml` blocks credential access, session export, bulk harvesting, and platform write actions. The runner follows that contract.

## Setup

From the repository root:

```bash
npm install
```

Configure an OpenAI-compatible model endpoint through environment variables:

```bash
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=<your-key>
LLM_MODEL=<your-model-id>
```

Do not commit keys.

## Start the durable runner

```bash
npm run run -w @pauli/skool-study-runner
```

Default folders:

```text
skool-study/input/
skool-study/output/
```

The process polls the input folder and checkpoints after every processed lesson.

## Capture each lesson

1. Log into Skool yourself in your normal browser.
2. Open the selected classroom lesson manually.
3. Open DevTools Console.
4. Run the contents of `capture/capture-current-lesson.js`.
5. Enter the lesson number and module title when prompted.
6. The helper downloads `lesson-###.json` locally.
7. Move that JSON into `skool-study/input/`.
8. Navigate to the next lesson yourself and repeat.

The capture helper reads only the currently open page. It does not navigate the classroom or access credentials/session data.

## First-three checkpoint

As soon as lessons 1-3 are processed, the runner writes:

```text
skool-study/output/first-three-actionable-knowledge.json
```

The runner **continues running** after writing this checkpoint.

The JSON contains:

- lesson summaries;
- evidence-backed knowledge units;
- reusable procedures;
- tool rules;
- decision rules;
- failure modes / guardrails;
- next actions;
- state required for another AI agent to continue.

## Course completion

On the final lesson, answer **Yes** when the capture helper asks whether it is the last lesson. The resulting snapshot sets `courseComplete: true`.

The runner then writes:

```text
skool-study/output/course-complete-actionable-knowledge.json
```

and exits only after that final checkpoint is saved.

## Durable behavior

- Every lesson result is saved independently.
- `progress.json` is refreshed after each lesson.
- The first-three checkpoint is immutable once written.
- The process does not depend on chat context.
- If the process stops, previously generated lesson JSON remains on disk; restart the runner and continue feeding missing lesson snapshots.

## Important limitation

This package does not claim that a course has been completed merely because the process ran. Completion requires a final captured lesson with `courseComplete: true`, supplied by the authorized user after manually reaching that final lesson.
