# SKILL: OPENMONTAGE VIDEO PRODUCTION ORCHESTRATOR

**Use this skill whenever:** producing full-lifecycle video content (research → script → compose → render). OpenMontage is the canonical agent orchestrator for multi-step video production with budget controls, quality gates, and multi-provider optimization.

---

## OPENMONTAGE ARCHITECTURE

```
VIDEO PRODUCTION ORCHESTRATION
├── Research Pipeline (Web-grounded scripting)
│   ├── YouTube transcript analysis
│   ├── Reddit/news/academic research
│   ├── Reference video analysis (TikTok, Reels, YouTube)
│   └── Script generation with sources cited
│
├── Tool Scoring Engine (Multi-provider evaluation)
│   ├── Video generation: Kling, Runway, Veo, HeyGen, local GPU
│   ├── Image generation: FLUX, Imagen, Recraft, free stock
│   ├── Audio: ElevenLabs, Google TTS, Piper, Suno
│   ├── Composition: Hyperframes (native), Remotion
│   └── Scoring: Cost, quality, control, reliability, latency
│
├── Production Governance (Quality gates)
│   ├── Slideshow-risk analysis (reject montage-only outputs)
│   ├── Pre-compose validation (content fit, timing, narrative)
│   ├── Budget tracking & approval gates
│   └── Post-render self-review
│
└── Platform-Specific Rendering
    ├── YouTube (landscape, 16:9)
    ├── Instagram/TikTok (vertical, 9:16)
    ├── LinkedIn (square, 1:1)
    └── Cinematic (2.39:1, premium formats)
```

---

## OPENMONTAGE + SYNTHIA INTEGRATION

OpenMontage provides the **production orchestration layer**. Synthia provides the **design governance layer**.

### Stack Integration

```
USER BRIEF
    ↓
BROWSER-HARNESS (Research + Reference Analysis)
    ↓ (Agent researches, captures examples)
OPENMONTAGE (Script generation + Tool scoring)
    ↓ (Agent selects best providers, estimates budget)
SYNTHIA DESIGN RULES (Validate palette, typography, motion)
    ↓
HYPERFRAMES VIDEO STUDIO (Compose + Render)
    ↓ (Synthia's native composition engine)
QUALITY GATES (UDEC 8.5 scoring)
    ↓
EXPORT (MP4/WebM/ProRes to platforms)
```

---

## SKILL INVOCATION

### Minimal: Auto-orchestrate

```
/produce-video "Create a 3-minute explainer on how AI video generation works.
Include real examples from YouTube, research from papers.
Platform: YouTube. Budget: $50. Quality: High."
```

Agent automatically:
1. Researches topic (browser-harness + web search)
2. Analyzes reference videos (TikTok, YouTube transcripts)
3. Generates script with sources
4. Scores video/image/audio providers
5. Estimates cost & timeline
6. Composes in Hyperframes (respecting Synthia rules)
7. Renders MP4
8. Self-reviews against UDEC 8.5

### Advanced: Step-by-step control

```
/research-video "explainer on diffusion models" \
  --sources youtube,arxiv,github \
  --depth deep \
  --output research-brief.md

/estimate-production research-brief.md \
  --budget $100 \
  --quality premium \
  --platforms youtube,instagram

/compose-video research-brief.md \
  --providers hyperframes \
  --style synthia-standard \
  --duration 3min

/render-video composition/ \
  --format mp4,webm \
  --quality high
```

---

## OPENMONTAGE PIPELINE TYPES (12 supported)

Agent selects based on brief:

| Type | Best For | Structure |
|------|----------|-----------|
| **Explainer** | How-to, educational, concepts | Problem → Explanation → Examples → CTA |
| **Talking Head** | Interviews, testimonials, commentary | B-roll + speaker over (can use HeyGen synthesis) |
| **Documentary** | Story-driven, narrative arcs | Scene → Scene → Scene with voiceover |
| **Animation** | Concepts, data viz, motion graphics | Animated sequences (Hyperframes native) |
| **Product Demo** | SaaS walkthrough, features | Feature 1 → Feature 2 → Results → CTA |
| **News/Updates** | Breaking news, announcements | Newscast style + B-roll montage |
| **Tutorial** | Step-by-step instruction | Screenshare + voiceover |
| **Case Study** | Results-driven storytelling | Challenge → Solution → Metrics |
| **Music Video** | Song + visuals | Scene sync to beat |
| **Social Reel** | 15-60s TikTok/Instagram | Hook → Payoff → CTA |
| **Montage** | Event coverage, highlights | Clips montage (B-roll only) |
| **Slideshow+** | Presentation with motion | Slides + animations (careful: gate against pure slideshows) |

