# SKILL: CINEMATIC MOTION — KUPURI SCROLL STACK

**Use this skill whenever:** adding scroll animations, transitions, parallax effects,
atmospheric shaders, or any kinetic behavior to a Kupuri/Synthia frontend. This is the
implementation reference — not theoretical. Everything in here ships as-is.

---

## THE 5-TECHNIQUE STACK (apply all 5 to cinematic landing pages)

### Stack Overview
```
1. Lenis + GSAP — physics-based scroll foundation (always first)
2. CSS Perspective layers — true z-depth parallax
3. GSAP SplitText + pin — typography scrub
4. Horizontal scroll gallery — vertical→horizontal conversion
5. GLSL noise shader — atmospheric depth canvas
```

---

## TECHNIQUE 1 — LENIS PHYSICS SCROLL FOUNDATION

```html
<!-- CDN — exact versions, always in this order -->
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.8/dist/lenis.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
```

```javascript
// MUST run before ALL other GSAP calls
const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
gsap.registerPlugin(ScrollTrigger);
```

**Tuning guide:**
- `lerp: 0.06` — maximum cinematic weight (feels like thick oil)
- `lerp: 0.08` — default Kupuri value (heavy but responsive)
- `lerp: 0.10` — lighter, more responsive (good for dashboards)
- `lerp: 0.12+` — barely any smoothing (close to native scroll)
- `smoothWheel: true` on desktop ONLY
- Mobile: disable Lenis entirely, use native scroll (performance critical)

```javascript
// Disable Lenis on mobile
if (window.matchMedia('(pointer: coarse)').matches) {
  lenis.destroy();
}
```

---

## TECHNIQUE 2 — CSS PERSPECTIVE Z-AXIS PARALLAX

```css
/* Scene container — the only element with perspective */
.scene {
  position: relative;
  height: 100vh;
  overflow: hidden;
  perspective: 1px;
  perspective-origin: 50% 50%;
}

/* Layer system — translateZ(-N) + scale(N+1) = full coverage */
/* Formula: scale = N + 1 where N = abs(translateZ value) */
.layer-sky    { transform: translateZ(-5px) scale(6); }   /* slowest, farthest */
.layer-mist   { transform: translateZ(-3px) scale(4); }
.layer-canopy { transform: translateZ(-2px) scale(3); }
.layer-fore   { transform: translateZ(-1px) scale(2); }   /* fastest, nearest */
.layer-ui     { transform: translateZ(0); }                /* no parallax — UI lives here */
```

**Standard layer map for eco/sacred scenes:**
```
Z = -5  Sky gradient / stars / moon
Z = -4  Distant mountain silhouette
Z = -3  Mid jungle canopy / ruins silhouette
Z = -2  Mist/fog layer (animated blur on scroll)
Z = -1  Near leaves / foreground elements
Z =  0  Navigation, headlines, CTAs, all interactive UI
```

**Critical rules:**
- Only the `perspective` container handles the 3D math. Children are just `transform`.
- Never set `transform-style: preserve-3d` on children — it breaks the layer system.
- Layer images must be sized 110–120% larger than the container to cover at extreme parallax.

---

## TECHNIQUE 3 — GSAP SPLITTEXT + PINNED SCRUB TYPOGRAPHY

```javascript
// Hero section stays locked to viewport for 300px of scroll
// Title reveals letter-by-letter tied to your scroll position
const heroTl = gsap.timeline({
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',          // when hero top hits viewport top
    end: '+=300',              // 300px later
    scrub: 1,                  // 1s smooth catch-up lag
    pin: true,                 // freeze the section
    anticipatePin: 1,          // prevents flash at pin start
  }
});

// SplitText is free with GSAP Club or CDN
const split = SplitText.create('.hero-title', { type: 'chars,words' });

heroTl.from(split.chars, {
  opacity: 0,
  yPercent: 120,
  rotateX: -45,
  stagger: { amount: 0.5, from: 'start' },
  ease: 'power3.out',
});

// Optional: subtitle follows with slight delay
heroTl.from('.hero-sub', { opacity: 0, yPercent: 20, ease: 'power2.out' }, '-=0.15');
heroTl.from('.btn-cta',  { opacity: 0, yPercent: 15, ease: 'power2.out' }, '-=0.10');
```

**Rules:**
- `scrub: 1` for smooth (1s catch-up). Use `scrub: true` for exact 1:1.
- Always pin the section — NEVER pin the text itself.
- `anticipatePin: 1` is mandatory to prevent visual glitch.
- For reveals below the fold (not hero): use IntersectionObserver, NOT GSAP+scrub.
- `ease: 'power2.out'` or `power3.out` for enters. `ease: 'none'` for anything scrubbed.

---

## TECHNIQUE 4 — HORIZONTAL SCROLL GALLERY

