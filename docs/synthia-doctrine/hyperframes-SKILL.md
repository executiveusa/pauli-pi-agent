# SKILL: HYPERFRAMES VIDEO STUDIO — SYNTHIA VIDEO ENGINE

**Use this skill whenever:** producing UGC videos, ad compositions, design showcases, animated case studies, product demos, social content, or any timeline-driven video. Hyperframes is the canonical video runtime for Cynthia.

---

## THE HYPERFRAMES STACK (production-grade video)

```
1. HTML Composition — data-attribute timeline markup
2. GSAP Animation — keyframe timelines with easing
3. Audio Mixing — FFmpeg-native audio tracks + TTS synthesis
4. Effects Pipeline — Shader transitions, color grading, cinematic filters
5. Deterministic Rendering — Puppeteer capture → FFmpeg encode (bit-identical output)
6. Agent Skills — Claude-native video composition from natural language
```

---

## COMPOSITION FUNDAMENTALS

### The Stage Container

```html
<div id="stage" 
  data-composition-id="ugc-product-demo-v1"
  data-width="1080"
  data-height="1920"
  data-frame-rate="30"
  data-duration="15">
  <!-- All assets live here -->
</div>
```

**Required attributes:**
- `data-width` / `data-height` — Resolution (standard: 1080×1920 vertical, 1920×1080 landscape)
- `data-frame-rate` — FPS (30 = cinematic, 60 = smooth)
- `data-duration` — Total length in seconds

---

## ASSET TIMELINE MODEL

### Video Tracks (Layered)

```html
<video 
  src="assets/product-b-roll.mp4"
  data-start="0"
  data-duration="5"
  data-track-index="0"
  data-scale="1.2"
  data-opacity="0.8"
  data-mute="true"
/>

<video 
  src="assets/user-testimonial.mp4"
  data-start="2"
  data-duration="3"
  data-track-index="1"
  data-scale="1"
  data-position-x="50"
  data-position-y="200"
/>
```

**Track rules:**
- `data-track-index="0"` = bottom (farthest)
- Higher indices layer on top
- UI elements (text, buttons) should use highest index
- `data-start` = seconds from video beginning
- `data-duration` = how long this asset appears

### Image Overlays

```html
<img 
  src="assets/cta-button.png"
  data-start="8"
  data-duration="3"
  data-track-index="2"
  data-animation="fade-in"
  data-animation-duration="0.5"
/>
```

### Text Layers

```html
<h1 class="video-title"
  data-start="0.5"
  data-duration="4"
  data-track-index="3"
  data-text-animation="word-reveal">
  Your Product Changes Everything
</h1>

<p class="video-subtitle"
  data-start="1"
  data-duration="3.5"
  data-track-index="3"
  data-text-animation="fade-in">
  See how 10,000+ teams ship faster
</p>
```

---

## ANIMATION ARCHITECTURE (GSAP + DATA ATTRIBUTES)

### Timeline Scrubbing (Scroll-Driven)

```javascript
const timeline = gsap.timeline();

// Fade in product video from 0s to 0.5s
timeline.from('#product-video', {
  opacity: 0,
  duration: 0.5,
}, '0');

// Reveal headline at 0.5s, over 1s
timeline.from('.headline', {
  opacity: 0,
  yPercent: 20,
  duration: 1,
}, '0.5');

// Text color shift from 2s to 4s (scrubbed to timeline)
timeline.to('.headline', {
  color: '#c4963c', // Cynthia gold
  duration: 2,
}, '2');

// Exit all at 8s
timeline.to(['#product-video', '.headline'], {
  opacity: 0,
  duration: 0.5,
}, '8');
```

**Rules:**
- All timing must be absolute (seconds from video start)
- Use `duration` in seconds, not frames
- Easing should be cinematic: `power3.out`, `cubic-bezier(0.16, 1, 0.3, 1)`
- Never animate `top`, `left`, `width`, `height` — use `transform` only

### Text Animation Patterns

```javascript
// Word-by-word reveal (for captions, headlines)
gsap.fromTo('.video-title', 
  { opacity: 0 },
  { 
    opacity: 1,
    stagger: { 
      amount: 0.8,
      from: 'start',
    },
    duration: 0.8,
  },
  '0.5'
);

// Character-based for dramatic effect
const split = SplitText.create('.dramatic-text', { type: 'chars' });
gsap.from(split.chars, {
  opacity: 0,
  rotateX: -90,
  stagger: 0.05,
  duration: 0.5,
}, '2');
```

