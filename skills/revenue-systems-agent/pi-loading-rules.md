# PI Loading Rules

## Skill Identity

```yaml
skill_name: revenue-systems-agent
display_name: Revenue Systems Agent Skill
slash_command: /pauli-sent-me
owner_agent: PI
status: active
mode: lazy_load
branch: claude/revenue-systems-skill-0Ke4z
canonical_folder: skills/revenue-systems-agent/
future_subagent_name: RevenueSystemsAgent
proof_sdk_integration: true
```

## When PI Should Load This Skill

Load this skill when the task involves:

1. Business website audits
2. Local business lead generation
3. Revenue-system offers
4. Custom CRM ideas
5. Booking systems
6. Appointment systems
7. Referral tracking
8. Directory partner monetization
9. Local trust systems
10. Outreach and sales scripts
11. Demo specs
12. Subscription packaging
13. Niche productization
14. Pauli Sent Me OS workflows

## When PI Should NOT Load This Skill

Do not load this skill for:

- general creative writing
- unrelated coding
- personal tasks
- video prompts
- manga/comic production
- infrastructure work
- unrelated research
- image generation
- generic chat

## PI Execution Pattern

1. User gives PI a business, niche, website, or revenue-system idea.
2. PI classifies the task.
3. If relevant, PI loads this skill via `/pauli-sent-me`.
4. PI runs the workflow from `workflow.md`.
5. PI creates a business audit, pain scorecard, offer, demo spec, outreach, and subscription package.
6. PI stores the output under `clients/` or `prospects/`.
7. PI logs reusable niche learnings under `factory/revenue-systems/`.
8. PI appends learnings to `learnings/self-improvement-log.md`.

## Skill Output Contract

Every completed run should produce:

1. Business Snapshot
2. Current Funnel
3. Likely Pain Points
4. Pain Scorecard
5. Recommended System
6. Demo Spec
7. Offer
8. Outreach Message
9. Sales Call Script
10. Monthly Subscription Package
11. Reusable Niche Template
12. Next Build Steps
