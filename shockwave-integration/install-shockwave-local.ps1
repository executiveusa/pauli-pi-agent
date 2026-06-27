# install-shockwave-local.ps1
# Pi Agent / ArchonX — Shockwave Second-Brain Installer
# Run this on your Windows machine as a regular user (no admin needed).
# Usage: pwsh -ExecutionPolicy Bypass -File install-shockwave-local.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$SECOND_BRAIN   = "E:\MENTAL MODELS"
$AGENT_WORKSPACE = "E:\AGENT WORKSPACE"
$SHOCKWAVE_DIR  = "$AGENT_WORKSPACE\shockwave-archonx"
$SHOCKWAVE_REPO = "https://github.com/stephengpope/shockwave.git"
$SKILL_LIB      = "$env:APPDATA\Shockwave\pi-agent\skill-library"
$SETTINGS_PATH  = "$env:APPDATA\Shockwave\settings.json"
$SCRIPT_DIR     = Split-Path -Parent $MyInvocation.MyCommand.Definition
$SKILLS_SRC     = "$SCRIPT_DIR\skills"
$NOTES_SRC      = "$SCRIPT_DIR\mental-models"

Write-Host ""
Write-Host "============================================"
Write-Host " Pi Agent / ArchonX — Shockwave Installer"
Write-Host "============================================"
Write-Host ""

# ── Phase 1: Verify environment ──────────────────────────────────────────────

Write-Host "[Phase 1] Checking environment..."

$nodeVersion = node -v 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Node.js not found. Install from https://nodejs.org (v22.19.0 or newer)."
    exit 1
}
$nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*','$1')
if ($nodeMajor -lt 22) {
    Write-Error "Node $nodeVersion found — need v22.19.0+. Run: winget install OpenJS.NodeJS.LTS"
    exit 1
}
Write-Host "  Node: $nodeVersion  OK"

$npmVersion = npm -v 2>&1
Write-Host "  npm:  $npmVersion  OK"

$gitVersion = git --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git not found. Install from https://git-scm.com"
    exit 1
}
Write-Host "  Git:  $gitVersion  OK"
Write-Host ""

# ── Phase 2: Workspace directories ───────────────────────────────────────────

Write-Host "[Phase 2] Setting up workspace directories..."

foreach ($dir in @($AGENT_WORKSPACE, $SHOCKWAVE_DIR)) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  Created: $dir"
    } else {
        Write-Host "  Exists:  $dir"
    }
}
Write-Host ""

# ── Phase 3: Clone or update Shockwave ───────────────────────────────────────

Write-Host "[Phase 3] Cloning / updating Shockwave..."

if (Test-Path "$SHOCKWAVE_DIR\.git") {
    Write-Host "  Repo already cloned. Checking status..."
    Push-Location $SHOCKWAVE_DIR
    $branch = git branch --show-current
    Write-Host "  Current branch: $branch"
    git status --short
    Pop-Location
} else {
    Write-Host "  Cloning from $SHOCKWAVE_REPO ..."
    git clone $SHOCKWAVE_REPO $SHOCKWAVE_DIR
    Write-Host "  Clone complete."
}

Push-Location $SHOCKWAVE_DIR

# Create or switch to integration branch
$branchExists = git branch --list "archonx/shockwave-second-brain"
if ($branchExists) {
    git checkout "archonx/shockwave-second-brain"
    Write-Host "  Switched to branch: archonx/shockwave-second-brain"
} else {
    git checkout -b "archonx/shockwave-second-brain"
    Write-Host "  Created branch: archonx/shockwave-second-brain"
}
Write-Host ""

# ── Phase 4: Install npm dependencies ────────────────────────────────────────

Write-Host "[Phase 4] Installing npm dependencies..."
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install failed. Check errors above."
    Pop-Location
    exit 1
}
Write-Host "  npm install: PASS"
Write-Host ""

# ── Phase 5: Install skills into Shockwave skill library ─────────────────────

Write-Host "[Phase 5] Installing Pi Agent skills..."

