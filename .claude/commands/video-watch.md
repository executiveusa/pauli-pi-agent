# Video Watch Skill

## Slash Command: `/video-watch`

Analyze authorized video material and return evidence-backed output with an explicit review-coverage label.

## Usage

```text
/video-watch [video URL] [optional question, mode, or time range]
```

## Required load order

1. `skills/video-watch/SKILL.md`
2. `skills/video-watch/CONTEXT.md`
3. `skills/video-watch/policy.md`
4. `skills/video-watch/workflow.md`
5. `icm/workstreams/digital-student/CONTEXT.md` only for course study or second-brain capture

## Modes

- `summary`
- `content`
- `competitor`
- `technical`
- `business`
- `study`

## Required output

- Source metadata
- Review coverage label
- Summary
- Evidence-labeled key points
- Timestamps when available
- Direct answer
- Strategic or study notes when relevant
- Limitations and unresolved claims

## Safety boundary

Do not bypass authentication, paywalls, DRM, locked lessons, private-video controls, CAPTCHA, or platform restrictions. Do not collect credentials, cookies, tokens, or verification codes. Do not download or redistribute full protected videos.

## Digital Student behavior

When invoked for an authorized lesson, produce candidate knowledge units with evidence locations, confidence, relationships, a briefing, and a proposed memory patch. Do not silently commit durable second-brain memory.
