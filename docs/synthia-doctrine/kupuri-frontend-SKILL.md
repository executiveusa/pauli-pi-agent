# SKILL: KUPURI FRONTEND DESIGN SYSTEM

**Use this skill whenever:** generating HTML/CSS/JS for any Kupuri Media project,
running SYNTHIA design output, building landing pages, dashboards, auth flows, or
any frontend component for kupuri-media-cdmx.vercel.app.

---

## SECTION 0 — ABSOLUTE ZERO DIRECTIVE (READ FIRST)

### Banned Fonts — NEVER USE
```
Inter, Roboto, Arial, Helvetica, system-ui (as primary), Nunito, Poppins,
Open Sans, Lato (as display), Montserrat (as display), Source Sans Pro
```

### Banned Aesthetics
```
- Glassmorphism (blurry cards layered on blurry backgrounds — generic SaaS)
- Neumorphism (gray embossed plastic — dead trend)
- Purple/pink gradient anything
- Neon green on dark backgrounds
- Generic CSS card grids (equal-height, equal-width, boring)
- Bootstrap-looking layouts
- "AI startup" hero sections (centered text + CTA + abstract blob)
- Lottie animations (too heavy, too generic)
- Generic stock photography (Unsplash people smiling at laptops)
- Carousel/sliders (accessibility nightmare, never use)
- Pop-up modals for conversion (intrusive, kills trust)
- Countdown timers (FUD-based design)
- Sticky headers with too many items (max 5 nav links)
- Infinite scroll for primary navigation content
```

### Banned Code Patterns
```javascript
// NEVER animate position properties
element.style.top = '...'; // ✗
gsap.to(el, { top: ... }); // ✗

// NEVER use scroll event for reveals
window.addEventListener('scroll', ...); // ✗ — use IntersectionObserver

// NEVER inline critical scripts at top of body
// NEVER block rendering with synchronous scripts

// NEVER guess CSS units — always use CSS custom properties
font-size: 16px; // ✗ (unless reset)
font-size: var(--text-base); // ✓
```

### Banned Motion
```
- Bounce easing (ease-out-back with too much overshoot)
- Random floating animations (divs floating up and down continuously)
- Parallax on every element (reserve for hero only)
- Auto-advancing carousels
- CSS animations that loop without pause (marquees are exception — must have hover-pause)
```

---

## SECTION 1 — THE THREE DESIGN DIALS

Every SYNTHIA output sets these three dials explicitly, then stays locked.

### DIAL 1: VARIANCE (how far from corporate-safe)
```
1 — Boardroom safe (minimal risk, universally acceptable)
2 — Premium brand (tasteful elevation, subtle details)
3 — Studio craft (strong opinions, editorial choices)
4 — Vanguard (provocative, memorable, not for everyone)
5 — Gallery art (pushes form entirely — reserved for culture projects)
```
**Default for Kupuri/Querencia: Dial 3–4**

### DIAL 2: MOTION (kinetic intensity)
```
1 — Static (accessibility mode — no motion)
2 — Subtle (fade-ins, gentle scroll reveals)
3 — Cinematic (full 5-technique scroll stack)
4 — Theatrical (heavy pin, horizontal scroll, shader effects)
5 — Film (Remotion sequences, video backdrops)
```
**Default for landing pages: Dial 3–4**
**Default for dashboards/apps: Dial 2**

### DIAL 3: DENSITY (information per viewport)
```
1 — Spacious (generous whitespace, one thought per section)
2 — Balanced (standard premium layout)
3 — Rich (bento-style information density)
4 — Dense (data dashboard aesthetic)
5 — Overloaded (never use — loses hierarchy)
```
**Default for landing pages: Dial 1–2**
**Default for dashboards: Dial 3**

---

## SECTION 2 — CREATIVE VARIANCE ENGINE