---

## RESEARCH PIPELINE (BROWSER-HARNESS POWERED)

Agent uses browser-harness to research and capture reference material:

### Step 1: Web Research

```python
# Agent controls browser to gather sources
research = await agent.execute_research([
    "youtube:diffusion models explainer",
    "arxiv:diffusion models 2024",
    "reddit:r/MachineLearning diffusion",
    "github:stable-diffusion implementations",
])

# Returns: transcripts, URLs, thumbnails, key phrases
```

### Step 2: Reference Video Analysis

```python
# Agent analyzes existing YouTube/TikTok videos
reference = await agent.analyze_reference(
    urls=[
        "https://youtube.com/watch?v=...",  # Reference 1
        "https://tiktok.com/@.../video/...",  # Reference 2
    ]
)

# Returns: transcript, scene breakdown, pacing, visual style
```

### Step 3: Script Generation

```javascript
// Agent generates script based on research + references
const script = await openmontage.generateScript({
  topic: "How Diffusion Models Work",
  sources: research,
  references: reference,
  tone: "educational",
  length: "3 minutes",
  targetAudience: "AI enthusiasts",
  citeSource: true,  // Include source citations
});

// Output: Script with shot descriptions, timing, voiceover
```

---

## TOOL SCORING ENGINE

Agent evaluates providers for this specific production:

### Scoring Dimensions

```yaml
video_generation:
  - kling:        # Cost-effective, fast, diverse styles
      cost: $0.30/min
      quality: 8.5
      control: 8.0
      latency: 30s
      best_for: realistic, diverse scenes
  
  - runway:       # Premium quality, motion control
      cost: $0.50/min
      quality: 9.0
      control: 9.0
      latency: 60s
      best_for: cinematic, controlled motion
  
  - veo:          # Google, diverse, zero-cost (beta)
      cost: $0
      quality: 8.0
      control: 7.0
      latency: 90s
      best_for: diverse styles, budget-conscious
  
  - heygen:       # Talking head / avatar video
      cost: $0.10/min
      quality: 8.5
      control: 7.0
      latency: 30s
      best_for: voiceovers, presenters, avatars
  
  - local_gpu:    # Self-hosted, ComfyUI/WAN
      cost: $0 (compute)
      quality: 7.5
      control: 9.0
      latency: 120s
      best_for: unlimited usage, custom models

image_generation:
  - flux:         # Fast, cheap, diverse
      cost: $0.02/image
      quality: 9.0
      control: 8.5
      latency: 10s
  
  - recraft:      # Brand consistency, design-aware
      cost: $0.05/image
      quality: 8.5
      control: 9.0
      latency: 15s
  
  - free_stock:   # Archive.org, NASA, Wikimedia, Pexels
      cost: $0
      quality: 7.0
      control: 0
      latency: instant
      best_for: budget videos, documentaries

audio:
  - elevenlabs:   # Premium voices, natural
      cost: $0.30/min
      quality: 9.5
      latency: 5s
  
  - google_tts:   # Free, good quality
      cost: $0
      quality: 7.5
      latency: 3s
  
  - piper:        # Local, open-source, fast
      cost: $0
      quality: 7.0
      latency: 2s
  
  - suno:         # Music generation
      cost: $0.50/song
      quality: 8.5
      latency: 30s
```

**Agent algorithm:**
```python
selected_providers = await openmontage.score_providers(
    brief=production_brief,
    constraints={
        "max_budget": 150,  # $ total
        "quality_floor": 8.0,  # Out of 10
        "latency_max": 5*60,  # 5 minutes total
        "must_have_control": True,  # Designer control required
    }
)

# Returns ranked list with confidence scores
# Agent can override, but logs decision
```

---

## PRODUCTION GOVERNANCE GATES

### Gate 1: Slideshow Risk Analysis

```python
# Reject pure montage outputs (low production quality)
slideshow_risk = await openmontage.analyze_slideshow_risk(composition)

if slideshow_risk > 0.7:
    return {
        "status": "REJECTED",
        "reason": "Excessive static slides / montage-only output",
        "suggestion": "Add motion graphics, transitions, or talking head layer",
        "fix": "Use Hyperframes animations or HeyGen talking head"
    }
```

### Gate 2: Pre-Compose Validation

```python
# Validate script/content fit BEFORE rendering (saves time/money)
validation = await openmontage.validate_composition({
    "script_length": "180 seconds",  # Actual script duration
    "composition_duration": "185 seconds",  # Composition allows 185s
    "shot_fit": "Check scenes match script beats",
    "narrative_arc": "Opening hook within 3s?",
    "cta_present": "CTA in final 10 seconds?",
    "audio_balance": "Check VO peak levels",
})

if validation.errors:
    return validation.errors  # Fix before render
```

