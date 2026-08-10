---
name: absurd
description: Debug and operate Absurd durable workflows with absurdctl. Use when working with Absurd queues, tasks, runs, events, retries, schema setup, or when a user wants to inspect, spawn, retry, cancel, or wake workflows.
license: Apache-2.0
---

# Absurd

Use this skill when the project uses **Absurd**, the Postgres-native durable workflow engine, or when the user mentions **`absurdctl`**, queues, durable tasks, runs, retries, sleeping tasks, or events.

Source: `earendil-works/absurd`, Apache-2.0.

## Tiny mental model

- A **queue** is a namespace of Absurd tables (`t_`, `r_`, `c_`, `e_`, `w_`).
- A **task** is the durable workflow instance.
- A **run** is one execution attempt of a task.
- A **step** is a checkpoint. Completed step results are stored as JSON.
- **Sleeping** tasks are usually waiting for time or an event.
- **Events** wake waiting tasks. Event payloads are cached; first emit wins.

Important distinction:

- `task_id` = the whole workflow across all attempts
- `run_id` = one specific execution attempt

## First: make sure `absurdctl` works

If `absurdctl` is not on `PATH`, check whether you are inside a repo checkout and, if so, use:

```bash
export PATH="$PWD:$PATH"
```

Absurd connection precedence is:

```text
--database > ABSURD_DATABASE_URL > PGDATABASE > postgresql://localhost/absurd
```

For non-URI connections, `PGHOST`, `PGPORT`, `PGUSER`, and `PGPASSWORD` are also honored.

## Default debugging workflow

Prefer **`absurdctl` state inspection before source inspection**. Usually you do **not** need to read application code first.

If the user explicitly asks you to use **`absurdctl`** to inspect or fix a workflow, do that first instead of starting with source browsing.

### 1) Discover queues

```bash
absurdctl list-queues
```

### 2) Inspect recent activity

```bash
absurdctl list-tasks --queue=default --limit=20
```

Useful statuses: `pending`, `running`, `sleeping`, `completed`, `failed`, `cancelled`.

### 3) Focus on failures or sleepers

```bash
absurdctl list-tasks --queue=default --status=failed --limit=20
absurdctl list-tasks --queue=default --status=sleeping --limit=20
```

### 4) Inspect one workflow or attempt

```bash
absurdctl dump-task --task-id=<task-id>
absurdctl dump-task --run-id=<run-id>
```

`dump-task` shows task parameters, retry settings, checkpointed step state, waits/events, sleep state, final result, and failures.

## Common state handling

### Failed task

1. Dump the task.
2. Read the failure and last successful checkpoints.
3. Inspect the latest run if needed.
4. Search code for the registered task name.
5. Retry only after understanding the failure.

### Sleeping task

1. Dump the task.
2. Determine whether it is waiting for time or an event.
3. If the expected event is ready and the user wants it resumed, emit that event.

### Running task

1. Dump the task.
2. Inspect checkpoints to see actual progress.
3. If a stuck worker is suspected, inspect worker/application logs.

## Worker rule

Do not assume a worker must be started or modified.

- If a task moves out of `pending`, a worker is active.
- If tasks remain `pending`, investigate the worker for that queue.
- Only change worker/runtime code when state inspection indicates a worker problem.

## Find a task implementation

TypeScript / JavaScript:

```bash
rg -n "registerTask\(|name:\s*['\"]<task-name>['\"]" .
```

Python:

```bash
rg -n "register_task\(|@.*register_task|['\"]<task-name>['\"]" .
```

## Spawn work

```bash
absurdctl spawn-task my-task -q default -P foo=bar
absurdctl spawn-task my-task -q default -P count:=42 -P enabled:=true
absurdctl spawn-task my-task -q default --params '{"foo":"bar","count":42}'
```

## Retry failed work

```bash
absurdctl retry-task <task-id>
absurdctl retry-task <task-id> --max-attempts 5
absurdctl retry-task -q default <task-id> --spawn-new
```

Prefer understanding the failure before retrying.

## Cancel work

```bash
absurdctl cancel-task <task-id>
absurdctl cancel-task -q default <task-id>
```

## Wake a waiting task

```bash
absurdctl emit-event order.completed -q default -P orderId=123
absurdctl emit-event approval.granted:42 -q default -P approved:=true
absurdctl emit-event shipment.packed:42 -q default --payload '{"trackingNumber":"XYZ"}'
```

## Schema setup / migrations

Use on a blank or controlled database, or when explicitly requested:

```bash
absurdctl init
absurdctl schema-version
absurdctl migrate
absurdctl create-queue default
```

## Safe operating rules

Be careful with state-changing commands. Unless the user clearly wants them, avoid running these blindly on a shared or production database:

- `init`
- `migrate`
- `create-queue`
- `drop-queue`
- `cleanup`
- `cancel-task`
- `retry-task`
- `emit-event`
- `spawn-task`

If the environment is ambiguous, identify the intended database and queue before acting.

## Digital Student mapping

For `@pauli/skool-study-runner`:

- queue: `digital-student` by default
- task: `digital-student-course:v1`
- manifest event: `course.manifest:<course-id>:v1`
- lesson event: `lesson.ready:<course-id>:<lesson-index>:v1`
- completed lesson compilation steps are Postgres checkpoints
- local JSON is an export, not workflow authority

Inspect a long-running course with:

```bash
absurdctl list-tasks --queue=digital-student --limit=20
absurdctl dump-task --task-id=<task-id>
```

## Extra reference

- Use `absurdctl <command> --help` for full options.
- `dump-task --task-id` is usually the best starting point once you know the task.
- Checkpointed step results are durable JSON state; code outside steps may execute multiple times across retries.
