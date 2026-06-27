# SKILL: BROWSER HARNESS — AGENT-CONTROLLED AUTOMATION

**Use this skill whenever:** agents need to research websites, capture reference material, interact with web services, automate workflows, or gather production data. Browser-harness is the canonical web automation layer for Synthia agents.

---

## BROWSER HARNESS ARCHITECTURE

```
AGENT → BROWSER HARNESS → CHROME DevTools Protocol (CDP) → BROWSER
         
Self-healing layer:
- Agent executes task
- Missing function? → Agent extends helpers.py mid-task
- Resume from checkpoint → No workflow interruption
- All decisions logged with alternatives considered
```

---

## CORE DESIGN PRINCIPLES

1. **Minimal constraints** (~592 lines Python) — Agent has maximum freedom
2. **Self-healing** — Agent can write missing functionality on the fly
3. **Direct control** — One websocket to Chrome, nothing between
4. **Domain skills** — Reusable patterns for specific websites
5. **Checkpoint-resumable** — Stop/start without losing state
6. **Confidence scoring** — Every decision logged with rationale

---

## AGENT API (What Agents Use)

### Basic Browser Control

```python
# Initialize browser connection
browser = await harness.connect_browser()

# Navigate to URL
await browser.navigate("https://example.com")

# Wait for element
await browser.wait_for_selector(".article-content", timeout=5000)

# Click element
await browser.click("button.primary")

# Type text
await browser.type("input[name='search']", "ai video generation")

# Get element text
text = await browser.get_text(".headline")

# Get all links on page
links = await browser.get_all("a[href]")

# Execute JavaScript
result = await browser.execute_script("""
  return document.querySelectorAll('.video-container').length;
""")

# Take screenshot
screenshot = await browser.screenshot()
```

### Research Patterns

```python
# Research topic across multiple sources
research = await harness.research({
    "topic": "how Claude models work",
    "sources": ["youtube", "arxiv", "github", "news"],
    "capture": ["transcripts", "summaries", "urls", "thumbnails"],
})

# Returns:
{
    "youtube": {
        "videos": [
            {
                "title": "Understanding Claude Models",
                "url": "https://youtube.com/watch?v=...",
                "transcript": "...",
                "duration": "12:34",
                "channel": "AI Explained",
            }
        ]
    },
    "arxiv": {
        "papers": [
            {
                "title": "Constitutional AI",
                "url": "https://arxiv.org/abs/...",
                "summary": "...",
                "authors": ["...", "..."],
            }
        ]
    },
    "github": [
        {
            "repo": "anthropics/anthropic-sdk",
            "url": "https://github.com/...",
            "stars": 12500,
            "description": "...",
        }
    ]
}
```

### Reference Video Analysis

```python
# Analyze existing videos for reference/inspiration
references = await harness.analyze_reference_videos([
    "https://youtube.com/watch?v=...",  # TikTok/YouTube URL
    "https://tiktok.com/@user/video/...",  # TikTok direct
])

# Returns:
{
    "videos": [
        {
            "url": "https://youtube.com/watch?v=...",
            "title": "How to Make a Video in 2024",
            "duration": "4:32",
            "transcript": "...",
            "scenes": [
                {
                    "timestamp": "0:00-0:15",
                    "description": "Hook: Person looking shocked",
                    "text_on_screen": "Do this ONE thing",
                    "background_music": "upbeat, electronic",
                },
                {
                    "timestamp": "0:15-1:30",
                    "description": "Feature demo walkthrough",
                    "pacing": "fast",
                }
            ],
            "visual_style": "bright, colorful, high-energy",
            "audio_style": "modern, trendy background music + voiceover",
            "cta": "Subscribe and follow for more",
        }
    ]
}
```

### Domain Skills (Reusable Patterns)