### 8 Vibe Archetypes
```
SACRED-EARTH   — Dark vellum + gold + sage. Playfair Display. Cinematic scroll.
ETHEREAL-GLASS — Pure black + emerald accent. Geist/Cabinet Grotesk. SaaS clean.
VOLCANIC       — Near-black + orange-red ember. Bold condensed type. High contrast.
COASTAL-FOG    — Slate gray + soft teal. DM Sans. Calm, editorial.
MARKET-VIBRANT — Warm white + electric yellow + deep navy. Plus Jakarta. Local energy.
ARCHIVE-PRINT  — Off-white + ink black. Playfair + DM Mono. Editorial magazine.
RITUAL-DARK    — Black + copper + bone. Space Grotesk. Ceremony and craft.
JUNGLE-LUSH    — Deep forest green + earth tones + cream. Cormorant Garamond. Organic.
```

### 6 Layout Archetypes
```
EDITORIAL-ASYMMETRIC   — Odd-numbered columns, type bleeds, images break the grid
BENTO-PREMIUM          — Unequal cards, feature card 2× size, breathing room
FULL-BLEED-CINEMATIC   — Sections that consume 100vw × 100vh
MANIFESTO              — Type as the primary visual element
PARALLAX-LAYERS        — Multiple z-depth layers, hero-only
SPARSE-LUXURY          — 60% whitespace, single focal point per section
```

### The DESIGN PROMPT Formula
```
VIBE: [one archetype] × LAYOUT: [one archetype] × DIAL: V[1-5]/M[1-5]/D[1-5]
Example: VIBE: SACRED-EARTH × LAYOUT: FULL-BLEED-CINEMATIC × DIAL: V4/M4/D1
```

---

## SECTION 3 — TYPOGRAPHY SYSTEM

### Font Stack by Project Type
```css
/* Sacred Earth (Kupuri, Querencia, eco-tour) */
--font-display:  'Playfair Display', 'Georgia', serif;
--font-body:     'Lato', sans-serif;
--font-mono:     'DM Mono', monospace;

/* Ethereal Glass (SaaS, tech, AI) */
--font-display:  'Cabinet Grotesk', 'Geist', sans-serif;
--font-body:     'DM Sans', sans-serif;
--font-mono:     'Geist Mono', monospace;

/* Ritual Dark / Archive Print */
--font-display:  'Cormorant Garamond', 'Playfair Display', serif;
--font-body:     'Plus Jakarta Sans', sans-serif;
--font-mono:     'Space Mono', monospace;
```

### Type Scale
```css
--text-xs:   0.625rem;   /* 10px — monospace labels, eyebrow tags */
--text-sm:   0.75rem;    /* 12px — captions */
--text-base: 0.875rem;   /* 14px — body */
--text-md:   1rem;       /* 16px — body large */
--text-lg:   1.25rem;    /* 20px — subhead */
--text-xl:   1.5rem;     /* 24px — section title */
--text-2xl:  2rem;       /* 32px — feature head */
--text-3xl:  3rem;       /* 48px — hero sub */
--text-4xl:  4.5rem;     /* 72px — hero display */
--text-5xl:  6.5rem;     /* 104px — statement piece */
```

### Eyebrow Tag Pattern (always use this — never plain uppercase text)
```html
<div class="eyebrow">
  <span class="eyebrow-dot">◆</span>
  Sacred Eco-Tours · Latin America
</div>
```
```css
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold);
  padding: 6px 14px;
  border: 1px solid var(--gold-border);
  border-radius: 999px;
}
.eyebrow-dot { font-size: 6px; }
```

---

## SECTION 4 — COLOR SYSTEM

### Sacred Earth Palette
```css
:root {
  --vellum:        #0c0d0a;  /* deep background */
  --vellum-2:      #14160e;
  --vellum-3:      #1a1d13;
  --vellum-4:      #22261a;
  --gold:          #c4963c;  /* primary accent */
  --gold-light:    #ddb85a;
  --gold-dim:      rgba(196,150,60,0.5);
  --gold-glow:     rgba(196,150,60,0.08);
  --gold-border:   rgba(196,150,60,0.18);
  --rust:          #b05c38;  /* secondary accent */
  --sage:          #5a7a52;  /* third accent */
  --sage-light:    #78a06a;
  --ink:           #e8e2d4;  /* primary text */
  --ink-dim:       #a09880;
  --ink-muted:     #5a5448;
}
```

