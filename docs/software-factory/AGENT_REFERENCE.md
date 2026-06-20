# AGENT REFERENCE

**Pauli Pi Software Factory — Complete Agent Reference**
**Version**: 1.0.0

This document provides the complete reference for all agents in the Software Factory. For operational workflows, see the skill files. For deployment details, see `README.md`.

---

## Agent Overview

| Agent | Role | Location | Always On? | Authority |
|-------|------|----------|-----------|-----------|
| Master Agent | Orchestrator | (implicit — Claude Code session) | Yes (in session) | Routes all work |
| Watcher Agent | Monitor | `/agents/watcher/` | Yes | Pause/alert |
| Builder Agent | Task executor | (Master Agent in builder mode) | No | Executes tasks |
| Design Agent | UI/UX quality | `/agents/design/` | No | UDEC gate |
| Monetization Agent | Revenue strategy | `/agents/monetization/` | No | Revenue scoring |
| Browser QA Agent | Validation | `/agents/browser-qa/` | No | QA gate |
| Backend Agent | Server-side tasks | (Master Agent in backend mode) | No | Executes tasks |
| Frontend Agent | Client-side tasks | (Master Agent in frontend mode) | No | Executes tasks |
| Deployment Agent | Deployments | (Master Agent in deploy mode) | No | Deploy execution |
| Judge Agent | Final evaluation | `/agents/judge/` | No | Deployment veto |

---

## MASTER AGENT

### Role
The Master Agent is the central orchestrator of the Software Factory. It is not a separate process but rather the Claude Code session itself, operating in coordination mode. It ingests the Command Registry, routes all tasks, maintains workflow state, and delegates to specialist agents.

### Capabilities
- Read and write all repository files
- Invoke all MCP tools (via MCP CLI wrappers in `/lib/mcp-cli/`)
- Read and update Mission Control state
- Create and manage build plans
- Route tasks to specialist agents
- Maintain phase progress tracking
- Enforce human approval gates

### Inputs
- Command from Command Registry (via Mission Control or CLI)
- Repository URL or path
- Project configuration
- Human decisions (at approval gates)
- Agent outputs (from all specialist agents)

### Outputs
- Phase completion reports
- Build plan
- Workflow state updates (Mission Control)
- Human approval requests
- Final project status update

### Escalation Paths
1. Any critical failure → Watcher alert
2. Judge ABORT → Human decision required
3. 3x task retry failure → Human notification, workflow continues on non-blocked tasks
4. Security issue found → Human notification, PAUSE factory run

### MCP Tools Available
All tools accessible via `/lib/mcp-cli/wrappers.ts`. See `MCP_CLI_REFERENCE.md`.

---

## WATCHER AGENT

### Role
Persistent monitor for all factory runs. Watcher observes every phase, every file change, every agent action. It raises alerts on anomalies and has the authority to PAUSE any workflow if conditions warrant.

The Watcher is the factory's safety layer — it ensures that no single agent or workflow can silently fail without detection.

### Location
```
/agents/watcher/SKILL.md        — Operating doctrine
/agents/watcher/config.json     — Configuration
/agents/watcher/orchestrator.ts — TypeScript implementation
```

### Capabilities
- Monitor filesystem changes in real-time
- Track build plan task progress
- Check agent heartbeats
- Detect error rate spikes
- Monitor deployment health
- Send alerts to Mission Control
- PAUSE a factory run (requires Master Agent acknowledgment)

### Inputs
- Factory run ID (to track specific runs)
- Build plan (for progress tracking)
- Alert thresholds (from config.json)
- Agent status events (emitted by each agent)

### Outputs
- Alert notifications (to Mission Control `WatcherAlertsPanel`)
- PAUSE signals (to Master Agent)
- Watcher log (append-only, in Mission Control)
- Status updates (periodic, every 5 minutes while factory run is active)

### Alert Conditions

| Alert | Severity | Action |
|-------|----------|--------|
| Task failed 3 times | HIGH | Notify human, mark task BLOCKED |
| Agent heartbeat missing > 5min | HIGH | Notify Master, attempt restart |
| UDEC score regressed > 1.0 | MEDIUM | Notify Design Agent, pause UI tasks |
| Security issue detected | CRITICAL | PAUSE entire run, notify human immediately |
| Human blocker unresolved > 48h | MEDIUM | Escalation reminder to human |
| Test failure at integration checkpoint | HIGH | PAUSE feature work, fix tests first |
| Build queue empty but project incomplete | LOW | Log, notify Master Agent |
| Deployment failed | HIGH | Notify human, preserve error logs |

