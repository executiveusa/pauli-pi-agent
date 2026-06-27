# PAULI PI SOFTWARE FACTORY

**Version**: 1.0.0
**Repository**: executiveusa/pauli-pi-agent
**Status**: Production Architecture — Runtime wiring in progress

---

## Overview

The Pauli Pi Software Factory is a fully autonomous software production system that transforms unfinished, stalled, or incomplete software projects into production-ready deployments. It is built on top of Anthropic's Claude AI agents, orchestrated through a Master Agent, and governed by a Judge Agent that has absolute approval authority over all deployments.

**What it does**:
- Takes any repository in any state of completion
- Audits it across completeness, design, security, and revenue potential
- Builds a prioritized plan to make it production-ready
- Executes the plan using specialized agents
- Validates the result using Browser QA, Design scoring, and Judge review
- Deploys to production with mandatory human approval gates

**Why it exists**:
The most common waste in software development is the half-built project — software that reaches 60-70% completion, then stalls due to technical debt, scope creep, or shifting priorities. The Software Factory systematically eliminates this waste by providing a repeatable, automated process for crossing the finish line.

**Design Philosophy**:
- Automation-first, but human-approved at critical gates
- No deployment without Judge PASS
- No production deploy without human sign-off
- Every action is logged and reversible
- Agents operate within lanes — no agent overrides another's domain

---

## Architecture

