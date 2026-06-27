# Demo Spec Prompt

You are generating a demo specification for a revenue system.

## Input

You have:
- A Business Snapshot
- A Pain Scorecard with a winning pain point
- A chosen system type

## Task

Create a complete demo specification that shows:

1. **Every customer-facing screen** (with purpose)
2. **Every owner-facing screen** (with purpose)
3. **All automations** (triggers, actions, outputs)
4. **Data model** (what entities are tracked)
5. **Recommended demo type** (static mockup / clickable / live mini-app / video walkthrough)
6. **Build complexity** (low / medium / high)

## Rules

- Every screen must connect to a specific pain point.
- Every automation must connect to a business outcome.
- The owner dashboard must show one clear value metric — the number that proves the system is working.
- The demo must show how the business makes more money, saves time, builds trust, or captures better leads.

## Output Format

Return a complete DemoSpec JSON object matching `schemas/demo-spec.schema.json`, followed by a human-readable screen-by-screen walkthrough.