### Configuration (`config.json`)
```json
{
  "alertThresholds": {
    "taskMaxRetries": 3,
    "agentHeartbeatTimeoutMs": 300000,
    "udecRegressionThreshold": 1.0,
    "humanBlockerTimeoutHours": 48,
    "checkIntervalMs": 30000
  },
  "notifications": {
    "missionControl": true,
    "slack": false,
    "email": false
  },
  "pauseConditions": [
    "SECURITY_ISSUE_DETECTED",
    "DATA_LOSS_RISK",
    "JUDGE_ABORT"
  ]
}
```

### Escalation Paths
1. LOW/MEDIUM alert → Mission Control notification
2. HIGH alert → Mission Control + human notification
3. CRITICAL alert → PAUSE run + immediate human notification
4. Watcher itself goes offline → Mission Control shows "WATCHER OFFLINE" in red. Run should be manually reviewed.

---

## BUILDER AGENT

### Role
The Builder Agent is the Master Agent operating in implementation mode. During Phase 7 (Implementation), the Master Agent acts as the Builder — reading task specifications, making code changes, and marking tasks complete.

The Builder does not have a separate agent file because it is not a separate process. It operates within the same Claude Code session as the Master Agent.

### Capabilities
- Read and write source files
- Run terminal commands (npm install, npm test, etc.)
- Make targeted code edits
- Verify task completion against acceptance criteria
- Hand off UI-facing tasks to Design Agent review
- Hand off backend API tasks to Backend Agent logic

### Inputs
- Single task specification from build plan
- Repository state (current files)
- Previous task outputs (if dependent)

### Outputs
- Modified source files
- Test results
- Task completion status (COMPLETE / FAILED / NEEDS_REVIEW)
- Notes on implementation decisions

### Escalation Paths
1. Task fails 3 times → Mark BLOCKED, notify Watcher
2. Task requires security decision → Pause, notify human
3. Task reveals a larger problem than anticipated → Alert Master Agent to re-assess scope

---

## DESIGN AGENT

### Role
The Design Agent owns visual quality in the Software Factory. It evaluates designs using the UDEC scoring system, enforces Synthia Superdesign standards, and can trigger an auto-rebuild of the UI if design quality is below threshold.

### Location
```
/agents/design/SKILL.md        — Operating doctrine
/agents/design/config.json     — Configuration
/agents/design/orchestrator.ts — TypeScript implementation
```

### Capabilities
- Run UDEC scoring engine across 10 dimensions
- Check Synthia standards compliance (30+ checkpoints)
- Generate design improvement task lists
- Trigger auto-rebuild of UI components (with human confirmation)
- Evaluate individual components after changes
- Approve or reject visual changes before Judge review

### Inputs
- Repository path (for CSS and component file analysis)
- Screenshots from Browser QA Agent
- UDEC rescore request (specific files changed)
- Synthia standards compliance check request

### Outputs
- UDEC score (per-dimension + aggregate)
- Synthia compliance report
- Design improvement task list (with effort estimates)
- Design approval/rejection (for Judge review package)
- Auto-rebuild specifications (if triggered)

### UDEC Scoring Dimensions
Each scored 0–10. See `SCORING_GUIDE.md` for full rubric.

1. Visual Hierarchy (VH)
2. Color & Contrast (CC)
3. Typography (TY)
4. Spacing & Rhythm (SR)
5. Component Consistency (CO)
6. Interaction & Motion (IM)
7. Mobile Responsiveness (MR)
8. Accessibility (AC)
9. Brand Coherence (BC)
10. User Flow Clarity (UF)

### Decision Gate

```
UDEC >= 8.5  → PASS — Continue to Judge review
UDEC 6.0–8.4 → PATCH — Generate improvement list, add to build plan as P2
UDEC < 6.0   → FAIL — Request human confirmation of auto-rebuild
               If approved: trigger full UI component rebuild
               Re-score after rebuild. Must reach >= 8.5.
               If declined: add all design items as P1 build plan tasks
```

### Escalation Paths
1. UDEC < 6.0 → Always escalates to human for auto-rebuild decision
2. Design rebuild exceeds 4 hours → Watcher alert, human notification
3. UDEC cannot reach 8.5 after rebuild → Escalate to Judge for evaluation

---

## MONETIZATION AGENT

### Role
The Monetization Agent identifies, analyzes, and documents revenue opportunities for projects processed by the Software Factory. It does not implement payment infrastructure — it produces the strategy that informs the build plan.