### Ethereal Glass Palette
```css
:root {
  --bg:            #050505;
  --surface:       rgba(255,255,255,0.04);
  --border:        rgba(255,255,255,0.08);
  --accent:        #10b981;  /* emerald — one accent only */
  --accent-dim:    rgba(16,185,129,0.2);
  --text:          #f8fafc;
  --text-dim:      #94a3b8;
}
```

### Rules
- **Max 1 accent color** per project. Saturation < 80%.
- **No purple.** No neon. No blue-purple gradients. Ever.
- All text must pass WCAG AA (4.5:1 contrast ratio minimum).
- Warm grays and cool grays do not mix in the same project.

---

## SECTION 5 — THE 5-TECHNIQUE CINEMATIC SCROLL STACK

### CDN Stack (always load in this exact order)
```html
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.8/dist/lenis.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
```

### TECHNIQUE 1 — Lenis Physics Scroll
```javascript
const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
gsap.registerPlugin(ScrollTrigger);
// lerp: 0.06–0.10. Lower = more resistance = more cinematic.
// smoothWheel: true on desktop ONLY. Mobile uses native scroll.
```

### TECHNIQUE 2 — CSS Perspective Z-axis Layering
```css
.scene {
  position: relative; height: 100vh;
  overflow: hidden; perspective: 1px; perspective-origin: 50% 50%;
}
.layer-sky    { transform: translateZ(-5px) scale(6); }   /* slowest */
.layer-mist   { transform: translateZ(-3px) scale(4); }
.layer-canopy { transform: translateZ(-2px) scale(3); }
.layer-fore   { transform: translateZ(-1px) scale(2); }   /* fastest */
.layer-ui     { transform: translateZ(0); }                /* no parallax */
```

### TECHNIQUE 3 — GSAP SplitText + Pinned Scrub Typography
```javascript
const heroTl = gsap.timeline({
  scrollTrigger: {
    trigger: '.hero', start: 'top top', end: '+=300',
    scrub: 1, pin: true, anticipatePin: 1
  }
});
const split = SplitText.create('.hero-title', { type: 'chars,words' });
heroTl.from(split.chars, {
  opacity: 0, yPercent: 120, rotateX: -45,
  stagger: { amount: 0.5, from: 'start' }, ease: 'power3.out'
});
// Rules: scrub:1 for smooth. Pin section (not text). ease:'none' for scrubbed.
```

### TECHNIQUE 4 — Horizontal Scroll Gallery
```javascript
const totalWidth = document.querySelector('.cards-track').scrollWidth - window.innerWidth;
gsap.to('.cards-track', {
  x: () => -totalWidth, ease: 'none',
  scrollTrigger: {
    trigger: '.destinations-section', start: 'top top',
    end: () => '+=' + totalWidth, pin: true, scrub: 1, invalidateOnRefresh: true
  }
});
// ease:'none' on x tween. ease+scrub = disorienting.
// Mobile: disable and stack vertically with gsap.matchMedia()
```

### TECHNIQUE 5 — GLSL Noise Shader Atmosphere
```html
<canvas id="atmosphere" style="position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0.6;mix-blend-mode:screen;"></canvas>
```
Full GLSL implementation in SECTION 5 of KUPURI-FRONTEND-SKILL.md.
- Sacred Earth: gold `#c4963c` + sage `#5a7a52` noise mist
- `mix-blend-mode: screen` dark bg; `multiply` light bg
- Graceful fallback: if `getContext('webgl')` fails, nothing breaks

---

## SECTION 6 — COMPONENT PATTERNS

