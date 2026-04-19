---
name: hyperframes
description: Create and render HTML-to-video compositions using HyperFrames. Use when the user wants to generate videos programmatically from HTML, build animated video content, convert websites to video, or produce social media clips via code. Covers CLI scaffolding, composition authoring, GSAP animation, registry blocks, and rendering to MP4.
---

# HyperFrames — HTML-to-Video Rendering

HyperFrames converts HTML compositions into rendered MP4 videos. Write HTML with data attributes, animate with GSAP, render with FFmpeg.

## Setup

```bash
npm install @hyperframes/cli
# or use directly:
npx hyperframes init my-video
```

Requirements: Node.js, FFmpeg, Chrome/Chromium (`npx hyperframes doctor` to diagnose).

## CLI Workflow

```bash
npx hyperframes init my-video       # scaffold project (choose a template)
npx hyperframes lint                # validate compositions
npx hyperframes preview             # open studio at localhost:3002 with hot-reload
npx hyperframes render              # render all compositions to MP4
npx hyperframes render --quality high --fps 60
npx hyperframes render --format webm  # transparency support
npx hyperframes doctor              # check environment (Chrome, FFmpeg, memory)
```

## Composition Structure

Each composition is a single HTML file. Required sections:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* All CSS here — position elements at their most visible (hero frame) */
    #title { position: absolute; top: 100px; left: 80px; font-size: 72px; }
  </style>
</head>
<body>
  <!-- Clip elements with data attributes -->
  <div id="scene1"
    data-start="0"
    data-duration="4"
    data-track-index="0">

    <h1 id="title">Hello World</h1>
  </div>

  <script>
    // GSAP animations — deterministic only
    const tl = gsap.timeline();
    tl.from("#title", { opacity: 0, y: 30, duration: 0.6, ease: "power2.out" }, 0.2);
  </script>
</body>
</html>
```

## Required Data Attributes

| Attribute | Required on | Purpose |
|---|---|---|
| `id` | all clips | unique identifier |
| `data-start` | all clips | start time in seconds |
| `data-track-index` | all clips | layer z-order (0 = bottom) |
| `data-duration` | images, divs | explicit duration (video/audio inherit from media) |
| `data-composition-src` | composition clips | path to sub-composition HTML |
| `data-composition-id` | composition clips | unique clip id within host |
| `data-width` / `data-height` | composition clips | dimensions in px |

## Layout Methodology

1. Position every element where it appears at **peak visibility** in CSS
2. Use `gsap.from()` for entrances (animate FROM hidden state TO visible)
3. Use `gsap.to()` for exits only on the final scene
4. Never use `gsap.from()` and `gsap.to()` on the same property simultaneously

```css
/* Hero frame position — where element should be when fully visible */
#card { position: absolute; top: 200px; left: 160px; opacity: 1; }
```

```js
// Entrance: animate FROM hidden state
gsap.from("#card", { opacity: 0, scale: 0.8, duration: 0.5, ease: "back.out(1.7)" }, 0.3);
```

## Non-Negotiable Rules

1. **Deterministic only** — no `Math.random()`, `Date.now()`, or async timeline construction
2. **Animate only visual properties** — opacity, x, y, scale, rotation, color, backgroundColor, borderRadius. Never `visibility`, `display`, or media play/pause
3. **No infinite loops** — use `repeat: Math.ceil(duration / cycle) - 1`, never `repeat: -1`
4. **No property conflicts** — never animate the same property on the same element from two timelines simultaneously
5. **Offset first animation** by 0.1–0.3s (never at t=0)
6. **Vary eases** — minimum 3 different eases per scene
7. **Text minimums** — 60px+ headlines, 20px+ body, 16px+ labels
8. **Multi-scene transitions** — every scene boundary needs a transition; no jump cuts

## Multi-Scene Compositions

```js
// Scene 1 → Scene 2 transition
const tl = gsap.timeline();
// Scene 1 entrance
tl.from("#scene1-title", { opacity: 0, y: -40, duration: 0.6, ease: "power3.out" }, 0.2);
tl.from("#scene1-body",  { opacity: 0, x: -30, duration: 0.5, ease: "power2.out" }, 0.5);
// Transition (outgoing content stays; incoming slides in)
tl.from("#scene2-bg", { opacity: 0, duration: 0.4, ease: "none" }, 3.5);
tl.from("#scene2-title", { opacity: 0, scale: 0.9, duration: 0.5, ease: "back.out" }, 3.7);
```

## Registry Blocks (Pre-built Components)

```bash
npx hyperframes add data-chart          # install a block
npx hyperframes add grain-overlay       # install a component
# discover available blocks:
curl -s https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/registry.json
```

**Block** (sub-composition with own dimensions/duration) — wire via:
```html
<div id="chart1"
  data-composition-src="compositions/data-chart.html"
  data-composition-id="chart1"
  data-start="2" data-duration="5"
  data-track-index="2"
  data-width="800" data-height="450">
</div>
```

**Component** (effect snippet) — merge its HTML, CSS, and JS into host composition directly.

## Text-to-Speech & Captions

```bash
npx hyperframes tts "Your narration text" --voice alloy --output audio/vo.mp3
npx hyperframes transcribe audio/vo.mp3 --format vtt  # word-level timestamps
```

## Output Formats

| Format | Dimensions |
|---|---|
| Landscape | 1920×1080 |
| Portrait | 1080×1920 |
| Square | 1080×1080 |

Typical durations: social ads 10–15s, product demos 30–60s, brand reels 20–45s.

## Validation

```bash
npx hyperframes lint          # checks missing IDs, overlapping tracks, attribute errors
npx hyperframes lint --verbose --json
```

## Website-to-Video Pipeline (7 Steps)

When converting a website URL to video:
1. **Capture** — fetch site, extract brand: colors, fonts, assets, aesthetic
2. **DESIGN.md** — write 6-section brand reference (~90 lines)
3. **Script** — narration text; scene count and durations come from pacing
4. **Storyboard** — beat-by-beat: mood, camera, animations, transitions, assets, sound
5. **VO + Timing** — generate TTS audio, extract timestamps, sync to story beats, update storyboard with actual durations
6. **Build** — implement each composition per storyboard; self-review layout and animation quality
7. **Validate & Deliver** — `hyperframes lint`, create handoff docs

## Before Writing Any Composition

Check for a visual identity source in this order:
1. `DESIGN.md` in the project
2. `visual-style.md` in the project
3. A named style preset (see `visual-styles.md` if present)
4. User-provided direction → generate minimal `DESIGN.md` before proceeding

## Reference

- Repo: https://github.com/heygen-com/hyperframes
- Skills repo includes: `skills/hyperframes/`, `skills/gsap/`, `skills/hyperframes-cli/`, `skills/hyperframes-registry/`, `skills/website-to-hyperframes/`
- Install all HyperFrames skills: `npx skills add heygen-com/hyperframes`