### Location
```
/agents/monetization/SKILL.md        — Operating doctrine
/agents/monetization/config.json     — Configuration
/agents/monetization/orchestrator.ts — TypeScript implementation
```

### Capabilities
- Classify project by type (SaaS, e-commerce, marketplace, etc.)
- Identify target customer segments
- Generate 3+ revenue paths per project
- Design subscription tier structure
- Map affiliate and partnership opportunities
- Calculate revenue score (0–100)
- Generate monetization strategy document

### Inputs
- Project type (from audit)
- Feature list (working + planned)
- Tech stack (to identify affiliate opportunities)
- Target audience (from README or audit)

### Outputs
- Revenue score (0–100)
- Monetization strategy document (`/audit-output/monetization-strategy.md`)
- Revenue path definitions (minimum 3)
- Subscription tier design
- Affiliate opportunity map
- 30-day revenue activation plan

### Revenue Score Dimensions
| Dimension | Weight | What it Measures |
|-----------|--------|-----------------|
| Market Size | 25% | Total addressable market |
| Differentiation | 25% | Competitive moat |
| Time to Revenue | 25% | How quickly revenue can start |
| Revenue Ceiling | 25% | Maximum realistic revenue potential |

### Escalation Paths
1. Revenue score < 20 → Flag to human: "Low revenue viability — recommend reconsidering model"
2. No identifiable revenue path → Escalate to human for product strategy discussion
3. Legal/compliance revenue concerns → Escalate to human (e.g., financial services, healthcare)

---

## BROWSER QA AGENT

### Role
The Browser QA Agent validates that the application works correctly in a real browser. It uses Chrome DevTools MCP to drive actual browser interactions, capture screenshots, run flow validations, and report on application health.

### Location
```
/agents/browser-qa/SKILL.md        — Operating doctrine
/agents/browser-qa/config.json     — Configuration
/agents/browser-qa/orchestrator.ts — TypeScript implementation
```

### Capabilities
- Navigate to URLs and capture screenshots
- Execute user flows (sequences of clicks, form fills, navigations)
- Capture console errors and network failures
- Run Lighthouse audits
- Validate HTTP response codes
- Check Time to First Contentful Paint
- Report pass/fail per flow

### Inputs
- Target URL (local dev server or staging/production URL)
- Flow definitions (sequences of actions to validate)
- Screenshot capture requests (for Design Agent review)

### Outputs
- Browser QA report (`/audit-output/browser-qa-report.md`)
- Screenshots (saved to `/audit-output/screenshots/`)
- Flow validation results (PASS/FAIL per flow)
- Console error log
- Lighthouse scores
- Performance metrics

### Standard Flows
These flows are run automatically during validation phases:

```
Flow 1: Homepage Load
  → Navigate to /
  → Verify 200 response
  → Verify page renders (not blank)
  → Capture screenshot
  → Measure LCP

Flow 2: Authentication
  → Navigate to /signup
  → Fill in test credentials
  → Submit form
  → Verify redirect to dashboard
  → Navigate to /login
  → Log in with same credentials
  → Verify redirect to dashboard
  → Click logout
  → Verify redirect to homepage

Flow 3: Core Feature
  → [project-specific — defined during Phase 1 audit]
  → Perform primary user action
  → Verify expected outcome

Flow 4: Error Handling
  → Attempt invalid form submission
  → Verify error message appears (not crash)
  → Attempt to access protected route without auth
  → Verify redirect to login (not 500)

Flow 5: Mobile
  → Set viewport to 375×812
  → Re-run Flow 1
  → Verify no horizontal scroll
  → Verify navigation accessible
```

### Escalation Paths
1. Chrome not available → Fall back to static analysis only, flag as limitation
2. Flow FAIL after 3 retries → Report failure, escalate to Builder Agent
3. All flows FAIL → CRITICAL alert, PAUSE factory run, notify human
4. Lighthouse score < 50 → HIGH alert, performance review required before deployment

---

## BACKEND AGENT

### Role
The Backend Agent is a specialization of the Master Agent for server-side tasks. When build plan tasks are categorized as backend, the Master Agent adopts backend mode: focusing on API routes, database queries, authentication logic, and server-side business logic.

It does not have a separate agent file — it operates as a mode of the Master Agent.

### Capabilities
- Create and modify API routes
- Write database queries and migrations
- Implement authentication and authorization logic
- Write server-side validation
- Configure environment variables
- Implement background jobs and webhooks
- Write unit tests for backend functions

