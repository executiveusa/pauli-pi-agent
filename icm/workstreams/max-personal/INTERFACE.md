# MAX Personal — Worker Interface

This contract is the stable boundary between the Agent MAXX control plane and Pi / MAX Personal.

## Purpose

Agent MAXX presents one nontechnical chat experience. The control plane routes personal work to Pi and business work to Hermes. This interface lets the portal and control plane invoke Pi without exposing Pi internals, model choices, tool names, or private memory to the user.

## Input envelope

```json
{
  "route": "personal",
  "request_id": "stable-request-id",
  "user_id": "authenticated-user-id",
  "conversation_id": "durable-conversation-id",
  "workspace_key": null,
  "user_intent": "plain-language request",
  "desired_outcome": "what done looks like",
  "context_refs": [],
  "approval": {
    "granted": false,
    "scope": []
  }
}
```

### Required behavior

- `route` MUST be `personal` before Pi executes personal work.
- `request_id` MUST be stable across retries so duplicate side effects can be reconciled.
- `conversation_id` MUST point to a Personal/Pi conversation in the durable conversation store.
- `desired_outcome` SHOULD describe success in user language, not tool instructions.
- `context_refs` MUST contain references, not an indiscriminate dump of personal memory.
- Credentials and raw secrets MUST NOT be written into the envelope.

## Output envelope

```json
{
  "request_id": "stable-request-id",
  "route": "personal",
  "agent_id": "pi",
  "status": "done",
  "summary": "Plain-English result",
  "proof": [],
  "human_blocker": null,
  "handoff": null,
  "next_action": null
}
```

Allowed `status` values:

- `working` — safe machine-executable work is still in progress.
- `done` — requested outcome is complete or the bounded mission is complete.
- `needs_human` — one specific human action is required before this branch can continue.
- `blocked` — an external dependency or unavailable capability prevents progress and there is no useful automatic retry remaining.
- `failed` — the bounded mission failed after verification/reconciliation.

The user-facing UI may translate these to `Working`, `Done`, `Needs you`, and `Blocked`.

## Human blocker contract

When a human is required, Pi returns exactly the information needed to resolve the blocker:

```json
{
  "status": "needs_human",
  "human_blocker": {
    "type": "authorization | judgment | credential | physical_action | sensitive_approval",
    "title": "Short plain-English title",
    "why": "Why only the human can do this",
    "action": "One concrete action",
    "resume_token": "opaque-resume-token"
  }
}
```

Rules:

1. Preserve all completed work before returning the blocker.
2. Stop only the blocked branch; independent safe work may continue.
3. Never expose implementation noise when one human action is sufficient.
4. Resume from durable state after the blocker is resolved; do not restart the whole mission.

## Business handoff contract

Pi does not execute business-domain work merely because the request arrived in the same Agent MAXX conversation.

For a business request, return a bounded handoff:

```json
{
  "status": "done",
  "handoff": {
    "target": "hermes",
    "route": "business",
    "reason": "business-domain request",
    "user_intent": "minimum business intent needed",
    "desired_outcome": "business result requested",
    "context_refs": []
  }
}
```

### Privacy rule

The handoff MUST NOT include health information, private personal notes, personal documents, or unrelated personal history unless the user explicitly asks to share that information and it is necessary for the business outcome.

## Mixed requests

For requests containing both personal and business outcomes:

1. Split the work into a Personal/Pi mission and a Business/Hermes mission.
2. Give each mission its own durable request identity.
3. Share only the minimum facts required between them.
4. Present one unified Agent MAXX result to the user.

## Side-effect discipline

Before any consequential external action:

1. Confirm the action is within the Personal lane.
2. Confirm required approval/authorization is present.
3. Reconcile current external state before retrying a previous request.
4. Use bounded retries with backoff for transient failures.
5. Record proof or a durable result reference after success.

## Health-support boundary

MAX Personal may organize symptoms/questions, prepare appointment notes, maintain user-requested reminders, explain general information, and help the user prepare for professional care. It must not claim a diagnosis, impersonate a clinician, or silently alter health-critical records.

## Control-plane routing truth

- `auto` is resolved by the Agent MAXX control plane before execution.
- `personal` resolves to Pi / MAX Personal.
- `business` resolves to Hermes / MAX Business.
- Pi MUST reject or hand off an explicitly `business` request rather than executing it as personal work.

This file defines the interface contract only. It does not create another runtime, database, or orchestration layer.