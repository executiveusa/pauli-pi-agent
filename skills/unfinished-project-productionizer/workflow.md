# UNFINISHED PROJECT PRODUCTIONIZER — OPERATIONAL WORKFLOW

**Version**: 1.0.0
**Type**: Step-by-step operational runbook
**Companion to**: `SKILL.md` (strategic overview)

This document is the line-by-line operational workflow. Every step is actionable. Every decision has a next step. No ambiguity.

---

## PRE-FLIGHT

Before starting any phase, verify:

```
[ ] Repository URL or path confirmed
[ ] Project name confirmed
[ ] Human contact confirmed (email or Slack)
[ ] Target environment confirmed (staging | production | staging-only)
[ ] Watcher Agent online
[ ] Mission Control dashboard accessible
[ ] All required MCP servers connected:
    [ ] GitHub MCP
    [ ] Vercel MCP
    [ ] Supabase MCP
    [ ] Chrome DevTools MCP
```

If any pre-flight item fails:
- Log failure to Watcher
- Notify human
- Do NOT proceed until resolved

---

## PHASE 1: DISCOVER

**Goal**: Map everything. Touch nothing. Observe and document.

### Step 1.1 — Repository Access

```typescript
// If GitHub URL:
const repo = await github_clone(repoUrl);

// If local path:
const repo = { path: localPath, name: path.basename(localPath) };

// Verify access:
const accessible = await fs.access(repo.path);
if (!accessible) {
  throw new Error('PHASE_1_FAIL: Cannot access repository');
}
```

Document:
- Repository URL / path
- Access method (GitHub / local / SSH)
- Access confirmed timestamp

### Step 1.2 — Directory Structure Mapping

Run directory tree to 4 levels depth:
```bash
find . -maxdepth 4 -not -path './.git/*' -type f | sort > /tmp/file-tree.txt
```

