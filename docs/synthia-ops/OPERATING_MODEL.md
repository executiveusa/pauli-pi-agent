# Cynthia Studio Operating Model
# Version: 1.0.0
# Date: 2026-04-04

## Overview

Cynthia operates as an 8-layer autonomous design studio. Each layer has clear responsibilities, inputs, outputs, and governance rules.

---

## LAYER 1 — INTAKE

**Purpose**: Receive and validate project inputs.

**Accepts**:
- PRDs (Product Requirements Documents)
- Spec kits
- Design requests (URL + goals)
- Content requests (newsletter, bulletin, blog audit)
- Audit requests (site analysis)
- Asset requests (3D brief, motion spec)
- Campaign requests (launch package)

**Intake Contract Fields**:
```yaml
job_id: string          # auto-generated
job_type: enum          # see task-types
client_id: string       # optional
brief: string           # natural language description
url: string             # optional, for audit jobs
brand_ref: string       # optional, pointer to brand profile
competitors: string[]   # optional
deliverables: string[]  # required
priority: low|normal|high|urgent
budget_class: starter|standard|premium|enterprise
submitted_at: datetime
```

**Output**: Job record in `studio/jobs/inbox/`

---

## LAYER 2 — TASK CLASSIFICATION

**Purpose**: Automatically determine job type and requirements.

**Classification Logic**:
1. Parse brief for domain keywords
2. Match to task-type registry (`studio/task-types/`)
3. Determine: domain, deliverables, required doctrine, required components, review standard, approval level, delivery channel

**Output**: Classified job with routing metadata

---

## LAYER 3 — AGENT ROUTING

**Purpose**: Assign agents to classified jobs.

**Routing Table** (see `studio/index/task-routing.yaml`):
| Job Type | Primary Agent | Supporting Agents |
|----------|--------------|-------------------|
| web.landing-page | Frontend Studio | Copy, Motion, Reviewer |
| web.marketing-site | Frontend Studio | Copy, Motion, Reviewer |
| app.product-ui | Frontend Studio | Copy, Reviewer |
| dashboard.analytics | Frontend Studio | Reviewer |
| copy.newsletter | Copy Studio | Reviewer, Packaging |
| copy.bulletin | Copy Studio | Reviewer |
| copy.blog-audit | Growth/Audit | Copy Studio |
| motion.interaction | Motion Studio | Frontend Studio, Reviewer |
| asset.3d-brief | 3D/Spatial Studio | Reviewer |
| design.audit | Growth/Audit | Design Librarian |
| design.refactor | Refactor Agent | Reviewer |
| brand.message-refresh | Copy Studio | Design Librarian |
| commercial.offer-assembly | Packaging | Copy Studio |

**Output**: Job moved to `studio/jobs/active/` with agent assignments

---

## LAYER 4 — EXECUTION

**Purpose**: Agents generate, iterate, and produce artifacts.

**Protocol (Karpathy Council)**:
1. Builder produces 3 parallel variations
2. Each variation is complete — no stubs, no TODOs
3. All variations use the 5-technique cinematic stack where applicable
4. All variations respect guardrails and anti-patterns

**Output**: Artifacts in active job folder

---

## LAYER 5 — REVIEW / SCORING

**Purpose**: Score all outputs against rubrics. Nothing passes without review.

**Process**:
1. Reviewer loads UDEC 14-axis framework
2. Scores each variation independently
3. Identifies blockers (MOT < 7.0 or ACC < 7.0 = full rejection)
4. Calculates weighted composite
5. If composite < 8.5: sends back with specific repair instructions
6. If composite ≥ 8.5 and no blockers: APPROVED

**Output**: Audit JSON in `studio/audits/`, job moved to `studio/jobs/review/` or `studio/jobs/approved/`

---

## LAYER 6 — MEMORY / LEARNING

**Purpose**: Approved outputs become institutional knowledge.

**What gets recorded**:
- Approved patterns → `studio/memory/approved-patterns/`
- Effective techniques → `studio/memory/lessons/`
- Scoring decisions → `studio/memory/decisions/`
- Failed approaches → `studio/memory/failed-attempts/`
- Critique rationale → `studio/memory/critiques/`
- Improvement ideas → `studio/memory/improvement-opportunities/`

**Rules**:
- Only reviewers and memory agents can write to approved-patterns
- All agents can write to lessons and improvement-opportunities
- Failed attempts are recorded without blame — they are learning data

---

## LAYER 7 — DELIVERY / COMMERCIALIZATION

**Purpose**: Package approved work for delivery.

**Delivery Formats**:
| Output Type | Format | Destination |
|-------------|--------|-------------|
| Landing page | HTML + assets bundle | Client CDN / Cloudflare Pages |
| Newsletter | HTML email + plain text | Email platform |
| Audit report | PDF + JSON | Client portal |
| Design system | Component library + docs | GitHub release |
| Motion spec | Video + code | Delivery bundle |
| 3D asset | GLB + scene spec | Asset CDN |
| Case study | Markdown + screenshots | Portfolio |

**Output**: Deliverable in `studio/jobs/delivered/`

---

## LAYER 8 — GOVERNANCE

**Purpose**: Enforce approval gates for sensitive actions.

### Autonomous (no approval needed):
- Design generation and iteration
- Quality scoring
- Memory recording
- Internal file operations
- Research and analysis

### Human approval required:
- Payment processing
- Contract acceptance or signing
- External publishing (to client CDN, social, etc.)
- Account creation or credential generation
- Database schema changes
- Destructive operations (delete, force push)
- Budget changes
- Regulatory claims
- Job platform submissions

### Approval mechanism:
Jobs requiring approval are placed in `studio/jobs/review/` with a `requires_human_approval: true` flag. Operators receive notification via Telegram/Discord. Work proceeds only after explicit approval.

---

## Quality Benchmarks

| Benchmark Site | Minimum UDEC Score |
|---------------|-------------------|
| basement.studio | 9.2+ |
| linear.app | 9.0+ |
| stripe.com | 8.8+ |
| vercel.com | 8.6+ |
| **Cynthia floor** | **8.5** |

---

## Continuous Improvement

The studio runs recurring improvement loops:

| Loop | Frequency | Owner |
|------|-----------|-------|
| Doctrine audit | Monthly | Design Librarian |
| Component inventory | Weekly | Ops Agent |
| Stale work detection | Daily | Ops Agent |
| Pattern gap analysis | Bi-weekly | Refactor Agent |
| Quality trend review | Weekly | Reviewer |
| Research intake | Daily | Scout/Research |
| Memory compaction | Monthly | Memory Agent |
