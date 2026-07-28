# Master Agent Isolation Architecture

## Overview

Each agent (Hermes, Vyapari, Pauli, Kupuri, Cheggie, Cascadia) is a **master agent** that:
- Works with **ONLY their company's context** (strict isolation)
- Has their **own dedicated API key** (no shared credentials)
- Processes **private signals** (no cross-visibility)
- Generates **autonomous content** (no template copying)
- **Auto-commits updates** to their company folder
- Participates in **circulation** (info flow without cross-access)

---

## Isolation Rules

### 1. **Context Isolation**
Each agent ONLY sees:
```
companies/<company-name>/
├── _signals/raw/today.md        ← PRIVATE signals (no other agent sees)
├── content/approved/*.md         ← PRIVATE content (auto-saved)
├── content/drafts/               ← PRIVATE drafts
├── briefs/                       ← PRIVATE briefs
└── agent/<AGENT>.md              ← Agent config & memory
```

**No agent can access another agent's folder.**

### 2. **API Key Isolation**
Each agent has a dedicated API key:
- `HERMES_NOUS_API_KEY` → Hermes only (NousResearch)
- `VYAPARI_ANTHROPIC_API_KEY` → Vyapari only (Anthropic)
- `PAULI_ANTHROPIC_API_KEY` → Pauli only
- `KUPURI_ANTHROPIC_API_KEY` → Kupuri only
- `CHEGGIE_ANTHROPIC_API_KEY` → Cheggie only
- `CASCADIA_ANTHROPIC_API_KEY` → Cascadia only

**One agent cannot use another's key.**

### 3. **Data Flow Isolation**
```
Content Engine (runs for ALL companies)
    ↓
Writes company-specific signals:
    companies/macs-digital/_signals/raw/today.md
    companies/myweb-lane/_signals/raw/today.md
    companies/pauli-effect/_signals/raw/today.md
    (etc. - completely separate files)
    ↓
Each Agent (runs in parallel, no cross-access)
    ↓
    Hermes reads ONLY: companies/macs-digital/_signals/raw/today.md
    Vyapari reads ONLY: companies/myweb-lane/_signals/raw/today.md
    (etc.)
    ↓
Each Agent generates PRIVATE content:
    companies/macs-digital/content/approved/hermes-TIMESTAMP.md
    companies/myweb-lane/content/approved/vyapari-TIMESTAMP.md
    (etc.)
    ↓
Circulation Layer (READ-ONLY visibility)
    companies/_circulation/latest.json
    {
      "agents": [
        { "agent": "hermes", "company": "Macs Digital", "posts": 5 },
        { "agent": "vyapari", "company": "MyWebLane", "posts": 4 }
      ]
    }
```

**Agents see circulation summary, but not each other's content.**

---

## Configuration

### Step 1: Set Environment Variables

```bash
# Copy template
cp .env.example.agents .env.local

# Edit with your API keys
export HERMES_NOUS_API_KEY="your-nousresearch-key"
export VYAPARI_ANTHROPIC_API_KEY="your-anthropic-key"
export PAULI_ANTHROPIC_API_KEY="your-anthropic-key"
# ... etc for all 6 agents

# Enable isolation mode
export AGENT_ISOLATION_MODE=true
export AGENT_AUTO_UPDATE=true
export AGENT_COMMIT_UPDATES=true
```

### Step 2: Verify Isolation

```bash
# Test context isolation
cd packages/secrets
npx tsx -e "
  import { loadAgentContext } from './src/agent-context';
  const secrets = require('dotenv').config().parsed;
  const hermesCtx = loadAgentContext('hermes', secrets);
  console.log('Hermes context:', hermesCtx.contextPath);
  // Output: companies/macs-digital
"
```

### Step 3: Run All Master Agents

```bash
cd packages/content-engine

# Option A: Run all agents in parallel (recommended)
npx tsx -e "
  import MasterAgentOrchestrator from './src/agent-orchestrator';
  const secrets = require('dotenv').config().parsed;
  const orchestrator = new MasterAgentOrchestrator(secrets);
  
  orchestrator.runAllAgents().then(updates => {
    console.log('All agents completed:', updates.length);
    updates.forEach(u => {
      console.log(\`  \${u.agent}: \${u.postsApproved} posts\`);
    });
  });
"

# Option B: Run single agent
npx tsx -e "
  import MasterAgentOrchestrator from './src/agent-orchestrator';
  const secrets = require('dotenv').config().parsed;
  const orchestrator = new MasterAgentOrchestrator(secrets);
  
  orchestrator.runMasterAgent('hermes').then(update => {
    console.log('Hermes update:', update);
  });
"
```