Parse output and categorize:
- Source files (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.go`, `.rb`, `.java`)
- Config files (`package.json`, `.env.example`, `Dockerfile`, `vercel.json`, `next.config.*`)
- Documentation (`*.md`, `*.txt`, `docs/`)
- Assets (`public/`, `static/`, `assets/`)
- Tests (`*.test.*`, `*.spec.*`, `__tests__/`, `/tests/`)
- Build artifacts (`dist/`, `build/`, `.next/`, `node_modules/`) — note presence, exclude from analysis

Count by category. Log to discovery report.

### Step 1.3 — Entry Point Discovery

Check for entry points in this order:
```
1. package.json → scripts.dev, scripts.start, scripts.build, main
2. next.config.js / next.config.ts → Next.js app
3. vite.config.ts → Vite app
4. app.py / main.py / server.py → Python app
5. main.go → Go app
6. index.js / index.ts → Node.js app
7. Dockerfile → containerized app
8. docker-compose.yml → multi-service app
```

For each entry point found: note file path and what it suggests about app type.

### Step 1.4 — Dependency File Parsing

| File | Parse For |
|------|-----------|
| `package.json` | dependencies, devDependencies, scripts, engines |
| `requirements.txt` | Python packages + versions |
| `Gemfile` | Ruby gems |
| `go.mod` | Go module dependencies |
| `Cargo.toml` | Rust crates |
| `pom.xml` | Java Maven dependencies |
| `build.gradle` | Java Gradle dependencies |
| `composer.json` | PHP Composer packages |

Build tech stack summary:
```
Language: [primary language]
Framework: [web framework]
Database: [database technology]
Auth: [auth library or service]
Styling: [CSS approach]
Testing: [test framework]
Deployment: [deployment target hints]
```

### Step 1.5 — Documentation Survey

Read in order:
1. `README.md` — extract: what it does, how to run, requirements, roadmap (if any)
2. `CONTRIBUTING.md` — extract: development setup
3. `CHANGELOG.md` or `HISTORY.md` — extract: last version, last significant change
4. `docs/` directory — read all `.md` files
5. `TODO.md` or `ROADMAP.md` — gold mine: captures what was planned but unbuilt
6. Code comments in entry point files — look for `TODO`, `FIXME`, `HACK`, `NOTE`

Specifically extract from README:
- Claimed feature list
- Status badges (if any)
- "Coming soon" or "planned" sections
- Known issues sections

### Step 1.6 — Run Attempt

Attempt to start the application. Document each step:

```bash
# Step 1: Install dependencies
npm install       # or pip install -r requirements.txt, etc.
# → RESULT: [success / error message]

# Step 2: Copy env template
cp .env.example .env.local   # if .env.example exists
# → RESULT: [success / not found]

# Step 3: Note all REQUIRED env vars from .env.example or code
grep -r 'process.env\.' src/ --include="*.ts" | grep -v '?.?' | sort -u
# → RESULT: [list of env vars referenced]

# Step 4: Attempt dev server
npm run dev       # or python app.py, etc.
# → RESULT: [started successfully / error at line X]

# Step 5: If started, capture initial state
# Browser QA Agent: navigate to localhost:PORT, capture screenshot
```

Document outcome:
- `RUNS`: App starts and renders something
- `PARTIAL_RUN`: App starts but with errors
- `INSTALL_FAIL`: Cannot install dependencies
- `ENV_FAIL`: Missing required environment variables
- `CRASH_ON_START`: App crashes immediately on start
- `UNKNOWN`: Cannot determine how to run it

### Step 1.7 — Git History Analysis

```bash
# Last commit
git log -1 --format="%H %ai %s"

# Commit count
git rev-list --count HEAD

# Contributors
git shortlog -sn --all | head -20

# Activity over time (commits per month, last 12 months)
git log --format="%ai" | awk '{print substr($1, 1, 7)}' | sort | uniq -c

# Open branches
git branch -a
```

Calculate staleness:
- `< 1 week`: ACTIVE
- `1 week – 1 month`: RECENT
- `1–3 months`: COOLING
- `3–6 months`: STALE
- `> 6 months`: ABANDONED

### Step 1.8 — Write Discovery Report

Using template at `/skills/unfinished-project-productionizer/templates/project-audit.md`, fill in:
- `{{what_being_built}}` — 1-3 sentence description
- `{{current_state}}` — one of: RUNS / PARTIAL_RUN / INSTALL_FAIL / ENV_FAIL / CRASH_ON_START / UNKNOWN
- `{{completeness_score}}` — rough first estimate (will be refined in Phase 2)
- All tech stack fields
- Git staleness level

**OUTPUT FILE**: `/audit-output/discovery-report.md`

---

## PHASE 2: AUDIT

**Goal**: Precise gap analysis. Know exactly what's broken and what's missing.

### Step 2.1 — Completeness Scoring

Run auditor:
```typescript
import { runAudit } from '/lib/project-audit/auditor';
const auditResult = await runAudit({ repoPath: repo.path });
// Returns: AuditResult { completenessScore: number, dimensions: Dimension[] }
```

For each dimension score < 5/10: add to detailed investigation queue.

### Step 2.2 — Feature Extraction

From README claimed features and any PRD/spec documents, build feature list:

| Feature | Claimed | Implemented | Working | Notes |
|---------|---------|-------------|---------|-------|
| User login | YES | YES | BROKEN | Throws env error |
| Task creation | YES | YES | YES | Working |
| Email notifications | YES | NO | NO | Not started |
| Payment integration | YES | PARTIAL | NO | Stripe referenced, not wired |
| ... | | | | |

For each NOT WORKING or NOT IMPLEMENTED feature:
- Assign effort estimate
- Assign priority (P0/P1/P2/P3)
- Note dependencies

### Step 2.3 — Security Scan

Run these checks in sequence:

**Check S1: Hardcoded Secrets**
```bash
# Search for common secret patterns
grep -rE "(api_key|apikey|secret|password|token|credential)\s*=\s*['\"][^'\"]{10,}" \
  --include="*.ts" --include="*.js" --include="*.py" --include="*.env" \
  --exclude-dir=node_modules --exclude-dir=.git .
```
Any match that is NOT in an `.env*` file AND NOT an obvious placeholder = CRITICAL SECURITY ISSUE.

**Check S2: .env Files Committed**
```bash
git ls-files | grep -E "^\.env$|^\.env\."
# Any real .env file (not .env.example) should NOT appear here
```

**Check S3: npm/pip Vulnerabilities**
```bash
npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities'
# OR
pip check 2>&1
```
CRITICAL or HIGH vulnerabilities = must address before deployment.

**Check S4: SQL Injection Patterns** (for projects with raw SQL)
```bash
grep -rE "query\(.*\$\{|execute\(.*\$\{|sql\(.*\$\{" \
  --include="*.ts" --include="*.js" --include="*.py" .
```
Any match = potential SQL injection. Review each.

**Check S5: CORS Configuration**
```bash
grep -rE "cors|Access-Control-Allow-Origin" \
  --include="*.ts" --include="*.js" .
# Look for: Access-Control-Allow-Origin: * in production contexts
```

### Step 2.4 — Technical Debt Assessment

**Dead Code Detection**
```bash
# For TypeScript/JavaScript: look for exported functions never imported
# For Python: look for functions defined but never called
# Heuristic: look for .ts files that nothing imports
```

**Complexity Scan**
Functions > 50 lines = high complexity candidate.
```bash
# Count lines per function (rough heuristic)
grep -n "function\|=>\|def \|async " src/**/*.ts | head -50
```

**Type Coverage** (TypeScript projects)
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# If > 20 TypeScript errors: document as technical debt
```

**Code Duplication**
Look for similar blocks > 10 lines repeated in 2+ files. Note as refactor opportunities.

### Step 2.5 — Human Blocker Identification

Scan for patterns that require human decisions:

**Missing Business Logic**
Look for comments like:
```
// TODO: figure out pricing
// TODO: confirm with client
// TODO: need product decision on this
// PLACEHOLDER: add real logic here
```

**Missing Assets**
```bash
# Check for broken image/asset references
grep -rE "src=['\"][^'\"]+['\"]" --include="*.tsx" --include="*.html" . | \
  grep -v "http" | grep -v "data:" | \
  awk -F'"' '{print $2}' | \
  xargs -I{} test -f public/{} 2>/dev/null || echo "MISSING: {}"
```

**Missing API Keys Required**
Parse `.env.example`:
```bash
cat .env.example | grep -v "^#" | grep "=" | \
  awk -F= '{print $1}' | \
  while read key; do echo "Required: $key"; done
```

**For each human blocker**: create a numbered item, describe what decision is needed, add to BLOCKED list.

If any human blockers exist: PAUSE. Send notification to human. Wait for responses before proceeding.

### Step 2.6 — Finalize Audit Report

Update `/audit-output/discovery-report.md` with:
- Precise completeness score (from auditor)
- Full feature status table
- All security findings (with severity)
- Technical debt catalog
- Human blockers list (numbered)

---

## PHASE 3: REVENUE MAP

**Goal**: Identify 3+ viable revenue paths. Score revenue potential.

### Step 3.1 — Project Classification

Based on discovery, classify into one of:

```
SAAS_APP         → Web application with user accounts and recurring use
ECOMMERCE        → Sells goods or services
DEVELOPER_TOOL   → SDK, API, CLI, library
MARKETPLACE      → Connects two sides of a market
CONTENT_PLATFORM → Media, courses, articles, community
MOBILE_APP       → Native or hybrid mobile
INTERNAL_TOOL    → Single-org internal use
DATA_PRODUCT     → Data, reports, analytics
OTHER            → Document what type
```

### Step 3.2 — Run Monetization Analyzer

```typescript
import { analyzeMonetization } from '/lib/monetization/analyzer';
const strategy = await analyzeMonetization({
  projectType: classification,
  features: workingFeatures,
  techStack: techStack,
  targetAudience: audienceFromReadme,
});
```

### Step 3.3 — Generate 3 Revenue Paths

For each path, complete this structure:
```markdown
## Revenue Path {{N}}: {{name}}

**Model**: {{Subscription | One-time | Usage-based | Freemium | Transaction fee | Licensing}}
**Description**: {{1-2 sentences}}
**Target Customer**: {{who pays}}
**Price Point**: {{range}}
**Implementation Complexity**: {{LOW | MEDIUM | HIGH}}
**Time to First Revenue**: {{estimate in weeks}}
**Estimated MRR at 100 customers**: ${{amount}}
**Implementation Requirements**:
- {{requirement 1}}
- {{requirement 2}}
```

Always include at minimum:
- Path 1: Primary SaaS/direct path
- Path 2: Partnership/affiliate path
- Path 3: Alternative model (enterprise, white-label, or marketplace)

### Step 3.4 — Subscription Tier Design

For SaaS projects, design tiers:

```markdown
| Tier | Monthly Price | Features | Target |
|------|--------------|----------|--------|
| Free | $0 | Core features, usage limits | Acquisition |
| Starter | ${{price}} | Full features, moderate limits | Individual users |
| Pro | ${{price}} | Full features, high limits | Power users |
| Team | ${{price}} | Multi-user, admin dashboard | Small teams |
| Enterprise | Custom | SSO, SLA, custom limits | Large orgs |
```

Price based on: competitor analysis + feature value + customer type.

### Step 3.5 — Affiliate Opportunity Mapping

For each dependency in the tech stack, check for affiliate programs:

| Tool/Service | Affiliate Program | Commission | Implementation |
|-------------|-----------------|------------|----------------|
| Vercel | Vercel Partner | 20% recurring | Add partner link |
| Stripe | N/A | N/A | N/A |
| Supabase | Supabase Partner | Variable | Add referral |
| AWS | AWS Partner | Variable | Complex |
| ... | | | |

### Step 3.6 — Revenue Score

Score 0–100:
- Market size (0–25): How large is the addressable market?
- Competition (0–25): How differentiated is this vs. alternatives?
- Time to revenue (0–25): How quickly can revenue begin?
- Revenue ceiling (0–25): What's the realistic maximum?

**OUTPUT FILE**: `/audit-output/monetization-strategy.md`

---

## PHASE 4: DESIGN AUDIT

**Goal**: Score design quality. Plan improvements or trigger rebuild.

### Step 4.1 — UDEC Scoring Run

```typescript
import { scoreUDEC } from '/lib/scoring/udec';
const udecResult = await scoreUDEC({
  repoPath: repo.path,
  screenshots: browserQAScreenshots,
  cssFiles: cssFilePaths,
  componentFiles: componentFilePaths,
});
```

Score each dimension 0–10. Overall = average.

### Step 4.2 — Synthia Standards Check

For each standard, mark: PASS / FAIL / N/A

```
Color Scheme:
[ ] PASS / [ ] FAIL — Dark HSL theme (background: hsl(224, 15%, 8%) or equivalent)
[ ] PASS / [ ] FAIL — Primary accent color defined as CSS custom property
[ ] PASS / [ ] FAIL — Proper contrast ratio (4.5:1 minimum for normal text)
[ ] PASS / [ ] FAIL — Semantic color tokens used (--color-primary, --color-surface, etc.)

Typography:
[ ] PASS / [ ] FAIL — Font stack defined (Geist Mono for code, Inter or system-ui for body)
[ ] PASS / [ ] FAIL — Type scale consistent (no arbitrary font sizes)
[ ] PASS / [ ] FAIL — Line height adequate (1.5 minimum for body text)
[ ] PASS / [ ] FAIL — Font weight used meaningfully (not decoratively)

Spacing:
[ ] PASS / [ ] FAIL — 8px grid used (all spacing values: 4, 8, 12, 16, 24, 32, 48, 64, 96)
[ ] PASS / [ ] FAIL — Consistent component padding
[ ] PASS / [ ] FAIL — Consistent section gaps

Components:
[ ] PASS / [ ] FAIL — Buttons have consistent styles (primary, secondary, ghost, destructive)
[ ] PASS / [ ] FAIL — Inputs have focus states
[ ] PASS / [ ] FAIL — Loading states present on async operations
[ ] PASS / [ ] FAIL — Error states present on forms
[ ] PASS / [ ] FAIL — Empty states present on data lists
[ ] PASS / [ ] FAIL — Toast notifications (not browser alert())

Motion:
[ ] PASS / [ ] FAIL — Hover transitions (150ms ease)
[ ] PASS / [ ] FAIL — Page transitions present
[ ] PASS / [ ] FAIL — Skeleton loaders (not just spinners)

Responsive:
[ ] PASS / [ ] FAIL — Mobile breakpoints defined (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
[ ] PASS / [ ] FAIL — Navigation collapses on mobile
[ ] PASS / [ ] FAIL — Touch targets >= 44px

Accessibility:
[ ] PASS / [ ] FAIL — All images have alt text
[ ] PASS / [ ] FAIL — Form inputs have labels
[ ] PASS / [ ] FAIL — Color not sole conveyor of information
[ ] PASS / [ ] FAIL — Focus visible on all interactive elements
```

### Step 4.3 — UDEC Gate Decision

```
udecScore >= 8.5 → Log "Design PASSES Synthia standards"
                   → Note improvement opportunities for P3 backlog
                   → Continue to Phase 5

udecScore >= 6.0
AND < 8.5         → Log "Design needs patches"
                   → Generate targeted improvement list
                   → Add to build plan as P2 tasks
                   → Continue to Phase 5

udecScore < 6.0   → Log "Design FAILS — auto-rebuild recommended"
                   → Notify human: "UDEC score {{score}}/10. Recommend auto-rebuild. Approve?"
                   → WAIT FOR HUMAN RESPONSE
                   → If APPROVE:
                       → Design Agent: rebuild all visual components
                       → Re-score UDEC after rebuild
                       → Must achieve >= 8.5
                   → If DECLINE:
                       → Add all design items to P1 build plan tasks
                       → Continue to Phase 5
```

### Step 4.4 — Design Improvement Task List

For each FAIL in Synthia standards check:
```
TASK-D-{{n}}
Category: DESIGN
Severity: {{HIGH | MEDIUM | LOW}}
Description: {{what's wrong}}
Fix: {{specific action to take}}
Files: {{which files to change}}
Effort: {{estimate}}
```

---

## PHASE 5: PRODUCTION READINESS

**Goal**: Run 30-point checklist. Identify critical blockers.

### Step 5.1 — Run Readiness Checker

```typescript
import { checkProductionReadiness } from '/lib/production-readiness/checker';
const readiness = await checkProductionReadiness({ repoPath: repo.path });
```

### Step 5.2 — Manual Verification Points

Some checks require manual review:

**SECURITY — Verify each manually:**
```bash
# S1: No hardcoded secrets (verify from Phase 2 results)
# S2: Environment variables used (check .env.example exists and is complete)
# S3: Authentication working (from Phase 1 run attempt)
# S4: HTTPS in production config
grep -r "http://" --include="*.ts" --include="*.json" . | grep -v localhost | grep -v dev
# S5: Input validation
grep -rE "z\.string()\|z\.number()\|joi\.string()\|yup\." --include="*.ts" . | wc -l
```

**RELIABILITY:**
```bash
# Error boundaries (React)
grep -r "ErrorBoundary\|componentDidCatch\|error.tsx" --include="*.tsx" . | wc -l
# Global error handler
grep -r "process.on.*uncaughtException\|process.on.*unhandledRejection" --include="*.ts" .
```

**OBSERVABILITY:**
```bash
# Logging
grep -r "console.log\|logger\.\|winston\|pino" --include="*.ts" . | grep -v "node_modules" | wc -l
# Error tracking
grep -r "Sentry\|@sentry\|rollbar\|bugsnag" package.json
```

### Step 5.3 — Score Calculation and Categorization

For items that PASS: +1 point
For items that FAIL:
- SECURITY fail → CRITICAL BLOCKER (must fix before any deployment)
- RELIABILITY fail → HIGH (must fix before production, can deploy to staging)
- PERFORMANCE fail → MEDIUM (should fix before production)
- OBSERVABILITY fail → MEDIUM (fix within 30 days post-launch)
- DEPLOYMENT fail → HIGH (must fix before deployment)
- SCALABILITY fail → LOW (acceptable for initial launch)

Final score = (passed items / 30) * 100

### Step 5.4 — Fix Plan Generation

For each failed item, generate:
```
READINESS-FIX-{{n}}
Category: {{category}}
Item: {{checklist item name}}
Priority: {{P0 | P1 | P2 | P3}}
Description: {{what's missing or broken}}
Fix Approach: {{how to fix it}}
Files to Modify: {{list}}
Effort: {{estimate}}
Acceptance: {{how to verify it's fixed}}
```

---

## PHASE 6: BUILD PLAN

**Goal**: Compile all tasks into a sequenced, estimated, approvable build plan.

### Step 6.1 — Task Aggregation

Collect tasks from all prior phases:
- From Phase 2: missing features, security fixes, technical debt items
- From Phase 4: design improvement tasks (TASK-D-*)
- From Phase 5: production readiness fixes (READINESS-FIX-*)

Deduplicate (same issue found in multiple phases → single task).

### Step 6.2 — Task Formatting

Each task in the final build plan:
```markdown
### TASK-{{id}}
**Category**: {{SECURITY | FEATURE | BUG | DESIGN | INFRA | DOCS}}
**Priority**: {{P0 | P1 | P2 | P3}}
**Effort**: {{XS | S | M | L | XL}}
**Agent**: {{Backend | Frontend | Design | Deployment | Master}}
**Dependencies**: {{[TASK-ids] or "none"}}
**Description**: {{what needs to be done}}
**Acceptance Criteria**:
- {{criterion 1}}
- {{criterion 2}}
```

### Step 6.3 — Execution Sequencing

Sort by:
1. P0 tasks first (always)
2. Then by dependency order (topological sort)
3. Then by effort (shortest first within same priority tier)

Identify parallelizable task groups (no inter-dependencies between them).

### Step 6.4 — Timeline Calculation

```
P0 tasks: {{count}} × avg effort = {{total_p0_hours}}
P1 tasks: {{count}} × avg effort = {{total_p1_hours}}
P2 tasks: {{count}} × avg effort = {{total_p2_hours}}
P3 tasks (optional): {{count}} × avg effort = {{total_p3_hours}}

Parallel execution factor: 0.6
Adjusted: (total_p0 + total_p1 + total_p2) × 0.6 = {{adjusted_hours}}
Buffer (30%): {{adjusted_hours}} × 1.3 = {{final_hours}}
Calendar days (8hr/day): {{final_hours / 8}}
```

### Step 6.5 — Human Approval Request

Present to human. Format:

```
======================================
BUILD PLAN READY FOR YOUR APPROVAL
======================================
Project: {{project_name}}
Generated: {{timestamp}}

SUMMARY:
  Total tasks: {{count}}
  Critical (P0): {{p0_count}} — must complete before any deployment
  High (P1): {{p1_count}} — must complete before production
  Medium (P2): {{p2_count}} — should complete before launch
  Optional (P3): {{p3_count}} — post-launch improvements

TIMELINE:
  Estimated work: {{final_hours}} hours
  Calendar estimate: {{days}} days
  Confidence: {{LOW | MEDIUM | HIGH}} (based on complexity)

DECISIONS NEEDED FROM YOU:
  {{list each human blocker with a clear question}}

REVIEW BUILD PLAN: [link to /audit-output/build-plan.md]

[APPROVE BUILD PLAN] [REQUEST CHANGES] [ABORT]
======================================
```

**HARD STOP**: Do not proceed until human responds with APPROVE.

### Step 6.6 — Write Build Plan

**OUTPUT FILE**: `/audit-output/build-plan.md`

---

## PHASE 7: IMPLEMENTATION

**Goal**: Execute approved build plan. Every task gets done, verified, and checked.

### Step 7.1 — Watcher Activation

```typescript
import { WatcherOrchestrator } from '/agents/watcher/orchestrator';
const watcher = new WatcherOrchestrator();
await watcher.startMonitoring({
  repoPath: repo.path,
  buildPlan: approvedBuildPlan,
  alertThresholds: { maxRetries: 3, maxBlockedHours: 2 },
});
```

### Step 7.2 — Execution Loop

For each task in priority+dependency order:

```
TASK: {{task_id}} — {{task_description}}
Status: IN_PROGRESS
Agent: {{assigned_agent}}

→ Execute task
→ Run tests related to changed files
→ If UI changes: Browser QA Agent validates
→ If design changes: Design Agent re-scores affected components
→ If PASS: mark task COMPLETE
→ If FAIL: see Step 7.3
```

Log every action. Every file change. Every test result. Watcher sees all of it.

### Step 7.3 — Rework Loop

```
Task FAIL detected:
  retry_count = 0
  
  WHILE retry_count < 3:
    Analyze failure reason
    Adjust approach
    Re-execute task
    If PASS: break
    retry_count++
  
  IF retry_count == 3:
    Mark task BLOCKED
    Log: "TASK {{id}} blocked after 3 retries: {{last_error}}"
    Notify Watcher
    Notify human: "Task {{id}} is blocked. Need your input: {{question}}"
    Continue with other non-blocked tasks
    WAIT for human response
    When human responds: retry task with new information
```

### Step 7.4 — Integration Checkpoints

After every 5 tasks completed:

```
INTEGRATION CHECKPOINT {{n}}
✓ Tasks completed this round: {{list}}
✓ Running tests: npm test (or equivalent)
  Result: {{pass/fail}}
✓ Browser QA: validating all affected flows
  Result: {{pass/fail}}
✓ Watcher alerts since last checkpoint: {{count}}
  Critical alerts: {{list or "none"}}
✓ Timeline: on track? {{yes | {{N}} hours behind}}
```

If tests fail at checkpoint: PAUSE. Fix before continuing.

### Step 7.5 — Progress Updates

Every 30 minutes, update Mission Control build queue:
- Tasks: {{completed}}/{{total}}
- Status: IN_PROGRESS
- ETA: {{remaining estimate}}
- Blockers: {{count}}

If human is waiting: send periodic update.

### Step 7.6 — Completion Verification

When all tasks COMPLETE (or COMPLETE + BLOCKED with human acknowledgment):

Run full test suite one final time.
Run full Browser QA validation — all flows from flow map.
Verify UDEC score is >= 8.5.
Verify production readiness score >= 70.

If any of these fail: return to 7.2 for targeted fixes.

---

## PHASE 8: JUDGE REVIEW

**Goal**: Independent quality gate. Judge has final say. No deployment without PASS.

### Step 8.1 — Compile Review Package

Assemble:
```
/audit-output/review-package/
  discovery-report.md          ← from Phase 1-2
  monetization-strategy.md     ← from Phase 3
  design-audit.md              ← from Phase 4
  production-readiness.md      ← from Phase 5
  build-plan.md                ← from Phase 6
  implementation-log.md        ← from Phase 7
  browser-qa-report.md         ← from Browser QA Agent
  current-udec-score.md        ← current UDEC score
  current-screenshots/         ← current state screenshots
```

### Step 8.2 — Judge Invocation

```
To: Judge Agent
Re: Production Readiness Review — {{project_name}}

Please evaluate this project for production readiness.

PROJECT CONTEXT:
  Name: {{project_name}}
  Type: {{project_type}}
  Original completeness: {{original_pct}}%
  Current completeness: {{current_pct}}%

SCORES:
  UDEC (Design): {{udec}}/10 (threshold: 8.5)
  Production Readiness: {{prod_ready}}/100 (threshold: 70)
  Revenue Viability: {{revenue_score}}/100

CHANGES MADE:
  {{summary of what was built/fixed}}

KNOWN LIMITATIONS:
  {{list any remaining issues with justification for deferral}}

Attached: [review-package/]

Please return: PASS / PASS WITH CONDITIONS / FAIL / ABORT
With: detailed reasoning for each dimension.
```

### Step 8.3 — Judge Verdict Handling

**PASS:**
```
Log: "Judge PASS received. Proceeding to deployment."
Write: /audit-output/judge-decision.md with verdict and timestamp
Notify human: "Project passed Judge review. Ready for deployment approval."
→ Proceed to Phase 9
```

**PASS WITH CONDITIONS:**
```
Log: "Judge PASS WITH CONDITIONS received."
For each condition:
  → Classify: DEPLOYMENT-BLOCKING or POST-DEPLOYMENT
  → If DEPLOYMENT-BLOCKING:
      Add to urgent fix list
      Execute fix
      Re-request Judge review (abbreviated — send only changed items)
  → If POST-DEPLOYMENT:
      Create ticket/note
      Include in launch documentation
When all DEPLOYMENT-BLOCKING conditions resolved:
→ Proceed to Phase 9
```

**FAIL:**
```
judge_fail_count++
If judge_fail_count >= 3:
  → ESCALATE TO HUMAN
  → Present: "Judge has failed this project 3 times. Options: (1) Continue fixing, (2) Accept and deploy with known issues, (3) Abandon project"
  → Wait for human decision

For each failure reason:
  → Map to tasks in build plan
  → Execute fix tasks (loop back to Phase 7)
  → Re-run Browser QA
  → Re-request Judge review
```

**ABORT:**
```
Log: "Judge recommends project abandonment."
Document: all Judge reasoning
Notify human with full context
Present options: (1) Disagree and override — human must explicitly authorize, (2) Accept recommendation
If human overrides: document override, proceed to Phase 9 with strong caveats
If human accepts: archive project state, close productionizer run
```

### Step 8.4 — Write Judge Decision Document

**OUTPUT FILE**: `/audit-output/judge-decision.md`

---

## PHASE 9: DEPLOYMENT

**Goal**: Deploy safely. Human approves everything.

### Step 9.1 — Staging Deployment Approval Request

```
======================================
READY TO DEPLOY TO STAGING
======================================
Project: {{project_name}}
Judge Verdict: PASS
Judge Date: {{timestamp}}

UDEC Score: {{udec}}/10
Production Readiness: {{prod_ready}}/100

Staging Target: {{staging_url_pattern}}

What will happen automatically:
1. Deploy to Vercel staging environment
2. Run automated validation suite
3. Monitor for 30 minutes
4. Report results to you

You will then decide: promote to production or stop here.

[APPROVE STAGING DEPLOY] [SKIP TO PRODUCTION REVIEW] [ABORT]
======================================
```

HARD STOP. Wait for human APPROVE.

### Step 9.2 — Staging Deployment

```typescript
import { deployToVercel } from '/lib/mcp-cli/wrappers';
const stagingDeploy = await deployToVercel({
  projectPath: repo.path,
  environment: 'preview',
  projectName: project.name,
});
// → Returns: { url: 'https://{{project}}-{{hash}}.vercel.app', deploymentId }
```

If deployment fails:
- Capture error
- Attempt 1 fix
- Retry deployment
- If still failing: notify human, document issue

### Step 9.3 — Post-Deploy Validation

Browser QA Agent validates staging URL:

```
Flow 1: Homepage accessible (200, < 3s load)
Flow 2: Auth flow (signup → login → logout)
Flow 3: Core feature ({{primary_feature}})
Flow 4: Error handling (trigger a known error, verify graceful display)
Flow 5: Mobile responsiveness (viewport 375px)

Automated checks:
- Lighthouse performance score > 75
- No console.error() calls
- No network requests returning 5xx
- Time to interactive < 5s
```

### Step 9.4 — Monitoring Window (30 minutes)

```
T+0:00   Deployment complete. Starting monitor.
T+0:05   Watcher checks: error log count, response times
T+0:10   Watcher checks: database connections, memory usage
T+0:15   Browser QA re-runs core flow (verify no regression)
T+0:20   Watcher checks: any 5xx spike?
T+0:25   Watcher checks: all health check endpoints responding
T+0:30   Monitoring complete. Generate staging report.
```

### Step 9.5 — Staging Report to Human

```
======================================
STAGING DEPLOYMENT REPORT
======================================
Project: {{project_name}}
Staging URL: {{staging_url}}
Deployed: {{timestamp}}

VALIDATION RESULTS:
  Homepage: PASS ({{load_time}}ms)
  Auth flow: PASS / FAIL
  Core feature: PASS / FAIL
  Error handling: PASS / FAIL
  Mobile: PASS / FAIL
  Lighthouse: {{score}}/100
  Console errors: {{count}} ({{list if any}})

MONITORING (30 min):
  Errors: {{count}}
  Avg response time: {{ms}}
  5xx count: {{count}}

STATUS: READY FOR PRODUCTION / ISSUES FOUND (see details)

Issues found (if any):
{{list issues with severity}}

[PROMOTE TO PRODUCTION] [FIX AND REDEPLOY] [KEEP AS STAGING ONLY] [ABORT]
======================================
```

### Step 9.6 — Production Deployment

After human approves:

```typescript
const prodDeploy = await deployToVercel({
  projectPath: repo.path,
  environment: 'production',
  projectName: project.name,
  domain: project.domain,  // if configured
});
```

Run final smoke test on production URL:
- Homepage: 200
- Auth: working
- Core feature: working

If production smoke test fails:
- Do NOT panic
- Vercel has instant rollback: `vercel rollback {{deploymentId}}`
- Notify human
- Fix and redeploy

### Step 9.7 — Post-Launch Documentation

Generate:

**Launch Summary** (for human):
```markdown
# {{project_name}} — LAUNCHED

**Date**: {{date}}
**Production URL**: {{url}}
**Judge Verdict**: PASS
**UDEC Score**: {{score}}/10

## What Was Built / Fixed
{{summary}}

## Known Limitations
{{list with ticket references}}

## Monitoring
- Uptime: {{uptime_monitor_url}}
- Error tracking: {{sentry_url or "not configured"}}
- Logs: {{log_url}}

## Recommended Next Actions (30 days)
1. {{action 1}}
2. {{action 2}}
3. {{action 3}}

## Revenue Action Items
1. {{monetization action 1}}
2. {{monetization action 2}}
```

### Step 9.8 — Mark Project PRODUCTION in Mission Control

Update project status:
```typescript
await updateProjectStatus({
  projectId: project.id,
  status: 'PRODUCTION',
  deployedAt: new Date(),
  productionUrl: prodDeploy.url,
  judgeVerdict: 'PASS',
  udecScore: udecScore,
  productionReadinessScore: prodReadyScore,
});
```

Mission Control now shows this project as: STATUS: PRODUCTION (green)

---

## POST-WORKFLOW HANDOFF

After Phase 9 completes:

1. Archive all `/audit-output/` documents to project record in Supabase
2. Close Watcher monitoring session (or transition to ongoing monitoring mode)
3. Notify human: workflow complete, project is live
4. Suggest next Productionizer candidate from backlog

---

## ERROR CODES

| Code | Meaning | Recovery |
|------|---------|----------|
| `PHASE_1_FAIL` | Cannot access repository | Check credentials, verify URL |
| `PHASE_2_BLOCKED` | Human blocker unresolved after 48h | Escalate, or skip blocked feature |
| `PHASE_4_REBUILD_TIMEOUT` | Design rebuild exceeds 4h | Review and continue manually |
| `PHASE_6_NO_APPROVAL` | Human didn't respond to build plan | Resend, wait, escalate after 48h |
| `PHASE_7_MAX_RETRIES` | Task failed 3 times | Escalate to human |
| `PHASE_8_JUDGE_ABORT` | Judge recommends abandon | Present to human for final decision |
| `PHASE_9_DEPLOY_FAIL` | Staging deploy failed | Debug, retry, or escalate |
| `PHASE_9_SMOKE_FAIL` | Production smoke test failed | Rollback immediately, notify human |

---

*Operational Workflow v1.0.0 — Pauli Pi Software Factory*
