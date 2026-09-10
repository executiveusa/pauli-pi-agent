---
name: graphify-index
description: Build and query a Graphify-derived knowledge graph from approved normalized private sources while keeping canonical memory and provenance outside the disposable graph index.
---

# Graphify Index

## Purpose
Use `Graphify-Labs/graphify` as a derived navigation/query layer for Bambu's private Second Brain.

## Rules
- Canonical normalized records remain source of truth.
- Graph artifacts must be reproducible and disposable.
- Preserve Graphify `EXTRACTED` vs `INFERRED` semantics.
- Do not feed unrestricted secrets or credentials into semantic passes.
- Prefer project-scoped installation/configuration.
- Rebuild after accepted canonical merges rather than mutating source history.
- Queries should return supporting node/edge provenance when available.

## Expected artifacts
`graphify-out/graph.json`, `GRAPH_REPORT.md`, and optional private `graph.html`.

## Boundary
Never serve the private graph publicly. Public site content must pass through `public-projection`.