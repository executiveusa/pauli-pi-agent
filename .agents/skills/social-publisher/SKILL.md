---
name: social-publisher
description: Schedule or publish only owner-approved Bambu social content through connected platform tools, with explicit destination, permissions and publication receipts.
---

# Social Publisher

## Preconditions
- platform/account is genuinely connected
- owner controls the account and OAuth
- content has `approved` state for the exact destination
- final text/media is known
- scheduled time is explicit when applicable

## Rules
- Never create an account, accept platform terms, buy ads, spend money, or change monetization/billing settings without explicit owner action.
- Never claim a post is live from a draft or API request alone.
- Capture platform post ID/URL/status as receipt when available.
- Fail closed when OAuth is missing/expired.
- Keep credentials server-side and out of memory/logs.
- Do not publish private/sensitive material merely because it exists in Second Brain.

## Output
Publication/schedule receipt or truthful failure state.