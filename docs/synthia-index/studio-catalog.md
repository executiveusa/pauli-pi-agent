# Studio Catalog — Cynthia Design Studio
# Version: 1.0.0
# Generated: 2026-04-04
# Purpose: Master index of everything in the studio

## Core Documents (read-first)
| Document | Path | Purpose |
|----------|------|---------|
| Studio Manifest | /STUDIO_MANIFEST.md | What Cynthia is |
| Agent Onboarding | /AGENT_ONBOARDING.md | How to start working |
| Operating Model | /studio/ops/OPERATING_MODEL.md | 8-layer system |
| Agent Roles | /studio/agents/AGENT_ROLES.md | 12 agent definitions |
| Design Laws | /studio/doctrine/DESIGN_LAWS.md | 14 non-negotiable laws |

## Doctrine
| File | Domain | Status |
|------|--------|--------|
| studio/doctrine/DESIGN_LAWS.md | All design | canonical |
| studio/doctrine/3d-world-SKILL.md | 3D world generation (Lyra pipeline) | canonical |
| skills/kupuri-frontend/SKILL.md | Frontend design | canonical |
| skills/design-principles/SKILL.md | Foundational design | canonical |
| skills/motion/SKILL.md | Motion design | canonical |
| skills/color-psychology/SKILL.md | Color systems | canonical |
| skills/brand/SKILL.md | Brand voice | canonical |
| skills/emerald-tablets/SKILL.md | Philosophy | canonical |
| skills/udec-scorer/SKILL.md | Quality scoring | canonical |
| tasks/GATE.md | Quality gate | canonical |

## Anti-Patterns
| File | Type |
|------|------|
| studio/anti-patterns/registry.yaml | Machine-readable registry |
| agents/ralphy/guardrails.md | Builder-specific guardrails |
| agents/lena/guardrails.md | Scorer-specific guardrails |

## Workflows
| Workflow | Location |
|----------|----------|
| Karpathy Council | studio/index/workflow-map.yaml |
| Free Audit Funnel | studio/public/FREE_AUDIT_FLOW.md |
| Newsletter Production | studio/index/workflow-map.yaml |
| Design Refactor | studio/index/workflow-map.yaml |
| Daily Research | studio/index/workflow-map.yaml |

## Task Routing
| File | Purpose |
|------|---------|
| studio/index/task-routing.yaml | Task type → agent mapping |
| tasks/ROUTING.md | Human-readable routing table |
| tasks/FORMAT.md | Task file format spec |
| tasks/DESIGN_GRAPH.json | Agent topology graph |

## Commercial
| File | Purpose |
|------|---------|
| studio/commercial/PAYMENTS_ARCHITECTURE.md | Payment system design |
| studio/commercial/CHECKOUT_OPTIONS.md | Payment methods |
| studio/commercial/LEAD_FUNNEL_ARCHITECTURE.md | Client acquisition |
| studio/commercial/DELIVERY_RELEASE_RULES.md | When to release work |

## Operations
| File | Purpose |
|------|---------|
| studio/ops/OPERATING_MODEL.md | 8-layer operating system |
| studio/ops/PAPERCLIP_ORG.md | Paperclip org chart |
| studio/ops/OBSERVABILITY_MODEL.md | Event system + dashboards |
| studio/ops/APPROVAL_BOUNDARIES.md | What requires human approval |

## Public Product
| File | Purpose |
|------|---------|
| studio/public/LANDING_PAGE_ARCHITECTURE.md | Landing page design |
| studio/public/FREE_AUDIT_FLOW.md | Free audit pipeline |
| studio/public/CLIENT_PORTAL_SPEC.md | Client dashboard spec |

## Mobile / Edge
| File | Purpose |
|------|---------|
| studio/mobile/EDGE_MODEL_STRATEGY.md | Gemma 4 + local inference |

## Rust Infrastructure
| Crate | Purpose | Priority |
|-------|---------|----------|
| rust/cli/ | cynthia CLI | P1 |
| rust/validators/ | Anti-pattern detection | P0 |
| rust/indexers/ | Knowledge graph compiler | P0 |
| rust/mcp/ | MCP server | P1 |
| rust/bridges/ | Integration adapters | P2 |
| rust/parsers/ | File format parsers | P2 |
| rust/graph-tools/ | Relationship graphs | P2 |
| rust/sync-tools/ | Repo reconciliation | P3 |

## Agent Workspaces
| Agent | Definition | Workspace |
|-------|-----------|-----------|
| Concierge | studio/agents/concierge/ | studio/jobs/inbox/ |
| Librarian | studio/agents/librarian/ | studio/doctrine/, studio/index/ |
| Architect | studio/agents/architect/ | studio/design-contracts/ |
| Frontend | studio/agents/frontend/ | studio/jobs/active/ |
| Copy | studio/agents/copy/ | studio/copy/, studio/newsletters/ |
| Motion | studio/agents/motion/ | studio/motion/ |
| 3D | studio/agents/3d/ | studio/3d/ |
| Reviewer | studio/agents/reviewer/ | studio/audits/ |
| Refactor | studio/agents/refactor/ | studio/components/ |
| Packaging | studio/agents/packaging/ | studio/delivery/ |
| Memory | studio/agents/memory/ | studio/memory/ |
| Ops | studio/agents/ops/ | studio/heartbeats/, studio/schedules/ |

## VS Code Extension
| Path | Purpose |
|------|---------|
| src/extension.ts | Extension entry point |
| src/providers/ | LLM providers |
| src/services/ | Services layer |
| src/tools/ | Agent tools |
| src/webview/ | React UI |

## Web Application
| Path | Purpose |
|------|---------|
| web/app/ | Next.js routes |
| web/components/ | React components |
| web/content/ | Blog content |
| web/lib/ | Utilities |

## Migration Artifacts
| File | Content |
|------|---------|
| migration/00_repo_inventory.md | Full inventory |
| migration/01_logic_graph.md | Knowledge flow graph |
| migration/02_duplicate_report.md | Duplicate detection |
| migration/05_studio_runtime_journal.md | Architecture decisions |
| migration/open-questions.md | Unresolved questions |
