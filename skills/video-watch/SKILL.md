---
name: video-watch
description: Analyze, summarize, and extract insights from video URLs — YouTube, demos, tutorials, competitor content, lectures, and more.
---

# Video Watch Skill

## Mission

Use this skill to analyze any video URL the user provides and return structured, actionable insight.

This skill does not say "I cannot watch videos." It retrieves transcripts, captions, metadata, and — when available — visual frame data, then answers the user's actual question.

## PI Relationship

This is a folder-based skill for PI.

PI remains the master agent.

This skill is loaded only when the user provides a video URL or asks PI to watch, analyze, summarize, or extract content from a video.

## Branch and Folders

```text
Branch: claude/video-watch-skill-mh0v6q
Skill folder: skills/video-watch/
Output folder: factory/video-watch/
```

Video analysis outputs may also be saved alongside related business work:

```text
clients/{slug}/video-analysis/
prospects/{niche}/{slug}/video-analysis/
```

## Trigger Phrases

Use this skill when the user:

- Provides a YouTube, Vimeo, Loom, or other video URL
- Says "watch this video"
- Says "summarize this video"
- Says "analyze this video"
- Says "what is the hook in this video"
- Says "extract key points from this video"
- Says "review this tutorial"
- Says "critique this demo"
- Says "analyze my competitor's video"
- Says "what does this video say about X"
- Says "turn this video into notes / a blog post / a content brief"
- Says "why is this video going viral"
- Says "analyze the first 30 seconds"
- Says "what is the call to action in this video"
- Says "compare this video to our product"

## Supported Analysis Modes

| Mode | Use When |
|---|---|
| `summary` | User wants a general overview |
| `content` | User asks about hooks, virality, structure, or creator strategy |
| `competitor` | Video is a competitor demo, pitch, ad, or landing-page video |
| `technical` | Video is a coding tutorial, architecture talk, or software demo |
| `business` | Video covers strategy, fundraising, operations, or market analysis |
| `study` | User wants to learn from the video (notes, flashcards, definitions) |

## Operating Rules

1. Never say "I cannot watch videos" if tools are available.
2. Prefer native captions and transcripts over audio transcription.
3. Prefer audio transcription over frame-only analysis.
4. When visuals matter (slides, code, diagrams), inspect high-resolution frames.
5. Always distinguish: what the video explicitly says vs. what is visually shown vs. your interpretation.
6. Include timestamps when they improve usefulness.
7. Do not bypass paywalls, DRM, private videos, or login-gated content.
8. Do not expose API keys, credentials, or raw video data to external services unnecessarily.
9. If the video cannot be accessed, explain what failed and ask for a transcript, captions, screenshots, or audio file.
10. Respect platform terms of service and copyright restrictions.

## Required Workflow

See `workflow.md` for the full step-by-step process.

## Required Outputs

Every completed run produces at minimum:

1. Video metadata (URL, title, creator, duration, publish date)
2. Concise summary
3. Key points (numbered list)
4. Notable timestamps
5. Direct answer to the user's question
6. Strategic notes or recommendations (when relevant)
7. Limitations notice (if transcript or frames were unavailable)

## Quality Rules

- Summary must be specific to the actual video content, not generic.
- Key points must reflect what the video explicitly states.
- Timestamps must be accurate when included.
- Competitor analysis must identify specific claims, not generic observations.
- Technical analysis must include tools, dependencies, and implementation steps.
- Study notes must be structured for actual learning use.
