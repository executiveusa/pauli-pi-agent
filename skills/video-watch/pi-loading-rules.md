# PI Loading Rules

## Skill Identity

```yaml
skill_name: video-watch
display_name: Video Watch Skill
slash_command: /video-watch
owner_agent: PI
status: active
mode: lazy_load
canonical_folder: skills/video-watch/
icm_stage_entry: icm/stages/01-inspect/CONTEXT.md
digital_student_workstream: icm/workstreams/digital-student/CONTEXT.md
future_subagent_name: VideoWatchAgent
```

## Required Context Load Order

1. `CONTEXT.md`
2. `AGENTS.md`
3. `WORKFLOW.md`
4. `icm/CONTEXT.md`
5. Active stage contract
6. `skills/video-watch/CONTEXT.md`
7. `skills/video-watch/policy.md`
8. `skills/video-watch/workflow.md`

Load the Digital Student workstream only when the task is educational ingestion, course study, lesson analysis, or second-brain capture.

## When PI Should Load This Skill

Load this skill when:

1. The user provides a YouTube, Vimeo, Loom, Wistia, or direct video URL.
2. The user asks to watch, analyze, summarize, or review existing video material.
3. The user asks about a video's hook, structure, virality, storytelling, claims, or call to action.
4. The user asks for notes, takeaways, definitions, flashcards, or a transcript-derived briefing.
5. The user requests competitor, technical, business, or study analysis.
6. A Digital Student mission selects a lesson containing embedded video.

## When PI Should Not Load This Skill

Do not load this skill for:

- Video generation, editing, rendering, or production tasks
- General text or document summarization without video material
- Audio-only work where no video context is relevant
- Private, unauthorized, DRM-protected, or inaccessible material
- Bulk platform crawling or community harvesting

## PI Execution Pattern

1. Classify authorization and access mode.
2. Validate the source URL and platform.
3. Load `policy.md` and select the appropriate workflow path.
4. Retrieve metadata and the best available evidence source.
5. Assign the actual coverage label.
6. Select or infer the analysis mode.
7. Produce evidence-labeled output.
8. Save only when the active workstream or user request requires an artifact.
9. For Digital Student, create candidate knowledge and a proposed memory patch rather than silently committing durable memory.

## Skill Output Contract

Every completed run should produce:

1. Source metadata
2. Coverage label
3. Summary
4. Key points with evidence labels
5. Notable timestamps when available
6. Direct answer to the user's question
7. Strategic or study notes when applicable
8. Limitations and unresolved claims

Digital Student runs additionally require evidence-backed knowledge units, relationships, a briefing, and a proposed second-brain memory patch.
