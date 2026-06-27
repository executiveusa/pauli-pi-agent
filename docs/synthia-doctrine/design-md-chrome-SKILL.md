# SKILL: DESIGN MD CHROME — AUTOMATED DESIGN EXTRACTION & DOCUMENTATION

**Use this skill whenever:** RALPHY needs to reverse-engineer an existing design, MARCO is auditing a competitor, LENA needs to analyze visual systems, or any agent needs to automatically extract design tokens and generate DESIGN.md / SKILL.md documentation from a live website.

---

## OVERVIEW

Design MD Chrome is a Chrome extension that performs **machine-assisted visual design analysis**. It reads computed styles from any webpage and generates:

1. **DESIGN.md** — Canonical design system documentation (TypeUI format)
2. **SKILL.md** — AI-agent-executable design skill files
3. **Design tokens** — Colors, typography, spacing, shadows, animations
4. **Accessibility audit** — WCAG 2.2 AA compliance matrix
5. **Anti-pattern detection** — Identifies violations of design laws
6. **Component specs** — Interactive patterns and their constraints

---

## WHEN TO USE THIS SKILL

### ✓ Use design-md-chrome for:

- **Competitive design analysis** — MARCO audits competitor sites and learns their system
- **Visual regression detection** — Compare two versions of a site and highlight token drift
- **Design system extraction** — Extract tokens from a Figma prototype before hand-coding
- **Accessibility baseline** — Generate WCAG compliance report for audit deliverables
- **Agent handoffs** — RALPHY uses extracted tokens to match a client's visual style
- **Brand voice audit** — LENA analyzes typography and color psychology of competitor copy
- **Motion capture** — Extract animation specs (easing, duration, transform-origin) for GSAP replication

### ✗ Don't use for:

