# Video Watch Skill

## Slash Command: `/video-watch`

Analyze authorized video material: summarize it, extract key points, review a competitor demo, study a tutorial, or convert a lesson into evidence-backed knowledge.

## Usage

```text
/video-watch [video URL] [optional question, mode, or time range]
```

## Required Load Order

1. `skills/video-watch/SKILL.md`
2. `skills/video-watch/CONTEXT.md`
3. `skills/video-watch/policy.md`
4. `skills/video-watch/workflow.md`
5. `icm/workstreams/digital-student/CONTEXT.md` only for study or second-brain missions

## Examples

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID
```

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID What makes this opening effective?
```

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID Analyze 0:30–2:00.
```

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID Create study notes and candidate knowledge units.
```

## Execution

1. Verify authorization and accessibility.
2. Retrieve metadata and the strongest available evidence.
3. Prefer captions or transcript, then authorized transcription.
4. Inspect frames when visuals materially affect the answer.
5. Assign the actual coverage label.
6. Select `summary`, `content`, `competitor`, `technical`, `business`, or `study` mode.
7. Label source claims, visual observations, inference, unresolved items, and action proposals.
8. Return limitations and stop rather than fabricating unavailable evidence.

## Required Output

- Source metadata
- Coverage label
- Summary
- Key points with evidence labels
- Notable timestamps when available
- Direct answer
- Strategic or study notes when relevant
- Limitations and unresolved claims

Digital Student runs additionally produce candidate knowledge, relationships, a briefing, and a proposed memory patch.

## Core Rule

Do not claim to have watched or visually verified material that was not actually inspected. Do not bypass authentication, paywalls, DRM, CAPTCHA, or private-content controls.
