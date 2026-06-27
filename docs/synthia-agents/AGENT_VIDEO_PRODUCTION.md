# AGENT VIDEO PRODUCTION SYSTEM — Complete AI Design + Video Studio

## What This Is

**Synthia Video Production System** = AI agents that automatically orchestrate complete video workflows from research to delivery, respecting Synthia design doctrine throughout.

**Canonical workflow:**
```
USER BRIEF
  ↓ (Agent reads brief)
BROWSER-HARNESS (Research)
  ├─ YouTube transcripts
  ├─ Reference videos
  ├─ Product images
  └─ Web data
  ↓
OPENMONTAGE (Orchestrate)
  ├─ Generate script
  ├─ Score providers
  ├─ Estimate cost
  └─ Validate gates
  ↓
HYPERFRAMES (Compose)
  ├─ Arrange clips
  ├─ Add text/animations
  └─ Apply effects
  ↓
SYNTHIA VIDEO STUDIO (Render)
  ├─ Capture frames
  ├─ Encode video
  └─ Mix audio
  ↓
QUALITY GATES (UDEC 8.5)
  ├─ Validate design rules
  ├─ Score on 8 axes
  └─ Approve or revise
  ↓
EXPORT (Platforms)
  ├─ YouTube
  ├─ TikTok
  ├─ Instagram
  └─ LinkedIn
```

---

## AGENT ROLES & RESPONSIBILITIES

### 1. **RESEARCHER AGENT**
**Tool:** Browser-harness
**Job:** Gather production data without rendering

```python
async def research_topic(brief: ProductionBrief) -> ResearchOutput:
    """Gather all source material for video production"""
    
    research = await browser_harness.research({
        "topic": brief.topic,
        "sources": ["youtube", "arxiv", "github", "news", "reddit"],
        "capture": ["transcripts", "summaries", "urls", "images", "timestamps"],
    })
    
    # Returns: Transcripts, papers, discussions, visual references
    return research
```

**Responsibilities:**
- Search YouTube for relevant content
- Extract transcripts + metadata
- Analyze academic papers
- Gather news/Reddit discussions
- Capture reference videos
- Cite all sources

**Output:** `research-brief.md` with full citations and key findings

---

### 2. **SCRIPTWRITER AGENT**
**Tool:** OpenMontage Script Generator
**Job:** Write script based on research, respecting Synthia design rules

```python
async def generate_script(research: ResearchOutput) -> Script:
    """Generate production-ready script from research"""
    
    script = await openmontage.generate_script({
        "research": research,
        "tone": "educational",  # or marketing, narrative, etc.
        "length": "3 minutes",
        "citeSource": True,
        "validate_synthia_rules": True,  # Typography, color, motion rules
    })
    
    # Returns: Script with shot descriptions, timing, voiceover
    return script
```

**Responsibilities:**
- Generate script from research
- Write shot descriptions
- Plan transitions
- Write voiceover narration
- Add speaker cues
- Validate against Synthia design rules

**Output:** `script.md` with timing, visual directions, audio cues

---

### 3. **PRODUCER AGENT**
**Tool:** OpenMontage Tool Scorer
**Job:** Estimate cost and score optimal provider combinations

```python
async def estimate_production(script: Script, budget: float) -> Estimate:
    """Score providers and estimate production cost"""
    
    estimate = await openmontage.estimate_production({
        "script": script,
        "budget": budget,
        "quality_floor": 8.0,  # UDEC minimum
        "optimize_for": "cost",  # or quality, latency
    })
    
    # Returns: Best provider combination + cost breakdown
    return estimate
```

**Responsibilities:**
- Score video generation providers (Kling, Runway, Veo, HeyGen)
- Score image providers (FLUX, Recraft, free stock)
- Score audio providers (ElevenLabs, Google TTS, Piper, Suno)
- Calculate total cost
- Validate against budget
- Recommend alternatives if over budget
- Log decision rationale

