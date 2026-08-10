---
type: domain
status: active
owner_path: packages/content-engine
consumes: [signals, company-briefs, brand-context]
produces: [stories, content-drafts, publishing-candidates]
edges: [../06-video-media/CONTEXT.md, ../13-business-revenue/CONTEXT.md]
governance: internal
---

# Storytelling and Content

One job: turn evidence, signals, offers, and brand context into useful narrative and publishable content.

## Owners

- `packages/content-engine/` — signal ingestion, scoring, synthesis.
- `companies/*/briefs/`, `companies/*/content/`, `companies/*/_signals/` — company-specific ICM factory/product layers.
- content, writing, podcast, and publishing skills referenced by `skills/SKILLS_REGISTRY.md`.
- `agents/monetization/` where story connects directly to offers and revenue.

## Rules

Source claims from evidence. Separate strategy from finished copy. Company voice and positioning are factory context; drafts and approved content are per-run product artifacts. Video scripting routes through `../06-video-media/CONTEXT.md` rather than duplicating a second story system.
