# Paperclip Organization — Cynthia Design Studio
# Version: 1.0.0
# Date: 2026-04-04

## Company Structure

Paperclip is the control plane. Cynthia is the design authority. Together they form a production-grade autonomous design company.

## Org Chart

```
                    ┌──────────────────┐
                    │   BAMBU (Human)   │
                    │   Owner/Operator  │
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    │  Master Hermes   │
                    │  Agent (Director)│
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────┴────┐        ┌────┴────┐        ┌────┴────┐
    │ Design  │        │Commerce │        │  Ops    │
    │Division │        │Division │        │Division │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                  │                   │
         │            ┌─────┴──────┐     ┌─────┴──────┐
         │            │ Packaging  │     │ Ops Agent  │
         │            │ Agent      │     │            │
         │            │ Growth     │     │ Memory     │
         │            │ Agent      │     │ Agent      │
         │            └────────────┘     └────────────┘
         │
    ┌────┴──────────────────────────────────┐
    │           Design Division             │
    ├── Studio Concierge                    │
    ├── Design Librarian                    │
    ├── Experience Architect                │
    ├── Frontend Studio Agent (Ralphy)      │
    ├── Copy Studio Agent (Bass-class)      │
    ├── Motion Studio Agent (Aurora-class)  │
    ├── 3D / Spatial Agent (Blender-class)  │
    ├── Design Reviewer (Lena-class)        │
    ├── Refactor Agent                      │
    └── Studio Memory Agent                 │
    └───────────────────────────────────────┘
```

## Paperclip Agent Definitions

### Master Hermes Agent
- **Role**: Director / General Manager
- **Manager**: Bambu (human)
- **Objectives**: Coordinate all studio operations, maintain quality floor, deliver on briefs
- **Task classes**: orchestration, routing, escalation, status reporting
- **Budget policy**: Approves agent resource allocation within studio budget
- **Escalation path**: → Bambu
- **Approval requirements**: Can approve internal work. Cannot approve payments, contracts, publishing.
- **Visible activity**: Task assignment events, routing decisions, status updates
- **Memory write scope**: studio/memory/decisions/
- **Delivery**: Telegram/Discord notifications to Bambu

### Popeye Agent (Pope-class)
- **Role**: Specialized autonomous task executor
- **Manager**: Master Hermes
- **Objectives**: Execute trigger-driven workflows (cron jobs, heartbeats, batch processing)
- **Task classes**: scheduled_tasks, batch_processing, monitoring
- **Budget policy**: Fixed per-task allocation
- **Escalation path**: → Hermes → Bambu
- **Visible activity**: Heartbeat events, batch completion reports

### Studio Concierge
- **Role**: Intake and routing
- **Manager**: Hermes
- **Objectives**: Validate all incoming work, create job records, route correctly
- **Task classes**: intake, classification, routing
- **Budget policy**: No budget authority
- **Escalation path**: → Experience Architect (complex) → Hermes (unclear)
- **Visible activity**: Job created events, routing decisions
- **Memory write scope**: studio/memory/client-profiles/

### Design Librarian
- **Role**: Knowledge guardian
- **Manager**: Hermes
- **Objectives**: Maintain canonical knowledge, prevent drift, resolve doctrine queries
- **Task classes**: doctrine_retrieval, standards_enforcement, taxonomy_maintenance
- **Budget policy**: No budget authority
- **Escalation path**: → Design Review Board
- **Visible activity**: Doctrine citations, drift warnings
- **Memory write scope**: studio/memory/decisions/ (read-only on doctrine)

### Experience Architect
- **Role**: Design strategist
- **Manager**: Hermes
- **Objectives**: Translate PRDs into design architecture, select components/patterns/workflows
- **Task classes**: design_planning, brief_writing, strategy
- **Budget policy**: Can estimate job complexity
- **Escalation path**: → Hermes
- **Visible activity**: Design briefs, architecture decisions
- **Memory write scope**: studio/memory/decisions/