```
╔══════════════════════════════════════════════════════════════╗
║                   MISSION CONTROL DASHBOARD                  ║
║   (brain-dashboard/app/mission-control/)                     ║
║   Agent Health │ Build Queue │ Approval Queue │ Judge Panel  ║
╚══════════════════════════════╤═══════════════════════════════╝
                               │
╔══════════════════════════════▼═══════════════════════════════╗
║                     COMMAND REGISTRY                         ║
║   (/lib/command-registry.ts)                                 ║
║   JSON-driven button definitions → agent invocations         ║
╚═══════════╤══════════════════════════════════════════════════╝
            │
╔═══════════▼══════════════════════════════════════════════════╗
║                     MASTER AGENT                             ║
║   Orchestrates all factory workflows                         ║
║   Routes tasks to specialist agents                          ║
╚═══╤═══╤═══╤═══╤═══╤════════════════════════════════════════╝
    │   │   │   │   │
    ▼   │   │   │   │     ╔═════════════════════╗
WATCHER │   │   │   └────►║   DEPLOYMENT AGENT  ║
(always │   │   │         ║   Vercel MCP        ║
 on)    │   │   │         ╚═════════════════════╝
        ▼   │   │         ╔═════════════════════╗
    DESIGN  │   └────────►║   BROWSER QA AGENT  ║
    AGENT   │             ║   Chrome DevTools   ║
    (UDEC)  │             ╚═════════════════════╝
            ▼             ╔═════════════════════╗
      MONETIZATION ──────►║   JUDGE AGENT       ║
      AGENT               ║   Final authority   ║
                          ║   No deploy without ║
                          ║   PASS              ║
                          ╚═════════════════════╝

╔═══════════════════════════════════════════════════════════════╗
║                    MCP CLI LAYER                              ║
║   /lib/mcp-cli/                                              ║
║   github_* │ vercel_* │ supabase_* │ browser_* │ fs_*       ║
╚═══════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════╗
║                   LIBRARY LAYER (/lib/)                      ║
║   scoring/ │ project-audit/ │ production-readiness/          ║
║   monetization/ │ browser-validation/ │ command-registry      ║
╚═══════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════╗
║                   SKILLS LAYER (/skills/)                     ║
║   unfinished-project-productionizer/                         ║
║   revenue-systems-agent/                                     ║
║   ui-intelligence/                                           ║
║   webflow-template-forge/                                    ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Quick Start: Productionize Your First Project

### Prerequisites

1. **Environment Variables** — Set in your deployment environment:
   ```
   ANTHROPIC_API_KEY=         # Required for all agents
   SUPABASE_URL=              # Required for persistent state
   SUPABASE_SERVICE_KEY=      # Required for Supabase operations
   VERCEL_TOKEN=              # Required for deployments
   GITHUB_TOKEN=              # Required for repository operations
   ```

2. **Supabase Tables** — Create factory tables:
   ```sql
   -- See /docs/software-factory/database-schema.sql
   -- Tables: factory_projects, agent_logs, judge_decisions, build_queue, approval_queue
   ```

3. **Start Mission Control**:
   ```bash
   cd brain-dashboard
   npm run dev
   # Open http://localhost:3000/mission-control
   ```

### Productionize a Project

**Option A: Via Mission Control Dashboard**
1. Open Mission Control at `/mission-control`
2. Click `[PRODUCTIONIZE PROJECT]` in the Action Center
3. Enter repository URL
4. Follow the prompts

**Option B: Via Command Palette**
1. Press `Cmd+K` (or `Ctrl+K`) anywhere in the dashboard
2. Type `productionize`
3. Select "Productionize Unfinished Project"

**Option C: Via Claude Code CLI** (in target repository)
```bash
claude --skill unfinished-project-productionizer
```

### What Happens Next

The Factory runs its 9-phase workflow (see `/skills/unfinished-project-productionizer/workflow.md`). You will be notified when human input is needed. The process takes 1-5 days depending on project complexity.

---

## Agents

### Master Agent
The central orchestrator. Routes all factory workflows. Has access to all tools. Delegates to specialist agents based on task type.

**Invoked by**: Command Registry (via Mission Control)
**Invokes**: All specialist agents
**Cannot**: Override Judge Agent verdict

### Watcher Agent
Persistent monitor. Watches all phases of all factory runs. Raises alerts on anomalies. Can PAUSE any workflow.

**Location**: `/agents/watcher/`
**Config**: `/agents/watcher/config.json`
**Implementation**: `/agents/watcher/orchestrator.ts`
**Always active**: Yes. If Watcher goes offline, the factory is in an unsafe state.

**Watches for**:
- Build failures
- UDEC regressions
- Test failures
- Agent timeouts
- Human blocker staleness (> 48h)
- Security anomalies

### Design Agent
Evaluates and improves UI/UX. Owns UDEC scoring. Can trigger auto-rebuild of visual components if UDEC < 6.0.

**Location**: `/agents/design/`
**Primary tool**: UDEC scoring engine (`/lib/scoring/udec.ts`)
**Authority**: Can reject UI changes that don't meet Synthia standards

### Monetization Agent
Identifies revenue paths, designs subscription tiers, calculates revenue scores. Does not implement payment infrastructure — informs the build plan.

**Location**: `/agents/monetization/`
**Primary tool**: Monetization analyzer (`/lib/monetization/analyzer.ts`)
**Output**: `/audit-output/monetization-strategy.md`

### Browser QA Agent
Validates running applications using Chrome DevTools MCP. Captures screenshots. Runs flow validation. Reports pass/fail.

**Location**: `/agents/browser-qa/`
**Primary tool**: Chrome DevTools MCP, Browser validator (`/lib/browser-validation/validator.ts`)
**Required for**: Phase 1 (initial capture), Phase 7 (task validation), Phase 9 (deployment validation)

### Judge Agent
Independent evaluator with absolute authority. Reviews completed projects before deployment. Issues PASS / PASS WITH CONDITIONS / FAIL / ABORT.

**Location**: `/agents/judge/`
**Authority**: No deployment without Judge PASS (or human override of ABORT)
**Cannot be overridden by**: Any agent (only by human with explicit command)
**Evaluates**: Functional completeness, code quality, design quality, revenue viability, production safety

---

## Command Registry

All user-facing actions are registered in `/lib/command-registry.ts`. This is the single source of truth for what buttons exist and what they do.

### How It Works

```typescript
// Every button in the UI is defined here:
{
  id: "productionize-project",
  label: "Productionize Project",
  description: "Transform an unfinished project into production-ready",
  icon: "Rocket",
  category: "factory",
  priority: 1,
  requiresInput: true,
  inputSchema: { repo: "string", name: "string" },
  agentSkill: "unfinished-project-productionizer",
  requiresApproval: false,  // approval happens inside the skill workflow
  tags: ["factory", "primary"]
}
```

### Adding a New Command

1. Add entry to `/lib/command-registry.ts`
2. Add API route in `brain-dashboard/app/api/commands/[commandId]/route.ts`
3. Command automatically appears in Mission Control Action Center
4. Command automatically appears in Command Palette (Cmd+K)

### Command Categories

| Category | Purpose |
|----------|---------|
| `factory` | Core factory operations (productionize, audit, judge) |
| `agents` | Agent management (start/stop/status) |
| `deploy` | Deployment operations |
| `review` | Review and evaluation operations |
| `admin` | System administration |

---

## MCP CLI Layer

MCP tools are accessed through the CLI abstraction layer at `/lib/mcp-cli/`. This provides:
- Consistent snake_case naming (`github_get_file_contents`, not `mcp__github__get_file_contents`)
- Argument validation before calling tools
- Retry logic with exponential backoff
- Structured logging of all tool invocations
- Error normalization

See `/docs/software-factory/MCP_CLI_REFERENCE.md` for complete function signatures.

---

## Scoring System

The Factory uses three scoring dimensions. See `/docs/software-factory/SCORING_GUIDE.md` for full details.

### UDEC — User Design & Experience Completeness
Score 0–10. Average across 10 dimensions. Threshold: **8.5 to pass**.

### MOT — Mission Operational Trust
Score 0–100. Evaluates agent reliability and system health. Threshold: **70 to run factory operations**.

### ACC — Autonomous Completion Confidence
Score 0–100. Predicts probability that the factory can complete a given project autonomously. Threshold: **60 to proceed without elevated human oversight**.

---

## Human Approval Gates

The Factory is autonomous but not ungoverned. These gates require explicit human approval before proceeding:

| Gate | Phase | What You Decide |
|------|-------|----------------|
| Credential provision | 1 | Provide access to private repositories |
| Human blocker resolution | 2 | Answer business questions the AI cannot answer |
| Build plan approval | 6 | Approve task list, timeline, and cost |
| Staging deployment | 9a | Approve deployment to staging environment |
| Production deployment | 9b | Approve promotion to production (FINAL GATE) |
| Judge ABORT override | 8 | Whether to continue despite Judge recommendation to stop |

**No production deployment can occur without human approval at Gate 9b.** This is a hard constraint, not a configuration option.

---

## Judge System

The Judge is an independent AI agent that evaluates completed projects before deployment. It has no power to build or deploy — only to approve or reject.

### Invocation
Judge is invoked automatically at end of Phase 7 by the Master Agent. It can also be invoked manually:
```
Command: "REQUEST JUDGE REVIEW"
Button: [REQUEST JUDGE REVIEW] in Mission Control
```

### Verdict Types

| Verdict | Meaning | Next Step |
|---------|---------|-----------|
| PASS | Project is production-ready | Proceed to deployment with human approval |
| PASS WITH CONDITIONS | Ready pending specific fixes | Fix conditions, re-request review |
| FAIL | Significant issues remain | Return to implementation phase |
| ABORT | Project is fundamentally unsuitable | Present options to human |

### Judge Cannot Be Overridden By Agents
Only a human can override a Judge ABORT verdict. The override command is:
```
HUMAN OVERRIDE: Proceed despite Judge ABORT
Reason: [human must provide reason]
```

This override is logged permanently in the project record.

---

## Deployment Pipeline

```
Phase 7 Complete
     │
     ▼
