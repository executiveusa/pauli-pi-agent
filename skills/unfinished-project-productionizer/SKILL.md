# UNFINISHED PROJECT PRODUCTIONIZER

**Skill Version**: 1.0.0
**Owner**: Pauli Pi Software Factory
**Category**: Core Factory Skill
**Trigger**: `[PRODUCTIONIZE PROJECT]` button in Mission Control / Command Palette / skill invocation

---

## Purpose

Take any repository — half-built, abandoned, incomplete, or architecturally sound but unshipped — and transform it from **incomplete → production-ready**.

The Unfinished Project Productionizer is the master skill of the Pauli Pi Software Factory. It orchestrates all other agents, applies every scoring dimension, and produces a complete production deployment with human approval gates at critical junctures. Nothing ships without a Judge PASS. Nothing deploys without human sign-off.

This skill exists because the most common form of wasted potential in software development is the half-built project. An estimated 60-80% of software projects that reach the "working prototype" stage never ship. This skill changes that ratio.

---

## Activation

### Via Mission Control Dashboard
Click the `[PRODUCTIONIZE PROJECT]` button in the Action Center. The Command Registry will prompt for:
- Repository URL or local path
- Project name (display label)
- Target deployment environment (staging | production)
- Human approval contact (email or Slack handle)

### Via Command Palette (Cmd+K)
Type `productionize` and select "Productionize Unfinished Project"

### Via Direct Trigger
```
SKILL: unfinished-project-productionizer
INPUT: { repo: "https://github.com/owner/repo", name: "My Project" }
```

### Via Claude Code CLI
```bash
# In the target repository:
claude --skill unfinished-project-productionizer
```

---

## Agent Hierarchy for This Skill

```
Master Agent (orchestrator)
├── Watcher Agent (monitors all phases, raises alerts)
├── Design Agent (UDEC scoring + visual improvements)
├── Monetization Agent (revenue path identification)
├── Browser QA Agent (validates running application)
├── Judge Agent (final evaluation authority)
└── Deployment Agent (Vercel/staging deployment)
```

The Master Agent drives the 8-phase workflow below. Watcher observes every phase and can pause execution if anomalies are detected. Judge is invoked at Phase 7 and has absolute veto power.

---

## Phase 1: Discovery & Audit (30–60 min)

### Objective
Understand what the project is, what it was trying to do, and what state it's in right now.

### Steps

**1.1 Repository Access**
- Clone or access the repository
- Verify file system access
- Note: if private repo, request credentials from human and pause until provided

**1.2 Structure Mapping**
- Generate full directory tree (max 4 levels)
- Identify top-level organization pattern (monorepo, single-app, microservices, library)
- Count: files, directories, lines of code (by language)
- Find all entry points: `package.json` scripts, `main.py`, `index.*`, `app.*`, `server.*`

