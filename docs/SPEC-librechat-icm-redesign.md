# Spec: LibreChat-Style ICM Redesign for Pauli Pi Agent

> **Branch:** `feat/librechat-icm-redesign` (rollback: `git checkout main`)
> **Goal:** Transform the web-ui example into a LibreChat-inspired interface customized for a US-based nonprofit founder / solo entrepreneur, with ICM library organization, an Infranodus-style knowledge graph, and wired-in YouTube/Bright Data/Firecrawl agents.

---

## Problem Statement

The current UI (`packages/web-ui/example/src/main.ts`) is a basic chat panel with a header. It lacks:
- A sidebar conversation list (LibreChat pattern)
- A centered panel structure with proper spacing
- A knowledge graph view (Infranodus-style node theater)
- Integration with the ICM library structure
- Accessible agent skills (not slash commands, but visible action buttons)
- The YouTube KG agent, Bright Data, and Firecrawl wired into the chat

## Design Principles (from ICM paper + LibreChat + Hyperagent)

1. **One agent, many folders** — Cosmos reads the ICM library structure, not a monolithic context
2. **Centered panel** — chat is the focal point, sidebar for navigation, right panel for context
3. **Skills as action buttons** — not slash commands; visible, clickable, discoverable
4. **Observable knowledge** — the Infranodus graph shows what the agent knows
5. **US-focused** — nonprofit founder workflow: grants, donors, community impact, solo ops
6. **Native feel** — keyboard shortcuts, smooth transitions, no layout shift

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Cosmos logo | model switcher | token tracker       │
├──────────┬──────────────────────────────────┬───────────────┤
│ SIDEBAR  │  CENTERED CHAT PANEL             │  RIGHT PANEL  │
│          │                                  │  (toggleable) │
│ + New    │  ┌────────────────────────────┐  │               │
│ Sessions │  │  Messages (streaming)      │  │  Knowledge    │
│ list     │  │  Artifacts inline          │  │  Graph        │
│          │  │  Mercury diffusion effect  │  │  (Infranodus) │
│ Skills:  │  └────────────────────────────┘  │               │
│ - Watch  │  ┌────────────────────────────┐  │  Library      │
│ - Scrape │  │  Input + action buttons    │  │  browser      │
│ - Search │  └────────────────────────────┘  │  (ICM shelves)│
│ - Graph  │                                  │               │
└──────────┴──────────────────────────────────┴───────────────┘
```

## Implementation Phases

### Phase 1: UI Shell (LibreChat layout)
- Replace `main.ts` renderApp with 3-column layout
- Left sidebar: New Chat button, session list, skills as buttons
- Center: ChatPanel (existing) with proper max-width centering
- Right panel: toggleable Knowledge Graph + Library browser
- Keep all existing functionality (model switcher, token tracker, Mercury)

### Phase 2: Skills as Action Buttons
- Replace slash-command concept with visible skill buttons in sidebar
- Skills: Watch Video, Scrape Web, Search Brain, View Graph, New Project
- Each button triggers a tool or opens a modal
- Skills read from `skills/SKILLS_REGISTRY.md` (lazy-load)

### Phase 3: Infranodus Knowledge Graph
- New component: `KnowledgeGraph.ts` — force-directed node graph
- Nodes = library files, brain memories, conversation topics
- Edges = semantic similarity (from embeddings) or folder co-occurrence
- Uses lightweight canvas rendering (no heavy D3 dependency)
- Click node → opens the file/memory in right panel
- Shows "gaps" (unconnected nodes) like Infranodus

### Phase 4: ICM Library Organization
- Reorganize `THE LIBRARY-AMENTIS LIBRARY` to strict ICM structure:
  - `CLAUDE.md` (Layer 0 — workspace identity)
  - `CONTEXT.md` (Layer 1 — task routing)
  - `stages/01_research/`, `02_build/`, `03_ship/` (Layer 2 — numbered)
  - `references/` (Layer 3 — stable doctrine)
  - `output/` (Layer 4 — working artifacts)
- Run `scan-library.mjs` to rebuild the index
- Wire the brain search to query the new structure

### Phase 5: Agent Wiring
- **YouTube KG agent**: Add "Watch Video" skill → ingests URL → stores in Supabase
- **Bright Data**: Add "Scrape Web" skill → uses BRIGHT_DATA_API for research
- **Firecrawl**: Add "Crawl Site" skill → uses FIRECRAWL_API_TOKEN for site ingestion
- All skills appear as action buttons, not slash commands

### Phase 6: US Nonprofit Founder Customization
- System prompt tuned for: 501(c)(3) ops, grant writing, donor management, community impact
- Quick actions: "Draft grant", "Find donors", "Impact report", "Volunteer coord"
- Model defaults: GLM-5.2 for big tasks, Groq/Gemini free for tool calls

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `packages/web-ui/example/src/main.ts` | Modify | 3-column layout, sidebar, skills |
| `packages/web-ui/example/src/sidebar.ts` | Create | Conversation list + skill buttons |
| `packages/web-ui/example/src/knowledge-graph.ts` | Create | Infranodus-style node graph |
| `packages/web-ui/example/src/library-browser.ts` | Create | ICM shelf browser |
| `packages/web-ui/example/src/skills-panel.ts` | Create | Action buttons for skills |
| `packages/web-ui/example/src/app.css` | Modify | LibreChat-style spacing/typography |
| `brain/CLAUDE.md` | Create | Layer 0 ICM identity |
| `brain/CONTEXT.md` | Create | Layer 1 task routing |
| `scripts/organize-library.mjs` | Create | Reorganize library to ICM structure |

## Rollback Plan

```bash
# If anything breaks:
git checkout main
git branch -D feat/librechat-icm-redesign

# Vercel rollback:
npx vercel rollback pauli-pi-agent.vercel.app --token vcp_3TZ2pq...
```

## Validation

- `npm run build` passes in `packages/web-ui/example`
- `npx tsc --noEmit` passes
- Browser loads at localhost:5173 with 3-column layout
- Model switcher still works
- Token tracker still syncs
- Knowledge graph renders with library nodes
- Deploy to Vercel production
