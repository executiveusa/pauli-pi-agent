# Video Watch Skill

Analyze any video URL. Summarize it, extract key points, review a competitor's demo, study a tutorial, or break down what makes a video viral.

---

## Quick Start

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID
```

Or just paste a video URL into chat:

```text
Watch this video and summarize it: https://youtube.com/watch?v=VIDEO_ID
```

---

## What It Does

1. Validates the URL and checks accessibility.
2. Retrieves title, creator, duration, and description.
3. Fetches the transcript or captions (prefers native captions, falls back to audio transcription).
4. Selects the right analysis mode based on your request.
5. Returns a structured answer: summary, key points, timestamps, and a direct reply to your question.

---

## Analysis Modes

| Mode | What it produces |
|---|---|
| **Summary** | Overview, key points, timestamps, main takeaway |
| **Content / Viral** | Hook analysis, structure, emotional triggers, virality score, adaptation ideas |
| **Competitor** | Positioning, claims, pain points, proof, weaknesses, how to outperform |
| **Technical** | Tools, architecture, code patterns, setup steps, implementation checklist |
| **Business** | Core thesis, market assumptions, risks, leverage points, actionable takeaways |
| **Study** | Structured notes, definitions, examples, study questions, flashcards |

---

## Example Requests

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID
Summarize this video.
```

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID
What makes this video go viral? Analyze the hook and structure.
```

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID
This is a competitor demo. Extract their claims, positioning, and weaknesses.
```

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID
Analyze only the first 2 minutes.
```

```text
/video-watch https://youtube.com/watch?v=VIDEO_ID
Turn this tutorial into step-by-step notes.
```

---

## Time Range

You can focus analysis on a specific section:

```text
Watch this video from 0:30 to 3:00 and extract the main argument.
```

---

## Output Format

By default the skill returns:

- **URL, title, creator, duration**
- **Summary** — concise overview
- **Key points** — numbered list
- **Notable moments** — timestamps with notes
- **Answer to your question** — direct reply
- **Strategic notes** — optional insights and recommendations
- **Limitations** — what could not be accessed (if anything)

You can request alternate formats:

```text
Give me the output as bullet points only.
Turn the notes into a blog post outline.
Give me the key points as flashcards.
```

---

## What It Cannot Do

- Access private, login-gated, DRM-protected, or paywalled videos
- Download or store full video files
- Expose platform API keys or credentials

If a video cannot be accessed, the skill will explain why and ask for an alternative (transcript, captions file, audio clip, or screenshots).

---

## Skill Files

| File | Purpose |
|---|---|
| `SKILL.md` | Core skill definition, trigger phrases, operating rules |
| `workflow.md` | Step-by-step execution process |
| `pi-loading-rules.md` | When and how PI loads this skill |
| `README.md` | This file — user-facing documentation |