**Output:** `estimate.json` with provider rankings + cost breakdown

---

### 4. **COMPOSER AGENT**
**Tool:** Hyperframes + Synthia Video Studio
**Job:** Assemble video composition from providers and script

```python
async def compose_video(script: Script, estimate: Estimate) -> Composition:
    """Compose video using Hyperframes respecting Synthia rules"""
    
    composition = await synthia.compose_video({
        "script": script,
        "providers": estimate.selected_providers,
        "template": "auto",  # Or specific template
        "validate": True,  # Enforce Synthia design rules
    })
    
    # Returns: HTML composition ready to render
    return composition
```

**Responsibilities:**
- Select appropriate Hyperframes template
- Generate video clips from providers
- Arrange timeline
- Add text overlays (validate typography)
- Apply animations (validate easing)
- Add background music
- Mix audio levels
- Generate captions
- Validate entire composition against Synthia rules

**Output:** `composition/index.html` (ready for preview)

---

### 5. **QUALITY ASSURANCE AGENT**
**Tool:** UDEC Scorer + Synthia Design Gates
**Job:** Validate composition before render (saves time/money)

```python
async def validate_composition(composition: Composition) -> ValidationResult:
    """Validate composition before expensive render"""
    
    validation = await synthia.validate_composition({
        "composition": composition,
        "checks": [
            "slideshow_risk",  # Reject pure montage
            "content_fit",  # Script length vs duration
            "narrative_arc",  # Hook in 1s? CTA in final 10s?
            "audio_balance",  # VO/BG levels correct?
            "synthia_rules",  # Typography, colors, motion
        ],
    })
    
    return validation
```

**Responsibilities:**
- Check for slideshow-only output (low quality)
- Validate script duration vs composition length
- Check narrative arc (hook, build, CTA)
- Validate audio levels (no clipping)
- Check typography (no banned fonts)
- Validate color palette (no purple/neon)
- Check motion easing (no bounce/elastic)
- Verify captions present
- Validate contrast ratios (WCAG 2.1)

**Output:** Validation report with approved/rejected status

---

### 6. **RENDERER AGENT**
**Tool:** Hyperframes Rendering Engine
**Job:** Capture frames and encode video

```python
async def render_video(composition: Composition) -> VideoOutput:
    """Render composition to video file"""
    
    video = await synthia.render({
        "composition": composition,
        "formats": ["mp4", "webm"],  # Can add "mov" for editing
        "quality": "high",
        "fps": 30,
    })
    
    # Returns: Video files ready for delivery
    return video
```

**Responsibilities:**
- Capture all frames with Puppeteer
- Encode with FFmpeg (H.264 codec)
- Mix audio tracks properly
- Validate output file integrity
- Log render time and file size
- Generate multiple formats

**Output:** `output/video.mp4`, `output/video.webm`

---

### 7. **REVIEWER AGENT**
**Tool:** UDEC Auto-Scorer
**Job:** Review final video against UDEC 8.5 standard

```python
async def self_review_video(video_path: str) -> UDECScore:
    """Auto-review video for quality (UDEC 8.5 floor)"""
    
    review = await openmontage.self_review_video({
        "video_path": video_path,
        "check_axes": ["MOT", "ACC", "AUD", "CMP", "TYP", "CAP", "VIS", "TEC"],
    })
    
    if review.score < 8.5:
        return {
            "status": "REVISE",
            "score": review.score,
            "failing_axes": review.failed_axes,
            "suggestions": review.improvement_suggestions,
        }
    
    return {"status": "APPROVED", "score": review.score}
```

**Responsibilities:**
- Score MOT (Motion) — Smooth animations, intentionality
- Score ACC (Accessibility) — Captions, contrast, audio description
- Score AUD (Audio) — Clarity, balance, sync
- Score CMP (Composition) — Visual hierarchy, focus
- Score TYP (Typography) — Readability, compliance
- Score CAP (Color Palette) — Brand consistency
- Score VIS (Visual Storytelling) — Narrative, CTA strength
- Score TEC (Technical) — Render quality, glitches
- Report failing axes with improvement suggestions

