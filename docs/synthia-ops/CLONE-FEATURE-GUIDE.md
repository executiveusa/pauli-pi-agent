# CLONE Feature — Complete Integration Guide
## Unified Website Cloning & Design System Extraction

---

## Overview

**CLONE** is the master feature that consolidates **all** website cloning and design extraction capabilities into one simple interface:

- Drop a URL → Get everything about that website
- HTML structure + CSS + JavaScript
- Design system (colors, typography, spacing)
- WCAG accessibility audit
- Competitive analysis reports
- Asset management

---

## What CLONE Unifies

### 1. **Website Cloning** (Puppeteer)
Downloads and replicates:
- Full HTML structure (every page)
- All CSS (external, inline, CSS-in-JS)
- JavaScript (event listeners, animations, state)
- Assets (images, fonts, videos, SVGs)
- Responsive design & media queries

### 2. **Design System Extraction** (design-md-chrome)
Automatically generates:
- `DESIGN.md` — Complete system documentation
- `SKILL.md` — AI-agent executable version
- WCAG 2.2 AA accessibility audit
- Anti-pattern detection (Cynthia doctrine)
- Visual token preview

### 3. **Design Tokens Export** (designlang)
Exports in 8 formats:
- `design-tokens.md` — Markdown reference
- `design-tokens.json` — Raw data
- `design-tokens.yaml` — Configuration format
- `tailwind.config.js` — Ready-to-use Tailwind config
- `theme.ts` — React TypeScript theme
- `styles.css` — CSS custom properties
- `design-tokens.html` — Visual swatch preview
- `accessibility-report.md` — WCAG scores

### 4. **Analysis & Metadata**
- `clone-manifest.json` — Complete metadata
- `responsive-breakpoints.json` — Media query analysis
- `font-manifest.json` — Font library inventory
- `performance-metrics.json` — Load time, file sizes
- `dependency-graph.json` — Library & framework detection

---

## Quick Start

### Installation

```bash
# One-time setup
npm install -g designlang puppeteer design-md-chrome

# Or use Rust CLI (if compiled)
cargo install synthia-clone
```

### Usage Examples

```bash
# Clone everything from a website
cynthia clone https://stripe.com

# Clone just design tokens (faster)
cynthia clone https://linear.app --mode design-only

# Full clone with all assets (larger)
cynthia clone https://github.com --with-assets --offline

# Batch clone competitors
cynthia clone --batch competitors.txt --parallel 3

# Save directly to studio memory
cynthia clone https://example.com --to-memory --competitor-analysis
```

---

## Modes Explained

### `--mode full` (Default)
**What**: Complete clone of everything
**Includes**: HTML + CSS + JS + Design tokens + Assets  
**Time**: 2–5 minutes  
**Size**: 5–50 MB  
**Use case**: Reference-based design, full replication

```bash
cynthia clone https://example.com --mode full
```

### `--mode design-only`
**What**: Design system extraction only
**Includes**: DESIGN.md, SKILL.md, tokens (8 formats), WCAG report  
**Time**: 30–60 seconds  
**Size**: 1–3 MB  
**Use case**: Competitive analysis, token reuse, accessibility audit

```bash
cynthia clone https://example.com --mode design-only
```

### `--mode structure-only`
**What**: HTML + CSS only
**Includes**: Website clone, all stylesheets, responsive design  
**Time**: 1–2 minutes  
**Size**: 3–20 MB  
**Use case**: Code replication, layout study

```bash
cynthia clone https://example.com --mode structure-only
```

### `--mode tokens-only`
**What**: Design tokens only
**Includes**: 8 token formats (JSON, Tailwind, React, etc.)  
**Time**: 15–30 seconds  
**Size**: <1 MB  
**Use case**: Quick token reference, Tailwind config reuse

```bash
cynthia clone https://example.com --mode tokens-only
```

---

## Options & Flags

### Asset Management

```bash
# Include all images, fonts, videos
cynthia clone <url> --with-assets

# Create offline-ready version (embed fonts and images)
cynthia clone <url> --offline

# Just images, not fonts
cynthia clone <url> --images-only

# No assets at all (smallest output)
cynthia clone <url> --no-assets
```

### Analysis & Validation

```bash
# Deep analysis (library detection, perf audit, dependency graph)
cynthia clone <url> --deep-analysis

# Full WCAG 2.2 AA accessibility audit
cynthia clone <url> --wcag-full

# Validate against Cynthia design doctrine
cynthia clone <url> --cynthia-check

# Format output for competitive analysis
cynthia clone <url> --competitor-analysis
```

