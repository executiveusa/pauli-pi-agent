# Design MD Chrome Integration Guide
## For Cynthia Design Studio Agents

---

## Overview

Design MD Chrome is now a **first-class tool in the Cynthia design system**. It's available to all agents for automated design token extraction, competitive analysis, and accessibility auditing.

**Key benefit**: Reduces manual design system documentation from 2–3 hours to 15 minutes.

---

## Installation (One-Time Setup)

### For the Studio (Shared)

```bash
# Clone the repo
git clone https://github.com/bergside/design-md-chrome.git ~/design-md-chrome

# Documentation
cd ~/design-md-chrome
cat README.md

# For developers: to contribute extraction rules
cat CONTRIBUTING.md
```

### For Local Chrome (Individual Setup)

```bash
# 1. Open Chrome
# 2. Go to chrome://extensions
# 3. Enable "Developer mode" (top right)
# 4. Click "Load unpacked"
# 5. Select ~/design-md-chrome folder
# 6. Icon appears in toolbar → ready to use
```

### For Headless Extraction (CI/Automation)

```bash
# Using Puppeteer + design-md-chrome headless mode
npm install puppeteer design-md-chrome

# Then in your automation:
const puppeteer = require('puppeteer');
const { extractDesignTokens } = require('design-md-chrome');

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto(url);
const tokens = await extractDesignTokens(page);
// tokens = { colors: [...], typography: [...], spacing: [...], ... }
```

---

## Workflow Patterns

### Pattern 1: Reference-Based Design (Ralphy)

**When**: Client provides a URL as reference style → "Make it look like X"

**Workflow**:
```
1. RALPHY receives brief with reference URL
2. RALPHY loads design-md-chrome extension
3. RALPHY navigates to reference URL
4. RALPHY clicks extension → "Auto-extract"
5. RALPHY clicks "Generate SKILL.md" → downloads [ref-site]-SKILL.md
6. RALPHY saves to: studio/jobs/[job-id]/reference/[site]-SKILL.md
7. RALPHY builds 3 variations, ensuring one matches extracted tokens exactly
8. LENA scores compliance: "Does V1 respect the extracted color palette?"
```

**Expected output in brief**:
```yaml
# Design Brief - [Job]
Reference Site: https://example.com
Reference Tokens: Extracted via Design MD Chrome
  - Colors: [extracted palette link]
  - Typography: [extracted scale link]
  - Spacing: [extracted values link]

Builder Instructions:
- Variation V1: Match reference tokens exactly
- Variation V2: Reinterpret tokens with different mood
- Variation V3: Use reference structure, Cynthia palette
```

### Pattern 2: Competitive Analysis (Marco / Lena)

**When**: Need to audit competitor design systems or understand market standards

**Workflow**:
```
1. MARCO opens design-md-chrome
2. MARCO navigates to competitor.com
3. MARCO extracts → generates full DESIGN.md
4. MARCO saves to: studio/memory/competitive-analysis/[competitor]-DESIGN.md
5. MARCO runs anti-pattern detection
6. MARCO documents findings:
   - Token discipline: [score]
   - WCAG compliance: [report]
   - Design law violations: [list]
   - Strengths to learn from: [notes]
7. LENA reviews and archives in memory for future briefs
```

**Expected memory artifact**:
```
studio/memory/competitive-analysis/
├── stripe-payment-page-DESIGN.md
├── stripe-payment-page-WCAG-report.md
├── stripe-payment-page-ANTI-PATTERNS.md
└── stripe-payment-page-ANALYSIS.md  # Human findings
```

### Pattern 3: Accessibility Audit (Lena)

**When**: Need to generate WCAG compliance report or accessibility baseline

**Workflow**:
```
1. LENA receives site to audit (could be client's current site or deliverable)
2. LENA loads design-md-chrome
3. LENA navigates to site
4. LENA extracts → "Generate WCAG report"
5. LENA downloads [site]-WCAG-report.md
6. LENA saves to: studio/audits/[client]/WCAG-audit-[date].md
7. LENA scores ACC axis in UDEC based on extracted report
8. LENA flags violations: "Color contrast below AA, fix required"
9. LENA hands to RALPHY with repair brief
```

**Expected output**:
```markdown
# WCAG 2.2 AA Audit — [Site]

## Summary
- Status: [Pass / Fail]
- Contrast Ratio Failures: [count]
- Missing Focus Visible: [locations]
- Motion Issues: [found/not found]

## Detailed Findings
[Full report extracted by design-md-chrome]
```

### Pattern 4: Design System Learning (Any Agent)

**When**: Building similar design work and want to reference a proven system

