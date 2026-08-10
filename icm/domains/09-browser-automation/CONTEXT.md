---
type: domain
status: active
owner_path: agents/browser-qa
consumes: [browser-intent, authorization, visual-state]
produces: [browser-actions, screenshots, qa-evidence]
edges: [../04-design/CONTEXT.md, ../07-research-learning/CONTEXT.md, ../12-security-governance/CONTEXT.md]
governance: sensitive
---

# Browser Automation

One job: operate or inspect browser surfaces within explicit authorization and evidence boundaries.

## Owners

- `agents/browser-qa/` — browser verification role.
- browser-harness references in `skills/SKILLS_REGISTRY.md`.
- `.agents/skills/online-shopper/` — higher-risk browser workflow with financial boundaries.
- `skills/ui-intelligence/` — interface diagnosis and visual validation.
- `icm/workstreams/digital-student/` — authenticated learning with domain-specific policy.

## Rules

- Prefer APIs/CLIs when they give the same outcome with less ambiguity.
- Visible user-controlled authentication stays separate from agent reasoning.
- Never extract passwords, MFA codes, cookies, auth tokens, or browser storage secrets.
- Browser writes, purchases, account changes, publishing, messaging, and destructive actions require their domain approval gates.
- Capture evidence before claiming a browser outcome succeeded.