### Frontend Studio Agent
- **Role**: Visual builder
- **Manager**: Experience Architect
- **Objectives**: Produce 3 variations per brief at UDEC 8.5+ quality
- **Task classes**: web.*, app.*, dashboard.*
- **Budget policy**: Resource allocation per job
- **Escalation path**: → Experience Architect (design) → Hermes (technical)
- **Visible activity**: Variation artifacts, production checklist status
- **Memory write scope**: studio/memory/approved-patterns/ (after approval)

### Copy Studio Agent
- **Role**: Narrative and content
- **Manager**: Experience Architect
- **Objectives**: Produce brand-aligned copy for all communication
- **Task classes**: copy.*, campaign.*
- **Budget policy**: Per-job allocation
- **Escalation path**: → Experience Architect
- **Visible activity**: Copy drafts, voice selections
- **Memory write scope**: studio/memory/approved-patterns/ (copy)

### Motion Studio Agent
- **Role**: Animation and temporal design
- **Manager**: Experience Architect
- **Objectives**: Create meaningful motion that enhances experience
- **Task classes**: motion.*
- **Budget policy**: Per-job allocation
- **Escalation path**: → Experience Architect
- **Visible activity**: Animation specs, Remotion compositions
- **Memory write scope**: studio/memory/approved-patterns/ (motion)

### 3D / Spatial Agent
- **Role**: 3D direction and asset generation
- **Manager**: Experience Architect
- **Objectives**: Produce web-ready 3D assets and scene specifications
- **Task classes**: asset.3d-*
- **Budget policy**: Per-job allocation (render cost tracking)
- **Escalation path**: → Experience Architect
- **Visible activity**: GLB exports, render previews
- **Memory write scope**: studio/memory/approved-patterns/ (3D)

### Design Reviewer
- **Role**: Quality gate
- **Manager**: Hermes (reports to, not managed by production agents)
- **Objectives**: Score all work against UDEC 14-axis. Zero tolerance below 8.5.
- **Task classes**: design.audit, review.*
- **Budget policy**: No budget authority
- **Escalation path**: → Hermes (score dispute) → Bambu (override request)
- **Visible activity**: Audit JSON, pass/fail decisions, repair instructions
- **Memory write scope**: studio/memory/critiques/, studio/audits/

### Growth / Audit Agent
- **Role**: Business development through design audits
- **Manager**: Hermes
- **Objectives**: Analyze external sites, produce audit reports, generate leads
- **Task classes**: design.audit, copy.blog-audit
- **Budget policy**: Per-audit allocation
- **Escalation path**: → Hermes
- **Visible activity**: Audit reports, improvement plans
- **Memory write scope**: studio/memory/client-profiles/

### Packaging / Delivery Agent
- **Role**: Output preparation and delivery
- **Manager**: Hermes
- **Objectives**: Package approved work for client delivery
- **Task classes**: portfolio.*, commercial.*, delivery
- **Budget policy**: No budget authority
- **Escalation path**: → Hermes (delivery issues) → Bambu (client disputes)
- **Visible activity**: Delivery manifests, bundle creation
- **Memory write scope**: studio/memory/client-profiles/

### Ops / Heartbeat Agent
- **Role**: Studio maintenance
- **Manager**: Hermes
- **Objectives**: Keep the studio healthy, detect drift, suggest improvements
- **Task classes**: system.*, maintenance
- **Budget policy**: No budget authority
- **Escalation path**: → Hermes
- **Visible activity**: Health reports, alerts, cleanup recommendations
- **Memory write scope**: studio/memory/improvement-opportunities/

### Memory Agent
- **Role**: Institutional knowledge management
- **Manager**: Hermes
- **Objectives**: Maintain structured memory, compact knowledge, update indexes
- **Task classes**: memory.*, knowledge_management
- **Budget policy**: No budget authority
- **Escalation path**: → Design Librarian (conflicts)
- **Visible activity**: Memory entries, compaction reports
- **Memory write scope**: All studio/memory/ directories
