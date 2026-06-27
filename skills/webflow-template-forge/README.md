# Webflow Template Forge

Webflow Template Forge is a Pi Agent skill for turning authorized Webflow sites and Webflow-style templates into clean, reusable frontend systems.

It is designed for Yappyverse Smart Sites, Hexona/GHL client demos, and character landing pages.

## What It Does

- Captures public pages through a browser harness.
- Extracts layout, assets, style tokens, and responsive behavior.
- Rebuilds pages into portable HTML or React/Tailwind components.
- Adds optional Fluid AI/Yappyverse smart-site placeholders.
- Produces handoff documents for clients and future agents.

## Why It Exists

The agency needs a repeatable way to create fast demo sites from existing inspiration without manually rebuilding every layout. This skill gives Pi Agent a standard operating procedure for capture, analysis, rebuild, QA, and handoff.

## Where Outputs Go

Do not write generated client output into this skill folder. Use:

```txt
clients/prospects/<client_id>/
```

## First Target

The first target site for smoke testing is:

```txt
https://quien-es-bambu.webflow.io/
```

A second design-domain target may be inspected when available:

```txt
https://quien-es-bambu.design.webflow.com/
```

## Required Runtime Tools

- Node.js 20+
- Playwright or browser harness
- HTML parser
- CSS parser
- image downloader
- accessibility checker
- optional screenshot comparison tool
- optional LLM provider routed through Pi Agent

## Skill Status

Initial instruction scaffold installed. Implementation scripts are intentionally thin until the browser harness and repo conventions are verified in the local Pi Agent runtime.