**1.3 Tech Stack Identification**
- Parse all dependency files: `package.json`, `requirements.txt`, `Gemfile`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`, `composer.json`
- Identify: language(s), framework(s), database(s), deployment target(s), testing tools
- Detect: CSS framework, UI component library, state management, authentication library
- Note version age (are packages dangerously outdated?)

**1.4 Documentation Survey**
- Read: README.md, CONTRIBUTING.md, CHANGELOG.md, any `/docs/` directory
- Find: existing design docs, architecture diagrams, PRD or product brief
- Note: what the README claims the project does vs. what code actually exists

**1.5 Run Attempt**
- Attempt to install dependencies (`npm install`, `pip install`, etc.)
- Attempt to run development server
- Document: what starts, what errors appear, what's missing (env vars, databases, external services)
- If it runs: capture screenshots via Browser QA Agent
- If it doesn't run: document exact failure point

**1.6 Git History Analysis**
- Last commit date
- Number of contributors
- Commit frequency graph
- Most recent meaningful commit message
- Any open branches with significant work

### Questions to Answer
- What was being built? (1-sentence description)
- Who was building it? (solo, team, agency)
- When did work stop? (estimate)
- Why did work stop? (common patterns: scope creep, technical blockers, life events, funding)
- What percentage is done? (rough estimate for Phase 2 to refine)

### Output
Produces: `/audit-output/discovery-report.md` (see template in `/templates/project-audit.md`)

---

## Phase 2: Gap Analysis

### Objective
Precisely identify what's missing, what's broken, and what technical debt exists.

### Steps

**2.1 Completeness Scoring (0–100)**

Run the `/lib/project-audit/auditor.ts` engine against the repository. It evaluates:

| Dimension | Weight | What It Checks |
|-----------|--------|----------------|
| Core Functionality | 30% | Are the primary use cases implemented? |
| Authentication | 10% | Login/logout/session management |
| Data Persistence | 10% | Database schema + CRUD operations |
| API Layer | 10% | REST/GraphQL endpoints defined and functional |
| UI/UX | 15% | Pages exist, navigation works, responsive |
| Error Handling | 5% | Try/catch, error boundaries, user messages |
| Testing | 5% | Any tests exist and pass |
| Documentation | 5% | Code comments, README, inline docs |
| Deployment Config | 5% | Dockerfile, Vercel config, CI/CD |
| Security | 5% | Auth guards, env var usage, no exposed secrets |

**2.2 Missing Functionality List**
For each missing feature, document:
- Feature name
- Expected behavior
- Estimated effort (hours) to implement
- Dependencies (what must exist first)
- Impact if missing: CRITICAL / HIGH / MEDIUM / LOW

**2.3 Broken Functionality List**
For each broken feature:
- What it does vs. what it should do
- Error message or failure mode
- Root cause (if determinable)
- Fix complexity: TRIVIAL / MODERATE / COMPLEX

**2.4 Security Audit**
- Scan for hardcoded secrets: API keys, passwords, tokens
- Check authentication flows for bypasses
- Validate input sanitization on forms
- Check for SQL injection vectors
- Review dependency vulnerabilities (npm audit, pip check)
- CORS configuration review
- Rate limiting absence

**2.5 Technical Debt Assessment**
- Code duplication patterns
- Missing error handling
- Undocumented magic values
- Inconsistent naming conventions
- Dead code
- Over-complex functions (cyclomatic complexity)
- Missing TypeScript types

**2.6 Human Blocker Identification**
Some gaps cannot be automated:
- Missing API keys or third-party credentials
- Business logic decisions not captured anywhere
- Missing design assets (logos, copy, images)
- Domain/hosting decisions
- Legal/compliance decisions

Document each human blocker and pause for human input before proceeding.

### Decision Tree: What to Do With Gaps

```
Gap identified →
  Is it a CRITICAL missing feature?
    YES → Add to build plan Phase 6
    NO → Continue
  Is it BROKEN and central to the product?
    YES → Add to immediate fix list
    NO → Document as known issue
  Is it a SECURITY issue?
    ALWAYS → Add to critical fix list, flag for human review
  Is it a HUMAN BLOCKER?
    YES → Pause, notify human, wait for input
