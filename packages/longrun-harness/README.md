# @pauli/longrun-harness

Durable course fan-out/fan-in primitives for Digital Student.

## Current scope

This package proves the first bounded orchestration slice without connecting to a live school or second brain:

- Course manifest with two modules and six lessons
- Prerequisite-aware lesson scheduling
- Bounded student-worker concurrency
- Standard evidence-bearing homework packets
- Retry after an injected lesson failure
- Module synthesis
- Course synthesis
- Candidate-memory generation
- ICM filesystem output

## Run the focused test

```bash
npm run test --workspace=@pauli/longrun-harness
```

## Run the demonstration

```bash
npm run demo --workspace=@pauli/longrun-harness
```

The demonstration writes to:

```text
icm/runs/mock-digital-student-course/
```

## Output contract

```text
<mission-id>/
├── course-manifest.json
├── lesson-jobs.json
├── events.jsonl
├── lessons/
│   └── <lesson-id>/
│       ├── homework-packet.json
│       └── briefing.md
├── modules/
│   ├── <module-id>.json
│   └── <module-id>.md
├── course-synthesis.json
├── course-synthesis.md
├── candidate-memory/
│   ├── candidate-memory.json
│   └── REVIEW_REQUIRED.md
└── HANDOFF.md
```

## Non-goals in this slice

- Live Skool access
- Browser authentication
- PostgreSQL leases and checkpoints
- Container process supervision
- Real model calls
- Automatic durable-memory promotion
- Multi-tenant SaaS behavior

## Next implementation slice

Add a PostgreSQL-backed mission store, expiring worker leases, heartbeat recovery, and resume from the last accepted homework packet. Only after that passes a forced process-kill test should the browser collector be connected.
