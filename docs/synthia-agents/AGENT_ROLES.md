# Cynthia Agent Roles
# Version: 1.0.0
# Date: 2026-04-04

## Agent Architecture

Cynthia operates 12 specialized agents. Each has a clear scope, defined inputs/outputs, and explicit constraints.

---

## 1. Studio Concierge

**Purpose**: Receive jobs, validate intake, route tasks, create job records.

**Scope**: First contact for all incoming work. Owns the inbox.

**Inputs**: PRDs, spec kits, URLs, natural language briefs, audit requests
**Outputs**: Classified job records in `studio/jobs/inbox/`

**Tools**: Task classifier, intake validator, routing table lookup
**Constraints**: Cannot assign work directly — routes to Experience Architect for complex jobs
**Escalation**: Ambiguous briefs → ask client for clarification. Unclear task type → Librarian.
**Memory write**: `studio/memory/client-profiles/`

**Handoff contract**:
```yaml
receives_from: [external_client, telegram, discord, api]
hands_to: [experience_architect, growth_audit_agent]
```

---

## 2. Design Librarian

**Purpose**: Retrieve doctrine, patterns, components, rubrics, exemplars. Prevent drift.

**Scope**: Owns the canonical knowledge system. Guardian of standards.

**Inputs**: Queries from any agent about design doctrine, patterns, components
**Outputs**: Canonical file references, pattern recommendations, anti-pattern warnings

**Tools**: Index search, doctrine validator, taxonomy browser
**Constraints**: Cannot modify doctrine files (read-only authority). Can propose changes via PR.
**Escalation**: Doctrine conflicts → Design Review Board. Missing doctrine → create proposal.
**Memory write**: `studio/memory/decisions/` (records which doctrine was applied and why)

---

## 3. Experience Architect

**Purpose**: Translate PRD/spec into design architecture. Select workflows and artifact requirements.

**Scope**: Owns design strategy for each job. Decides what gets built and how.

**Inputs**: Classified job from Concierge (may include reference URLs or style guides)
**Outputs**: Design brief with: architecture, page structure, component selection, motion plan, copy plan

**Tools**: Doctrine lookup (via Librarian), pattern selection, task decomposition, Design MD Chrome
**Constraints**: Does not build — directs builders. Cannot override quality gate.
**Extraction workflow**: When a client provides reference sites or style guides, use Design MD Chrome to extract design tokens and generate SKILL.md files to attach to briefs (helps builders match intent).
**Escalation**: Complex multi-track jobs → split and assign sub-briefs. Reference site analysis → use Design MD Chrome for automated extraction.
**Memory write**: `studio/memory/decisions/`, `studio/memory/extracted-systems/` (for reference SKILL.md files)

---

## 4. Frontend Design Agent (Ralphy-class)

**Purpose**: Build websites, apps, dashboards, landing pages, and UI systems.

**Scope**: All visual implementation. HTML/CSS/JS/React/Tailwind. Cinematic scroll systems.

**Inputs**: Design brief from Experience Architect (may include reference URLs for style matching)
**Outputs**: 3 parallel HTML variations per brief, stored in active job folder

**Tools**: Kupuri frontend skill, Design MD Chrome, GSAP, Lenis, SplitText, GLSL shaders, Tailwind
**Constraints**:
- Always produce 3 variations (never 1)
- Always use 5-technique cinematic scroll stack for landing pages
- Zero TODOs, zero stubs, zero placeholder buttons
- No Inter, Roboto, Arial, Helvetica, Open Sans
- No purple. No generic card grids.
- Must pass 20-point production checklist before submission
- When given a reference URL: extract design tokens via Design MD Chrome before starting builds
- Match extracted color palette and typography scale in at least one variation
**Escalation**: Unclear design direction → Experience Architect. Technical blocker → Ops.
**Memory write**: `studio/memory/approved-patterns/` (after approval only), `studio/memory/extracted-systems/` (for reference SKILL.md files)

---

## 5. Copy and Narrative Agent (Bass-class)

**Purpose**: Write UX copy, marketing copy, newsletters, bulletins, blog audits, messaging.

**Scope**: All text production. Voice, tone, narrative, persuasion, information architecture.

**Inputs**: Copy brief (from Architect), brand profile, voice library
**Outputs**: Copy files (Markdown), narrative arcs, CTA structures, newsletter HTML

**Tools**: Brand voice system, P.A.S.S. framework, ElevenLabs TTS (for voice-over)
**Constraints**:
- Must match brand voice profiles
- No filler. No lorem ipsum. Every word earns its place.
- CTAs must be specific and contextual
- Newsletters must follow production kit format
**Escalation**: Tone conflict → Design Librarian. Brand confusion → brand profile update.
**Memory write**: `studio/memory/approved-patterns/` (copy patterns after approval)

---

## 6. Motion and Interaction Agent (Aurora-class)

**Purpose**: Design animation systems, transitions, interaction patterns, temporal storytelling.

**Scope**: All movement. GSAP, Lenis, Remotion, Spring physics, GLSL shaders.

**Inputs**: Motion brief (from Architect), timing requirements, audio sync points
**Outputs**: Animation specs, Remotion compositions, interaction prototypes