```python
# LinkedIn-specific skill (scrape job posting)
linkedin_job = await harness.domain_skill("linkedin", {
    "action": "scrape_job",
    "url": "https://linkedin.com/jobs/view/...",
    "capture": ["title", "company", "description", "requirements", "salary_range"],
})

# GitHub-specific skill (analyze repository)
github_repo = await harness.domain_skill("github", {
    "action": "analyze_repo",
    "url": "https://github.com/user/repo",
    "capture": ["readme", "license", "stars", "forks", "recent_commits", "languages"],
})

# YouTube-specific skill (extract metadata)
youtube_video = await harness.domain_skill("youtube", {
    "action": "extract_video",
    "url": "https://youtube.com/watch?v=...",
    "capture": ["title", "transcript", "duration", "description", "comments", "engagement"],
})
```

### Self-Healing / Dynamic Extension

When agent needs a function that doesn't exist:

```python
# Agent realizes helpers.py lacks a function
# Agent writes the missing code directly
await harness.extend_helpers("""
async def get_all_product_prices(selector):
    '''Get prices from all products on page'''
    prices = []
    products = await browser.get_all(selector)
    for product in products:
        price = await product.get_text(".price")
        prices.append(float(price.replace('$', '')))
    return prices
""")

# Then immediately use it
prices = await harness.get_all_product_prices(".product-card")
```

### Checkpoints & Resumable State

```python
# Save state before risky operation
checkpoint = await harness.save_checkpoint("before_form_submission")

# Do work
await browser.click("button.submit")

# If fails:
await harness.restore_checkpoint("before_form_submission")
# Try different approach

# Get checkpoint history
history = await harness.get_checkpoint_history()
# Returns: ["started", "navigated_to_url", "found_search_box", "before_form_submission"]
```

---

## BROWSER HARNESS FOR SYNTHIA AGENTS

### Use Case 1: Research Phase (OpenMontage)

Agent uses browser-harness to gather production research:

```python
# Agent researches topic for video script
research_data = await harness.research({
    "topic": "How AI models are trained",
    "sources": ["youtube", "arxiv", "hacker_news", "reddit"],
    "depth": "deep",
})

# Returns: Transcripts, papers, discussions with sources
# → Feeds into OpenMontage script generation
```

### Use Case 2: Reference Analysis

Agent captures reference videos to learn from:

```python
# Agent analyzes existing successful videos
references = await harness.analyze_reference_videos([
    "https://youtube.com/watch?v=xyz",  # Top performing explainer
    "https://tiktok.com/@account/video/abc",  # Trendy short-form
])

# Returns: Scene breakdown, pacing, visual style, audio style
# → Informs composition decisions in Synthia video studio
```

### Use Case 3: Data Scraping for Visuals

Agent gathers images/data for video content:

```python
# Agent scrapes product images for demo video
products = await harness.domain_skill("shopify", {
    "action": "scrape_products",
    "store_url": "https://store.example.com",
    "capture": ["images", "descriptions", "prices", "reviews"],
})

# Returns: Product images, specs
# → Used in Hyperframes composition
```

### Use Case 4: Automation Workflow

Agent automates complex workflows (e.g., social media posting):

```python
# After video renders, agent uploads to platforms
await harness.domain_skill("youtube", {
    "action": "upload_video",
    "file": "output/my-video.mp4",
    "title": "My Awesome Video",
    "description": "Watch this amazing video",
    "tags": ["ai", "video", "tutorial"],
    "visibility": "public",
})

# Returns: Upload status, video URL
```

### Use Case 5: Live Data Gathering

Agent monitors website for changes/updates:

```python
# Agent checks website for updated pricing
pricing_data = await harness.monitor({
    "url": "https://example.com/pricing",
    "selector": ".price",
    "interval": "hourly",
    "duration": "7 days",
    "log_changes": True,
})

# Returns: Historical pricing data with timestamps
```

---

## ARCHITECTURE: AGENT'S PERSPECTIVE