```

### Output
Produces: Gap Analysis section in `/audit-output/discovery-report.md`

---

## Phase 3: Revenue Mapping

### Objective
Identify how this project can generate revenue. Every project is a potential revenue stream.

### Steps

**3.1 Project Type Classification**

| Type | Description | Default Revenue Model |
|------|-------------|----------------------|
| SaaS App | Web app with user accounts | Subscription tiers |
| E-commerce | Sells products/services | Transaction fees + subscription |
| API / Developer Tool | Technical product | Usage-based + subscription |
| Marketplace | Connects buyers/sellers | Commission + SaaS |
| Content Platform | Articles, media, courses | Subscription + advertising |
| Mobile App | iOS/Android app | Freemium + IAP |
| Library / Framework | Open source tool | Sponsorship + enterprise licenses |
| Internal Tool | Used within one org | License sale or service fee |
| Data Product | Reports, insights, APIs | Data license + API credits |

**3.2 Customer Identification**
- Who benefits from this project existing?
- What problem does it solve for them?
- What are they currently paying for alternatives?
- What market segment are they in? (B2B, B2C, B2B2C, developer, enterprise)

**3.3 Revenue Path Generation (minimum 3 paths)**

For each path document:
- Model name
- Description
- Price point range
- Target customer
- Implementation complexity (LOW / MEDIUM / HIGH)
- Time to first revenue (weeks)
- Estimated monthly revenue at scale

**Subscription Tier Template**:
```
FREE:    [Features] — $0/month — Goal: acquire users
STARTER: [Features] — $X/month — Goal: convert free users
PRO:     [Features] — $Y/month — Goal: power users
TEAM:    [Features] — $Z/month — Goal: business accounts
ENTERPRISE: Custom — Goal: large contracts
```

**3.4 Affiliate Opportunity Scan**
- What tools/services does this project use?
- Which have affiliate programs? (Stripe, AWS, Vercel, etc.)
- Integration complexity of affiliate tracking

**3.5 Revenue Score Calculation**
Score 0–100 based on:
- Market size
- Competition level
- Differentiation
- Implementation complexity
- Time to revenue
- Revenue ceiling

### Output
Produces: `/audit-output/monetization-strategy.md` (see template)

---

## Phase 4: Design Audit

### Objective
Score the current design against Synthia Superdesign standards. Determine if it needs patching or a full rebuild.

### Steps

**4.1 UDEC Scoring**

Run the UDEC scoring engine (`/lib/scoring/udec.ts`) across 10 dimensions:

| Dimension | Abbreviation | Weight |
|-----------|--------------|--------|
| Visual Hierarchy | VH | 10% |
| Color & Contrast | CC | 10% |
| Typography | TY | 10% |
| Spacing & Rhythm | SR | 10% |
| Component Consistency | CO | 10% |
| Interaction & Motion | IM | 10% |
| Mobile Responsiveness | MR | 10% |
| Accessibility | AC | 10% |
| Brand Coherence | BC | 10% |
| User Flow Clarity | UF | 10% |

Score each dimension 0–10. Total = average across all dimensions.

**4.2 Synthia Standards Compliance Check**

Verify against Synthia Superdesign doctrine:
- [ ] Dark HSL color scheme with proper lightness gradients
- [ ] Typography: Geist Mono for code, Inter/system-ui for body
- [ ] 8px spacing grid (all margins/paddings multiples of 8)
- [ ] Micro-animations on hover/focus states
- [ ] Loading states for all async operations
- [ ] Error states for all form inputs
- [ ] Empty states for all data lists
- [ ] Toast notifications (not browser alerts)
- [ ] Mobile-first responsive breakpoints
- [ ] Keyboard navigation support

**4.3 UDEC Decision Gate**

```
UDEC Score >= 8.5 → Design PASSES. Document improvements as optional enhancements.
UDEC Score 6.0–8.4 → Design NEEDS PATCHES. Generate targeted improvement plan.
UDEC Score < 6.0 → Design FAILS. Mark for AUTO-REBUILD. Flag for human confirmation.
```

**4.4 Design Improvement Plan**

For each issue found:
- Issue description
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Specific fix instructions
- Estimated effort
- Before/after code snippet (if applicable)

**4.5 Auto-Rebuild Trigger**

If UDEC < 6.0 AND human confirms auto-rebuild:
- Design Agent takes over
- Rebuilds all UI components to Synthia standard
- Preserves all business logic and data structures
- Rebuilds only the presentation layer
- Re-runs UDEC scoring after rebuild
- Must achieve >= 8.5 before proceeding

### Output
Produces: Design audit section in `/audit-output/discovery-report.md`
If rebuild triggered: `design-agent` produces new component library

---

## Phase 5: Production Readiness Evaluation

### Objective
Run the 30-point production readiness checklist and identify critical blockers.

### Steps

**5.1 Checklist Execution**

Run `/lib/production-readiness/checker.ts` across 6 categories:

**SECURITY (0–5)**
- [ ] No hardcoded secrets in codebase
- [ ] Environment variables properly used
- [ ] Authentication implemented and working
- [ ] HTTPS enforced in production config
- [ ] Input validation on all user-facing inputs

**RELIABILITY (0–5)**
- [ ] Error boundaries or global error handlers
- [ ] Graceful degradation when services unavailable
- [ ] Database connection pooling
- [ ] Retry logic for external API calls
- [ ] Health check endpoint exists

**PERFORMANCE (0–5)**
- [ ] No N+1 query patterns
- [ ] Images optimized (lazy loading, correct formats)
- [ ] Bundle size reasonable (< 500KB initial JS)
- [ ] Database queries use indexes
- [ ] Caching strategy in place

**OBSERVABILITY (0–5)**
- [ ] Structured logging
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log retention policy

**DEPLOYMENT (0–5)**
- [ ] CI/CD pipeline defined
- [ ] Environment-specific configs (dev/staging/prod)
- [ ] Database migrations automated
- [ ] Rollback procedure documented
- [ ] Zero-downtime deployment possible

**SCALABILITY (0–5)**
- [ ] Stateless application layer
- [ ] Session management not server-side
- [ ] Database connection limits handled
- [ ] Rate limiting on public endpoints
- [ ] CDN configuration for static assets

**5.2 Scoring**

Total score: sum of all checked items / 30 * 100

```
Score 90–100: PRODUCTION READY
Score 70–89:  NEARLY READY — address HIGH items first
Score 50–69:  NEEDS WORK — significant gaps remain
Score < 50:   NOT READY — critical blockers present
```

**5.3 Critical Blocker Identification**

Any SECURITY item that fails = CRITICAL BLOCKER. Cannot proceed until fixed.

**5.4 Fix Plan Generation**

For each failed item:
- Fix description
- Implementation approach
- Files to modify
- Effort estimate
- Priority: P0 (security/data loss) / P1 (functionality) / P2 (enhancement)

### Output
Produces: Production readiness report section in `/audit-output/discovery-report.md`

---

## Phase 6: Build Plan Generation

### Objective
Convert all audit findings into an actionable, sequenced, estimated build plan.

### Steps

**6.1 Task Collection**

Gather all items from prior phases:
- Missing functionality list (Phase 2)
- Security fixes (Phase 2 + Phase 5)
- Design improvements (Phase 4)
- Production readiness fixes (Phase 5)

**6.2 Task Classification**

Each task gets:
- ID: `TASK-001`, `TASK-002`, etc.
- Category: SECURITY / FEATURE / BUG / DESIGN / INFRASTRUCTURE / DOCS
- Priority: P0 / P1 / P2 / P3
- Effort: XS (< 1hr) / S (1-4hr) / M (4-8hr) / L (1-2 days) / XL (3-5 days)
- Agent: which agent handles this task
- Dependencies: list of task IDs that must complete first
- Acceptance criteria: how to verify it's done

**6.3 Dependency Mapping**

Build a dependency graph. Topological sort to establish execution order.

Critical path = longest sequence of dependent tasks.

**6.4 Timeline Estimation**

```
Total effort = sum of all task efforts
Parallel execution factor = 0.6 (agents work in parallel, but not perfectly)
Adjusted timeline = Total effort * parallel_factor

