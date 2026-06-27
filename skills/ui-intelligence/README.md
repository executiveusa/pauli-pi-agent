# UI Intelligence Skill

## Purpose

This skill gives PI the ability to take full browser control of any web application, tour it like a real user, and produce a complete intelligence report.

Output includes: a design system in JSON, a full user journey map, microinteraction documentation, simplified plain-language docs, and a pixel-accurate React component library.

## Architecture Position

This is a PI skill, not a separate agent.

PI remains the master agent.

This skill lives in its own folder:

```text
Skill folder: skills/ui-intelligence/
```

Analysis outputs are saved outside the skill:

```text
factory/ui-analyses/analysis-[app-name]/
```

## Trigger Phrases

Load this skill when the user says any of the following:

- "analyze this app"
- "analyze this UI"
- "analyze https://..."
- "document the UI for"
- "take a tour of this product"
- "tell me everything about this interface"
- "I need to rebuild this interface"
- "extract the design system from"
- "generate components for"
- "document how this app works"
- "what does this UX look like"

## Required Inputs

Before starting, confirm:

1. The URL of the app
2. Login credentials if the app requires authentication
3. Any specific pages or flows that need extra depth

## Required Browser Tool

This skill requires the Orgo computer MCP (`orgoamcp`) for live browser control.

Available operations:
- `orgo.navigate(url)` — go to any URL
- `orgo.screenshot()` — capture the current screen
- `orgo.click(selector)` — click any element
- `orgo.type(selector, text)` — type into any field
- `orgo.hover(selector)` — trigger hover states
- `orgo.scroll(direction, amount)` — scroll the page
- `orgo.wait(ms)` — wait for animations or loading
- `orgo.keyboard(key)` — press keyboard keys
- `orgo.getPageState()` — return current DOM structure

If Orgo MCP is unavailable, fall back to:
- `WebFetch` for static page inspection
- `WebSearch` for public product documentation
- Manual design token extraction from screenshots if provided

## Output Location

All analysis outputs are written to:

```text
factory/ui-analyses/analysis-[app-name]/
├── design-system.json
├── user-journey-map.md
├── microinteractions.md
├── simplified-docs.md
├── component-library/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   ├── Dropdown.tsx
│   ├── Tabs.tsx
│   ├── Navigation.tsx
│   ├── Badge.tsx
│   ├── Spinner.tsx
│   ├── Checkbox.tsx
│   ├── Link.tsx
│   └── index.ts
└── README.md
```
