# Webflow Template Forge Workflow

## Phase 0: Intake

Collect:

- target URL
- client ID
- permission basis
- output mode
- brand overlay
- deployment target

Create a run folder:

```txt
clients/prospects/<client_id>/
```

## Phase 1: Browser Capture

Use a browser harness to capture:

- desktop screenshot
- tablet screenshot
- mobile screenshot
- DOM snapshot
- computed style summary
- network asset inventory
- console report
- page metadata

Expected files:

```txt
source-capture/screenshots/desktop.png
source-capture/screenshots/tablet.png
source-capture/screenshots/mobile.png
source-capture/dom-snapshot.html
source-capture/network-assets.json
source-capture/console-report.json
source-capture/metadata.json
```

## Phase 2: Design Extraction

Extract:

- colors
- type scale
- font families
- spacing scale
- border radius
- shadows
- layout sections
- breakpoint behavior
- animation cues
- Webflow-specific class patterns

Write:

```txt
design-system/design-system.json
design-system/tokens.css
design-system/component-map.md
```

## Phase 3: Usability Audit

Apply Steve Krug-style checks:

- Can the user tell what the page is within five seconds?
- Is the primary CTA obvious?
- Is navigation self-evident?
- Are sections scannable?
- Are forms short and clear?
- Is mobile thumb flow usable?
- Is there visual noise that can be removed?

Write:

```txt
qa-reports/steve-krug.md
```

## Phase 4: Rebuild Planning

Choose one output mode:

- `static-html`
- `react-tailwind`
- `fluid-ai`
- `yappyverse-character-site`

Create:

```txt
rebuilt-frontend/REBUILD_PLAN.md
```

## Phase 5: Frontend Reconstruction

Build the selected output.

Rules:

- use semantic HTML
- preserve visual hierarchy
- avoid unnecessary dependencies
- use mock integrations only
- keep generated frontend portable
- avoid hard-coded secrets

## Phase 6: Smart-Site Overlay

For Yappyverse/Fluid AI outputs, add placeholders:

- voice agent
- booking
- analytics
- Hexona/GHL lead bridge
- offer stack
- media showcase
- 30-day demo countdown

## Phase 7: QA

Check:

- visual resemblance
- responsive behavior
- accessibility basics
- broken links
- missing assets
- console errors
- copy clarity

Write:

```txt
qa-reports/QA_REPORT.md
```

## Phase 8: Handoff

Create:

```txt
client-handoff/CLIENT_HANDOFF.md
client-handoff/NEXT_ACTIONS.md
client-handoff/DEPLOYMENT_NOTES.md
```

The handoff must clearly state:

- what was captured
- what was rebuilt
- what is placeholder-only
- what requires credentials
- what requires human approval
- what the next agent should do