### Gate 3: Budget Tracking

```python
# Real-time cost tracking
budget_tracker = {
    "allocated": 150,  # $ user specified
    "video_generation": 45,  # Kling 3 min @ $0.30/min
    "image_generation": 12,  # 600 frames @ $0.02/image
    "audio_synthesis": 2,  # Google TTS (free)
    "composition": 0,  # Hyperframes (free)
    "total_estimated": 59,
    "remaining_budget": 91,  # Room for revisions
}

if budget_tracker["total_estimated"] > budget_tracker["allocated"]:
    # Agent must choose: reduce quality, fewer providers, or request budget increase
    return "BUDGET_EXCEEDED"
```

### Gate 4: Post-Render Self-Review

```python
# Agent auto-reviews final output against UDEC 8.5
review = await openmontage.self_review_video(render_output, {
    "udec_floor": 8.5,
    "check_axes": ["MOT", "ACC", "AUD", "CMP", "TYP", "CAP", "VIS", "TEC"],
    "video_path": "output/final-render.mp4",
})

if review.score < 8.5:
    return {
        "status": "REVISE",
        "score": review.score,
        "failing_axes": review.failed_axes,
        "suggestions": review.improvement_suggestions,
    }
```

---

## SYNTHIA RULE ENFORCEMENT IN OPENMONTAGE

Synthia design rules are **built into** OpenMontage agent skills:

### Typography Validation

```python
# Before composition, validate all fonts
fonts_used = extract_fonts_from_script_and_visuals(brief)

for font in fonts_used:
    if font in SYNTHIA_BANNED_FONTS:  # Inter, Roboto, Arial, etc.
        raise BannedFontError(f"{font} prohibited by Synthia doctrine")
```

### Color Palette Enforcement

```python
# Validate colors before image/video generation
colors = extract_colors_from_composition(composition)

synthia_palette = {
    "primary": "#c4963c",    # Gold
    "secondary": "#5a7a52",  # Sage
    "dark": "#0a1108",       # Deep
}

for color in colors:
    if color.is_purple or color.is_neon:
        raise ColorPaletteError(f"{color} violates Synthia doctrine")
```

### Motion Validation

```python
# Validate easing before generation
easing_used = extract_easing_from_composition(composition)

banned_easing = ["bounce.out", "elastic.out", "bounce.in", ...]

for easing in easing_used:
    if easing in banned_easing:
        raise MotionError(f"{easing} not permitted by Synthia")
```

---

## EXAMPLE WORKFLOW

### User Brief
```
"Create a 2-minute explainer on how Claude models work.
Include diagrams and talking head. Budget $75. YouTube format."
```

### Agent Execution Flow

**[1] RESEARCH (5 min)**
```bash
$ /research-video "how Claude models work" \
  --sources youtube,arxiv,official_docs \
  --record-references true
```
Agent (using browser-harness):
- Searches YouTube for Claude explanations
- Reads Anthropic docs
- Analyzes transcripts of reference videos
- Captures key visual moments
- Outputs: research-brief.md with sources cited

**[2] ESTIMATE (2 min)**
```bash
$ /estimate-production research-brief.md \
  --budget 75 \
  --quality high \
  --platforms youtube
```
OpenMontage:
- Analyzes script length (2 min = 120 seconds)
- Scores providers (Kling for diagrams, HeyGen for talking head, Google TTS)
- Estimates costs:
  - HeyGen talking head: $0.10/min × 2 = $0.20
  - Kling images: 50 frames × $0.30/frame = $15
  - Google TTS: $0 (free)
  - Hyperframes composition: $0 (free)
  - **Total: $15.20** (way under budget!)
- Returns: estimate.json with confidence scores

**[3] VALIDATE (1 min)**
```bash
$ /validate-production estimate.json research-brief.md
```
OpenMontage gates:
- ✓ Not a slideshow (has talking head + motion graphics)
- ✓ Content fits duration (120s script → 125s composition)
- ✓ Narrative arc strong (hook in 2s, CTA in final 10s)
- ✓ Audio levels balanced
- ✓ Synthia rules enforced (no banned fonts, correct palette)