### Double-Bezel Container (all major cards/frames)
```css
.bezel-outer {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(196,150,60,0.12);
  border-radius: 24px; padding: 6px;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
}
.bezel-inner {
  background: var(--vellum-3);
  border-radius: 18px; /* 24-6=18, always concentric */
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  overflow: hidden;
}
```
Apply to: destination cards, auth cards, feature bentos, hero frames, maps. NOT body text/nav.

### Primary CTA Button
```css
.btn-cta {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 16px 28px 16px 32px;
  background: var(--gold); color: var(--vellum);
  border-radius: 999px; font-family: var(--mono);
  font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
  transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
}
.btn-cta:hover { background: var(--gold-light); }
.btn-icon-wrap {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(0,0,0,0.15); display: flex;
  align-items: center; justify-content: center;
  transition: transform 0.2s cubic-bezier(0.16,1,0.3,1);
}
.btn-cta:hover .btn-icon-wrap { transform: translate(2px,-2px); }
```

### Glassmorphism Panel (fixed/sticky only)
```css
.glass-panel {
  background: rgba(18,22,16,0.7);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid rgba(196,150,60,0.18);
  border-top: 1px solid rgba(196,150,60,0.3); /* lighter top = light refraction */
  box-shadow: 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
  border-radius: 16px;
}
```

