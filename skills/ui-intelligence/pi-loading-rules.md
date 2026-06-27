# UI Intelligence — PI Loading Rules

## When to Load This Skill

Load this skill when the user says any of the following (or anything semantically equivalent):

| Trigger | Example |
|---|---|
| URL + analyze | "Analyze https://app.example.com" |
| URL + document | "Document the UI at this link" |
| URL + tour | "Take a tour of this product" |
| URL + rebuild | "I need to rebuild this interface" |
| Design system extraction | "Extract the design system from this app" |
| Component generation | "Generate components for this UI" |
| Documentation rewrite | "Rewrite the docs for this app in plain English" |
| User journey mapping | "Map the user journey through this product" |
| Microinteraction audit | "What are all the animations in this app" |
| Competitive analysis | "Analyze the UI of our competitor" |

## What to Ask Before Starting

Always confirm these three inputs before executing:

1. **URL** — the target app
2. **Credentials** — username/password if login is required
3. **Priority flows** — any specific pages or flows the user wants extra depth on

If all three are present in the user's message, skip asking and proceed directly to Phase 1.

## Lazy Load Condition

Do not load this skill unless one of the trigger phrases above is detected.

This skill is NOT loaded by default on every session.

## Output Destination

Always write analysis outputs to:

```
factory/ui-analyses/analysis-[app-name]/
```

Never write inside the skill folder itself.

## Fallback Behavior

If Orgo computer MCP is not available:

1. Use `WebFetch` to retrieve static page HTML and inspect structure
2. Use `WebSearch` to find any publicly documented design system or component library
3. Ask the user to provide screenshots if live browser control is unavailable
4. Note the limitation clearly at the top of every output file

## Checkpoint Protocol

After completing each phase, write a checkpoint file:

```
factory/ui-analyses/analysis-[app-name]/.checkpoint
```

Content: `{ "last_completed_phase": N, "timestamp": "...", "url": "..." }`

If the session resumes, read the checkpoint and continue from the next phase instead of restarting.