Judge Review (Phase 8)
     │
  ┌──┴──────────────────────────────────────────┐
  │                                             │
PASS                                         FAIL/ABORT
  │                                             │
  ▼                                         Loop back
Human approval: Deploy to staging?              │
  │                                         (or human decides)
  ▼
Staging Deployment
  │
  ▼
Automated Validation (Browser QA)
  │
  ▼
30-minute monitoring window
  │
  ▼
Staging report to human
  │
  ▼
Human approval: Promote to production?
  │
  ▼
Production Deployment
  │
  ▼
Production smoke test
  │
  ▼
If PASS: Project status → PRODUCTION
If FAIL: Rollback immediately
```

---

## Directory Structure

```
/home/user/pauli-pi-agent/
├── agents/                    Agent orchestrators
│   ├── watcher/
│   ├── judge/
│   ├── design/
│   ├── monetization/
│   └── browser-qa/
├── brain-dashboard/           Next.js Mission Control UI
│   ├── app/
│   │   ├── mission-control/  Main dashboard
│   │   └── api/             API routes
│   └── components/
│       ├── mission-control/  Dashboard components
│       └── action-center/    Command button components
├── docs/
│   └── software-factory/     This documentation
├── lib/                       Shared library layer
│   ├── mcp-cli/              MCP tool wrappers
│   ├── scoring/              UDEC/MOT/ACC engines
│   ├── project-audit/        Audit engine
│   ├── production-readiness/ Readiness checker
│   ├── monetization/         Revenue analyzer
│   ├── browser-validation/   Browser QA validator
│   └── command-registry.ts   Central command registry
├── skills/                    Skill definitions
│   ├── unfinished-project-productionizer/
│   ├── revenue-systems-agent/
│   ├── ui-intelligence/
│   └── webflow-template-forge/
└── .agents/skills/            Sub-agent definitions
    ├── mercury-voice-chatbot/
    ├── online-shopper/
    ├── shopkeeper-x/
    └── synthia-pretext/