**Output:** UDEC score report with pass/fail determination

---

### 8. **DELIVERY AGENT**
**Tool:** Browser-harness + Platform APIs
**Job:** Upload and distribute video to platforms

```python
async def export_video(video_path: str, platforms: List[str]) -> ExportResult:
    """Export video to multiple platforms"""
    
    exports = {}
    
    for platform in platforms:
        export = await harness.domain_skill(platform, {
            "action": "upload_video",
            "file": video_path,
            "title": "...",
            "description": "...",
            "tags": [...],
        })
        exports[platform] = export
    
    return exports
```

**Responsibilities:**
- Convert to platform-specific formats (YouTube, Instagram, TikTok)
- Write platform-optimized metadata
- Upload to YouTube, TikTok, Instagram, LinkedIn
- Schedule posts (optional)
- Monitor initial performance
- Log all delivery details

**Output:** Platform URLs, upload confirmations, performance metrics

---

## AGENT ORCHESTRATION FLOW

When user provides brief, here's how agents collaborate:

```
USER: "Create 2-minute explainer on AI. Budget $50. YouTube format."
  ↓
RESEARCHER: Search YouTube, papers, Reddit for AI content
  → research-brief.md
  ↓
SCRIPTWRITER: Write script from research, verify Synthia rules
  → script.md
  ↓
PRODUCER: Score providers, estimate cost ($15 < $50 ✓)
  → estimate.json
  ↓
COMPOSER: Assemble video in Hyperframes
  → composition/index.html
  ↓
QA: Validate before render (check slideshow risk, narrative, audio)
  → validation-report.md
  ↓
RENDERER: Encode to MP4/WebM
  → output/video.mp4
  ↓
REVIEWER: Score UDEC (8.9/10 > 8.5 ✓)
  → udec-report.md
  ↓
DELIVERY: Upload to YouTube with optimized metadata
  → https://youtube.com/watch?v=xyz
```

---

## AGENT SKILL INHERITANCE

All agents inherit these core skills:

```markdown
# Synthia Core Agent Skills

## Always Available
- `/research-video` — Browser-harness research (any agent)
- `/compose-video` — OpenMontage orchestration (any agent)
- `/render-video` — Hyperframes rendering (any agent)
- `/preview-video` — Live preview (any agent)
- `/validate-video` — Pre-render validation (any agent)
- `/score-udec` — UDEC 8.5 evaluation (any agent)
- `/export-video` — Platform delivery (any agent)

## Specialized Skills (By Agent Role)
- Researcher: `/research-topic`, `/analyze-references`, `/domain-skill`
- Scriptwriter: `/generate-script`, `/validate-script`, `/estimate-script-length`
- Producer: `/estimate-production`, `/score-providers`, `/budget-analysis`
- Composer: `/compose-video`, `/select-template`, `/validate-composition`
- QA: `/validate-composition`, `/check-design-rules`, `/slideshow-risk`
- Renderer: `/render-video`, `/encode-formats`, `/validate-output`
- Reviewer: `/score-udec`, `/auto-review`, `/improvement-suggestions`
- Delivery: `/export-video`, `/upload-platform`, `/schedule-post`
```

---

## DEFAULT BEHAVIOR (CLAUDE CODE)

When user interacts with Synthia in Claude Code:

### Prompt: "Create a video"
```
AGENT RESPONSE:
1. Parse brief (topic, duration, budget, platform)
2. Auto-select agents (Researcher → Scriptwriter → Producer → Composer → QA → Renderer → Reviewer → Delivery)
3. Execute pipeline with checkpoints
4. Log every decision, alternative considered, confidence score
5. Return: Final video URL + production report
```