### Output Control

```bash
# Custom output directory
cynthia clone <url> --output ./my-clones/

# Save directly to studio memory
cynthia clone <url> --to-memory

# Compress output to .zip
cynthia clone <url> --zip

# Specific formats only (comma-separated)
cynthia clone <url> --format json,tailwind,react

# Skip cache, force re-clone
cynthia clone <url> --skip-cache
```

### Batch Operations

```bash
# Clone multiple URLs from file
cynthia clone --batch urls.txt

# Parallel cloning (3 jobs at a time)
cynthia clone --batch urls.txt --parallel 3

# Batch with output options
cynthia clone --batch competitors.txt \
              --output ./analysis/ \
              --competitor-analysis \
              --wcag-full
```

---

## Output Structure

After cloning, you get:

```
cloned-websites/stripe-com/
│
├── HTML & Structure
│   ├── index.html
│   ├── pages/
│   │   ├── about.html
│   │   ├── pricing.html
│   │   └── docs.html
│   └── sitemap.txt
│
├── Styling & Design Tokens
│   ├── styles/
│   │   ├── main.css
│   │   ├── responsive.css
│   │   └── animations.css
│   ├── design-tokens.json
│   ├── design-tokens.yaml
│   ├── design-tokens.md
│   ├── tailwind.config.js
│   ├── theme.ts
│   ├── styles.css (CSS variables)
│   └── design-tokens.html
│
├── JavaScript
│   ├── scripts/
│   │   ├── main.js
│   │   ├── animations.js
│   │   └── handlers.js
│   ├── interactions-map.json (event listener guide)
│   └── dependencies.json
│
├── Assets (if --with-assets)
│   ├── images/
│   ├── fonts/
│   ├── videos/
│   └── svg/
│
├── Design System Documentation
│   ├── DESIGN.md (complete system doc)
│   ├── SKILL.md (AI-agent executable)
│   ├── design-tokens.html (visual preview)
│   ├── accessibility-report.md (WCAG 2.2 AA audit)
│   ├── anti-patterns.md (Cynthia doctrine violations)
│   └── color-palette.svg (visual swatches)
│
├── Analysis & Metadata
│   ├── clone-manifest.json
│   │   ├── source_url
│   │   ├── clone_date
│   │   ├── files_cloned
│   │   ├── total_size_bytes
│   │   ├── estimated_rebuild_time
│   │   └── analysis_summary
│   ├── responsive-breakpoints.json
│   ├── font-manifest.json (library, weights, usage)
│   ├── performance-metrics.json (sizes, load times)
│   ├── dependency-graph.json (libraries detected)
│   └── technology-stack.json
│
└── README.md (how to use this clone)
```

---

## Workflow Examples

### Workflow 1: Reference-Based Design (Ralphy)

```
Job: "Make it look like Stripe's checkout"

Step 1: Clone the reference
cynthia clone https://stripe.com --mode full

Step 2: Extract tokens and documentation
Output includes: SKILL.md, design-tokens.json, tailwind.config.js

Step 3: Study the design system
RALPHY reads SKILL.md for design patterns
RALPHY imports tailwind.config.js for color system

Step 4: Build variations
RALPHY builds 3 variations:
  V1: Exact match to extracted tokens
  V2: Reinterpret with different mood
  V3: Use reference structure with Cynthia palette

Step 5: Review
LENA scores: "V1 perfectly adheres to reference system" ✓
```

### Workflow 2: Competitive Analysis (Marco)

```
Task: Analyze top 5 payment processors

Step 1: Create batch file (competitors.txt)
stripe.com
square.com
adyen.com
paypal.com
braintree.com

Step 2: Batch clone with analysis
cynthia clone --batch competitors.txt \
              --mode design-only \
              --competitor-analysis \
              --wcag-full \
              --cynthia-check

Step 3: Output: 5 complete analysis packages
Each contains:
  - DESIGN.md (design system doc)
  - design-tokens.json (reusable tokens)
  - accessibility-report.md (WCAG scores)
  - anti-patterns.md (what NOT to do)
  - clone-manifest.json (metadata)

Step 4: Archive in memory
Saves to: studio/memory/cloned-websites/competitive-analysis/

Step 5: Document findings
MARCO: "Stripe uses #0055FF, Square uses #1D1D1B, Adyen uses #0055FF
        All support WCAG AA, only Stripe has full AAA support
        Payment flows average 3 steps, similar spacing systems"
```

