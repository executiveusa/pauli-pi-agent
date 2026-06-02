# Shockwave Local Console

Shockwave is the local Electron markdown editor that serves as the Pi Agent second-brain console.

## What it is

- Electron desktop app (not a web app, not Vercel)
- Markdown / Obsidian-style editor with wiki-links and backlinks
- Hosts the Pi Agent chat sidebar
- Manages skills (Pi Agent capability modules)

## Source

- Repo: `https://github.com/stephengpope/shockwave.git`
- Local path: `E:\AGENT WORKSPACE\shockwave-archonx`
- Branch: `archonx/shockwave-second-brain`

## Active Workspace

`E:\MENTAL MODELS` is registered as the primary workspace.

## Skills Installed

Skills live at: `%APPDATA%\Shockwave\pi-agent\skill-library\`

- `emerald-tablets-prime-directive` — locked Prime Directive (always on)
- `shockwave-obsidian-graph-operator` — graph traversal and mapping

## Launch

```powershell
cd "E:\AGENT WORKSPACE\shockwave-archonx"
npm run dev
```

## Pi Agent Second Brain Root

Canonical path: `E:\MENTAL MODELS`

Rules:
- Read existing notes before creating new ones.
- Preserve wiki-links and folder structure.
- Never delete or overwrite without explicit approval.
- New operational logs → `_ops/`
- New project/company maps → `_registry/`
- New system prompts and guardrails → `_system/`

## Links

[[ArchonX OS Map]]
[[Pi Agent Operating Map]]
[[Emerald Tablets™ Prime Directive]]