```javascript
// Vertical scroll → horizontal slide of destination cards
const track = document.querySelector('.cards-track');
const totalWidth = track.scrollWidth - window.innerWidth;

const hScroll = gsap.to('.cards-track', {
  x: () => -totalWidth,
  ease: 'none',            // ALWAYS ease:none for scroll-driven x movement
  scrollTrigger: {
    trigger: '.destinations-section',
    start: 'top top',
    end: () => '+=' + totalWidth,
    pin: true,
    scrub: 1,
    invalidateOnRefresh: true,  // required when end uses a function
  }
});

// Each card image parallaxes in opposite direction (depth illusion inside h-scroll)
gsap.utils.toArray('.card-image').forEach(img => {
  gsap.to(img, {
    xPercent: 25,
    ease: 'none',
    scrollTrigger: {
      trigger: img.closest('.card'),
      containerAnimation: hScroll,  // nested in horizontal scroll
      start: 'left right',
      end: 'right left',
      scrub: true,
    }
  });
});

// Always disable on mobile:
const mm = gsap.matchMedia();
mm.add('(max-width: 768px)', () => {
  // stack cards vertically, remove pin
});
```

---

## TECHNIQUE 5 — GLSL NOISE ATMOSPHERE SHADER

```html
<!-- Fixed canvas — never in scroll flow -->
<canvas id="atmosphere" style="
  position: fixed; inset: 0; z-index: 0;
  pointer-events: none; opacity: 0.6;
  mix-blend-mode: screen;
"></canvas>
```

```javascript
function initAtmosphere() {
  const canvas = document.getElementById('atmosphere');
  const gl = canvas.getContext('webgl');
  if (!gl) return; // graceful fallback — nothing breaks

  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const vert = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const frag = `
    precision mediump float;
    uniform vec2  u_res;
    uniform float u_time;

    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211325,0.366025,-0.577350,0.024390);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
      vec3 m = max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0*fract(p*C.www)-1.0;
      vec3 h = abs(x)-0.5;
      vec3 ox = floor(x+0.5);
      vec3 a0 = x-ox;
      m *= 1.79284291-0.85373472*(a0*a0+h*h);
      vec3 g;
      g.x  = a0.x*x0.x+h.x*x0.y;
      g.yz = a0.yz*x12.xz+h.yz*x12.yw;
      return 130.0*dot(m,g);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      float t  = u_time * 0.06;
      float n  = snoise(uv * 2.5 + vec2(t, t * 0.4));
      float n2 = snoise(uv * 5.0 - vec2(t * 0.3, t * 0.7));
      float mist = smoothstep(-0.2, 0.8, (n + n2 * 0.4) * 0.5 + 0.5);
      /* Palette: gold #c4963c = rgb(0.77,0.59,0.24) / sage #5a7a52 = rgb(0.35,0.48,0.32) */
      vec3 gold = vec3(0.77, 0.59, 0.24);
      vec3 sage = vec3(0.35, 0.48, 0.32);
      vec3 color = mix(sage, gold, uv.y + n * 0.3);
      gl_FragColor = vec4(color, mist * 0.5);
    }
  `;

  const compile = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog); gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const uRes  = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let start = performance.now();
  const render = () => {
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (performance.now() - start) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  };
  render();
}
```

**Shader palette adaptation (change for other projects):**
- Sacred Earth: gold `vec3(0.77,0.59,0.24)` + sage `vec3(0.35,0.48,0.32)`
- Ethereal Glass: emerald `vec3(0.06,0.73,0.50)` + deep `vec3(0.02,0.15,0.10)`
- Volcanic: ember `vec3(0.85,0.25,0.05)` + charcoal `vec3(0.08,0.07,0.07)`

**blend-mode guide:**
- Dark background → `mix-blend-mode: screen` (adds light)
- Light background → `mix-blend-mode: multiply` (adds grain/darkening)

---

## GPU-SAFE ANIMATION RULES

```
✓ transform: translate, scale, rotate, translateZ
✓ opacity
✓ filter: blur, brightness (sparingly, reduces to 1 layer)
✗ top, left, bottom, right (causes layout recalculation)
✗ width, height, margin, padding (during animation)
✗ background-color (use opacity on overlay layer instead)
```

## EASING REFERENCE

```javascript
// Cinematic entry (hero reveals, card appears)
ease: 'power3.out'

// Premium feel (button response, hover state)
ease: 'cubic-bezier(0.16, 1, 0.3, 1)'

// Scrubbed scroll (always no easing — easing+scrub = disorienting)
ease: 'none'

// Draw-back then launch (sparingly — use only for dramatic moments)
ease: 'back.out(1.7)'

// NEVER use:
// ease: 'bounce.out'  — childish
// ease: 'elastic.out' — cartoon
```