if (-not (Test-Path $SKILL_LIB)) {
    New-Item -ItemType Directory -Path $SKILL_LIB -Force | Out-Null
    Write-Host "  Created skill library: $SKILL_LIB"
}

$skills = @("emerald-tablets-prime-directive", "shockwave-obsidian-graph-operator")
foreach ($skill in $skills) {
    $src  = "$SKILLS_SRC\$skill"
    $dest = "$SKILL_LIB\$skill"
    if (Test-Path $src) {
        if (-not (Test-Path $dest)) {
            Copy-Item -Recurse -Path $src -Destination $dest
            Write-Host "  Installed skill: $skill"
        } else {
            Copy-Item -Recurse -Force -Path "$src\*" -Destination $dest
            Write-Host "  Updated skill:   $skill"
        }
    } else {
        Write-Warning "  Skill source not found: $src"
    }
}
Write-Host ""

# ── Phase 6: Enable skills in Shockwave settings ─────────────────────────────

Write-Host "[Phase 6] Registering skills in Shockwave settings..."

if (Test-Path $SETTINGS_PATH) {
    $settings = Get-Content $SETTINGS_PATH -Raw | ConvertFrom-Json

    # Ensure nested structure exists
    if (-not $settings.codingAgent) { $settings | Add-Member -NotePropertyName codingAgent -NotePropertyValue @{} }
    if (-not $settings.codingAgent.skills) { $settings.codingAgent | Add-Member -NotePropertyName skills -NotePropertyValue @{} }
    if (-not $settings.codingAgent.skills.global) { $settings.codingAgent.skills | Add-Member -NotePropertyName global -NotePropertyValue @{} }

    $settings.codingAgent.skills.global | Add-Member -NotePropertyName "emerald-tablets-prime-directive" -NotePropertyValue "enabled" -Force
    $settings.codingAgent.skills.global | Add-Member -NotePropertyName "shockwave-obsidian-graph-operator" -NotePropertyValue "enabled" -Force

    $settings | ConvertTo-Json -Depth 20 | Set-Content $SETTINGS_PATH -Encoding UTF8
    Write-Host "  Skills registered in settings.json"
} else {
    Write-Host "  settings.json not found yet — Shockwave will create it on first launch."
    Write-Host "  Skills will be enabled on next launch after Shockwave initializes."
}
Write-Host ""

# ── Phase 7: Create second-brain folder structure ────────────────────────────

Write-Host "[Phase 7] Preparing E:\MENTAL MODELS structure..."

$subfolders = @("_system", "_ops", "_registry", "_archonx", "_pi-agent", "_shockwave")
foreach ($folder in $subfolders) {
    $path = "$SECOND_BRAIN\$folder"
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "  Created: $path"
    } else {
        Write-Host "  Exists:  $path"
    }
}
Write-Host ""

# ── Phase 8: Copy starter notes (only if missing) ────────────────────────────

Write-Host "[Phase 8] Installing starter notes (skip if already present)..."

function Copy-NoteIfMissing {
    param($srcFile, $destFile)
    if (-not (Test-Path $destFile)) {
        $destDir = Split-Path $destFile
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        Copy-Item $srcFile $destFile
        Write-Host "  Created: $destFile"
    } else {
        Write-Host "  Exists (skipped): $destFile"
    }
}

$noteMap = @{
    "_system\Emerald Tablets™ Prime Directive.md" = "_system\Emerald Tablets™ Prime Directive.md"
    "_archonx\ArchonX OS Map.md"                  = "_archonx\ArchonX OS Map.md"
    "_archonx\Shockwave Integration Status.md"    = "_archonx\Shockwave Integration Status.md"
    "_pi-agent\Pi Agent Operating Map.md"         = "_pi-agent\Pi Agent Operating Map.md"
    "_shockwave\Shockwave Local Console.md"        = "_shockwave\Shockwave Local Console.md"
    "_registry\Repository Company Registry.md"    = "_registry\Repository Company Registry.md"
    "_ops\Tasks NOW.md"                           = "_ops\Tasks NOW.md"
}