---

## AUDIO INTEGRATION (CRITICAL FOR UGC/ADS)

### Audio Tracks

```html
<!-- Background music (starts at 0s, plays full duration) -->
<audio 
  src="assets/audio/upbeat-bg-music.mp3"
  data-start="0"
  data-duration="15"
  data-track-index="-2"
  data-volume="0.6"
/>

<!-- Voiceover (synthetic or recorded) -->
<audio 
  src="assets/audio/voiceover-intro.mp3"
  data-start="0.5"
  data-duration="3"
  data-track-index="-1"
  data-volume="1.0"
/>

<!-- Sound effect (button click, transition) -->
<audio 
  src="assets/audio/sfx-transition.mp3"
  data-start="2"
  data-duration="0.5"
  data-volume="0.8"
/>
```

**Audio track indices are NEGATIVE** (below video content):
- `-2` = background music/ambience
- `-1` = voiceover/dialog
- `0+` = effects on video layers

### Voiceover Synthesis (Agent-Driven)

```javascript
// Agents can request TTS synthesis via skill params
async function generateVoiceover(text, voice = 'alloy', speed = 1.0) {
  return await hyperframes.tts.synthesize({
    text,
    voice, // options: 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
    speed, // 0.5x to 2.0x
    format: 'mp3',
  });
}
```

**Synthia rule:** All voiceovers must be approved by human (financial/legal content).

---

## EFFECTS PIPELINE (PROFESSIONAL VIDEO)

### Shader Transitions

```javascript
// Cross-fade with shader animation (0.5s duration)
gsap.to('#transition-shader', {
  opacity: 1,
  duration: 0.5,
}, '2');

// Built-in shader catalogs:
// - 'dissolve' (particle-based dissolve)
// - 'window-blinds' (cinematic reveal)
// - 'mosaic' (pixelate transition)
// - 'liquid' (fluid morphing)
// - 'radial-wipe' (circular reveal)
```

### Color Grading

```javascript
// Warm filter (gold/amber color cast)
gsap.to('#color-filter', {
  filter: 'sepia(0.3) brightness(1.1) saturate(1.2)',
  duration: 1,
}, '0');

// Cool filter (blue/cyan tone)
gsap.to('#color-filter', {
  filter: 'hue-rotate(-30deg) brightness(0.95) saturate(0.9)',
  duration: 1,
}, '5');

// Deep/cinematic (shadows enhanced)
gsap.to('#color-filter', {
  filter: 'contrast(1.2) brightness(0.9)',
  duration: 0.5,
}, '8');
```

### Blur & Depth Effects

```javascript
// Rack focus (foreground sharp, background blurs)
gsap.to('#background-video', {
  filter: 'blur(8px)',
  duration: 0.3,
}, '3');

gsap.to('#foreground-text', {
  filter: 'blur(0px)',
  duration: 0.3,
}, '3');
```

---

## COMPOSITION TEMPLATES (SYNTHIA-STANDARD)

### Template 1: UGC TESTIMONIAL (15-30s vertical)

**Structure:**
```
[0.0s] Fade in product B-roll (background)
[0.5s] Zoom + blur on product
[1.0s] User testimonial video overlay (main)
[2.0s] Quote text + stars (foreground)
[4.0s] CTA button appears
[7.0s] Product shot + value props
[10.0s] Social proof stats
[12.0s] CTA button glows
[14.0s] Fade to black
```

**Audio:**
- BG: Upbeat instrumental (0-15s, 0.5 vol)
- Voiceover: Synthetic testimonial (0.5-4.5s)
- SFX: Button click (4.0s, 0.7 vol)

### Template 2: PRODUCT DEMO (30-60s horizontal)

**Structure:**
```
[0.0s] Cinematic product intro
[2.0s] Split screen: before/after
[10.0s] Feature 1 walkthrough
[20.0s] Feature 2 walkthrough
[30.0s] Results/metrics screen
[40.0s] Call-to-action
[45.0s] Exit animation
```

**Audio:**
- BG: Professional corporate music (0-45s)
- Voiceover: Energetic demo narration
- SFX: UI sounds on each interaction

### Template 3: DESIGN SHOWCASE (10-20s vertical)