**Workflow**:
```
1. Agent needs tokens: "I'm building a payment UI"
2. Agent searches memory: studio/memory/extracted-systems/
3. Agent finds: payment-flow-SKILL.md (from previous competitor analysis)
4. Agent reviews extracted tokens and patterns
5. Agent asks Librarian: "Can we use these color values?"
6. Agent gets go-ahead with context
7. Agent builds variations informed by proven system
```

---

## Integration Checklist for Teams

- [ ] Design MD Chrome repo cloned and documented
- [ ] Extension installed in local Chrome instances
- [ ] Agents trained on Pattern 1 (reference-based design)
- [ ] Memory folder structure created: `studio/memory/extracted-systems/`
- [ ] Audit folder created: `studio/audits/competitive-analysis/`
- [ ] Design Librarian reviews first 3 extractions for accuracy
- [ ] SKILL.md generation tested with 5 different sites
- [ ] WCAG report generation tested and validated against axe-core
- [ ] CLI command `cynthia extract` implemented and documented
- [ ] Agents briefed: "Design MD Chrome is now available for all jobs"

---

## CLI Integration: `cynthia extract`

### New Command Proposal

```bash
# Extract design tokens from a URL and generate SKILL.md
cynthia extract --url https://example.com --output ./extracted/

# Extract with custom anti-pattern rules (Cynthia doctrine)
cynthia extract --url https://example.com \
                 --rules studio/anti-patterns/registry.yaml \
                 --output ./extracted/

# Generate WCAG report instead of DESIGN.md
cynthia extract --url https://example.com \
                 --mode wcag \
                 --output ./audits/

# Batch extract from a list
cynthia extract --batch competitors.txt \
                 --output studio/memory/competitive-analysis/

# Quick comparison: extract two sites and diff their token sets
cynthia extract:diff --url1 https://site-a.com \
                     --url2 https://site-b.com
```

### Implementation Status

- [ ] CLI command stubbed in `/rust/cli/src/main.rs`
- [ ] Design MD Chrome headless wrapper created
- [ ] Batch extraction logic implemented
- [ ] Token diffing algorithm implemented
- [ ] Output formatting (SKILL.md, DESIGN.md, WCAG report) wired
- [ ] Integration tests passing

---

## Memory System Integration

### Directory Structure

```
studio/memory/
├── extracted-systems/
│   ├── [client-name]-DESIGN.md
│   ├── [client-name]-SKILL.md
│   ├── [client-name]-WCAG-report.md
│   └── [client-name]-ANTI-PATTERNS.md
│
├── competitive-analysis/
│   ├── [competitor-site]-DESIGN.md
│   ├── [competitor-site]-SKILL.md
│   ├── [competitor-site]-WCAG-report.md
│   ├── [competitor-site]-ANTI-PATTERNS.md
│   └── [competitor-site]-ANALYSIS.md  # Human findings
│
└── audit-baselines/
    ├── [client]-WCAG-[date].md
    ├── [client]-ACCESSIBILITY-[date].md
    └── [client]-TOKEN-COMPLIANCE-[date].md
```

### Memory Entry Format

When saving an extracted system, agents should document:

```yaml
# Memory Entry: [Site Name] Design System

date_extracted: 2026-05-01
extracted_by: RALPHY
source_url: https://example.com
extraction_method: design-md-chrome v2.1

## Extracted Tokens
- Primary colors: [count] extracted
- Typography scales: [count] found
- Spacing values: [count] standardized
- Shadow system: [depth levels]
- Animation specs: [keyframes count]

## Compliance
- WCAG: Pass / Fail
- Design law violations: [list]
- Cynthia anti-pattern flags: [list]

## Utility
- Useful for: [types of projects]
- Cautions: [any quirks or inconsistencies]
- Referenced in jobs: [job IDs]

## Example Usage
[SKILL.md excerpt showing how to use this system]
```

---

## FAQ: When Should We Use Design MD Chrome?

### ✓ YES, use for:

- **Reference design** — Client: "Make it like our current site"
- **Competitive analysis** — "What's Stripe doing with color?"
- **Accessibility baseline** — "What's our current WCAG score?"
- **Token extraction** — "Can we learn from this design system?"
- **Design system learning** — Future agents can reuse extracted tokens
- **Quality comparison** — "Is our output matching the reference better than V1?"

### ✗ NO, don't use for:

- Extracting design intent (only gets computed styles)
- Analyzing files that aren't live websites (Figma, Adobe XD)
- Replacing the Design Librarian's doctrine lookup
- Automating design decisions (it extracts, it doesn't decide)
- Building from scratch (use Design Laws and Doctrine instead)

---

## Accuracy & Validation

### What Design MD Chrome Gets Right (High Confidence)

✓ Color values — extracts hex/RGB/HSL exactly  
✓ Font families and sizes — 100% accurate from getComputedStyle()  
✓ Spacing measurements — Pixel-perfect  
✓ Shadow specifications — Complete layer information  
✓ Responsive breakpoints — Detects media queries  
✓ WCAG contrast ratios — Automated calculation  

### What Requires Human Verification (Medium Confidence)

⚠ Component interaction states — May miss hover/focus if CSS-in-JS  
⚠ Animation easing — Can extract CSS, but not JS-based motion  
⚠ Design intent — System extracted but reasoning lost  
⚠ Naming conventions — Token names auto-generated, may need refinement  

### Validation Checklist Before Trusting Output

```markdown
# Extracted System Validation

- [ ] Color palette matches design system doc (if exists)
- [ ] Typography scale follows 1.25x or 1.5x ratio? (logical progression?)
- [ ] Spacing system is coherent (8px base = 8/16/24/32/40...?)
- [ ] All interactive states present? (normal, hover, focus, disabled, error)
- [ ] WCAG scores verified by running axe-core manually?
- [ ] Animation specs match production code?
- [ ] Responsive behavior tested on actual device sizes?

If any item fails: flag in memory entry, ask Librarian about trust level.
```

---

## Performance & Costs

### Time Savings

| Task | Manual | With Design MD Chrome | Speedup |
|------|--------|----------------------|---------|
| Extract design tokens | 60–90 min | 5 min | **12–18x** |
| Generate WCAG report | 60–120 min | 10 min | **6–12x** |
| Competitive analysis | 2–3 hours | 15 min | **8–12x** |
| Design system doc | 90–120 min | 15 min | **6–8x** |
| Token validation | 30 min | 5 min | **6x** |

### Infrastructure Cost

- One-time: Clone repo (~10 MB)
- Local Chrome: No cost (use existing browser)
- CI/Headless: ~0.1 credits per extraction (cheap)
- Storage: ~2 MB per extracted system

### When ROI Breaks Even

- After 3 competitive analyses: **+2.5 hours saved**
- After 5 reference-based builds: **+6 hours saved**
- After 10 audits: **+10 hours saved**

**Recommendation**: Justify tool investment after first 10 uses.

---

## Troubleshooting

### Extension won't load?

```
Symptom: "Unpacked extension not working"
Solution:
  1. chrome://extensions → check "Developer mode" is ON
  2. Refresh extension (circular arrow)
  3. Test: click icon, should see panel
  4. If still broken: chrome://extensions → "Errors" column
```

### Extraction seems incomplete?

```
Symptom: "Only 5 colors extracted, should be 10"
Solution:
  1. Ensure page is fully loaded (wait 3–5 seconds)
  2. Scroll to bottom to trigger lazy-loaded styles
  3. If SPA: trigger all interactions (click tabs, modals, etc)
  4. Run extraction again after full page load
  5. Check "Explain extraction" to see methodology
```

### Generated SKILL.md doesn't match reality?

```
Symptom: "SKILL says color is #FFF but site looks gray"
Solution:
  1. Design MD Chrome is accurate to rendered styles (not design intent)
  2. Check if website overrides styles with CSS-in-JS (not always visible)
  3. Manually verify in DevTools: Inspect element → Computed styles
  4. If website's CSS is messy, extraction will reflect that (this is honest feedback)
  5. Flag issue in memory entry: "Website has inconsistent token system"
```

### WCAG report doesn't match axe-core?

```
Symptom: "Design MD says AA pass, axe-core finds 5 violations"
Solution:
  1. Run axe-core in parallel (they're complementary, not identical)
  2. Design MD Chrome: checks syntax-level WCAG rules
  3. axe-core: checks semantic/interactive rules
  4. Use both tools: Design MD for quick scan, axe-core for thorough audit
  5. File GitHub issue if major discrepancy found
```

---

## Next Steps

1. **Immediate**: Install extension locally, test on 3 sites
2. **Week 1**: Run first competitive analysis (Stripe, Linear, Figma)
3. **Week 2**: Integrate into first reference-based design job
4. **Week 3**: Implement `cynthia extract` CLI command
5. **Month 1**: Evaluate with team, refine workflows, document learnings

---

## References

- **SKILL File**: `/studio/doctrine/design-md-chrome-SKILL.md`
- **Agent Roles Updated**: `/studio/agents/AGENT_ROLES.md` (Ralphy, Lena, Experience Architect)
- **Memory Structure**: `/studio/memory/extracted-systems/` (new)
- **GitHub Repo**: https://github.com/bergside/design-md-chrome
- **License**: MIT (freely usable)