**[4] COMPOSE (15 min)**
```bash
$ /compose-video research-brief.md \
  --providers hyperframes \
  --talking-head heygen \
  --diagrams kling \
  --music suno
```
Agent:
- Generates HeyGen talking head video (Avatar explains Claude models)
- Generates Kling diagrams (attention mechanism, training, inference)
- Composes in Hyperframes (Synthia's native engine)
- Adds Suno background music (educational tone)
- Returns: composition/index.html (ready to preview)

**[5] PREVIEW (5 min)**
```bash
$ npm run video:preview
# Open localhost:3000
# Watch composition
# Send feedback: "Speed up the talking head section, add more visual examples"
```

**[6] REVISE (3 min)**
Agent automatically:
- Adjusts talking head playback speed (1.1x)
- Adds more Kling diagram frames
- Re-composes in Hyperframes
- Returns updated preview

**[7] RENDER (5 min)**
```bash
$ npm run video:render --format mp4 --quality high
```
Hyperframes:
- Captures all frames with Puppeteer
- Encodes with FFmpeg (H.264, YouTube specs)
- Mixes audio (voiceover + music)
- Outputs: output/claude-explainer.mp4 (1.2 GB, 2 min)

**[8] SELF-REVIEW (1 min)**
OpenMontage auto-reviews:
- ✓ MOT (Motion): 8.7/10 (smooth transitions, intentional animations)
- ✓ ACC (Accessibility): 7.8/10 (captions added, but audio description optional)
- ✓ AUD (Audio): 8.9/10 (clear voiceover, music balanced)
- ✓ CMP (Composition): 8.6/10 (strong visual hierarchy)
- ✓ TYP (Typography): 8.9/10 (Suisse BP used, correct sizes)
- ✓ CAP (Color): 8.8/10 (Synthia palette throughout)
- ✓ VIS (Storytelling): 8.7/10 (strong narrative arc)
- ✓ TEC (Technical): 9.0/10 (clean render, no glitches)

**UDEC COMPOSITE: 8.83/10 ✓ PASS**

**[9] EXPORT**
```bash
$ /export-video output/claude-explainer.mp4 \
  --formats mp4,webm \
  --platforms youtube,twitter,linkedin
```
Agent:
- Generates YouTube format (1920×1080)
- Generates Twitter format (1080×1080)
- Generates LinkedIn square (1080×1080)
- Outputs all with correct metadata
- Logs production in studio memory

---

## COST ANALYSIS FOR THIS WORKFLOW

```
Budget allocated: $75
Actual spend: $15.20
Savings: $59.80

Breakdown:
- HeyGen (talking head): $0.20
- Kling (diagram generation): $15.00
- Google TTS (voiceover): $0
- Suno (music): $0 (sample)
- Hyperframes (composition): $0
- FFmpeg (render): $0
- Total: $15.20

Quality floor: 8.83/10 (exceeds UDEC 8.5 requirement)
```

---

## INTEGRATION WITH SYNTHIA AGENTS

OpenMontage skills are **taught to all Synthia agents** via:

1. **AGENT_ROLES.md** — Each of 12 agents learns OpenMontage orchestration
2. **Agent memory** — Every production logged (what worked, what didn't)
3. **Skill files** — `.claude/skills/openmontage-orchestrator.md` (agent-usable reference)
4. **Design doctrine** — Synthia rules enforced at every gate
5. **UDEC scoring** — Quality measured consistently (8.5 floor, no exceptions)

---

## QUICK COMMANDS

```bash
# Research + estimate (no cost)
/research-video "topic" --sources youtube,arxiv

# Full orchestration (auto all steps)
/produce-video "brief" --budget 100 --quality high

# Step-by-step (manual control)
/research-video "topic" -> /estimate -> /validate -> /compose -> /preview -> /render

# Export to platforms
/export-video file.mp4 --platforms youtube,instagram,tiktok
```

---

## REPLICATE & SEEDED DANCE 2.0 INTEGRATION

OpenMontage can use Replicate API for video/image generation:

```python
# In openmontage providers config
replicate_providers = {
    "video": [
        "stability-ai/stable-video-diffusion",
        "damo-vilab/text-to-video",
    ],
    "image": [
        "stability-ai/sdxl",
        "openai/dall-e-3",
    ],
}

# Seeded Dance 2.0 integration
seeded_video = await replicate.run(
    "seeded-dance/text-to-motion:2.0",
    input={
        "text": "A person dancing to electronic music",
        "seed": 42,  # Reproducible generation
        "quality": "high",
    }
)
```

This enables **deterministic, reproducible video generation** (same seed = same output).

---

## WHAT THIS GIVES SYNTHIA

✓ **Full-lifecycle video production** (research → render in one command)
✓ **Multi-provider optimization** (best tool for the job, lowest cost)
✓ **Production governance** (quality gates, budget control, self-review)
✓ **Synthia rule enforcement** (design doctrine applied automatically)
✓ **Zero-cost baseline** (free stock footage + local tools if budgetless)
✓ **Agent-orchestrated** (Claude Code runs the entire workflow)
✓ **Reproducible outputs** (seeded generation, logged decisions)