Buffer = 30% for integration issues and human approval wait times
Final estimate = Adjusted timeline * 1.3
```

**6.5 Agent Assignment**

| Task Category | Primary Agent | Review Agent |
|---------------|---------------|-------------|
| SECURITY | Backend Agent | Master Agent |
| FEATURE (backend) | Backend Agent | Watcher |
| FEATURE (frontend) | Frontend Agent | Design Agent |
| DESIGN | Design Agent | Judge |
| BUG | Backend or Frontend | Browser QA |
| INFRASTRUCTURE | Deployment Agent | Master Agent |
| DOCS | Master Agent | (none) |

**6.6 Human Approval Gate**

STOP. Present build plan to human.

Required information:
- Full task list with estimates
- Timeline projection
- Cost estimate (compute costs if applicable)
- Key decisions that require human input

Human must explicitly APPROVE before Phase 7 begins.

**Format of approval request**:
```
BUILD PLAN READY FOR REVIEW
================================
Project: {{project_name}}
Tasks: {{task_count}} ({{p0_count}} critical, {{p1_count}} high)
Estimated timeline: {{timeline}}
Estimated compute cost: {{cost}}

Critical decisions requiring your input:
1. {{decision_1}}
2. {{decision_2}}

[APPROVE BUILD PLAN] [REQUEST CHANGES] [ABORT]
```

### Output
Produces: `/audit-output/build-plan.md` (see template)

---

## Phase 7: Implementation

### Objective
Execute the approved build plan. All agents work in parallel where possible. Watcher monitors everything.

### Steps

**7.1 Watcher Activation**

Watcher Agent comes online:
- Monitors all file changes
- Tracks build plan progress
- Watches for errors in real-time
- Alerts on anomalies
- Can pause/resume execution

**7.2 Task Execution Loop**

For each task in priority order:
1. Assign to appropriate agent
2. Agent executes
3. Browser QA validates (if UI-facing)
4. Design Agent reviews (if visual)
5. Mark complete or return for rework

**7.3 Integration Checkpoints**

After every 5 tasks completed:
- Run full test suite
- Run Browser QA validation
- Review Watcher alerts
- Assess if timeline still on track
- Notify human if significant deviations

**7.4 Rework Loop**

If a task fails validation:
```
Task FAIL →
  Retry count < 3?
    YES → Rework and retry
    NO → Escalate to human. Mark as BLOCKED.
         Continue with non-blocked tasks.
         Return when human resolves blocker.
