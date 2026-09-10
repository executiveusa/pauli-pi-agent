---
name: memory-dedupe
description: Find duplicate and conflicting personal memories conservatively, preserve originals, and create a reversible merge ledger instead of destructive cleanup.
---

# Memory Dedupe

## Order
1. exact hash/content duplicates
2. normalized-key matches
3. identity candidates
4. semantic similarity candidates
5. conflict review

## Rules
- Preserve every source record.
- Never hard-delete a memory because it appears duplicated.
- Use relations such as `same_as`, `duplicate_of`, `conflicts_with`, `supersedes`.
- Record why a merge candidate exists and its evidence/confidence.
- Identity conflicts involving people, dates, ownership, medical, legal, financial, or relationship facts require owner review.
- A canonical record may cite multiple sources.
- All merges must be reversible from the ledger.

## Output
Duplicate candidates, conflict candidates, and an auditable merge ledger. No public projection.