### Inputs
- Task specification from build plan
- API contracts (from design or existing code)
- Database schema (from project audit)
- Authentication system details

### Outputs
- API route files
- Database migration files
- Server-side validation logic
- Test files
- Configuration files

### Technology Awareness
The Backend Agent adapts to the project's tech stack:
- **Next.js**: App Router API routes in `/app/api/`
- **Express/Fastify**: Route handlers in `/routes/` or `/src/routes/`
- **Python/FastAPI**: Route handlers with type annotations
- **Django**: Views and serializers
- **Supabase**: Row-level security policies and edge functions

### Escalation Paths
1. Task involves security-sensitive changes → Watcher alert, extra scrutiny
2. Database migration is destructive → PAUSE, human confirmation required
3. Third-party API integration fails → Document in task notes, flag for alternative approach

---

## FRONTEND AGENT

### Role
The Frontend Agent is the Master Agent operating in frontend mode — handling UI components, client-side logic, styling, and user interaction. When build plan tasks are UI-facing, the Frontend Agent mode is activated.

All visual output from the Frontend Agent is reviewed by the Design Agent before marking tasks complete.

### Capabilities
- Create and modify React/Vue/HTML components
- Implement responsive layouts
- Apply Synthia Superdesign standards
- Wire components to API endpoints
- Implement client-side form validation
- Add micro-animations and transitions
- Implement loading, error, and empty states
- Write component tests

### Inputs
- Task specification from build plan
- Design Agent guidance (UDEC dimensions to improve)
- API contracts (what data is available)
- Existing component patterns (from project audit)

### Outputs
- Component files
- CSS/styling files
- Client-side validation logic
- Component test files

### Design Checkpoint
Every visual change produced by the Frontend Agent is validated by the Design Agent before the task is marked COMPLETE. The Design Agent may return changes with specific feedback. The Frontend Agent iterates until Design Agent approval.

### Escalation Paths
1. Design Agent returns rejection 3 times → Escalate to human with specific design conflict
2. Framework-specific limitation prevents Synthia standard → Document workaround, note as exception

---

## DEPLOYMENT AGENT

### Role
The Deployment Agent handles all deployment operations. It wraps Vercel MCP (primary) and can support other deployment targets. It executes staging and production deployments, reports results, and initiates rollbacks if needed.

The Deployment Agent NEVER deploys to production without human approval. This is a hard constraint.

### Capabilities
- Deploy to Vercel staging (preview environment)
- Deploy to Vercel production
- Execute database migrations pre-deployment
- Configure environment variables
- Verify domain and SSL configuration
- Monitor deployment logs
- Execute rollbacks

### Inputs
- Human approval (REQUIRED for any deployment)
- Project configuration
- Environment variables to set
- Target environment (staging / production)
- Deployment ID (for rollbacks)

### Outputs
- Deployment URL (staging or production)
- Deployment status log
- Post-deploy validation results
- Rollback confirmation (if executed)

### Deployment Checklist (auto-run before every deployment)
```
PRE-DEPLOY:
  [ ] Human approval received
  [ ] Judge PASS on file
  [ ] All critical checklist items complete
  [ ] Staging validation complete (for production deploys)
  [ ] Database backup created (for production deploys)

DURING DEPLOY:
  [ ] Environment variables set
  [ ] Migration executed (if applicable)
  [ ] Build successful
  [ ] Deployment to Vercel complete

POST-DEPLOY:
  [ ] URL accessible (200 response)
  [ ] Smoke test: homepage + login
  [ ] No error spike in first 5 minutes
```

### Rollback Procedure
```bash
# Instant rollback via Vercel:
vercel rollback [deployment-id] --yes

# Verify rollback:
curl -I [production-url]
# Should return previous working state
```

### Escalation Paths
1. Build failure during deployment → Notify human, do NOT deploy
2. Staging deploy fails → Debug and retry, escalate after 3 failures
3. Production smoke test fails → ROLLBACK IMMEDIATELY, notify human
4. Migration failure → STOP, preserve backup, notify human for manual intervention

---

## JUDGE AGENT

### Role
The Judge Agent is the final evaluator in the Software Factory pipeline. It is deliberately isolated from the implementation process — it does not know which agents built what, only what the final result looks like. This isolation ensures objective evaluation.

The Judge's verdict is final. It cannot be overridden by any other agent. It can only be overridden by a human with an explicit override command, and that override is permanently logged.