```

**7.5 Progress Tracking**

Update `/audit-output/build-plan.md` in real-time:
- Mark tasks COMPLETE / IN-PROGRESS / BLOCKED / FAILED
- Update timeline projections
- Log all decisions made during implementation

### Output
All tasks from build plan executed and marked complete.
Live progress visible in Mission Control Build Queue panel.

---

## Phase 8: Judge Review

### Objective
Independent evaluation by Judge Agent. No deployment without Judge PASS.

### Steps

**8.1 Preparation**

Before requesting Judge review, compile:
- Complete audit report from Phase 1-2
- Build plan and execution log from Phases 6-7
- Current UDEC score (must be >= 8.5)
- Current production readiness score
- Browser QA report
- Revenue strategy document
- All known remaining issues

**8.2 Judge Invocation**

```
JUDGE: Please evaluate this project for production readiness.

Context:
- Project: {{project_name}}
- Original completeness: {{original_completeness}}%
- Current completeness: {{current_completeness}}%
- UDEC Score: {{udec_score}}/10
- Production Readiness Score: {{prod_ready_score}}/100
- Revenue Strategy: {{revenue_model}}

Attached: [full audit report] [build plan] [browser qa report]
```

**8.3 Judge Evaluation Criteria**

Judge evaluates across 5 dimensions:
1. **Functional Completeness** (25%): Does it do what it claims?
2. **Code Quality** (20%): Is the implementation clean and maintainable?
3. **Design Quality** (20%): Does it meet Synthia standards (UDEC >= 8.5)?
4. **Revenue Viability** (15%): Is there a credible path to revenue?
5. **Production Safety** (20%): Is it safe to deploy to production?

**8.4 Possible Verdicts**

```
PASS → Proceed to Phase 9 (Deployment)
PASS WITH CONDITIONS → Document conditions, address them, re-request Judge review
FAIL → Document all failure reasons, return to Phase 7 for rework
ABORT → Project fundamentally flawed, recommend abandonment (rare)
```

**8.5 Fail Loop**

If FAIL:
- Read Judge's failure reasons carefully
- Map each reason to tasks in the build plan
- Execute fix tasks
- Re-run Browser QA
- Re-request Judge review
- Maximum 3 loops before escalating to human

**8.6 PASS WITH CONDITIONS Flow**

- Document all conditions
- For each condition: assess if it blocks deployment
- DEPLOYMENT-BLOCKING conditions: fix before Phase 9
- POST-DEPLOYMENT conditions: create tickets, inform human, document in launch notes

### Output
Judge decision document in `/audit-output/judge-decision.md`

---

## Phase 9: Deployment

### Objective
Deploy to production with human approval. Monitor post-launch.

### Steps

**9.1 Human Approval Gate (MANDATORY)**

Present to human:

```
READY TO DEPLOY
================================
Project: {{project_name}}
Judge Verdict: PASS
UDEC Score: {{udec_score}}/10
Production Readiness: {{prod_ready_score}}/100