```
AGENT (Claude in Claude Code)
  │
  ├─→ Task: "Research how neural networks work, capture YouTube reference"
  │
  └─→ Browser Harness
        │
        ├─ Step 1: Navigate to YouTube
        ├─ Step 2: Search "neural networks explained"
        ├─ Step 3: Click top result
        ├─ Step 4: Extract transcript
        ├─ Step 5: Take screenshot at key moments
        ├─ Step 6: Get video metadata (duration, channel, engagement)
        │
        └─ Return: research_data.json
              {
                "transcript": "...",
                "key_frames": ["url1", "url2", ...],
                "metadata": {...},
                "sources": [...]
              }

AGENT uses research_data → feeds into OpenMontage script generation
                        → composes with Hyperframes
                        → renders with video studio
```

---

## REMOTE BROWSER ACCESS

Browser-harness can use free remote browsers:

```python
# Connect to cloud.browser-use.com (free tier: 3 concurrent)
browser = await harness.connect_browser(
    remote=True,
    provider="cloud.browser-use.com",
)

# Automatically creates CDP tunnel
# No local Chrome required
# Perfect for CI/CD, long-running jobs, parallel research
```

---

## INTEGRATION WITH SYNTHIA STACK

Browser-harness feeds data into OpenMontage → Hyperframes → Video Studio:

```
USER BRIEF
  ↓
BROWSER-HARNESS (Agent researches)
  ├─ YouTube transcripts
  ├─ Reference video analysis
  ├─ Product images/data
  └─ Research sources
  ↓
OPENMONTAGE (Scores + generates script)
  ├─ Selects video/audio/image providers
  ├─ Estimates cost
  └─ Validates against Synthia rules
  ↓
HYPERFRAMES (Composes video)
  ├─ Arranges clips + text + audio
  └─ Applies animations/effects
  ↓
SYNTHIA VIDEO STUDIO (Renders)
  ├─ Captures frames
  ├─ Encodes video
  └─ Exports to formats
  ↓
QUALITY GATES (UDEC 8.5)
  ↓
PLATFORM EXPORT (YouTube, TikTok, Instagram, etc.)
```

---

## EXAMPLE: FULL WORKFLOW WITH BROWSER-HARNESS

**User brief:** "Create a 3-minute video explaining how Claude AI works"

**Agent execution:**

```python
# [1] RESEARCH using browser-harness
research = await harness.research({
    "topic": "how Claude AI models work",
    "sources": ["youtube", "anthropic.com", "arxiv", "github", "hn"],
})
# Returns: YouTube transcripts, Anthropic docs, papers, discussions

# [2] ANALYZE reference videos
references = await harness.analyze_reference_videos([
    "https://youtube.com/watch?v=popular_explainer",
    "https://youtube.com/watch?v=trending_ai_video",
])
# Returns: Scene breakdowns, visual styles, pacing

# [3] SEARCH for diagram resources
diagrams = await harness.domain_skill("github", {
    "action": "search",
    "query": "transformer attention mechanism visualization",
    "capture": ["images", "descriptions", "repos"],
})
# Returns: Open-source diagrams available for use

# [4] Feed into OpenMontage
script = await openmontage.generate_script({
    "research": research,
    "references": references,
    "tone": "educational",
    "length": "3 minutes",
    "citeSource": True,
})
# Returns: Full script with shots, timing, voiceover

# [5] Estimate production
estimate = await openmontage.estimate_production(script, {
    "quality": "high",
    "budget": 100,
})
# Returns: Provider recommendations + cost breakdown

# [6] Compose in Hyperframes
composition = await synthia.compose_video({
    "script": script,
    "estimate": estimate,
    "providers": {
        "video": "kling",
        "images": "flux",
        "audio": "google_tts",
        "music": "suno",
    },
})
# Returns: composition/index.html (ready to preview)

# [7] Preview + iterate
await synthia.preview(composition)
# Agent watches, adjusts timing/text if needed

# [8] Render
output = await synthia.render(composition, {
    "format": "mp4",
    "quality": "high",
})
# Returns: output/claude-explainer.mp4 (ready for platforms)

# [9] UPLOAD to YouTube (using browser-harness)
await harness.domain_skill("youtube", {
    "action": "upload_video",
    "file": output.path,
    "title": "How Claude AI Works",
    "description": research.summary + "Sources: [list]",
    "tags": ["ai", "claude", "explainer"],
})
# Returns: YouTube video URL
```

