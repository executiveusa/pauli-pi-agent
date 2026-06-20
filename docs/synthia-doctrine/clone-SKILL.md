# SKILL: CLONE — Complete Website Cloning & Design System Extraction

**Use this skill whenever:** You need to clone a website, extract its design system, or replicate its entire structure and styling.

---

## Quick Start

```bash
# Clone everything from a website
/clone https://example.com

# Or in conversation:
# "clone stripe.com"
# "extract and clone https://linear.app"
# "clone this site with all assets"
```

---

## What CLONE Does (All-in-One)

When you drop a URL, CLONE automatically:

### 1. **Website Cloning**
- Downloads full HTML structure
- Captures all CSS (inline, external, CSS-in-JS)
- Clones JavaScript (event listeners, animations, state)
- Downloads assets: images, fonts, videos, SVGs
- Preserves responsive design & media queries
- Creates a fully-functional local copy

### 2. **Design System Extraction** (via design-md-chrome)
- Extracts complete color palette
- Maps typography system (fonts, scales, weights)
- Captures spacing & layout patterns
- Documents interactive states (hover, focus, active, disabled, error)
- Generates WCAG 2.2 AA accessibility audit
- Detects anti-patterns against Cynthia doctrine
- Outputs: DESIGN.md + SKILL.md + anti-pattern report

### 3. **Design Tokens Export** (via designlang)
- Generates 8 different output formats:
  - `design-tokens.md` — AI-optimized documentation
  - `design-tokens.json` — Raw token data
  - `tailwind.config.js` — Ready to use in Tailwind
  - `theme.ts` — React TypeScript theme object
  - `styles.css` — CSS custom properties
  - `design-tokens.yaml` — YAML format
  - `design-tokens.html` — Visual preview
  - `accessibility-report.md` — WCAG compliance

### 4. **Asset Management**
- Optional: Download all images (with optimization)
- Optional: Embed web fonts locally
- Optional: Create offline-ready version

---

## Usage Examples

### Clone a SaaS Product
```bash
/clone https://stripe.com
# Output: /cloned-websites/stripe/
# ├── index.html (full copy)
# ├── styles/ (all CSS)
# ├── scripts/ (all JS)
# ├── assets/ (images, fonts, etc)
# ├── DESIGN.md (design system doc)
# ├── SKILL.md (for agents to use)
# ├── design-tokens.json
# ├── tailwind.config.js
# ├── theme.ts
# ├── accessibility-report.md
# └── clone-manifest.json (metadata)
```

### Clone a Design Agency Site
```bash
/clone https://awwwards.com/showcase --with-assets
# Includes all images, fonts, animations
```

### Clone for Design Analysis
```bash
/clone https://linear.app --mode design-only
# Skips HTML/JS cloning, focuses on design tokens
# Faster, smaller output
```

### Clone for Code Replication
```bash
/clone https://github.com/user/repo --mode structure-only
# Gets HTML structure + CSS, no design token analysis
```

### Batch Clone Competitors
```bash
/clone --batch competitors.txt --output ./competitive-analysis/
# Clones: stripe.com, square.com, adyen.com (from file, one per line)
```

---

## Output Structure

After running `/clone https://example.com`:

```
cloned-websites/example-com/
│
├── HTML & Structure
│   ├── index.html
│   ├── pages/
│   │   ├── about.html
│   │   ├── pricing.html
│   │   └── ...
│   └── sitemap.txt
│
├── Styling
│   ├── styles/
│   │   ├── main.css
│   │   ├── responsive.css
│   │   └── animations.css
│   ├── tailwind.config.js
│   ├── theme.ts
│   ├── design-tokens.json
│   ├── styles.css (CSS variables)
│   └── design-tokens.yaml
│
├── Scripts & Interactivity
│   ├── scripts/
│   │   ├── main.js
│   │   ├── animations.js
│   │   └── ...
│   └── interactions-map.json (event listener guide)
│
├── Assets
│   ├── images/
│   ├── fonts/
│   ├── videos/
│   └── svg/
│
├── Design System Documentation
│   ├── DESIGN.md (complete system doc)
│   ├── SKILL.md (AI-agent executable)
│   ├── design-tokens.html (visual preview)
│   ├── design-tokens.md (markdown reference)
│   ├── accessibility-report.md (WCAG 2.2 AA audit)
│   ├── anti-patterns.md (Cynthia doctrine violations)
│   └── color-palette.svg (visual swatch)
│
├── Analysis & Metadata
│   ├── clone-manifest.json
│   │   ├── source_url
│   │   ├── clone_date
│   │   ├── files_cloned
│   │   ├── size_bytes
│   │   ├── estimated_rebuild_time
│   │   └── analysis_summary
│   ├── responsive-breakpoints.json
│   ├── font-manifest.json
│   ├── performance-metrics.json
│   └── dependency-graph.json (library detection)
│
└── README.md (how to use this clone)
```