Deployment Target: {{target_environment}}
Domain: {{domain}}

What will happen:
1. Deploy to Vercel staging
2. Run post-deploy validation (automated)
3. Monitor for 30 minutes
4. Promote to production (requires your confirmation)

Known limitations:
{{known_limitations}}

[APPROVE DEPLOYMENT] [DEPLOY TO STAGING ONLY] [ABORT]
```

Human must explicitly approve. No auto-deploy to production.

**9.2 Staging Deployment**

Using Vercel MCP:
- Deploy to staging environment
- Capture staging URL
- Run Browser QA against staging URL
- Validate all critical flows work in staging environment

**9.3 Post-Deploy Validation**

Automated checks:
- Homepage loads (200 response)
- Authentication flow works
- Core feature works (as defined in audit)
- No JavaScript console errors
- Performance: Time to First Contentful Paint < 3s
- Lighthouse score > 75

**9.4 Monitoring Window**

Monitor for 30 minutes after staging deploy:
- Check error logs
- Validate no spike in 5xx responses
- Confirm database connections stable

**9.5 Production Promotion Gate**

Report staging results to human.
Human confirms promotion to production.

**9.6 Production Deployment**

- Deploy to production via Vercel
- Update DNS if needed
- Verify production URL accessible
- Run final smoke test
- Set up uptime monitoring

**9.7 Launch Documentation**

Produce:
- Launch checklist (completed)
- Known limitations document
- Monitoring runbook
- Escalation contacts
- First 30-day growth plan

**9.8 Mark as Production-Ready**

Update project status in Mission Control:
- Status: PRODUCTION
- Deploy date: {{timestamp}}
- URL: {{production_url}}
- Judge verdict: PASS

### Output
Live production deployment with monitoring configured.

---

## Example Walkthrough: "TaskForge"

*A fictional project to illustrate the workflow.*

### Discovery (Phase 1)
**Repository**: `github.com/jane/taskforge`
**What it is**: A project management SaaS targeting freelancers
**Tech stack**: Next.js 14, Supabase, Tailwind CSS, Stripe (referenced but not integrated)
**Last commit**: 4 months ago
**Run attempt**: App starts, but login page throws "NEXT_PUBLIC_SUPABASE_URL not defined"

### Audit (Phase 2)
**Completeness**: 52%
**Working**: Authentication UI, task list page, task creation form
**Missing**: Stripe payment integration (referenced in 3 files, never implemented), email notifications, team collaboration, dashboard analytics
**Broken**: Login throws env var error, task deletion crashes the app
**Security**: Hardcoded Supabase anon key found in 2 source files (CRITICAL)
**Human blockers**: Stripe account needed, custom domain decision

### Revenue Map (Phase 3)
**Project type**: SaaS App
**Customer**: Freelancers, solo consultants, small agencies
**Revenue paths**:
1. Subscription ($9/$29/$79/month: Free/Pro/Team)
2. Stripe partner commission on payment features
3. White-label licensing to agencies ($299/month)
**Revenue score**: 74/100

### Design Audit (Phase 4)
**UDEC score**: 6.2/10
**Issues**: No spacing rhythm, inconsistent button styles, no mobile breakpoints, no empty states
**Decision**: NEEDS PATCHES (not full rebuild)

### Production Readiness (Phase 5)
**Score**: 43/100
**Critical blockers**:
- Hardcoded API key (SECURITY)
- No error handling on task deletion
- No health check endpoint

### Build Plan (Phase 6)
**Tasks**: 23 total (2 P0, 7 P1, 9 P2, 5 P3)
**Timeline**: 3 days estimated
**Human approval**: Received. Jane confirmed Stripe account and domain.

### Implementation (Phase 7)
- P0: Move API key to env var — 20 min
- P0: Fix task deletion crash — 45 min
- P1: Stripe integration — 4 hours
- P1: Email notifications via Resend — 2 hours
- P2: Design improvements (spacing, mobile, states) — 3 hours
- [all 23 tasks completed in 2.5 days]

### Judge Review (Phase 8)
**Verdict**: PASS WITH CONDITIONS
**Conditions**:
- Add rate limiting on /api/tasks (deployment-blocking)
- Dashboard analytics (post-deployment ticket)
**Rate limiting added**: 30 min
**Re-review**: PASS

### Deployment (Phase 9)
- Staging: deployed, validated, 30-min monitor passed
- Human approved production
- Production: live at taskforge.app
- Status: PRODUCTION READY

---

## Integration with Other Agents

### Watcher Agent
- Active from Phase 1 through Phase 9
- Raises alerts on: file changes outside expected scope, build failures, performance regressions, Judge FAIL loops
- Can PAUSE the workflow at any time
- Reports to Master Agent and human simultaneously

### Judge Agent
- Invoked exclusively in Phase 8
- Has absolute authority to block deployment
- Evaluates the complete project, not individual tasks
- Cannot be overridden by any agent (only by human with explicit override command)

### Design Agent
- Primary role in Phase 4
- Assists Frontend Agent in Phase 7
- Re-evaluates UDEC after all design changes
- Must sign off on any visual component before it reaches Judge

### Browser QA Agent
- Active in Phase 1 (initial state capture)
- Active in Phase 7 (validates each UI-facing task)
- Active in Phase 9 (staging and production validation)
- Uses Chrome DevTools MCP for real browser validation

### Monetization Agent
- Primary role in Phase 3
- Provides revenue context to Judge in Phase 8
- Can be re-invoked after implementation to refine pricing

---

## Human Approval Gates Summary

| Phase | Gate | What Human Decides |
|-------|------|-------------------|
| Phase 1 | Credential request | Provide private repo access |
| Phase 2 | Human blockers | Resolve business decisions |
| Phase 6 | Build plan approval | Approve tasks + timeline + cost |
| Phase 9 | Deploy to staging | Approve staging deployment |
| Phase 9 | Promote to production | Final production approval |
| Phase 8 | Judge ABORT | Whether to continue or abandon |

Automation operates fully between approval gates. Humans are interrupted only when necessary.

---

## Failure Modes & Recovery

| Scenario | Recovery Action |
|----------|----------------|
| Build plan abandoned after approval | Archive partial work, notify human |
| Judge returns FAIL 3 times | Escalate to human with options |
| Browser QA cannot run (Chrome unavailable) | Switch to static analysis only, flag limitation |
| Staging deploy fails | Debug, fix, retry up to 3 times, then human |
| Human approval not received in 48h | Send reminder, then pause project |
| Repository is encrypted/obfuscated | Flag as unprocessable, recommend new build |
| Project uses unsupported tech stack | Document limitation, request human guidance |

---

*This skill is a core component of the Pauli Pi Software Factory. Questions? See `/docs/software-factory/README.md`.*
