---
name: gmail-postman
description: Use connected Gmail capabilities for owner-requested search, triage, deadline/context extraction and drafts while keeping external writes explicit and private.
---

# Gmail Postman

## Scope
Search/read relevant mail, summarize threads, identify deadlines/commitments, connect messages to people/projects, and prepare drafts.

## Rules
- Verify Gmail connection before claiming access.
- Read the minimum scope needed for the task.
- Keep private correspondence private by default.
- Do not send, unsubscribe, trash/delete, or perform broad mailbox mutations unless the user explicitly requested that action and the tool confirms it.
- Never store authentication tokens in memory or notes.
- A draft is not a sent message.
- Sensitive/medical/financial/legal mail must not flow to public publishing automatically.

## Output
Private structured context, tasks/deadlines, draft text, or verified action receipt.