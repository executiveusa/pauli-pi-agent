# Pauli Evolution — Evidence-Backed Timeline

This is a repository evolution map, not a changelog replacement. Dates and milestones are derived from Git history and verified current code/deployment evidence. Historical claims are not treated as current live wiring without re-verification.

## June 2026 — from Pi fork to Pauli system

### June 2–3: voice, second brain, design doctrine

- Mercury/voice chatbot work established voice as an agent interface.
- Second-brain/dashboard work introduced a browser-facing knowledge surface.
- SYNTHIA/design doctrine and security fixes expanded the fork beyond upstream Pi defaults.

### June 19–20: architecture graph and software factory

- A static architecture graph documented roughly dozens of capability nodes across agent/runtime layers.
- Software-factory and Mission Control concepts introduced specialized build/QA roles and a higher-level operator cockpit.

### June 24–27: brain, data, research, UI, content, integrations

- Pauli identity/brain/control-bridge work established local control and second-brain concepts.
- Repository/Notion inventory and sync work expanded external knowledge ingestion.
- Durable data-processor work added ChatGPT/Claude/Notion import and evidence/embedding paths.
- Deep research, Firecrawl/Bright Data work added external research capability.
- UI Intelligence, YouTube knowledge graph, shopping/browser, Mercury chat, content and multiple provider integrations accumulated rapidly.
- A web deployment path was switched from a brain dashboard toward the Pi web-ui example.
- Historical commits intentionally experimented with baking keys into production; that pattern is now classified as an S0 architecture issue and must be removed rather than preserved.

### June 30: delivery governance

- Masterstack/flywheel and `WORKFLOW.md` introduced explicit QA, security, release, and evidence gates.

## July 2026 — ICM and company operating system

### July 4: company ICM/content architecture

- Company-specific context, content, and agent isolation evolved toward folder-driven orchestration.

### July 28: canonical ICM layer

- Root ICM routing, five stages, skill catalog, and Digital Student workstream were added.
- Video Watch was normalized into an evidence-aware ICM-compatible skill.
- The repository formally adopted the rule that ICM organizes context while runtime package boundaries remain stable until consumer references are verified.

## August 2026 — durable learning and control-plane consolidation

### August 10: Digital Student / Skool

- Assisted Skool study runner merged to `main` with lesson checkpoints and first-three actionable knowledge export.
- A follow-on Absurd-backed durability branch was built to move long-running learning state from process memory to Postgres-backed durable tasks; it remains intentionally unmerged until the repository code-check gate can be run successfully.

### August 10: full-stack/ICM diagnosis

Current audit established:

- the hosted `pauli-pi-agent` domain serves the generic Pi web-ui example;
- repo-local Mission Control code exists but is not proven wired to the real control bridge;
- `ops/pauli-control` is the strongest verified backend control primitive;
- the historical second-brain Vercel deployment is sourced from another repository and its search endpoint is currently broken;
- the separate `pauli-dashboard` Vercel project is sourced from `dashboard-agent-swarm`, not this repo;
- browser build configuration can inject `.env` provider/service credentials and must be replaced with server-side brokering;
- upstream Pi has advanced far enough that selective harvesting is safer than a wholesale merge.

## Present architecture principle

Pauli is no longer "Pi plus a few changes." It is a capability operating system built around a Pi-derived runtime. The next phase is consolidation:

`ICM truth map -> one Mission Control -> one server-side control plane -> durable mission state -> selective upstream harvest`.
