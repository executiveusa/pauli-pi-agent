# UI Intelligence Skill — Full Operating Doctrine

## Mission

Use this skill to take full control of a real browser, tour any web application like a real user, and produce a complete intelligence package:

- A structured design system (colors, typography, spacing, component styles)
- A step-by-step user journey map with every interaction documented
- A microinteraction log with exact timing and CSS values
- Plain-language documentation rewritten for non-technical users
- A pixel-accurate React/TypeScript component library

## Core Belief

Most developers who need to replicate, audit, or rebuild a UI start from screenshots and guesswork.

This skill eliminates guesswork.

Every design token is extracted from computed styles. Every transition timing is clocked. Every error message is captured. Every component variant is documented. The output is production-ready.

## PI Relationship

This is a skill folder for PI.

PI remains the master agent.

This skill is loaded only when the user wants to analyze or replicate a user interface.

## Branch and Folders

```text
Branch: claude/ui-intelligence-upgrade-DEuib
Skill folder: skills/ui-intelligence/
```

Analysis outputs are saved outside the skill:

```text
factory/ui-analyses/
```

## Trigger Phrases

Load this skill for any of the following:

- Analyzing a live URL
- Documenting UI/UX of an application
- Extracting a design system
- Generating components from an existing interface
- Rewriting app documentation in plain language
- Mapping user journeys through a product
- Auditing microinteractions and animation patterns

## The 7-Phase Workflow

Execute these phases in order for every UI analysis. Checkpoint after each phase.

---

### Phase 1 — Initialize and Log In

Navigate to the target URL. Authenticate if required. Wait for full load. Screenshot the initial state. Save: URL, page title, authenticated user, timestamp.

---

### Phase 2 — Extract the Design System

Inspect computed styles from the home or landing page. Extract every design token. Save as `design-system.json` with these sections:

**colors** — primary, secondary, background, text (default + muted), borders, error, success, warning, link

**typography** — font families, sizes (h1 through label), weights, line heights, letter spacing

**spacing** — base unit, full scale

**components** — for every visible component (button, input, card, modal, dropdown, badge, tab, toast): padding, height, border-radius, shadow, font-size, font-weight, border-color, background-color

---

### Phase 3 — Map the Entire User Journey

For every major page and flow:

1. Navigate to the page
2. Screenshot at rest
3. Identify every interactive element
4. For each element, capture every state: default, hover, active, disabled, loading, error, success
5. For streaming or animated content, screenshot at 0ms, 200ms, 500ms, 1000ms, and complete
6. Write a journey document per page:

```
## Page: [Name]

### What the user sees first
[visual hierarchy — dominant element, color, headline]

### Step-by-step user flow
Step N: [description]
- Element: [name or label]
- Action: [click / hover / type / scroll]
- Result: [what happens]
- Timing: [instant / Xms animation / Xs load]
- Subtle detail: [non-obvious but felt behavior]

### Microinteractions on this page
[list every animation, transition, state change, loading behavior, feedback moment with timing]

### Copy on this page
[every label, placeholder, error, success, tooltip, help text — exact words]
```

---

### Phase 4 — Deep Dive on Microinteractions

Revisit the most interaction-heavy parts of the app. Document with CSS precision:

**Chatbot / streaming text** — render method (char / word / sentence), cursor presence, speed, style differences between streaming and complete

**Buttons** — color transition on hover, timing in ms, scale or shadow effect, active/press behavior, loading state

**Forms** — validation trigger (blur / submit / keystroke), error state: color + icon + message position, success state

**Modals** — entry animation (fade / slide / scale), speed, backdrop opacity, focus management

**Toasts** — position, entry/exit animation, auto-dismiss timing, manual dismiss capability

**Dropdowns** — open animation, chevron rotation and speed, item hover state

**Navigation** — active state (underline / background / color), hover state

Save everything to `microinteractions.md` with exact CSS values wherever determinable.

---

### Phase 5 — Find and Rewrite All Documentation

Extract all existing documentation from: help buttons, onboarding overlays, tooltips, settings explanations, error messages, guide pages, FAQ sections, about pages.

Rewrite every piece following these rules:

- No jargon. If a technical term must appear, immediately explain it in plain language.
- Write for someone smart who has never used software like this.
- Replace: configure → set up, integrate → connect, authenticate → sign in, endpoint → address, sync → update
- Lead with the "why" before the "how"
- Active voice always
- Sentences under 20 words
- Paragraphs of 3 sentences maximum
- Use real-world analogies
- Bold the most important words
- Clear headings for skimmers

Output structure: Getting Started / How to [primary action] / How to [secondary action] / Troubleshooting / FAQ

Save as `simplified-docs.md`.

---

### Phase 6 — Generate React Components

Using `design-system.json`, generate a TypeScript React component for every distinct UI component observed.

Minimum required components:

Button, Input, Card, Modal, Toast, Dropdown, Tabs, Navigation, Badge, Spinner, Checkbox, Link

Each component must:
- Use exact color values from `design-system.json`
- Use exact spacing values from `design-system.json`
- Use exact typography values from `design-system.json`
- Support every variant and state observed (primary/secondary, default/hover/active/disabled/loading/error/success)
- Include exact transition timing from Phase 4
- Be TypeScript with typed props
- Have one-line comments on each style value citing its source (e.g., `// design-system: colors.primary`)

Save each component as `component-library/[ComponentName].tsx`. Include `component-library/index.ts` exporting all components.

---

### Phase 7 — Deliver the Final Report

Compile all output into `factory/ui-analyses/analysis-[app-name]/`.

Write a `README.md` that covers:
- What app was analyzed
- How many pages were toured
- How many components were found
- Primary color and primary font
- 3–5 key UX insights that most people would not notice on first use

---

## Quality Rules

- Be specific. No generic descriptions.
- If a screenshot action fails, retry once. Then document the failure and continue.
- If a navigation fails, document the failure and move to the next element.
- Never store login credentials. Use them in-session only.
- If a phase runs longer than 5 minutes, checkpoint what exists and continue in the next step.
- If analysis is estimated to cost over $50 in API usage, stop and report the estimate before continuing.

## Required Outputs (Checklist)

- [ ] `design-system.json`
- [ ] `user-journey-map.md`
- [ ] `microinteractions.md`
- [ ] `simplified-docs.md`
- [ ] `component-library/` (12+ components)
- [ ] `component-library/index.ts`
- [ ] `README.md`
