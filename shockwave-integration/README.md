# Shockwave Integration Package

Pi Agent / ArchonX — Shockwave Second-Brain installer.

## What's in this folder

```
shockwave-integration/
├── install-shockwave-local.ps1          ← Run this on your Windows machine
├── skills/
│   ├── emerald-tablets-prime-directive/ ← Locked Prime Directive skill
│   └── shockwave-obsidian-graph-operator/ ← Graph/backlink operator skill
└── mental-models/                       ← Starter notes for E:\MENTAL MODELS
    ├── _system/
    ├── _archonx/
    ├── _pi-agent/
    ├── _shockwave/
    ├── _registry/
    └── _ops/
```

## How to install

1. Clone this repo to your Windows machine (or `git pull` if already cloned).
2. Open PowerShell and run:

```powershell
cd path\to\pauli-pi-agent\shockwave-integration
pwsh -ExecutionPolicy Bypass -File install-shockwave-local.ps1
```

3. The script will:
   - Verify Node >= 22.19.0, npm, Git
   - Clone Shockwave to `E:\AGENT WORKSPACE\shockwave-archonx`
   - Run `npm install`
   - Install skills into `%APPDATA%\Shockwave\pi-agent\skill-library\`
   - Create folder structure in `E:\MENTAL MODELS` (never overwrites existing files)
   - Copy starter notes (skip if already present)
   - Append write verification line to `_ops\Tasks NOW.md`
   - Register `E:\MENTAL MODELS` as Shockwave workspace

4. Launch Shockwave:

```powershell
cd "E:\AGENT WORKSPACE\shockwave-archonx"
npm run dev
```

5. In Shockwave verify:
   - `E:\MENTAL MODELS` opens as the active workspace
   - Settings → Agent Chat → Skills shows `emerald-tablets-prime-directive`
   - Settings → Agent Chat → Skills shows `shockwave-obsidian-graph-operator`
   - Chat sidebar can read `_ops\Tasks NOW.md`

## Skill architecture

Skills use Shockwave's native skill format — a folder with `SKILL.md` inside.
They install to `%APPDATA%\Shockwave\pi-agent\skill-library\<skill-name>/`.

The `emerald-tablets-prime-directive` skill enforces the locked Pi Agent operating rules.
The `shockwave-obsidian-graph-operator` skill enables graph traversal and knowledge mapping.

## Safety rules

- The install script never overwrites existing notes.
- No secrets are committed to this repo.
- `E:\MENTAL MODELS` folder structure is created additive-only.