### Prompt: "Make it faster/better/cheaper"
```
AGENT RESPONSE:
1. Identify which phase to optimize (research, script, providers, render)
2. Auto-select best option for requested improvement
3. Re-run affected agents only (checkpoint-resumable)
4. Compare before/after (cost, quality, time)
5. Return: Updated video + comparison report
```

### Prompt: "I don't like the voiceover"
```
AGENT RESPONSE:
1. Restore checkpoint before voiceover generation
2. Alternative: Switch TTS provider (Google → ElevenLabs) or style (narrated → musical)
3. Re-compose with new voiceover
4. Compare quality/cost
5. Return: New version for approval
```

---

## EXAMPLE FULL WORKFLOW

**User:** "I want a 60-second TikTok video about how neural networks work. Budget $30."

**Agent execution (automated):**

```
[1] RESEARCHER AGENT (5 min)
---
Research topic: "neural networks explained"
Sources: YouTube explainers, 3Blue1Brown, MIT courses, arXiv papers
Capture: 3 video transcripts, 5 key papers, 200 relevant clips
Output: research-brief.md (10 pages with sources)

[2] SCRIPTWRITER AGENT (3 min)
---
Generate script: "Hook (3s) → Concept (15s) → Examples (25s) → CTA (17s)"
Validate: No Inter/Roboto fonts, no purple, power3.out easing ✓
Output: script.md (detailed shot-by-shot breakdown)

[3] PRODUCER AGENT (2 min)
---
Score providers:
  - Video: Kling (8-min cost: $2.40)
  - Images: FLUX free (open-source)
  - Audio: Google TTS (free) + Suno music (free tier)
  - Total: ~$5 < $30 budget ✓
Output: estimate.json (confident, good quality, cheap)

[4] COMPOSER AGENT (8 min)
---
Compose in Hyperframes:
  - Kling video (30s of animated network concepts)
  - FLUX images (key concepts)
  - Google TTS voiceover (clear, educational)
  - Suno music (electronic, modern)
  - Text overlays (Suisse BP font, gold #c4963c color)
  - Transitions (power3.out easing, 0.5s min)
  - Captions (auto-generated, QA'd)
Output: composition/index.html (ready to preview)

[5] QA AGENT (2 min)
---
Validate:
  ✓ Not slideshow (has animations, voiceover)
  ✓ Content fits 60s (script is 58s)
  ✓ Hook in 1s (3s opening hook)
  ✓ CTA present (final 17s "Subscribe for more")
  ✓ Audio balanced (VO 0.95, music 0.5)
  ✓ Synthia rules (fonts, colors, motion verified)
Output: validation-report.md (APPROVED FOR RENDER)

[6] RENDERER AGENT (4 min)
---
Render:
  - Capture 1800 frames (60s × 30fps)
  - Encode H.264 (MP4)
  - Encode VP9 (WebM for web)
  - Mix audio (VO + music)
Output: output/video.mp4 (3.2 MB), output/video.webm (1.8 MB)

[7] REVIEWER AGENT (1 min)
---
UDEC 8.5 Scoring:
  - MOT (Motion): 8.8 (smooth, intentional animations)
  - ACC (Accessibility): 8.2 (captions present, audio description optional)
  - AUD (Audio): 8.9 (clear VO, music balanced)
  - CMP (Composition): 8.7 (strong visual hierarchy)
  - TYP (Typography): 9.0 (Suisse BP, correct sizing)
  - CAP (Color): 8.9 (Synthia palette throughout)
  - VIS (Visual): 8.6 (strong narrative arc, clear CTA)
  - TEC (Technical): 9.0 (clean render, no glitches)
COMPOSITE: 8.81/10 ✓ APPROVED

[8] DELIVERY AGENT (3 min)
---
Export to TikTok:
  - Convert to 1080×1920 (TikTok vertical)
  - Write title: "How Neural Networks Work in 60 Seconds"
  - Write description with sources
  - Add hashtags: #ai #neural #networks #tutorial
  - Upload to TikTok
Output: https://tiktok.com/@account/video/xyz (live!)

TOTAL TIME: 28 minutes (fully automated)
TOTAL COST: $5
QUALITY: 8.81/10 (exceeds 8.5 floor)
```

