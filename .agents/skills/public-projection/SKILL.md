---
name: public-projection
description: Enforce the only approved bridge from Bambu's private Second Brain to the public Animo Bambu site and social channels using allowlisted fields and owner approval.
---

# Public Projection

## Default
DENY.

## Required projection record
- canonical/source IDs
- provenance
- sensitivity class
- exact public fields/content
- owner approval state
- destination(s)
- expiration/review date when appropriate
- publication receipt/status

## Rules
- Never expose private source records wholesale.
- Remove credentials, private contact details, third-party correspondence, medical/health data, financial/legal private data, and unrelated personal identifiers unless explicitly approved for that destination.
- Approval for one destination does not imply approval for all platforms.
- Public content can reference a private source without making the source accessible.
- Revocation should stop future distribution and record what has already been published.

## Output
Public-safe projection payload or a blocked decision with reason.