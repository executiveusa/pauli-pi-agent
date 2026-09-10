---
name: second-brain-ingest
description: Inventory and ingest only owner-approved personal knowledge sources into Bambu's private Second Brain with immutable provenance and source manifests.
---

# Second Brain Ingest

## Purpose
Create a truthful, replayable intake layer for Bambu's private knowledge sources.

## Approved initial roots
- Google Drive `1RXPst2I_QY3btZ1CbmStDsuGKY4eTcwa`
- Google Drive `10l7H0layX2UL2u974CtkstF8IIYSpmPY`

## Rules
1. Inventory before reading deeply.
2. Stay inside explicitly approved roots; never expand to all Drive by convenience.
3. Record source ID/path, type, timestamps, size/hash when available, importer version, and ingest status.
4. Treat original exports as immutable evidence.
5. Stage extraction separately from source archives.
6. Never place secrets, OAuth tokens, private URLs, or credentials into durable memory.
7. Stop and report `Not connected` when a source cannot be verified.

## Output
A source manifest plus normalized-ingest candidates, each linked to provenance. Do not publish or deduplicate in this skill.