### Scroll Reveal (IntersectionObserver — NEVER window scroll)
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(el => {
    if (el.isIntersecting) { el.target.classList.add('visible'); observer.unobserve(el.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
```
```css
[data-reveal] { opacity:0; transform:translateY(20px); transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1); }
[data-reveal].visible { opacity:1; transform:translateY(0); }
[data-reveal]:nth-child(2) { transition-delay:0.1s; }
[data-reveal]:nth-child(3) { transition-delay:0.2s; }
```

### Infinite Marquee
```css
.marquee-inner { display:inline-flex; gap:2rem; animation: marquee 30s linear infinite; font-family:var(--mono); font-size:10px; letter-spacing:3px; text-transform:uppercase; }
.marquee-inner:hover { animation-play-state:paused; }
@keyframes marquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
/* Always duplicate items for seamless loop */
```

---

## SECTION 7 — PERFORMANCE GUARDRAILS

### GPU-safe animations ONLY
```
✓ transform (translate, scale, rotate, translateZ)
✓ opacity
✓ filter (blur, brightness) — sparingly
✗ top, left, bottom, right
✗ width, height, margin, padding (during animation)
✗ background-color (use opacity on overlay instead)
```

### Mobile rules
```
✓ Disable horizontal scroll parallax on mobile (gsap.matchMedia)
✓ Disable backdrop-blur on prefers-reduced-motion
✓ Native scroll on mobile — no Lenis on touch
✓ Shader at half resolution on mobile
✗ Never animate >3 elements simultaneously on mobile
✗ Never will-change on >5 elements total
```

---

## SECTION 8 — HTML SCAFFOLD

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="theme-color" content="#0c0d0a"/>
  <title>[PROJECT NAME]</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&family=DM+Mono:wght@300;400;500&family=Lato:wght@300;400;700&display=swap" rel="stylesheet"/>
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.3.8/dist/lenis.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
  <style>/* 1. CSS tokens 2. Reset 3. Scene 4. Typography 5. Components 6. Sections 7. Animations 8. Responsive */</style>
</head>
<body>
  <canvas id="atmosphere"></canvas>
  <section class="hero scene" id="hero">
    <div class="layer layer-sky"></div>
    <div class="layer layer-mid"></div>
    <div class="layer layer-mist"></div>
    <div class="layer layer-fore"></div>
    <div class="layer layer-ui">
      <div class="hero-content">
        <div class="eyebrow"><span class="eyebrow-dot">◆</span> Sacred Eco-Tours · Latin America</div>
        <h1 class="hero-title">Querencia</h1>
        <p class="hero-sub">The place you feel most yourself</p>
        <button class="btn-cta">Begin Your Journey <span class="btn-icon-wrap">↗</span></button>
      </div>
    </div>
  </section>
  <div id="toast" role="status" aria-live="polite"></div>
  <script>
    // ORDER: 1. Atmosphere shader 2. Lenis+GSAP 3. Hero SplitText+pin 4. H-scroll 5. Reveals 6. Marquee 7. Toast
  </script>
</body>
</html>
```

---

## SECTION 9 — THE 20-POINT PRODUCTION CHECKLIST

Run before every output. Every item must be ✅ or output is rejected.

```
SECURITY
✅ 1.  No hardcoded API keys or secrets
✅ 2.  All user-generated content passed through escHtml()
✅ 3.  Form inputs have type, required, and appropriate autocomplete

PERFORMANCE
✅ 4.  Only transform/opacity animated — no layout properties
✅ 5.  backdrop-blur only on fixed/sticky elements
✅ 6.  IntersectionObserver used for scroll reveals (not scroll event)
✅ 7.  Images have loading="lazy" and aspect-ratio in CSS
✅ 8.  Atmosphere canvas is position:fixed, pointer-events:none
✅ 9.  will-change on max 5 elements, removed after animation

DESIGN LAW (UDEC ≥ 8.5)
✅ 10. No banned fonts (Inter, Roboto, Arial, Helvetica)
✅ 11. No purple gradients, no neon, no generic card grids
✅ 12. Approved display font in use
✅ 13. Double-bezel architecture on all major containers
✅ 14. Button-in-button pattern on primary CTA
✅ 15. Section padding minimum py-24 (6rem)
✅ 16. Text contrast passes WCAG AA (4.5:1 minimum)

COMPLETENESS
✅ 17. Zero stubs — every function implemented, every button does something
✅ 18. Empty states exist for dynamic content areas
✅ 19. Mobile responsive — tested at 375px breakpoint
✅ 20. Keyboard accessible — tab order logical, focus visible
```

---

## KUPURI DESTINATION LIBRARY (Querencia™)

```javascript
const DESTINATIONS = [
  { name:'Cenote Ik Kil', region:'Yucatán, México', mood:['SPIRITUAL','ECO'], line:'Descend into the sacred underground', color:'#2a6a8a' },
  { name:'Palenque', region:'Chiapas, México', mood:['SPIRITUAL','ADVENTURE'], line:'Where the Maya spoke to the stars', color:'#4a7a3a' },
  { name:'Hierve el Agua', region:'Oaxaca, México', mood:['ECO','ADVENTURE'], line:'Petrified waterfalls above the valley', color:'#8a6a2a' },
  { name:'Sierra Norte', region:'Oaxaca, México', mood:['ECO'], line:'Cloud forests, Zapotec villages, no WiFi', color:'#3a6a4a' },
  { name:'Barichara', region:'Santander, Colombia', mood:['ECO','SPIRITUAL'], line:'The most beautiful town in Colombia', color:'#8a5a3a' },
  { name:'Parque Tayrona', region:'Magdalena, Colombia', mood:['ADVENTURE','ECO'], line:'Jungle meets Caribbean — untouched', color:'#2a7a6a' },
  { name:'Valle Sagrado', region:'Cusco, Perú', mood:['SPIRITUAL','ADVENTURE'], line:'The heartbeat of the Inca world', color:'#6a4a8a' },
  { name:'Monteverde', region:'Puntarenas, Costa Rica', mood:['ECO'], line:'Walk through the clouds', color:'#4a8a5a' },
  { name:'Teotihuacán', region:'Estado de México', mood:['SPIRITUAL','ADVENTURE'], line:'Climb the Pyramid of the Sun at dawn', color:'#9a7a2a' },
];
```

---

*This skill covers: HTML/CSS/JS frontend output only.*
*Backend API, database schema, auth logic → see AGENTS.md bead specs.*
*UDEC scoring → see skills/udec-scorer/SKILL.md*
