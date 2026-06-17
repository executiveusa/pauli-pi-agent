# Video Watch Skill

## Slash Command: `/video-watch`

Analyze any video URL — summarize it, extract key points, break down the hook, review a competitor demo, or turn a tutorial into structured notes.

## Usage

```text
/video-watch [video URL] [optional: your question or goal]
```

## Examples

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID
```

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID What makes this video go viral?
```

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID Analyze from 0:30 to 2:00
```

## What This Does

1. Loads `skills/video-watch/SKILL.md`
2. Runs the full workflow from `skills/video-watch/workflow.md`
3. Selects the analysis mode based on your request:
   - `summary` — overview, key points, timestamps, main takeaway
   - `content` — hook, structure, virality, emotional triggers, adaptation ideas
   - `competitor` — positioning, claims, proof, weaknesses, opportunities
   - `technical` — tools, architecture, code patterns, implementation checklist
   - `business` — thesis, market assumptions, risks, leverage, takeaways
   - `study` — structured notes, definitions, study questions, flashcards
4. Returns structured output with summary, key points, timestamps, and a direct answer

## Default Output

- Video metadata (title, creator, duration)
- Summary
- Key points
- Notable timestamps
- Direct answer to your question
- Strategic notes when relevant
- Limitations if transcript or frames were unavailable

## Core Rule

**Never say "I cannot watch videos" when tools are available.**

Always retrieve transcript or captions first, fall back to audio transcription, then frame analysis. Answer the user's actual question from the retrieved content.
