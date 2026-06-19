# ROUTING.md — Task Dispatch Table
# The Pauli Effect™ AI Design Studio
# This table is the only "orchestration" this studio needs.
# HERMES reads this. Agents read this. External backends read this.

---

## DISPATCH TABLE

| Intent (plain English)          | Agents                              | Skills to Load                        | Output                              |
|---------------------------------|-------------------------------------|---------------------------------------|-------------------------------------|
| Build a landing page            | SCOUT → RALPHY×3 → LENA             | kupuri-frontend, motion, color-psych  | 3× HTML in .superdesign/            |
| Iterate on existing design      | LENA (score current) → MARCO → RALPHY×3 → LENA | udec-scorer, kupuri-frontend | updated HTML + new audit JSON |
| Score a design file             | LENA only                           | udec-scorer                           | audits/{project}-audit-{n}.json     |
| Research design category        | SCOUT only                          | awwwards-research                     | research/{date}-{topic}.md          |
| Write iteration brief           | MARCO only                          | udec-scorer, design-principles        | tasks/queue/{project}-synthesis.md  |
| Build brand intro video         | AURORA + BASS                       | motion                                | video/{project}/                    |
| Build character animation       | AURORA + BLENDER                    | motion                                | video/{project}/ + 3d/exports/*.glb |
| Generate audio / voiceover      | BASS only                           | —                                     | audio/{voices,music}/{file}.mp3     |
| 3D scene or asset               | BLENDER only                        | —                                     | 3d/exports/*.glb                    |
| Full campaign (frontend+video)  | ALL agents sequenced                | all                                   | examples/{project}/ complete        |
| Daily research cron (6am PV)    | SCOUT only                          | awwwards-research                     | research/{YYYY-MM-DD}-awwwards.md   |

---

## ROUTING DECISION TREE

```
Incoming brief
    │
    ├── "build" / "design" / "create page" / "landing"
    │       └── frontend pipeline (SCOUT → RALPHY×3 → LENA → gate)
    │
    ├── "iterate" / "improve" / "fix" / "v2" / "v3"
    │       └── score existing → MARCO → RALPHY×3 → LENA → gate
    │
    ├── "score" / "audit" / "UDEC" / "review"
    │       └── LENA only
    │
    ├── "research" / "find references" / "awwwards" / "inspiration"
    │       └── SCOUT only
    │
    ├── "video" / "animation" / "reel" / "intro"
    │       └── AURORA (+ BASS if audio needed)
    │
    ├── "audio" / "voice" / "music" / "voiceover"
    │       └── BASS only
    │
    ├── "3D" / "model" / "GLB" / "blender"
    │       └── BLENDER only
    │
    └── ambiguous / multi-deliverable
            └── escalate to HERMES for decomposition
```

---

## API ENDPOINTS (for backend callers)

When AKASHPORTFOLIO backend calls this studio:

```
POST /design/dispatch       → writes task.md to tasks/queue/, returns task ID
GET  /design/queue          → lists all tasks/queue/*.task.md with status
GET  /design/output/{id}    → returns output file path(s) for completed task
POST /design/score          → triggers LENA on specified HTML file
GET  /design/audits/{id}    → returns audit JSON for task ID
POST /vibe/ingest           → POSTs approved output to Vibe Graph
```

These are handled by AKASHPORTFOLIO Rust backend (backend/src/routes/design.rs).
This repo (synthia-superdesign) is the file system the backend reads/writes.

---

## TASK FILE DROP PROTOCOL

Any backend, agent, or CLI can trigger work by:
1. Writing a `.task.md` file to `tasks/queue/` following FORMAT.md schema
2. HERMES picks it up on next cycle (or immediately if triggered via MCP)
3. No API call required. Folder IS the queue.

This is the zero-infrastructure dispatch system.
