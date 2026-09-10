---
name: memory-normalizer
description: Convert approved personal source records into canonical people, projects, events, ideas, decisions, tasks, documents and relationships while preserving provenance.
---

# Memory Normalizer

## Canonical nodes
`Person, Project, Organization, Place, Event, Idea, Decision, Task, Document, Media, Skill, Value, Goal, Offer`

## Canonical edges
`knows, worked_with, created, belongs_to, occurred_at, mentioned_in, depends_on, inspired_by, decided, supports, contradicts, duplicate_of, derived_from`

## Rules
- Never invent missing facts.
- Preserve exact source provenance for every canonical claim.
- Keep facts, inferences, and user-authored opinions distinguishable.
- Preserve dates/timezones and original names before adding normalized forms.
- Give stable IDs to canonical records.
- Flag contradictions instead of silently choosing one version.
- Mark sensitive records before downstream indexing or publishing.

## Output
Canonical records and relations suitable for private storage, dedupe and graph construction.