**Structure:**
```
[0.0s] Fade in design component
[0.5s] Animate design elements in sequence
[3.0s] Zoom + pan across design
[5.0s] Show component states (hover, active, etc.)
[8.0s] Typography showcase
[10.0s] Color palette reveal
[12.0s] Final branded frame
```

**Audio:**
- BG: Minimal ambient music (0-12s, 0.3 vol)
- SFX: Subtle transitions between sections

### Template 4: ANIMATED CASE STUDY (45-90s)

**Structure:**
```
[0.0s] Problem statement
[5.0s] Challenge visualization (animated chart)
[15.0s] Solution overview
[25.0s] Implementation walkthrough
[40.0s] Results & metrics (data viz)
[55.0s] Testimonial quote
[65.0s] ROI summary
[75.0s] Final CTA
```

**Audio:**
- BG: Professional underscore
- Voiceover: Narrative-driven (full duration)
- SFX: Data visualization sounds

---

## CYNTHIA DESIGN RULES FOR VIDEO

### Typography in Video

**Banned fonts (same as web):**
- ✗ Inter, Roboto, Arial, Helvetica, Open Sans, Montserrat, Poppins, Lato

**Approved fonts for video:**
- Heading: Paradox, Futura, Avant Garde, DM Sans, SF Pro
- Body: Suisse BP, TT Norms, ABC Neutral
- Mono: SF Mono, IBM Plex Mono

**Text rules:**
- Minimum 32pt for readable video
- 4:1 contrast ratio minimum (WCAG AA)
- Subtitles must have background (color box or dark overlay)
- No text over uncontrolled video backgrounds without contrast layer

### Color Grading

**Sacred palette (from motion-SKILL):**
- Gold: `#c4963c` (hex) = `rgb(196, 150, 60)`
- Sage: `#5a7a52` (hex) = `rgb(90, 122, 82)`
- Deep: `#0a1108` (hex) = `rgb(10, 17, 8)`

**Prohibited:**
- ✗ Purple gradients
- ✗ Neon/artificial colors
- ✗ Over-saturated palettes
- ✗ Generic blue-to-purple slides

### Motion Rules

**What's allowed:**
- ✓ Smooth, intentional camera moves (pan, zoom, rack focus)
- ✓ Eased animations (ease: 'power3.out', cubic-bezier)
- ✓ Parallax depth layering
- ✓ Shader transitions (dissolve, wipe, etc.)

**What's banned:**
- ✗ Rapid cuts (< 0.3s transitions)
- ✗ Bouncy/playful easing (bounce.out, elastic.out)
- ✗ Unmotivated motion (no clear purpose)
- ✗ Scroll-jacking in video (user should never feel "stuck")

### Accessibility (WCAG 2.1)

