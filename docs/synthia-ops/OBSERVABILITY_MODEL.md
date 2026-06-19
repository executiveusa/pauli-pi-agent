# Observability Model — Cynthia Design Studio
# Version: 1.0.0

## Philosophy

Visibility is mandatory. Clients and operators must never feel like the studio is a black box. Every agent action is inspectable. Every job has a timeline. The interface is elegant operational transparency, not voyeuristic noise.

## Event System

All agent activity emits structured events to an append-only event log.

### Event Schema

```yaml
Event:
  id: uuid
  timestamp: datetime (ISO 8601)
  agent_id: string
  agent_role: string
  job_id: uuid (optional)
  event_type: enum
  payload: object
  visibility: internal|operator|client
```

### Event Types

```yaml
event_types:
  # Agent lifecycle
  - agent.heartbeat          # Agent is alive and ready
  - agent.task_started       # Agent began working on a task
  - agent.task_completed     # Agent finished a task
  - agent.task_failed        # Agent encountered an error
  - agent.escalation         # Agent escalated to higher authority

  # Job lifecycle
  - job.created              # New job entered inbox
  - job.classified           # Job type determined
  - job.routed               # Agents assigned
  - job.active               # Work in progress
  - job.artifact_produced    # An output was created
  - job.review_started       # Reviewer began scoring
  - job.review_completed     # Score delivered
  - job.iteration_required   # Below threshold, needs improvement
  - job.approved             # Passed quality gate
  - job.packaged             # Deliverable created
  - job.delivered            # Sent to client
  - job.archived             # Moved to archive

  # Financial
  - payment.invoice_created  # Invoice generated
  - payment.checkout_opened  # Client opened checkout
  - payment.captured         # Payment received
  - payment.failed           # Payment failed
  - payment.refunded         # Refund issued

  # System
  - system.health_check      # Periodic health report
  - system.alert             # Something needs attention
  - system.memory_write      # Knowledge recorded
  - system.doctrine_cited    # Doctrine was loaded/referenced
```

## Observability Layers

### Layer 1: Event Stream (foundation)
- Structured JSON events
- Append-only log
- Every agent action writes here
- Replayable

### Layer 2: Action Feed (human-readable)
- Summarized activity per agent and per job
- "Ralphy started variation 2 of querencia-landing"
- "Lena scored variation 1: UDEC 7.8 — MOT blocker"
- Mobile-friendly text descriptions

### Layer 3: Artifact Snapshots
- Thumbnail previews of produced artifacts
- Screenshot captures of generated HTML
- Before/after comparisons for refactoring

### Layer 4: Live Session (optional, advanced)
- VNC/browser session for supported agents with browser access
- Only when explicitly enabled
- Resource-intensive, not default

### Layer 5: Summary Dashboard
- Aggregated view of all active work
- Job pipeline (inbox → active → review → approved → delivered)
- Agent status cards
- Quality trend charts
- Revenue tracking

## Agent Cards (UI Component)

Each active agent displays:
```
┌─────────────────────────────────┐
│ 🟢 Frontend Studio (Ralphy)     │
│ Working on: querencia-landing   │
│ Current: Building variation 2/3 │
│ Last action: 2 min ago          │
│ Job progress: ████████░░ 80%    │
│ Budget used: $12.40 / $50.00    │
└─────────────────────────────────┘
```

## Design Room View

Per-job view showing:
- Job timeline (all events in order)
- Active agents and their current status
- Artifact preview panel (variations, drafts)
- Review score panel (14-axis radar chart)
- Operator intervention controls (pause, redirect, approve)
- Cost/budget tracker
- Delivery checklist

## Mobile Summary View

Condensed for phone screens:
- Job pipeline count (5 inbox, 3 active, 1 review)
- Active agents (list with status pills)
- Latest events (5 most recent)
- Alerts (if any)
- Quick actions (approve, pause, escalate)

## Heartbeat Schema

```yaml
Heartbeat:
  agent_id: string
  agent_role: string
  timestamp: datetime
  status: healthy|degraded|offline
  current_job: uuid (optional)
  current_task: string (optional)
  uptime_seconds: integer
  tasks_completed_today: integer
  last_error: string (optional)
```

Heartbeat interval: Every 60 seconds for active agents, every 300 seconds for idle agents.

## Alert Conditions

```yaml
alerts:
  - agent_offline:
      condition: "No heartbeat for 5 minutes"
      severity: warning
      notify: [hermes, ops]

  - job_stale:
      condition: "Job in active state for > 24 hours without progress"
      severity: warning
      notify: [hermes]

  - quality_regression:
      condition: "Average UDEC score trending down over 5 jobs"
      severity: info
      notify: [reviewer, librarian]

  - budget_exceeded:
      condition: "Job cost exceeds 120% of estimate"
      severity: warning
      notify: [hermes, bambu]

  - blocker_detected:
      condition: "MOT or ACC score below 7.0"
      severity: critical
      notify: [hermes, frontend]
```
