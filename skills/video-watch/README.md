# Video Watch Skill

Analyze authorized video material. Summarize it, extract key points, review a competitor demo, study a tutorial, or convert a lesson into evidence-backed knowledge.

## Quick Start

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID
```

Or paste a video URL with a goal:

```text
Watch this video and summarize the main argument: https://youtube.com/watch?v=VIDEO_ID
```

## What It Does

1. Validates the source and authorization mode.
2. Retrieves available metadata.
3. Prefers native captions or transcripts.
4. Falls back to authorized transcription when necessary.
5. Reviews visual frames when the answer depends on slides, code, diagrams, interfaces, or demonstrations.
6. Assigns an accurate coverage label.
7. Separates source statements, visual observations, and inference.
8. Returns a structured answer with limitations.

## Analysis Modes

| Mode | What it produces |
|---|---|
| **Summary** | Overview, key points, timestamps, main takeaway |
| **Content** | Hook, structure, emotional triggers, retention, virality, adaptation ideas |
| **Competitor** | Positioning, claims, pain points, proof, weaknesses, opportunities |
| **Technical** | Tools, architecture, code patterns, setup steps, implementation checklist |
| **Business** | Thesis, market assumptions, risks, leverage points, actionable takeaways |
| **Study** | Notes, definitions, evidence-backed knowledge units, questions, flashcards, proposed memory patch |

## Coverage Labels

Every result states the strongest review level completed:

- `METADATA ONLY`
- `TRANSCRIPT REVIEWED`
- `AUDIO TRANSCRIBED`
- `VISUAL SEGMENTS REVIEWED`
- `FULL AUDIOVISUAL REVIEW`

The skill does not claim visual review when it only processed a transcript.

## Evidence Labels

- `SOURCE STATES`
- `VISUALLY SHOWN`
- `STUDENT INFERENCE`
- `UNRESOLVED`
- `ACTION PROPOSAL`

## Example Requests

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID Summarize the video.
```

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID What makes the opening work?
```

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID Analyze from 0:30 to 2:00.
```

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID Turn this tutorial into study notes and candidate knowledge units.
```

## Digital Student Mode

When called from `icm/workstreams/digital-student/`, study mode can produce:

- Source and lesson hierarchy
- Transcript-linked or timestamp-linked notes
- Evidence-backed knowledge units
- Cross-topic relationships
- Written briefing
- Proposed second-brain memory patch

Durable memory is not silently committed when review is required.

## Boundaries

The skill does not:

- Collect credentials, cookies, tokens, or verification codes
- Bypass login, paywalls, DRM, CAPTCHA, or private-content controls
- Download or redistribute full protected videos
- Reproduce a complete third-party transcript without an appropriate basis
- Claim to have watched visuals that were not inspected

When a source cannot be accessed, the skill reports what failed and requests an authorized alternative such as user-provided captions, transcript, audio, or screenshots.

## Skill Files

| File | Purpose |
|---|---|
| `SKILL.md` | Mission, triggers, evidence contract, and required outputs |
| `CONTEXT.md` | ICM inputs, stage routing, dependencies, outputs, and stop conditions |
| `policy.md` | Authorization, copyright, evidence, external processing, and memory policy |
| `workflow.md` | Step-by-step analysis process |
| `pi-loading-rules.md` | Lazy-load rules and execution routing |
| `tests/acceptance-cases.md` | Deterministic policy and output acceptance fixtures |
| `README.md` | User-facing documentation |
