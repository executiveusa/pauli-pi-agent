# Video Watch Workflow

## Input

**Required:**
- Video URL

**Optional:**
- User question or goal
- Analysis mode (`summary` | `content` | `competitor` | `technical` | `business` | `study`)
- Time range (`startTime`, `endTime`)
- Whether to include full transcript
- Whether to include timestamps

---

## Process

### Step 1 — Validate URL

Confirm the URL:
- Points to a recognizable video platform (YouTube, Vimeo, Loom, Wistia, direct `.mp4`, etc.)
- Is publicly accessible (not private, login-gated, DRM-protected, or paywalled)
- Is not a playlist-only or redirect-only link

If validation fails, explain what failed and request an alternative (transcript, captions file, audio, screenshots).

---

### Step 2 — Retrieve Metadata

Collect available metadata:

- Title
- Channel or creator name
- Publish date
- Duration
- Description
- Tags or categories
- View count or engagement signals (when available)

---

### Step 3 — Retrieve Transcript or Captions

Processing order:

1. **Native captions** — Check for platform-provided closed captions or subtitles (YouTube auto-captions, Vimeo captions, etc.)
2. **Uploaded captions** — Check for `.srt`, `.vtt`, or `.sbv` files associated with the video
3. **Audio transcription** — If no captions exist, extract audio and transcribe using an available speech-to-text service
4. **Frame analysis** — If audio is unavailable or unclear, sample frames at regular intervals (every 30–60 seconds) and extract visual text via OCR

When a time range is provided (`startTime` / `endTime`), restrict transcript and frame retrieval to that range only.

---

### Step 4 — Select Analysis Mode

If the user specified a mode, use it.

If not, infer from the user's request:

| User says... | Mode |
|---|---|
| "summarize", "what is this about" | `summary` |
| "hook", "viral", "structure", "creator", "retention" | `content` |
| "competitor", "their demo", "their pitch", "their ad" | `competitor` |
| "tutorial", "how to", "code walkthrough", "architecture" | `technical` |
| "strategy", "business model", "fundraising", "market" | `business` |
| "notes", "study", "flashcards", "learn from" | `study` |

If unclear, default to `summary`.

---

### Step 5 — Analyze Content

#### Summary Mode

- Write a 3–6 sentence overview of the video.
- Extract 3–7 key points.
- Note the most important timestamps.
- Identify the main takeaway.

#### Content / Viral Analysis Mode

Analyze:

- Opening hook (first 3–10 seconds): What does it say? Why does it work?
- Pattern interrupts: Do visuals or edits change unexpectedly?
- Emotional triggers: Fear, curiosity, aspiration, humor, social proof?
- Curiosity gaps: What questions does the video leave open to keep watching?
- Pacing: Fast cuts, slow builds, or mixed?
- Structure: Problem → example → explanation → demo → CTA? Other?
- Payoff: Does the video deliver on its opening promise?
- Call to action: What does it ask the viewer to do?
- Virality assessment: What specific elements might drive sharing or replays?
- Adaptation note: How could this format be reused or repurposed?

#### Competitor Research Mode

Analyze:

- Product or service positioning
- Target customer profile
- Pain points addressed
- Explicit claims and value propositions
- Differentiators mentioned
- Pricing or packaging mentions
- Objections they handle
- Proof points (case studies, testimonials, metrics)
- Weaknesses or gaps in the presentation
- Opportunities to outperform or reframe in your favor

#### Technical Review Mode

Analyze:

- Tools, frameworks, and dependencies shown or mentioned
- Architecture decisions
- Code patterns, libraries, and conventions
- Setup and installation steps
- Configuration assumptions
- Security considerations
- Deployment notes
- Known limitations or caveats
- Step-by-step implementation checklist

When code or slides are visible, inspect high-resolution frames for accuracy.

#### Business / Strategy Review Mode

Analyze:

- Core thesis or central argument
- Business model mechanics
- Market assumptions
- Strategic insights and mental models
- Identified risks and second-order effects
- Leverage points or asymmetric opportunities
- Actionable takeaways

#### Study Notes Mode

Return:

- Section-by-section structured notes
- Key concept definitions
- Examples and analogies
- Important quotes
- Study questions (3–5)
- Flashcard pairs (term → definition) when applicable

---

### Step 6 — Format Output

Use the default output format unless the user requests otherwise:

```markdown
## Video Analysis

**URL:** [video URL]
**Title:** [title if available]
**Creator:** [channel or creator name]
**Duration:** [duration if available]
**Published:** [publish date if available]

### Summary

[Concise summary of the video.]

### Key Points

1. [Point one]
2. [Point two]
3. [Point three]

### Notable Moments

- `[timestamp]` — [what happens or is said]
- `[timestamp]` — [what happens or is said]

### Answer to Your Question

[Direct answer.]

### Strategic Notes

[Insights, critique, opportunities, or recommended next actions — when applicable.]

### Limitations

[List any gaps: no transcript available, audio only, frames not inspected, etc.]
```

---

### Step 7 — Save Output (Optional)

If the user is working on a business project, save the analysis to:

```text
factory/video-watch/{video-slug}-analysis.md
```

or alongside a client or prospect folder:

```text
clients/{slug}/video-analysis/{video-slug}.md
prospects/{niche}/{slug}/video-analysis/{video-slug}.md
```

---

## Error Handling

If the video cannot be processed, return:

```markdown
## Video Watch Failed

**Reason:** [clear explanation of what failed]

### What I Could Access

- Metadata: yes / no
- Transcript / Captions: yes / no
- Audio: yes / no
- Frames: yes / no

### Next Best Option

Please provide one of the following so I can complete the analysis:
- A transcript or captions file
- A downloaded audio clip
- Screenshots of key moments
- A different publicly accessible URL
```