---

## Circulation System

All agent updates flow through **circulation** without breaking isolation:

```json
// companies/_circulation/latest.json
{
  "timestamp": "2026-07-05T00:00:00Z",
  "agents": [
    {
      "agent": "hermes",
      "company": "Macs Digital",
      "geo": "US",
      "postsGenerated": 5,
      "status": "completed",
      "commitHash": "abc123..."
    },
    {
      "agent": "vyapari",
      "company": "MyWebLane",
      "geo": "IN",
      "postsGenerated": 4,
      "status": "completed",
      "commitHash": "def456..."
    }
    // ... more agents
  ]
}
```

**Key**: Circulation is **read-only summary only**. No agent can read another's content, signals, or briefs.

---

## Auto-Updates

When `AGENT_AUTO_UPDATE=true` and `AGENT_COMMIT_UPDATES=true`:

1. **Every 6 hours** (or `AGENT_UPDATE_INTERVAL_MINUTES`):
2. Content engine generates fresh signals for ALL companies
3. Each agent wakes up → reads their PRIVATE signals
4. Agent generates content → saves to `companies/<name>/content/approved/`
5. Auto-commits: `git commit -m "chore(hermes): auto-update content for Macs Digital"`
6. Circulation updates: `companies/_circulation/latest.json`

```bash
# Example cron trigger (if using scheduled agents)
npx tsx packages/content-engine/src/agent-orchestrator.ts
```

---

## Isolation Enforcement

The `enforceAgentIsolation()` function blocks cross-access:

```typescript
// ❌ This will throw an error
enforceAgentIsolation('hermes', 'companies/myweb-lane/signals.md');
// Error: ISOLATION VIOLATION: hermes cannot access companies/myweb-lane

// ✅ This is allowed
enforceAgentIsolation('hermes', 'companies/macs-digital/signals.md');
// Returns: true
```

---

## Agent Capabilities

| Agent | Company | Model | Platforms | Geo | Language |
|-------|---------|-------|-----------|-----|----------|
| **Hermes** | Macs Digital | NousResearch Hermes | LinkedIn → YouTube | US | English |
| **Vyapari** | MyWebLane | Claude Haiku | YouTube → Instagram | IN | Hindi + English |
| **Pauli** | The Pauli Effect | Claude Haiku | TikTok → IG Reels | US | English |
| **Kupuri** | Kupuri Media | Claude Haiku | Instagram → TikTok | MX | Spanish + English |
| **Cheggie** | Cheggie | Claude Haiku | LinkedIn → Instagram | RS | Serbian + English |
| **Cascadia** | Cascadia Atlas | Claude Opus | Demo → LinkedIn | PNW | English |

---

## Troubleshooting

### Agent Can't Access Signals
```
Error: Failed to load signals for Macs Digital at companies/macs-digital/_signals/raw/today.md
```
**Fix**: Run content engine first:
```bash
cd packages/content-engine && npx tsx src/scraper/run.ts
```

### Wrong API Key Error
```
Error: Missing API key: HERMES_NOUS_API_KEY
```
**Fix**: Set env var:
```bash
export HERMES_NOUS_API_KEY="your-key"
```

### Isolation Violation
```
Error: ISOLATION VIOLATION: hermes cannot access companies/myweb-lane
```
**Fix**: Agent tried to access another company's context. Check that agent is using correct `CONTEXT_PATH`.

---

## Summary

✅ Each agent has **dedicated API key**  
✅ Each agent accesses **only their company folder**  
✅ Each agent generates **autonomous content** (no copying)  
✅ All agents run **in parallel** (no coordination needed)  
✅ Updates **auto-commit** to respective folders  
✅ **Circulation** provides read-only visibility of all agent activity  
✅ **Complete isolation** = no data leaks between companies  

**Result**: 6 master agents, 6 completely separate contexts, one coordinated content engine.