---

## Options & Flags

```bash
# Basic cloning
/clone <url>                              # Clone everything

# Mode selection
/clone <url> --mode full                  # Default: HTML + CSS + JS + Design tokens + Assets
/clone <url> --mode design-only           # Design tokens only (no HTML/CSS cloning)
/clone <url> --mode structure-only        # HTML + CSS only, no design analysis
/clone <url> --mode tokens-only           # Just the 8 design token formats

# Asset handling
/clone <url> --with-assets                # Download all images, fonts, videos
/clone <url> --offline                    # Create offline-ready version (embed fonts, images)
/clone <url> --images-only                # Only download images, not fonts
/clone <url> --no-assets                  # Structure only, no downloads

# Output control
/clone <url> --output ./my-clones/        # Custom output directory
/clone <url> --to-memory                  # Save to studio/memory/cloned-websites/
/clone <url> --zip                        # Compress output to .zip file
/clone <url> --format html+json           # Output specific formats only

# Analysis depth
/clone <url> --deep-analysis              # Extended: dependency detection, library identification, perf audit
/clone <url> --wcag-full                  # Run comprehensive WCAG audit (slower)
/clone <url> --no-analysis                # Skip design analysis, clone structure only

# Batch operations
/clone --batch urls.txt --output ./cloned/ # Clone multiple URLs from file
/clone --batch urls.txt --parallel 3      # Parallel cloning (3 at a time)

# Caching & updates
/clone <url> --skip-cache                 # Don't use cached version
/clone <url> --update-existing             # Re-clone existing clone, merge changes

# Integration
/clone <url> --cynthia-check              # Validate against Cynthia design doctrine
/clone <url> --competitor-analysis        # Format for competitive analysis
/clone <url> --reference-for-job <job-id> # Link clone to specific design job
```

---

## How Each Agent Uses CLONE

### RALPHY (Frontend Builder)
```
Job: "Build like Stripe's checkout flow"

1. RALPHY: /clone https://stripe.com/checkout
2. Output: HTML structure + tailwind.config.js + theme.ts
3. RALPHY: Studies SKILL.md for design patterns
4. RALPHY: Uses tailwind.config.js as reference
5. RALPHY: Builds 3 variations based on extracted patterns
```

### MARCO (Competitive Analyst)
```
Task: Analyze top 5 payment processors

1. MARCO: /clone --batch payments.txt --competitor-analysis
2. Clones: stripe.com, square.com, adyen.com, paypal.com, braintree.com
3. Output: 5 complete DESIGN.md files + WCAG reports
4. MARCO: Compares palettes, accessibility, anti-patterns
5. MARCO: Documents findings in studio/memory/competitive-analysis/
```

### LENA (Reviewer)
```
Task: Audit client's current site before redesign

1. LENA: /clone https://client-site.com --wcag-full
2. Output: accessibility-report.md + design-tokens.json + anti-patterns.md
3. LENA: Scores ACC axis using WCAG report
4. LENA: Flags design law violations
5. LENA: Creates baseline for "before/after" comparison
```

