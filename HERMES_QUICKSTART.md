# Hermes Quick Start (Isolated Master Agent)

## 1-Minute Setup: Run Hermes Only

### Step 1: Environment
```bash
cat > .env.local << 'EOF'
# Hermes Configuration
AGENT_ISOLATION_MODE=true
HERMES_NOUS_API_KEY=your-nousresearch-key
HERMES_CONTEXT_PATH=companies/macs-digital
NODE_ENV=production
EOF
```

### Step 2: Generate Signals (Hermes sees ONLY Macs Digital data)
```bash
cd packages/content-engine
npx tsx src/scraper/run.ts
# Output: companies/macs-digital/_signals/raw/today.md
```

### Step 3: Run Hermes Master Agent
```bash
npx tsx << 'SCRIPT'
import MasterAgentOrchestrator from './src/agent-orchestrator';
import { createSecretsLoader } from '../secrets/src/loader';

const loader = createSecretsLoader();
const secrets = loader.get();
const orchestrator = new MasterAgentOrchestrator(secrets);

const update = await orchestrator.runMasterAgent('hermes');
console.log(`\n✅ Hermes generated ${update.postsApproved} posts`);
console.log(`📍 Saved to: companies/macs-digital/content/approved/`);
SCRIPT
```

### Step 4: Deploy to Vercel (Macs Portal)
```bash
cd ../../macs-agent-portal
npm run build
vercel deploy --prod
```

---

## What Hermes Sees (Isolated Context)

```
companies/macs-digital/         ← ONLY this folder
├── _signals/raw/today.md        ← Viral signals (PRIVATE)
│   └── "TikTok trending: AI coding tools"
│       "LinkedIn engagement: B2B SaaS founders"
│       "YouTube: 10M+ views on developer content"
│
├── content/approved/            ← Generated posts (PRIVATE)
│   └── hermes-2026-07-05T00:00.md
│       "## LinkedIn Post 1: [content]"
│       "## YouTube Script 1: [content]"
│
├── agent/HERMES.md              ← Agent config
│   └── Platform: LinkedIn → YouTube
│       Geo: US
│       Voice: Emerald Tablets™
│       Model: NousResearch Hermes
│
└── briefs/                       ← Strategy docs (PRIVATE)
```

**Hermes CANNOT see:**
- companies/myweb-lane/* (Vyapari's data)
- companies/pauli-effect/* (Pauli's data)
- companies/kupuri-media/* (Kupuri's data)
- companies/cheggie/* (Cheggie's data)
- companies/cascadia-atlas/* (Cascadia's data)

---

## Hermes Architecture

### Input
```
Viral signals from social platforms (Hermes-only):
├── "LinkedIn: Akash Network trending in dev community"
├── "YouTube: Developer tools getting 1M+ views"
├── "TikTok: AI code assistants go mainstream"
└── "X: Founding stories resonate with founders"
```

### Processing
```
NousResearch Hermes (openai/gpt-5.5)
Model: Emerald Tablets™ persona
Context: Macs Digital voice + US B2B audience
Task: Generate 3-5 viral posts from signals
Platforms: LinkedIn → YouTube
```

### Output
```
companies/macs-digital/content/approved/hermes-TIMESTAMP.md
├── ## LinkedIn Post 1: [viral hook] [value prop] [CTA]
├── ## LinkedIn Post 2: [founder story angle]
├── ## YouTube Script 1: [thumbnail idea] [outline]
├── ## YouTube Script 2: [trending hook] [structure]
└── [timestamps] [hashtags] [platform-specific formatting]
```

### Circulation (Read-Only)
```json
companies/_circulation/latest.json
{
  "agents": [
    { "agent": "hermes", "company": "Macs Digital", "posts": 5 }
  ]
}
```

---

## Full Hermes Flow (6-Hour Cycle)

```
T+0:00   Content engine wakes
T+0:10   → Scrapes Twitter, TikTok, YouTube, LinkedIn
T+0:20   → Scores posts by viral potential
T+0:30   → Writes companies/macs-digital/_signals/raw/today.md
         
T+0:31   Hermes agent wakes (strictly isolated)
T+0:31   → Reads ONLY companies/macs-digital/_signals/raw/today.md
T+0:35   → Invokes NousResearch Hermes via OpenRouter
T+0:40   → Receives generated content (5 posts)
T+0:40   → Saves to companies/macs-digital/content/approved/
T+0:41   → Auto-commits: "chore(hermes): auto-update content"
T+0:42   → Updates circulation summary

T+0:42   All agents completed ✅
         Next run: T+6:00
```

---

## Testing Isolation (Hermes Can't Access Others)

```bash
# Test 1: Try to load Vyapari's signals (will fail)
npx tsx << 'SCRIPT'
import { enforceAgentIsolation } from './packages/secrets/src/agent-context';

const isAllowed = enforceAgentIsolation('hermes', 'companies/myweb-lane/_signals/raw/today.md');
console.log(isAllowed); // false → ISOLATION ENFORCED
SCRIPT

# Test 2: Hermes can only access Macs Digital
npx tsx << 'SCRIPT'
import { enforceAgentIsolation } from './packages/secrets/src/agent-context';

const isAllowed = enforceAgentIsolation('hermes', 'companies/macs-digital/_signals/raw/today.md');
console.log(isAllowed); // true ✅
SCRIPT
```

---

## Troubleshooting

### "Missing API key: HERMES_NOUS_API_KEY"
```bash
export HERMES_NOUS_API_KEY="your-nousresearch-key"
```

### "Failed to load signals"
Content engine hasn't run yet:
```bash
cd packages/content-engine && npx tsx src/scraper/run.ts
```

### "ISOLATION VIOLATION"
Hermes tried to access another company's data. This shouldn't happen with the isolation system.

### "No posts approved"
Check the generated content at `companies/macs-digital/content/approved/`

---

## Next Steps

- **Add more platforms**: Edit `HERMES.md` to include TikTok, Instagram, etc.
- **Adjust voice**: Customize Emerald Tablets™ persona in agent config
- **Schedule runs**: Use cron trigger for 6-hour cycles
- **Multi-agent**: Add other isolated agents (Vyapari, Pauli, etc.)

---

## Architecture Summary

```
Hermes = Master Agent for Macs Digital ONLY
├── Input: companies/macs-digital/_signals/raw/today.md
├── Processing: NousResearch Hermes (Emerald Tablets voice)
├── Output: companies/macs-digital/content/approved/*.md
├── Isolation: NO access to other companies
├── Auto-commit: YES (updates git on completion)
└── Circulation: Read-only visibility in companies/_circulation/
```

**Complete isolation. Master autonomy. Hermes is ready. 🧙‍♂️**