- Generating layouts (it extracts, doesn't create)
- Building components (it documents, doesn't implement)
- As a replacement for design thinking (use Design Librarian for doctrine)
- Static analysis of design files (it works on rendered websites only)

---

## HOW TO USE: STEP-BY-STEP

### Step 1: Load the Extension

```bash
# Clone the repo
git clone https://github.com/bergside/design-md-chrome.git

# Open Chrome DevTools
# Settings → More tools → Extensions → Enable "Developer mode"
# Load unpacked → select design-md-chrome folder
```

### Step 2: Extract on Any Website

```
1. Navigate to the website you want to analyze
2. Click the Design MD extension icon
3. Click "Auto-extract" to analyze all visible styles
4. Review the extracted tokens panel
```

### Step 3: Generate Documentation

```
✓ Click "Generate DESIGN.md" → outputs TypeUI format
✓ Click "Generate SKILL.md" → outputs AI-agent-executable format
✓ Click "Download" → save as local markdown files
✓ Click "Explain extraction" → see methodology transparency
```

### Step 4: Integrate into Studio

```bash
# Move the generated files to your job workspace
mv ~/Downloads/DESIGN.md ~/synthia-superdesign/studio/jobs/job-xxx/exports/

# Reference in your design brief
# LENA can now build copy against extracted typography scale
# RALPHY can match the color palette and spacing system
```

---

## OUTPUT FORMAT: DESIGN.MD

Generated DESIGN.md includes these sections:

```markdown
# DESIGN.md — [Site Name]

## Mission & Brand Context
[Extracted from meta tags, hero copy, navigation]

## Design Tokens
### Typography
- Headline: [Font, scale, weight, line-height, letter-spacing]
- Body: [Font, scale, weight, line-height]
- Labels: [Font, scale, weight]

### Color Palette
- Primary: [hex] [usage context]
- Secondary: [hex] [usage context]
- Accent: [hex] [usage context]
- Backgrounds: [hex] [usage context]
- Text: [hex] [contrast ratio vs background]

### Spacing System
- Base unit: [px or rem]
- Scale: [8px, 16px, 24px, 32px, 48px, ...]

### Shadows & Depth
- Light: [shadow values]
- Medium: [shadow values]
- Heavy: [shadow values]

## Component Interaction Specs
### Button States
- Idle: [styles]
- Hover: [styles, animation]
- Active: [styles, animation]
- Disabled: [styles, contrast ratio]

### Form Inputs
- Default: [height, padding, border-radius, typography]
- Focus: [outline style, color, animation]
- Error: [color, icon, messaging]

## Accessibility Guidelines (WCAG 2.2 AA)
- Minimum contrast ratio: [extracted]
- Keyboard navigation: [detected or missing]
- Focus visible: [yes/no, style]
- Motion: [prefers-reduced-motion respected? yes/no]

## Anti-patterns Detected
- [List of violations from Cynthia doctrine]

## Implementation Rules
- When spacing is used, always use the extracted scale (no ad-hoc spacing)
- When colors are mixed, maintain palette discipline (no arbitrary gradients)
- When typography sizes change, they follow the extracted scale ratios
```

---

## OUTPUT FORMAT: SKILL.MD

Generated SKILL.md is executable by Claude agents:

```markdown
# SKILL: [Site Name] Design System

**Use this skill whenever:** Building UI that matches [site]'s visual language.

---

## Quick Reference

### Brand Color Palette
\`\`\`
Primary:    [hex]  # [usage]
Secondary:  [hex]  # [usage]
Accent:     [hex]  # [usage]
\`\`\`

### Typography Scale
[Show all extracted font sizes with visual hierarchy]

### Spacing System
[Show all extracted spacing values in px/rem]

---

## Component Patterns
[List each component with its constraints and interactive states]
```

---

## INTEGRATION WITH CYNTHIA AGENTS

### RALPHY (Frontend Agent)
```
When starting a new design job:
1. MARCO sends RALPHY a URL of a reference site
2. RALPHY runs design-md-chrome extraction
3. RALPHY imports the SKILL.md tokens into their CSS system
4. RALPHY builds 3 variations respecting the extracted system
5. LENA scores compliance against the reference tokens
```

### MARCO (Reviewer Agent)
```
When auditing a competitor:
1. MARCO extracts their site using design-md-chrome
2. MARCO generates anti-pattern report
3. MARCO compares their palette against Cynthia doctrine
4. MARCO flags any WCAG violations
5. MARCO archives the DESIGN.md for future reference
```

### LENA (Reviewer Agent)
```
When scoring UDEC:
1. LENA receives RALPHY's output + original reference SKILL.md
2. LENA uses color contrast report to verify ACC axis
3. LENA compares extracted motion specs against RALPHY's GSAP code
4. LENA flags typography scale deviations
5. LENA scores higher if reference system was accurately replicated
```

---

## DATA EXTRACTION METHODOLOGY

Design MD Chrome extracts using **computed style introspection** — it reads `window.getComputedStyle()` from the DOM, not design files. This means:

### Accuracy: ✓ High
- Extracts what the browser actually renders
- Captures real CSS values, not design intent
- Includes runtime overrides and media queries

### Coverage: ✓ Complete
- Every DOM node analyzed
- Generates comprehensive token set
- Detects all applied shadows, animations, gradients

### Limitations:
- Cannot extract design intent (only computed values)
- Cannot see Figma-only work (must be deployed)
- Cannot analyze Adobe XD or other tools natively
- Animation analysis limited to CSS transitions/keyframes (not JS)

---

## QUALITY CHECKS FOR EXTRACTED DATA

### Before trusting the output, verify:

1. **Color accuracy** — Compare extracted palette against design system doc (if exists)
2. **Typography scale** — Ensure ratios match documented scale (should be 1.25x or 1.5x)
3. **Spacing consistency** — Verify spacing values form a coherent system (8px base = 8/16/24/32...)
4. **Component completeness** — All interactive states extracted? (hover, focus, disabled, error)
5. **Accessibility** — Do reported contrast ratios match your WCAG audit? (run axe-core in parallel)

If extraction diverges from expectations, the website itself may not follow a disciplined system — **that's valuable audit data**.

---

## CYNTHIA DOCTRINE INTEGRATION

After extraction, the generated DESIGN.md should be scored against Cynthia design laws:

```
✓ Does it follow spacing rhythm? (DESIGN_LAWS.md: Law 3)
✓ Is color palette constrained? (No more than 6 primary colors?)
✓ Are typography scale ratios logical? (1.25x or 1.5x progression?)
✓ Are animations prefers-reduced-motion compliant? (DESIGN_LAWS.md: Law 7)
✓ Are form inputs 44px minimum height? (DESIGN_LAWS.md: Law 9)
✓ Is there atmospheric depth or just flat cards? (DESIGN_LAWS.md: Law 11)
```

Violations become **anti-pattern warnings** that agents should note in their audit reports.

---

## REPO & DOCUMENTATION

**GitHub**: https://github.com/bergside/design-md-chrome  
**License**: MIT  
**Community**: https://github.com/bergside/design-md-chrome/discussions

---

## TROUBLESHOOTING

### Extension doesn't load?
- Ensure Chrome version ≥ 120
- Check chrome://extensions → "Developer mode" is ON
- Reload the extension after any code changes

### Extraction seems incomplete?
- Ensure the website is fully loaded (wait 3–5 seconds)
- Some frameworks (SPA) may need a manual scroll to trigger all styles
- Try running extraction twice for dynamic content

### Generated DESIGN.md looks wrong?
- The extraction is accurate to what the browser renders
- If the website's CSS is messy, the output will reflect that (this is honest)
- Use "Explain extraction" button to see the methodology
- File a GitHub issue with the problematic site as a test case

### SKILL.md doesn't work with my agent?
- Verify the SKILL.md format matches other Cynthia skills
- Add context hints for the agent: "This was auto-extracted from [site]"
- Include a link to the original reference for human verification
- Use SKILL.md as a supplement, not a replacement for design thinking

---

## ADVANCED: CUSTOM EXTRACTION RULES

Want to teach design-md-chrome your own anti-patterns?

1. Fork the repo: `git clone https://github.com/bergside/design-md-chrome.git`
2. Modify `src/extractors/patterns.js` to add your rules
3. Modify `src/validators/cynthia-doctrine.js` to flag custom violations
4. Load the modified extension and test
5. Contribute back if it's useful to the community

---

## EXPECTED UTILITY GAIN

### Time saved:
- Manual token extraction: 60–90 min → **5 min** (12x speedup)
- Competitive analysis: 2–3 hours → **15 min** (8–12x speedup)
- Accessibility audit generation: 1–2 hours → **10 min** (6–12x speedup)

### Quality improvements:
- RALPHY gets machine-verified reference tokens (fewer palette drift errors)
- LENA gets comprehensive WCAG report (faster scoring)
- MARCO gets formatted competitive analysis (documented and reusable)

### Knowledge capture:
- Every extraction becomes a reusable SKILL.md file
- Studio gradually builds a reference library of analyzed sites
- Future jobs can reference "extract similar to [site]" → instant context

---

## MEMORY & DOCUMENTATION

After each extraction, agents should save:

```
studio/memory/extracted-systems/
├── [client-name]-DESIGN.md
├── [client-name]-SKILL.md
├── [client-name]-WCAG-report.md
└── [client-name]-ANTI-PATTERNS.md
```

This becomes searchable context for future jobs.
