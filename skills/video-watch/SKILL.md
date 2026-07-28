---
name: video-watch
description: Analyze, summarize, and extract evidence-backed insights from authorized video URLs, lessons, demos, tutorials, lectures, and competitor content.
---

# Video Watch Skill

## Mission

Analyze authorized video material and return structured, evidence-backed insight without overstating what was actually reviewed.

This skill retrieves available metadata, captions, transcripts, audio, and selected visual frames, then answers the user's actual question. It must distinguish transcript evidence, visual evidence, and agent inference.

## PI Relationship

PI remains the master agent. Load this skill only when a task involves analyzing existing video material.

Canonical folder:

```text
skills/video-watch/
```

Default output folder:

```text
factory/video-watch/
```

Digital Student outputs may instead route through:

```text
icm/workstreams/digital-student/
```

## Trigger Phrases

Load this skill when the user:

- Provides a YouTube, Vimeo, Loom, Wistia, or direct video URL
- Says "watch this video"
- Says "summarize this video"
- Says "analyze this video"
- Asks about a video's hook, structure, virality, claims, or call to action
- Requests notes, flashcards, definitions, or an implementation checklist from a video
- Requests competitor, technical, business, or study analysis
- Selects a course lesson containing embedded video

## Supported Analysis Modes

| Mode | Use when |
|---|---|
| `summary` | General overview and key points |
| `content` | Hooks, retention, structure, emotion, virality, or creator strategy |
| `competitor` | Product demo, pitch, advertisement, positioning, or market claims |
| `technical` | Coding tutorial, architecture talk, setup, or software demo |
| `business` | Strategy, fundraising, operations, business model, or market analysis |
| `study` | Learning notes, concepts, questions, flashcards, or second-brain capture |

## Evidence Labels

Every material claim must use or inherit one of these labels:

- `SOURCE STATES` — explicitly present in transcript, captions, or visible source text
- `VISUALLY SHOWN` — observed in reviewed frames or screen content
- `STUDENT INFERENCE` — reasoned conclusion not directly stated
- `UNRESOLVED` — unclear, inaccessible, contradictory, or not verified
- `ACTION PROPOSAL` — recommended next step, not source fact

## Coverage Labels

State the strongest review level actually completed:

- `METADATA ONLY`
- `TRANSCRIPT REVIEWED`
- `AUDIO TRANSCRIBED`
- `VISUAL SEGMENTS REVIEWED`
- `FULL AUDIOVISUAL REVIEW`

Never claim to have watched or visually verified content when only a transcript was processed.

## Operating Rules

1. Prefer native captions and transcripts over audio transcription.
2. Prefer local or approved transcription over unnecessary external upload.
3. Inspect visual frames when slides, code, interfaces, diagrams, demonstrations, or body language materially affect the answer.
4. Include timestamps when they improve traceability.
5. Separate source statements, visual observations, and inference.
6. Do not bypass paywalls, DRM, authentication, permissions, private-video controls, or platform restrictions.
7. Do not expose credentials, session data, API keys, or raw protected media.
8. Do not download or redistribute full copyrighted video files.
9. Stop and report limitations when access or evidence is insufficient.
10. Follow `policy.md`, `CONTEXT.md`, and `workflow.md`.

## Digital Student Study Contract

When loaded by the Digital Student workstream, study mode must produce:

1. Source metadata and course or lesson hierarchy
2. Review coverage label
3. Transcript-linked or timestamp-linked notes
4. At least five knowledge units when the source supports them
5. Evidence location and confidence for each knowledge unit
6. At least one relationship or cross-topic link when justified
7. A concise written briefing
8. A proposed second-brain memory patch
9. No automatic durable-memory commit without the configured approval step

## Required Outputs

Every completed run produces at minimum:

1. Source metadata
2. Review coverage label
3. Concise summary
4. Key points with evidence labels
5. Notable timestamps when available
6. Direct answer to the user's question
7. Strategic or study notes when relevant
8. Limitations and unresolved claims

## Quality Rules

- Summaries must reflect retrieved evidence, not generic assumptions.
- Timestamps must correspond to the cited transcript or reviewed segment.
- Competitor analysis must separate explicit claims from interpretation.
- Technical analysis must identify tools, dependencies, assumptions, and uncertainty.
- Study outputs must be usable for recall, application, and second-brain organization.
- A missing transcript or missing visual review must be disclosed prominently.
