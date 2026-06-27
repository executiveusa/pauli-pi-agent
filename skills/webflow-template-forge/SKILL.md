# Webflow Template Forge Skill

## Mission

Turn any authorized public Webflow site, Webflow template, or Webflow-style landing page into a clean, reusable, AI-managed frontend package that Pi Agent can inspect, rebuild, audit, and hand off.

This skill is for Yappyverse Smart Sites, client demo sites, and reusable character landing pages. It keeps the frontend simple and portable while Pi Agent manages intelligence, media, QA, and handoff from the backend/control layer.

## Primary Use Cases

1. Clone a public Webflow page for analysis.
2. Extract layout, assets, typography, colors, spacing, animation patterns, and responsive behavior.
3. Rebuild the page as clean static HTML or React/Tailwind/Framer components.
4. Add Yappyverse/Fluid AI smart-site modules: voice agent placeholder, booking placeholder, analytics placeholder, GHL/Hexona placeholder, and media sections.
5. Generate a client handoff package with design notes, component map, and next actions.
6. Produce a downgrade-ready static export when a 30-day demo does not convert.

## Required Inputs

- `target_url`: public URL to inspect.
- `client_id`: stable folder slug.
- `project_type`: `webflow-template`, `client-demo`, `yappyverse-character`, or `internal-site`.
- `output_mode`: `analysis-only`, `static-html`, `react-tailwind`, `fluid-ai`, or `handoff`.
- `permission_basis`: note proving the work is authorized, owned, purchased, or used as inspiration.

## Non-Negotiable Safety Rules

- Never extract or store secrets.
- Never scrape authenticated Webflow Designer pages unless the user provides an authorized browser session inside their own agent runtime.
- Never bypass paywalls, logins, robots restrictions, or license restrictions.
- Never claim a rebuild is an exact Webflow export unless it came from an authorized Webflow export.
- Use visual reconstruction and clean-room componentization when the template is inspiration-only.
- Keep all client artifacts isolated under `clients/prospects/<client_id>/` or another explicit output path.

## Canonical Workflow

1. **Capture**
   - Open the target URL with a browser harness.
   - Save desktop, tablet, and mobile screenshots.
   - Save DOM snapshot, computed styles summary, console errors, network asset inventory, and metadata.

2. **Analyze**
   - Identify page sections.
   - Extract design tokens: colors, fonts, spacing, radius, shadows, animation timing, breakpoints.
   - Detect Webflow class patterns and CMS/form/embed patterns.
   - Produce `clone-manifest.json` and `design-system.json`.

3. **Rebuild Plan**
   - Map each visual section into reusable components.
   - Decide whether to output static HTML, React/Tailwind, or Fluid AI components.
   - Create a Steve Krug usability pass before writing implementation code.

4. **Reconstruct**
   - Build clean components.
   - Use local assets or approved generated replacements.
   - Add smart-site placeholders only; do not inject real keys.

5. **Verify**
   - Run visual comparison.
   - Check accessibility basics.
   - Check responsive behavior.
   - Check missing assets and broken links.

6. **Handoff**
   - Create `DESIGN.md`, `CLIENT_HANDOFF.md`, `QA_REPORT.md`, and `NEXT_ACTIONS.md`.
   - Explain what was cloned, what was rebuilt, what still needs human approval, and what can be automated next.

## Output Folder Contract

```txt
clients/prospects/<client_id>/
  source-capture/
    screenshots/
    dom-snapshot.html
    network-assets.json
    console-report.json
  design-system/
    design-system.json
    tokens.css
    typography.md
  rebuilt-frontend/
    static-html/
    react-tailwind/
    fluid-ai/
  qa-reports/
    visual-diff.md
    accessibility.md
    steve-krug.md
  client-handoff/
    CLIENT_HANDOFF.md
    NEXT_ACTIONS.md
```

## Yappyverse Style Overlay

When the output is a Yappyverse or character site, apply these constraints:

- Sepia/noir base.
- Controlled red and neon-teal accent pops.
- Cinematic cartoon / claymotion-adjacent presentation.
- Mystery-first silhouettes when the character has not been revealed.
- No uncontrolled style drift.
- Use the locked character/style registry before generating new visuals.

## Fluid AI Overlay

When `output_mode=fluid-ai`, add these modules as placeholders:

- `VoiceAgentWidget`
- `BookingEmbed`
- `AnalyticsBridge`
- `GHLHexonaLeadBridge`
- `MediaShowcase`
- `OfferStack`
- `ClientDemoCountdown`

All placeholders must use mock config until secrets are injected in the deployment environment.

## Command Pattern

```bash
pi skill webflow-template-forge clone <target_url> --client <client_id>
pi skill webflow-template-forge analyze <client_id>
pi skill webflow-template-forge rebuild <client_id> --mode react-tailwind
pi skill webflow-template-forge audit <client_id>
pi skill webflow-template-forge handoff <client_id>
```

## Done Criteria

A run is complete when it produces:

- screenshots for at least 3 breakpoints
- `clone-manifest.json`
- `design-system.json`
- rebuild plan
- usability audit
- frontend output or implementation packet
- client handoff docs

## Human Approval Gates

Human approval is required before:

- publishing to a production domain
- using a paid or licensed template commercially
- connecting real CRM/API/analytics credentials
- deploying generated images or videos under a client brand
- modifying a live Webflow project through an authenticated session
