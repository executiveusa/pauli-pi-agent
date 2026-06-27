# Branch Policy

## Branch

All work for this skill belongs on:

```text
claude/revenue-systems-skill-0Ke4z
```

## Folder Boundary

Canonical folder:

```text
skills/revenue-systems-agent/
```

Do not scatter files across the repo.

Do not modify unrelated core PI runtime files unless required for skill registration.

If a registry file exists, add the smallest possible reference to this skill.

## PI Core Rule

PI is the master agent.

This skill is a separate folder and branch.

PI loads this skill only when task classification matches the Revenue Systems domain.

Do not merge this skill into PI's global personality.

Do not overload PI's context with this skill unless needed.

## Lazy Load Rule

PI should load this skill when the user asks for any of the following:

- "audit this business"
- "make this into an offer"
- "how do we sell this business software?"
- "build a lead system"
- "create outreach"
- "make a demo"
- "turn this website into revenue"
- "Pauli Sent Me"
- "directory partner"
- "local business"
- "niche system"
- "subscription offer"
- "client CRM"
- "booking automation"
- "foreign buyer property leads"
- "hotel package leads"
- "eco-tour package"
- "HVAC/plumber leads"
- "anime digital products"
- "medical tourism leads"
- "destination wedding leads"

## Output Storage Rule

Business-specific outputs should be saved outside the skill folder.

Use:

```text
clients/{business-slug}/revenue-system-audit.md
prospects/{niche}/{business-slug}/audit.md
factory/revenue-systems/{niche}/{template-name}.md
```

The skill folder stores reusable workflows, templates, examples, schemas, and prompts only.
