---
name: longrun-harness
description: Run durable fan-out/fan-in course missions with bounded student workers, retries, synthesis, and approval-gated ICM filing.
category: agent-orchestration
status: active
risk: medium
requires_human_approval: true
tools:
  - filesystem
  - model-router
  - browser-adapter
inputs:
  - course-manifest
  - lesson-source-packages
  - learning-objective
outputs:
  - homework-packets
  - module-syntheses
  - course-synthesis
  - candidate-memory
  - event-log
---

# Long-running Course Harness

## Purpose

Turn a course into bounded lesson jobs, process those jobs through a controlled student-worker pool, retry recoverable failures, reduce results hierarchically, and produce candidate knowledge for human-reviewed second-brain insertion.

## Load when

- A course contains multiple modules or lessons.
- The user asks to send sub-agents to different classes.
- Work must survive individual lesson-worker failures.
- Outputs must be filed into ICM rather than returned as one large summary.

## Do not load when

- The source is a single short article or lesson.
- There is no measurable learning objective.
- The user lacks authorized access to the source.
- The requested workflow includes platform engagement, impersonation, or access-control circumvention.

## Core sequence

1. Inventory the course into a manifest.
2. Capture one source package per authorized lesson.
3. Create prerequisite-aware lesson jobs.
4. Run a bounded pool of lesson students.
5. Validate each homework packet.
6. Retry recoverable failures within budget.
7. Synthesize lessons into modules.
8. Synthesize modules into the course.
9. Create candidate memory organized by meaning.
10. Require independent review and human approval before durable memory promotion.

## Current verified slice

The package `packages/longrun-harness/` provides a deterministic six-lesson mock course demonstrating:

- Two modules
- Six lesson jobs
- Two concurrent student slots
- One injected first-attempt failure
- Retry and recovery
- Standard homework packets
- Module and course synthesis
- Candidate-memory output
- ICM artifact writing

It does not yet connect to a live browser, PostgreSQL lease store, or production second brain.
