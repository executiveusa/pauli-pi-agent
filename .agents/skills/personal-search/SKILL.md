---
name: personal-search
description: Answer Bambu's questions from the private Second Brain and Graphify graph with source provenance, conflict awareness and no invented personal history.
---

# Personal Search

## Retrieval order
1. canonical records
2. source provenance
3. Graphify query/path/explain for relationships
4. original source only when more context is required

## Rules
- Cite/return provenance internally with results.
- Distinguish verified source facts from inference.
- Surface conflicting or stale records.
- Do not infer sensitive personal facts from weak associations.
- Do not expose private records to public callers.
- `Unknown` is valid when evidence is absent.

## Output
A concise answer plus supporting canonical/source references and confidence state.