### EXPERIENCE ARCHITECT
```
Task: Create design brief with reference system

1. ARCHITECT: /clone https://reference-site.com --design-only
2. Output: DESIGN.md + SKILL.md + design-tokens.*
3. ARCHITECT: Attaches SKILL.md to design brief
4. ARCHITECT: Notes: "Match reference palette in V1"
5. ARCHITECT: RALPHY receives brief with tokens pre-extracted
```

---

## Installation & Setup

### One-Time Setup

```bash
# Install dependencies
npm install -g designlang design-md-chrome puppeteer

# Or via Rust CLI
cargo install synthia-clone

# Verify installation
cynthia clone --version
```

### Via Claude Code

```bash
# Already configured in project settings
# Just use: /clone <url>
```

---

## CLI Commands

### Via Rust CLI

```bash
# Single URL
cynthia clone https://example.com --output ./clones/

# Batch mode
cynthia clone --batch urls.txt --output ./clones/ --parallel 3

# Design tokens only
cynthia clone https://example.com --mode tokens-only --output ./tokens/

# Full analysis
cynthia clone https://example.com --deep-analysis --wcag-full --with-assets

# Save to memory
cynthia clone https://example.com --to-memory --competitor-analysis
```

### Via Node/npm

```bash
# Single clone
npx designlang https://example.com

# With Puppeteer for full page cloning
node clone.js https://example.com --with-assets --offline
```

---

## What Gets Cloned

### ✓ Fully Cloned (HTML/CSS/JS)

- Page structure (HTML)
- All CSS (external stylesheets, inline styles, CSS-in-JS)
- JavaScript (event listeners, animations, state management)
- Fonts (with optional offline embedding)
- Images (with optional optimization)
- Videos (meta and preview)
- SVGs (inline and file-based)
- Responsive design (media queries preserved)
- Animations (CSS keyframes and GSAP preserved)

### ✓ Extracted (Design System)

- Color palette (dominant, secondary, accent colors)
- Typography scale (all font sizes, weights, line-heights)
- Spacing system (all margin/padding/gap values)
- Shadow system (depth levels)
- Border radius patterns
- Animation specs (easing, duration, delay)
- Interactive states (hover, focus, active, disabled, error)
- Accessibility compliance (WCAG 2.2 AA)
- Anti-patterns (violations of Cynthia doctrine)

### ⚠ Partially Cloned (Context Needed)

- Backend API calls (endpoints mapped, but not cloned)
- Authentication (noted, not replicated)
- Dynamic content (structure cloned, data may be empty)
- Real-time features (structure cloned, websockets noted)

### ✗ Not Cloned

- Server-side logic
- Databases
- Authentication credentials
- User data
- Private API keys

---

## Accuracy & Validation

### What's 100% Accurate

✓ HTML structure — exact DOM copy  
✓ CSS values — pixel-perfect computed styles  
✓ Fonts & sizes — extracted from getComputedStyle()  
✓ Colors — exact hex/RGB values  
✓ Animations — CSS keyframes 1:1  
✓ Responsive breakpoints — media query detection  

### What Requires Verification

⚠ JavaScript behavior — may need manual testing  
⚠ State management — structure preserved, state may differ  
⚠ Performance metrics — depends on cloning environment  

### Validation Checklist Before Using Clone

```markdown
- [ ] HTML structure renders correctly?
- [ ] All CSS styles apply visually?
- [ ] Colors match original screenshot?
- [ ] Typography sizes/weights correct?
- [ ] Responsive layout works on mobile?
- [ ] Animations play smoothly?
- [ ] Interactive elements respond to clicks?
- [ ] Forms are functional (even if backend disconnected)?
- [ ] Images load from local assets?
- [ ] Fonts render correctly?

Failing items → note in clone manifest for manual fixes
```

---

## Use Cases

### 1. Reference-Based Design
Client: "Make it look like [competitor]"
→ Clone competitor → Extract tokens → Build matching design

### 2. Competitive Analysis
Audit 10 competitors' design systems automatically
→ Compare palettes, accessibility, layouts

### 3. Design Replication
Replicate interaction patterns from Awwwards winners
→ Clone → Extract → Study → Build variations

### 4. Accessibility Baseline
Client's current site WCAG score before redesign
→ Clone → Generate WCAG report → Document gaps