### Workflow 3: Accessibility Audit (Lena)

```
Task: Generate WCAG baseline for client's current site

Step 1: Clone with WCAG focus
cynthia clone https://client-site.com \
              --mode design-only \
              --wcag-full

Step 2: Review accessibility report
Output: accessibility-report.md contains:
  - WCAG 2.2 AA score: 72/100
  - Contrast ratio failures (3 elements)
  - Missing focus indicators (forms)
  - Motion not respecting prefers-reduced-motion
  - Missing ARIA labels (navigation)

Step 3: Score UDEC ACC axis
LENA uses report to score accessibility:
  ACC = 5.2/10 (failures in contrast, focus, ARIA)

Step 4: Create audit deliverable
Save to: studio/audits/client/WCAG-baseline-[date].md

Step 5: Document next steps
"Before redesign: ACC 5.2, fix required
 Target after redesign: ACC 8.5+
 Critical fixes: 1) Contrast ratios, 2) Form focus states"
```

### Workflow 4: Design System Learning (Any Agent)

```
Task: Need to reference a proven design system

Step 1: Search studio memory
Agent queries: studio/memory/cloned-websites/

Step 2: Find relevant reference
"I need a payment UI reference"
→ Finds: cloned-websites/stripe-payment-flow/

Step 3: Review extracted system
Opens: SKILL.md and design-tokens.json
Studies: color palette, form element styles, spacing system

Step 4: Ask for permission
AGENT: "Can we use Stripe's color palette for form elements?"
LIBRARIAN: "Yes, with these 2 Cynthia-specific modifications..."

Step 5: Build informed
AGENT builds using reference tokens as baseline
Result: Familiar patterns + brand-consistent styling
```

---

## CLI Command Reference

### Single Clone

```bash
# Most common: full clone
cynthia clone https://example.com

# Design tokens only (fast)
cynthia clone https://example.com --mode design-only

# With assets
cynthia clone https://example.com --with-assets

# Offline version
cynthia clone https://example.com --offline

# To studio memory
cynthia clone https://example.com --to-memory

# With validation
cynthia clone https://example.com --cynthia-check --wcag-full

# Compressed output
cynthia clone https://example.com --zip
```

### Batch Clone

```bash
# Basic batch
cynthia clone --batch urls.txt

# Parallel (3 jobs at a time)
cynthia clone --batch urls.txt --parallel 3

# Design tokens only
cynthia clone --batch urls.txt --mode design-only

# Full analysis
cynthia clone --batch urls.txt \
              --deep-analysis \
              --wcag-full \
              --cynthia-check

# Competitive format
cynthia clone --batch competitors.txt \
              --competitor-analysis \
              --to-memory

# Custom output
cynthia clone --batch urls.txt \
              --output ./competitive-analysis/ \
              --format json,tailwind
```

---

## Memory Integration

All clones automatically organized in studio memory:

```
studio/memory/cloned-websites/
├── [domain]-[date]/
│   ├── clone-manifest.json
│   ├── DESIGN.md
│   ├── SKILL.md
│   ├── design-tokens.*
│   ├── accessibility-report.md
│   ├── [full clone folder]
│   └── README.md
│
├── competitive-analysis/
│   ├── payment-processors/
│   │   ├── stripe-com/
│   │   ├── square-com/
│   │   ├── adyen-com/
│   │   └── comparative-analysis.md
│   │
│   ├── design-agencies/
│   │   ├── awwwards-winner-1/
│   │   ├── awwwards-winner-2/
│   │   └── ...
│   │
│   └── saas-products/
│       ├── linear-app/
│       ├── figma-com/
│       └── ...
│
└── reference-systems/
    ├── payment-checkout-patterns/
    ├── form-design-systems/
    ├── navigation-patterns/
    └── ...
```

Fully indexed and searchable by agents.

---

## Validation Checklist

After cloning, verify:

```markdown
# Clone Validation Checklist

- [ ] HTML structure renders correctly?
- [ ] All CSS styles applied visually?
- [ ] Colors match original screenshot?
- [ ] Typography sizes/weights correct?
- [ ] Responsive layout works on mobile/tablet?
- [ ] Animations play smoothly (if JS)?
- [ ] Interactive elements respond to clicks?
- [ ] Forms are functional?
- [ ] Images load from local assets (if --with-assets)?
- [ ] Fonts render correctly (if --with-assets)?
- [ ] Design tokens match extracted values?
- [ ] WCAG report matches axe-core results?

Failing items → Document in clone-manifest.json "known_issues"
```

