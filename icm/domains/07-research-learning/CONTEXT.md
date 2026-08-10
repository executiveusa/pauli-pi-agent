---
type: domain
status: active
owner_path: packages/deep-research
consumes: [questions, sources, authorized-learning-material]
produces: [research-evidence, knowledge-units, briefings]
edges: [../08-memory-knowledge/CONTEXT.md, ../../workstreams/digital-student/CONTEXT.md]
governance: sensitive
---

# Research and Learning

One job: obtain evidence and convert authorized source material into actionable, source-linked knowledge.

## Owners

- `packages/deep-research/` — external research workflow.
- `icm/workstreams/digital-student/` — course/learning contract and platform policies.
- `packages/skool-study-runner/` — assisted Skool runner currently merged on main.
- `skills/video-watch/` — media evidence processing.
- research references in `skills/SKILLS_REGISTRY.md`.

## Rules

Evidence precedes inference. Authorized/private sources keep their access boundary. Learning outputs flow to Memory only after source identity, coverage, confidence, and unresolved questions are recorded. Durable execution work on `feat/skool-absurd-durability` remains a separate unmerged implementation slice until its required code checks pass.