### Location
```
/agents/judge/SKILL.md        — Operating doctrine
/agents/judge/config.json     — Configuration
/agents/judge/orchestrator.ts — TypeScript implementation
```

### Capabilities
- Evaluate projects across 5 dimensions
- Issue 4 verdict types
- Provide detailed reasoning for each verdict
- Re-evaluate after condition resolution
- Provide escalating scrutiny on repeated failures

### Inputs (required to invoke Judge)
- Discovery report (Phase 1-2 output)
- Monetization strategy (Phase 3 output)
- Design audit with current UDEC score (Phase 4 output)
- Production readiness report (Phase 5 output)
- Build plan with execution log (Phases 6-7 output)
- Browser QA report (current state)
- Current screenshots of the application
- List of known remaining issues (with justification for deferral)

### Evaluation Dimensions

| Dimension | Weight | What Judge Evaluates |
|-----------|--------|---------------------|
| Functional Completeness | 25% | Does it do what it claims? Core features working? |
| Code Quality | 20% | Clean, maintainable, documented? No obvious bugs? |
| Design Quality | 20% | UDEC >= 8.5? Synthia standards met? |
| Revenue Viability | 15% | Is there a credible path to revenue? |
| Production Safety | 20% | Safe to run in production? Security, reliability? |

### Verdict Types

**PASS**
All 5 dimensions meet threshold. Project is production-ready.
```
Action: Notify Master Agent of PASS
         Notify human: ready for deployment
         Write judge-decision.md
         Update Mission Control
```

**PASS WITH CONDITIONS**
Mostly ready. Specific issues must be resolved before or after deployment.
```
Action: List all conditions with DEPLOYMENT-BLOCKING or POST-DEPLOYMENT flag
         DEPLOYMENT-BLOCKING → must fix, then re-review
         POST-DEPLOYMENT → document as known limitation, proceed
```

**FAIL**
Significant issues remain. Return to implementation.
```
Action: List all failures with specific, actionable feedback
         Map failures to build plan tasks
         Watcher tracks loop count (max 3 before human escalation)
```

**ABORT**
Project is fundamentally unsuitable for production in current form.
Use sparingly. Reserved for:
- Irreparable architectural flaws
- Project concept is not viable
- Security issues that cannot be resolved without full rebuild
- Legal/compliance issues that make deployment impossible

```
Action: Document all reasoning
         Present to human with options:
           1. Significant rebuild (not just fixes)
           2. Pivot the project concept
           3. Abandon project
         Human makes final decision
```

### Judge Independence
The Judge is deliberately kept unaware of which agents made which changes. Its evaluation is based on:
- The current state of the application (as seen by a user)
- The completeness of the documentation
- The security of the implementation
- The viability of the revenue strategy

It is NOT influenced by:
- How hard the implementation was
- How many tasks were completed
- How long the factory run took
- Which agents were involved

### Escalation Paths
1. Review package incomplete → Request missing materials, do not evaluate
2. FAIL issued 3 times for same project → Alert human: "Project has failed Judge review 3 times. Recommend human review of approach."
3. Cannot evaluate (technical error) → Log error, retry, then escalate to Master Agent
4. ABORT issued → Mandatory human decision before any further action

---

## Agent Communication Patterns

### Synchronous (wait for response)
- Master → Judge (request review, wait for verdict)
- Master → Design (request UDEC score, wait for score)
- Master → Browser QA (validate flow, wait for result)

### Asynchronous (fire and monitor)
- Master → Watcher (start monitoring — Watcher runs independently)
- Master → Deployment Agent (deploy — may take minutes, Watcher monitors)

### Event-based (Watcher)
- Watcher monitors file system events
- Watcher emits alerts as conditions are detected
- Master Agent subscribes to Watcher alerts

### Human Gates (explicit interrupt)
- Master Agent presents decision to human via Mission Control
- Workflow PAUSES
- Human clicks button or sends message
- Master Agent resumes

---

## Agent Health Monitoring

Mission Control `AgentHealthCard` displays for each agent:

```
Agent: [Name]
Status: ONLINE | IDLE | RUNNING | OFFLINE | ERROR
Last Activity: [timestamp]
Current Task: [task or "none"]
Tasks Completed Today: [count]
Error Count (24h): [count]
```

Watcher monitors agent health. If any agent goes OFFLINE during a factory run, Watcher raises a HIGH alert.

---

*Agent Reference v1.0.0 — Pauli Pi Software Factory*
*See README.md for architecture overview and quick start guide.*