---

## Performance & Costs

### Time Savings vs Manual Work

| Task | Manual | CLONE | Speedup |
|------|--------|-------|---------|
| Clone website | 1–2 hours | 2–5 min | **12–60x** |
| Design system extraction | 60–90 min | 5 min | **12–18x** |
| WCAG audit | 60–120 min | 10 min | **6–12x** |
| Competitive analysis (5 sites) | 5+ hours | 15 min | **20x** |
| Design token export | 30–45 min | 5 min | **6–9x** |

### Storage Requirements

- Single clone (no assets): 3–10 MB
- Single clone (with assets): 10–50 MB
- Batch (10 sites, design-only): 30–50 MB
- Batch (10 sites, full): 200+ MB

### Recommendation

**Use `--mode design-only` for competitive analysis** (smaller, faster)  
**Use `--mode full` for reference-based design** (complete replication)

---

## Tools & Dependencies

CLONE requires:

| Tool | Purpose | GitHub |
|------|---------|--------|
| Puppeteer | Full website cloning | [puppeteer/puppeteer](https://github.com/puppeteer/puppeteer) |
| design-md-chrome | Design system extraction | [bergside/design-md-chrome](https://github.com/bergside/design-md-chrome) |
| designlang | Design tokens export | [Manavarya09/design-extract](https://github.com/Manavarya09/design-extract) |
| axe-core | WCAG accessibility audit | [dequelabs/axe-core](https://github.com/dequelabs/axe-core) |
| cheerio | HTML parsing | [cheeriojs/cheerio](https://github.com/cheeriojs/cheerio) |
| postcss | CSS analysis | [postcss/postcss](https://github.com/postcss/postcss) |

Install all:
```bash
npm install -g designlang puppeteer design-md-chrome
```

---

## Cynthia Doctrine Integration

Clones are automatically validated against Cynthia doctrine:

✓ **No banned fonts** → Flag if: Inter, Roboto, Arial, Helvetica, Open Sans, Montserrat, Poppins, Lato  
✓ **Color discipline** → Suggest constraints if palette > 8 colors  
✓ **Spacing coherence** → Validate scale ratios (8px, 16px, 24px...)  
✓ **WCAG compliance** → Score ACC axis using accessibility report  
✓ **Animation quality** → Motion best practices (no jank, prefers-reduced-motion)  
✓ **Anti-patterns** → Flag violations of design laws  

Use `--cynthia-check` flag to enable validation.

---

## Troubleshooting

### Clone hangs or times out
```
Solution:
  1. Use --mode design-only (faster)
  2. Skip assets: remove --with-assets
  3. Increase timeout: export CLONE_TIMEOUT=120000
  4. Check network connectivity
```

### Assets don't download
```
Solution:
  1. Add --with-assets flag
  2. Check CORS headers (some sites block external requests)
  3. Use --offline to create data URIs
  4. Manually download critical assets
```

### Design tokens look wrong
```
Solution:
  1. Site may use CSS-in-JS (harder to extract)
  2. Verify from browser DevTools manually
  3. Check clone-manifest.json for warnings
  4. File issue if major discrepancy
```

### JavaScript not working in clone
```
Solution:
  1. Cloned JS may reference server APIs
  2. Some features require backend
  3. Document limitations in clone README
  4. Use --structure-only if JS not needed
```

---

## Next Steps

1. **Install** — `npm install -g designlang puppeteer`
2. **Test** — `cynthia clone https://stripe.com --mode design-only`
3. **Review** — Check generated DESIGN.md and tokens
4. **Archive** — Move to studio/memory/cloned-websites/
5. **Reuse** — Reference in future design jobs

---

## Documentation

- **Full SKILL**: `studio/doctrine/clone-SKILL.md`
- **Agent Integration**: `studio/agents/AGENT_ROLES.md` (Ralphy, Lena, Architect)
- **This Guide**: `studio/ops/CLONE-FEATURE-GUIDE.md`
- **GitHub**: https://github.com/bergside/design-md-chrome (MIT license)

---

**Status**: 🟢 **Production Ready** — CLONE feature is fully integrated and available to all agents.