### 5. Design System Learning
Build reference library of proven design systems
→ Clone top 20 SaaS sites → Archive design tokens → Reuse patterns

### 6. Performance Analysis
Understand how high-performing sites structure CSS
→ Clone → Analyze asset pipeline → Document best practices

### 7. Technology Stack Detection
Detect libraries, frameworks, build tools
→ Clone → Analyze dependencies → Inform tech decisions

---

## Performance & Costs

### Time Savings

| Task | Manual | CLONE | Speedup |
|------|--------|-------|---------|
| Clone website | 1–2 hours | 2–5 min | **12–60x** |
| Extract design tokens | 60–90 min | 5 min | **12–18x** |
| WCAG audit | 60–120 min | 10 min | **6–12x** |
| Competitive analysis (5 sites) | 5+ hours | 15 min | **20x** |

### Storage & Bandwidth

- Average clone size: 5–50 MB (depends on assets)
- With compression (.zip): 1–15 MB
- Batch cloning (10 sites): ~100 MB total

---

## Troubleshooting

### Clone hangs/times out?
```
Problem: "Clone is taking too long"
Solution:
  1. Use --no-assets flag to skip image downloads
  2. Use --structure-only mode
  3. Increase timeout: --timeout 120000
  4. Check network: site may be slow or blocking
```

### Assets don't download?
```
Problem: "Images/fonts are missing"
Solution:
  1. Add --with-assets flag
  2. Check CORS headers (some sites block external requests)
  3. Use --offline to embed data URIs
  4. Manually download critical assets
```

### Design tokens look wrong?
```
Problem: "Colors/typography don't match screenshot"
Solution:
  1. Site may use CSS-in-JS (harder to extract)
  2. Run manual verification from browser DevTools
  3. Check clone-manifest.json for warnings
  4. File issue if major discrepancy
```

### JavaScript not working?
```
Problem: "Interactions don't work in cloned version"
Solution:
  1. Cloned JS may reference server APIs
  2. Use --no-api-calls flag to stub endpoints
  3. Some dynamic content requires backend
  4. Document limitations in README
```

---

## Memory & Archive Integration

After cloning, automatically saved to:

```
studio/memory/cloned-websites/
├── stripe-com/
│   ├── clone-manifest.json
│   ├── DESIGN.md
│   ├── SKILL.md
│   ├── design-tokens.json
│   ├── [full clone folder]
│   └── README.md
│
├── linear-app/
│   ├── clone-manifest.json
│   ├── DESIGN.md
│   ├── ...
│
└── competitive-analysis/
    ├── payments-processors/ (Stripe + Square + Adyen + PayPal + Braintree)
    ├── design-agencies/ (Awwwards winners)
    └── saas-products/ (Top 10 SaaS sites)
```

Fully searchable and indexable by agents.

---

## Cynthia Integration

Cloned design systems are automatically checked against:

✓ Banned fonts → Flag if detected  
✓ Color discipline → Suggest constraints  
✓ Spacing coherence → Validate scale ratios  
✓ WCAG compliance → Score ACC axis  
✓ Animation quality → Motion best practices  
✓ Anti-patterns → Cynthia doctrine violations  

All findings documented in clone output.

---

## Repository & Tools

**Tools Used:**
- **Puppeteer** — Full website cloning
- **design-md-chrome** — Design system extraction
- **designlang** — Design token export
- **axe-core** — WCAG accessibility audit
- **cheerio** — HTML parsing
- **postcss** — CSS analysis
- **jsdom** — JavaScript evaluation

**GitHub Repos:**
- https://github.com/bergside/design-md-chrome (MIT)
- https://github.com/Manavarya09/design-extract (design tokens)

---

## Next Steps

1. **Install** — `npm install -g designlang puppeteer`
2. **Test** — `/clone https://stripe.com`
3. **Review** — Check generated DESIGN.md and tokens
4. **Archive** — Move to studio/memory/cloned-websites/
5. **Reuse** — Reference in future design jobs

---

**Status**: 🟢 **Ready to use** — All components integrated and available.