**Mandatory:**
- All meaningful content in captions (auto-generated, then QA'd)
- Contrast ratio ≥ 4.5:1 for text
- Avoid strobing/flashing (no more than 3x per second)
- Audio descriptions for visual-only sequences (optional for short-form)
- `prefers-reduced-motion` support (disable animations on demand)

---

## UDEC SCORING FOR VIDEO (ADAPTED)

| Axis | Target | Failure |
|------|--------|---------|
| MOT (Motion Quality) | ≥ 8.0 | Jerky, unmotivated, low FPS |
| ACC (Accessibility) | ≥ 7.5 | Missing captions, poor contrast |
| AUD (Audio Quality) | ≥ 8.0 | Clipping, poorly synced, harsh |
| CMP (Composition) | ≥ 8.0 | Cluttered, unclear focus |
| TYP (Typography) | ≥ 8.0 | Banned fonts, unreadable, poor hierarchy |
| CAP (Color Palette) | ≥ 8.0 | Neon, purple, generic |
| VIS (Visual Storytelling) | ≥ 7.5 | Confusing narrative, weak CTA |
| TEC (Technical) | ≥ 8.5 | Render errors, audio sync issues, glitches |

**UDEC VIDEO FLOOR: 8.5** (same as web). No exceptions.

---

## RENDERING & EXPORT

### Preview (Live Development)

```bash
cd studio/video/projects/[project-name]
npx hyperframes preview
# Opens browser at localhost:3000 with hot reload
```

### Lint (Validation)

```bash
npx hyperframes lint
# Validates:
# - All data attributes present and valid
# - Asset file references exist
# - Timeline integrity (no overlaps in critical layers)
# - Typography compliance (no banned fonts)
# - Color palette compliance
# - Audio sync correctness
```

### Render (Export to MP4)

```bash
npx hyperframes render --format mp4 --quality high
# Options:
# --format [mp4|webm|mov]
# --quality [low|standard|high]
# --output-path [directory]
```

**Output characteristics:**
- Bit-identical on repeated renders (deterministic)
- H.264 codec (MP4), VP9 (WebM), ProRes (MOV for editing)
- Audio mixed in via FFmpeg (proper sync guaranteed)
- Max bitrate: 25 Mbps for short-form, 50 Mbps for long-form

---

## AGENT SKILL INTERFACE (CLAUDE-NATIVE)

Agents can compose videos via natural language:

```
/compose-video "Create a 30-second UGC testimonial for our SaaS product. 
Include product B-roll, user voiceover saying [quote], CTA button, 
background music at 0.6 volume. Use our brand colors."

/render-video [project-name] --format mp4 --quality high

/export-design-to-video [design-name] --template product-showcase
```

Agent receives:
- HTML composition (auto-generated from prompt)
- Asset references (from studio assets library)
- Timeline orchestration (GSAP timeline pre-built)
- Render instructions (output format/quality)

---

## PROJECT STRUCTURE (EXAMPLE)

```
studio/video/projects/uber-eats-ugc-v1/
├── index.html           (main composition)
├── assets/
│   ├── video/          (B-roll, user testimonials)
│   ├── audio/          (music, voiceover, SFX)
│   ├── images/         (overlays, logos, buttons)
│   └── fonts/          (custom typefaces)
├── styles.css          (text styling, filters)
├── timeline.js         (GSAP animation orchestration)
├── config.json         (project metadata, UDEC target)
└── output/             (renders: MP4, WebM, etc.)
```

---

## COMMON PATTERNS & RECIPES

### Pattern 1: Fade-In + Reveal

```javascript
// Video fades in, headline reveals word-by-word
timeline.from('#video', { opacity: 0, duration: 0.5 }, 0);
timeline.from('.headline-word', { opacity: 0, stagger: 0.1, duration: 0.5 }, 0.3);
```

### Pattern 2: Zoom + Pan (Ken Burns Effect)

```javascript
timeline.to('#hero-image', {
  x: 50,
  y: 30,
  scale: 1.15,
  duration: 5,
}, 0);
```

### Pattern 3: Split Screen Comparison

```html
<div class="split-screen-before" data-start="2" data-duration="4">
  <video src="before.mp4" />
</div>
<div class="split-screen-after" data-start="2" data-duration="4">
  <video src="after.mp4" />
</div>
```

```css
.split-screen-before { clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%); }
.split-screen-after { clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%); }
```

### Pattern 4: Data Visualization (Animated Chart)

```javascript
// Bars animate in one-by-one with values
gsap.to('.chart-bar', {
  height: (i) => bars[i].value,
  stagger: 0.15,
  duration: 0.8,
}, 3);
```

---

## COMMON MISTAKES (ANTI-PATTERNS)

1. **Unmotivated motion** — Every animation must serve the narrative
2. **Undersized text** — < 32pt is unreadable in video
3. **Clipped audio** — Peak levels above -3dB during mixing
4. **Async voiceover** — VO should end 0.5s before final frame
5. **Banned fonts** — Double-check before rendering
6. **Missing captions** — Non-negotiable for accessibility
7. **Rapid cuts** — Jarring transitions < 0.3s
8. **Ungraded footage** — Raw B-roll looks amateurish
9. **Unmixed audio** — BG music + VO at same level = muddled
10. **No CTA** — Every video must have clear call-to-action

---

## QUICK REFERENCE

```bash
# New video project
npx hyperframes init --template product-demo

# Preview (live edit)
npx hyperframes preview

# Validate
npx hyperframes lint

# Render MP4 (standard quality)
npx hyperframes render --format mp4

# Render all formats
npx hyperframes render --all-formats

# Add block from catalog
npx hyperframes add animated-chart
```

---

## INTEGRATION WITH SYNTHIA

Video compositions auto-integrate with:
- **Clone Skill** — Export design system to video timeline
- **Motion Skill** — Reuse scroll animation easing in video animations
- **Doctrine** — Design laws enforced via linter
- **Agent Memory** — Video projects logged in agent workspace
- **UDEC Scoring** — Automated quality check before export