---

## AGENT CONFIGURATION

Agents are defined in `.claude/agents/` with roles + capabilities:

```markdown
# .claude/agents/researcher-agent.md
**Role:** Video Research & Reference Analysis
**Tools:** Browser-harness, web search, YouTube API
**Responsible for:** Gathering all source material
**Outputs:** research-brief.md with full citations
**Cost:** FREE (no API calls required)

# .claude/agents/scriptwriter-agent.md
**Role:** Script Generation & Validation
**Tools:** OpenMontage, Synthia design rules
**Responsible for:** Writing production-ready scripts
**Outputs:** script.md with timing and shot descriptions
**Cost:** FREE (no API calls)

... (similar for Producer, Composer, QA, Renderer, Reviewer, Delivery)
```

---

## AGENT MEMORY & LEARNING

Agents record every production for future improvement:

```yaml
studio/video/memory/
├── 2026-04-19-neural-networks-tiktok.yaml
│   ├── brief: {...}
│   ├── research: {...}
│   ├── script: {...}
│   ├── estimate: {...}
│   ├── composition: {...}
│   ├── validation: {...}
│   ├── render: {...}
│   ├── review: {...}
│   ├── delivery: {...}
│   └── feedback:
│       ├── what_worked: [...] 
│       ├── what_failed: [...]
│       └── improvements_next_time: [...]
└── ... (other productions)
```

Agents query memory for:
- "Which providers worked best for explainers?"
- "What script length performs best on TikTok?"
- "How much did similar productions cost?"
- "Which composition templates get highest UDEC scores?"

---

## TRAINING NEW AGENTS

To add new agent role:

1. **Create agent definition** (`.claude/agents/[role]-agent.md`)
2. **Define responsibilities** (What this agent does)
3. **List available tools** (Browser-harness, OpenMontage, Hyperframes, etc.)
4. **Set output format** (What it produces)
5. **Integrate into pipeline** (Where in the workflow)
6. **Log decisions** (What alternatives were considered)

---

## QUALITY ASSURANCE

Every production is logged with:
- ✓ UDEC 8.5 score (minimum)
- ✓ Agent decisions & confidence scores
- ✓ Budget tracking
- ✓ Timeline
- ✓ Alternatives considered (why chosen, why rejected)
- ✓ Production metadata (platforms, formats, engagement)

**Nothing ships below UDEC 8.5. Ever.**

---

## WHAT AGENTS CAN NOW DO

✓ Research any topic (YouTube, papers, news, Reddit)
✓ Generate production-ready scripts
✓ Score & select optimal providers
✓ Compose videos respecting design rules
✓ Validate before render (saves time/money)
✓ Render to multiple formats
✓ Auto-review against UDEC 8.5
✓ Upload to platforms
✓ Learn from every production
✓ Suggest improvements
✓ Handle revisions checkpoint-to-checkpoint

---

## INVOCATION FROM CLAUDE CODE

Users interact with agents through Claude Code:

```
/produce-video "Create a TikTok about neural networks, budget $30"
  → Auto-orchestrates all 8 agents
  → 30 min later: Video on TikTok
  → Full production report logged
```

Or step-by-step:

```
/research-video "neural networks"
/analyze-references "https://youtube.com/..."
/generate-script "research-brief.md"
/estimate-production "script.md" --budget 30
/compose-video "script.md" --providers auto
/preview-video "composition/"
/render-video "composition/" --format mp4,webm
/score-udec "output/video.mp4"
/export-video "output/video.mp4" --platforms tiktok,youtube
```

---

**Every agent follows Synthia doctrine. Every production logged. Every decision transparent. UDEC 8.5 floor, no exceptions.**