foreach ($rel in $noteMap.Keys) {
    $src  = "$NOTES_SRC\$($noteMap[$rel])"
    $dest = "$SECOND_BRAIN\$rel"
    if (Test-Path $src) {
        Copy-NoteIfMissing $src $dest
    } else {
        Write-Warning "  Source note not found: $src"
    }
}
Write-Host ""

# ── Phase 9: Verification write test ─────────────────────────────────────────

Write-Host "[Phase 9] Write verification test..."
$tasksNow = "$SECOND_BRAIN\_ops\Tasks NOW.md"
$testLine = "- [ ] Shockwave live verification test — written by Pi Agent installer."
if (Test-Path $tasksNow) {
    $content = Get-Content $tasksNow -Raw
    if ($content -notmatch [regex]::Escape($testLine)) {
        Add-Content $tasksNow "`n$testLine"
        Write-Host "  Test line appended to Tasks NOW.md"
    } else {
        Write-Host "  Test line already present in Tasks NOW.md"
    }
    # Confirm on disk
    if (Get-Content $tasksNow -Raw | Select-String -SimpleMatch $testLine) {
        Write-Host "  Write verification: PASS"
    }
} else {
    Write-Warning "  Tasks NOW.md not found — check Phase 8"
}
Write-Host ""

# ── Phase 10: Register E:\MENTAL MODELS as Shockwave workspace ───────────────

Write-Host "[Phase 10] Registering E:\MENTAL MODELS workspace in Shockwave settings..."

if (Test-Path $SETTINGS_PATH) {
    $settings = Get-Content $SETTINGS_PATH -Raw | ConvertFrom-Json

    $wsPath = $SECOND_BRAIN
    $wsId   = "mental-models-primary"
    $wsName = "Mental Models"

    # Check if workspace is already registered
    $existing = $settings.workspaces | Where-Object { $_.path -eq $wsPath }
    if (-not $existing) {
        $newWs = [PSCustomObject]@{ id = $wsId; name = $wsName; path = $wsPath }
        $settings.workspaces += $newWs
        $settings.activeWorkspaceId = $wsId
        $settings | ConvertTo-Json -Depth 20 | Set-Content $SETTINGS_PATH -Encoding UTF8
        Write-Host "  Workspace registered: $wsPath"
    } else {
        Write-Host "  Workspace already registered: $wsPath"
    }
} else {
    Write-Host "  settings.json not yet created — open Shockwave and add E:\MENTAL MODELS manually:"
    Write-Host "    File > Open Folder > E:\MENTAL MODELS"
}
Write-Host ""

# ── Summary ──────────────────────────────────────────────────────────────────

Pop-Location

Write-Host "============================================"
Write-Host " Installation Complete"
Write-Host "============================================"
Write-Host ""
Write-Host " Shockwave repo:   $SHOCKWAVE_DIR"
Write-Host " Second brain:     $SECOND_BRAIN"
Write-Host " Skill library:    $SKILL_LIB"
Write-Host ""
Write-Host " NEXT STEPS:"
Write-Host "  1. Launch Shockwave:"
Write-Host "     cd '$SHOCKWAVE_DIR'"
Write-Host "     npm run dev"
Write-Host ""
Write-Host "  2. In Shockwave, confirm:"
Write-Host "     - E:\MENTAL MODELS opens as the active workspace"
Write-Host "     - Settings > Agent Chat > Skills shows emerald-tablets-prime-directive"
Write-Host "     - Settings > Agent Chat > Skills shows shockwave-obsidian-graph-operator"
Write-Host "     - Chat sidebar can read _ops\Tasks NOW.md"
Write-Host ""
Write-Host "  3. Mark the checklist in _archonx\Shockwave Integration Status.md"
Write-Host ""
Write-Host " VERDICT: PARTIAL — installer complete; visual verification required after launch."
Write-Host ""