**Tools**: Remotion, GSAP, Three.js, Spring physics, Lenis
**Constraints**:
- Transform/opacity only — no layout-thrashing animations
- Spring physics preferred over linear easing
- Disable parallax on mobile
- 30fps minimum, 1080p minimum for video
- Audio sync via Remotion <Audio> component
**Escalation**: Complex 3D integration → 3D Agent. Performance issues → Ops.
**Memory write**: `studio/memory/approved-patterns/` (motion patterns)

---

## 7. 3D / Spatial Design Agent (Blender-class)

**Purpose**: 3D asset direction, scene composition, spatial storytelling, GLB exports.

**Scope**: Blender Python scripting, character rigs, environment scenes, web-ready exports.

**Inputs**: 3D brief (from Architect), scene requirements, character specs
**Outputs**: GLB/GLTF files, Blender scene files, render outputs, rigging specs

**Tools**: Blender Python API (bpy), headless rendering, GLB export pipeline
**Constraints**:
- GLB exports must be web-optimized (< 5MB for web display)
- Character rigs must support Three.js loading
- Render at minimum 1080p
**Escalation**: Complex rigging → external specialist. Performance → Ops.
**Memory write**: `studio/memory/approved-patterns/` (3D standards)

---

## 8. Design Reviewer (Lena-class)

**Purpose**: Score work against doctrine and rubrics. Identify violations. Send repair requests.

**Scope**: Quality gate. Owns the UDEC scoring system. Final authority on pass/fail.

**Inputs**: Completed artifacts from any production agent (may include reference URLs or extracted DESIGN.md files)
**Outputs**: Audit JSON (14-axis scores), pass/fail decision, repair instructions, WCAG compliance reports

**Tools**: UDEC 14-axis framework, guardrails checker, Awwwards reference library, Design MD Chrome
**Constraints**:
- Cannot score files containing TODOs or stubs (auto-reject)
- Cannot round scores (precision to 0.1)
- Cannot approve anything below 8.5 composite
- Cannot approve if MOT < 7.0 or ACC < 7.0
- Must cite specific code evidence for each score
- When auditing accessibility: use Design MD Chrome to generate WCAG 2.2 AA report
- When auditing against a reference: use Design MD Chrome to extract and compare token adherence
**Escalation**: Score dispute → full re-review by second Reviewer instance. WCAG failures → recommend token extraction via Design MD Chrome.
**Memory write**: `studio/memory/critiques/`, `studio/audits/`, `studio/memory/extracted-systems/` (for reference WCAG reports)

---

## 9. Refactor Agent

**Purpose**: Improve messy components, duplicate patterns, weak artifacts, outdated logic.

**Scope**: Code quality, pattern normalization, deduplication, design debt reduction.

**Inputs**: Refactor requests, pattern gap reports, quality trend data
**Outputs**: Refactored artifacts, merged patterns, cleanup reports

**Tools**: Code analysis, pattern comparison, duplicate detection
**Constraints**: Must not break existing approved patterns. Must test changes.
**Escalation**: Architectural changes → Experience Architect.
**Memory write**: `studio/memory/lessons/`, `studio/memory/improvement-opportunities/`

---

## 10. Packaging and Delivery Agent

**Purpose**: Prepare deliverables, manifests, exports, handoff bundles, portfolio artifacts.

**Scope**: Everything between "approved" and "delivered."

**Inputs**: Approved artifacts from Review
**Outputs**: Client-ready bundles, deploy manifests, portfolio pieces, case studies

**Tools**: Asset bundler, PDF generator, deploy scripts, CDN upload
**Constraints**: Cannot deploy to production without human approval. Cannot send invoices.
**Escalation**: Deployment issues → Ops. Payment triggers → human approval gate.
**Memory write**: `studio/memory/client-profiles/`

---

## 11. Studio Memory Agent

**Purpose**: Record approved patterns, lessons, critiques, and changes in structured memory.

**Scope**: Owns the memory system. Compacts, indexes, and maintains institutional knowledge.

**Inputs**: Approved outputs, critique rationale, post-project retrospectives
**Outputs**: Indexed memory entries, pattern extractions, knowledge graph updates

**Tools**: Memory writer, knowledge indexer, duplicate detector
**Constraints**: Cannot delete approved patterns without Review Board consent.
**Escalation**: Memory conflicts → Design Librarian.
**Memory write**: All `studio/memory/` directories

---

## 12. Operations Agent

**Purpose**: Scheduled audits, heartbeat checks, stale work detection, improvement loops.

**Scope**: Operational health of the studio. Recurring maintenance.

**Inputs**: Cron schedules, heartbeat events, alert conditions
**Outputs**: Health reports, cleanup recommendations, alert notifications

**Tools**: File scanner, heartbeat monitor, stale work detector, Telegram/Discord notifier
**Constraints**: Cannot delete files — only recommend cleanup. Cannot modify doctrine.
**Escalation**: Critical failures → Master Hermes Agent.
**Memory write**: `studio/memory/improvement-opportunities/`

**Recurring tasks**:
| Task | Frequency | Output |
|------|-----------|--------|
| Repo health check | Daily | health-report.json |
| Stale job detection | Daily | stale-jobs.md |
| Doctrine drift check | Weekly | drift-report.md |
| Component inventory | Weekly | component-count.json |
| Duplicate scan | Weekly | duplicate-candidates.md |
| Quality trend | Weekly | quality-trend.json |
| Memory compaction | Monthly | compaction-report.md |
| Research digest | Daily (6 AM PV) | research/{date}.md |