---

## SYNTHIA RULE ENFORCEMENT

Browser-harness includes Synthia design doctrine:

```python
# When scraping images/colors from web, validate against Synthia rules
colors_scraped = await harness.extract_colors(webpage)

for color in colors_scraped:
    if color.is_synthia_compliant():
        # Use in video
        pass
    else:
        # Warn agent: purple detected, replace with sage/gold
        await agent.warn(f"Color {color} not Synthia-compliant. Use #5a7a52 instead.")
```

---

## DOMAIN SKILLS (Agent-Extensible)

Agent can add domain skills for frequently-used websites:

```python
# Create skill file: .claude/domain-skills/linkedin.md
# Agent uses it in future tasks

# Example: LinkedIn skill
linkedin_skill = """
# LinkedIn Domain Skill

## Actions
- scrape_job: Extract job posting data
- get_company_info: Retrieve company details
- search_posts: Find posts by keyword
- extract_conversation: Get discussion threads

## Usage
await harness.domain_skill("linkedin", {
    "action": "scrape_job",
    "url": "...",
})
"""
```

---

## QUICK COMMANDS

```bash
# Research topic
/research-topic "neural networks" --sources youtube,arxiv,github

# Analyze reference videos
/analyze-references \
  "https://youtube.com/watch?v=..." \
  "https://tiktok.com/@.../video/..."

# Scrape website
/scrape-website "https://example.com" --selector ".product-card" --capture text,href,image

# Monitor for changes
/monitor-website "https://example.com/pricing" --interval hourly

# Extend helpers with custom function
/add-helper "get_all_product_prices(selector) -> prices"

# Restore from checkpoint
/restore-checkpoint "before_form_submission"

# Execute domain skill
/domain-skill youtube analyze_video "url"
```

---

## WHAT THIS GIVES AGENTS

✓ **Web research** (YouTube transcripts, papers, discussions)
✓ **Reference analysis** (Learn from existing videos)
✓ **Data scraping** (Product images, prices, specs)
✓ **Workflow automation** (Post to social, fill forms, monitor)
✓ **Self-healing** (Agent extends helpers on the fly)
✓ **Checkpoints** (Stop/resume without losing progress)
✓ **Remote browsers** (No local Chrome required)
✓ **Domain skills** (Reusable patterns for specific sites)
✓ **Logging & transparency** (Every decision recorded)

---

## INTEGRATION WITH CLAUDE CODE

Agents in Claude Code use browser-harness as standard tool:

```markdown
# Synthia Agent Skills

## Available Skills
- `/research-video` — Browser-harness research
- `/compose-video` — OpenMontage orchestration
- `/render-video` — Hyperframes rendering
- `/preview-video` — Live preview
- `/export-video` — Platform export

## Default Behavior
When agent needs to:
1. **Research** → Use browser-harness
2. **Script** → Use OpenMontage
3. **Compose** → Use Hyperframes
4. **Review** → Use UDEC 8.5 gates
5. **Deliver** → Use export workflow
```

---

## FREE TOOLS USED

- **Browser-harness**: Open-source, Python ~592 lines
- **Chrome DevTools Protocol**: Native, no dependencies
- **Piper TTS**: Free, local, open-source
- **FFmpeg**: Free, open-source
- **Hyperframes**: Synthia native
- **Free cloud browsers**: cloud.browser-use.com (3 concurrent free)

**Zero-cost production pipeline** if using free tiers of research + generation services.