```

---

## Configuration

### Factory Configuration
Key configuration lives in:
- `/agents/*/config.json` — Per-agent configuration
- `/lib/command-registry.ts` — Command definitions
- `brain-dashboard/.env.local` — Dashboard environment

### Agent Timeouts (defaults)
```json
{
  "phase_timeout_minutes": 120,
  "task_timeout_minutes": 30,
  "judge_timeout_minutes": 60,
  "human_blocker_timeout_hours": 48,
  "deployment_timeout_minutes": 15
}
```

### Score Thresholds (defaults, configurable)
```json
{
  "udec_pass_threshold": 8.5,
  "udec_rebuild_threshold": 6.0,
  "production_readiness_pass": 70,
  "mot_operational_threshold": 70,
  "acc_autonomous_threshold": 60
}
```

---

## Troubleshooting

### "MCP tool not available"
The MCP CLI wrappers require active MCP server connections. Verify in Claude Code settings that the required MCP servers are connected. See MCP_CLI_REFERENCE.md.

### "Judge is unavailable"
Judge Agent requires an active Claude Code session with sufficient context. Ensure you are running in an active session. If Judge timeout occurs, the Watcher will alert and retry up to 3 times.

### "Watcher offline"
The Watcher requires a persistent process. For production use, deploy Watcher as a Trigger.dev background job or a cron-driven Lambda function. The current implementation requires a running Node.js process.

### "Build queue not persisting"
The in-memory build queue does not survive process restarts. To enable persistence, create the `build_queue` table in Supabase and set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` environment variables.

### "UDEC score not updating after design changes"
The UDEC scorer reads CSS and component files. After design changes, ensure files are saved and the scoring engine is re-invoked. Use `[RESCORE DESIGN]` button in Mission Control.

---

## Related Documents

- `/skills/unfinished-project-productionizer/SKILL.md` — Primary skill reference
- `/skills/unfinished-project-productionizer/workflow.md` — Operational workflow
- `/docs/software-factory/AGENT_REFERENCE.md` — Complete agent reference
- `/docs/software-factory/MCP_CLI_REFERENCE.md` — MCP CLI function signatures
- `/docs/software-factory/SCORING_GUIDE.md` — Scoring system guide
- `/SOFTWARE_FACTORY_READINESS_REPORT.md` — Current factory state assessment

---

*Pauli Pi Software Factory v1.0.0 — Built on Anthropic Claude*
*Questions: See WIKI.md or raise an issue in GitHub*
