---
name: new-look
description: Convert an existing repo-backed web app into a repo-aware, multilingual, chat-first outcome interface with Popebot as the primary interaction surface. Audit the backend and frontend, infer the domain and real capabilities, interview the owner with GrillMe only for unresolved decisions, generate five divergent interactive HTML wireframes, apply ADHD/Apple/anti-slop design gates, run a separate Gauntlet critic loop, then produce an upgrade specification that preserves backend functionality while moving complexity under the hood.
license: MIT
---

# New Look

## Mission

Turn an existing application from "a user learns the software and clicks through controls" into:

**human states an outcome → system gathers only missing context → system selects tools → system works → human sees proof and consequential decisions**

The chat is the product. The rest of the interface supports context, progress, evidence, approval, recovery, and outputs.

New Look is repo-agnostic. Never assume the product domain from this skill. Infer it from the repository, deployed app, content, schemas, routes, data models, tests, and owner input.

A real-estate backend should become a real-estate operator. A CRM should become a sales operator. A construction platform should become a project operator. A media system should become a content operator.

## Non-negotiable order

Do not style first.

Run:

1. REPO TRUTH
2. DOMAIN + CAPABILITY MAP
3. CURRENT-UI CONTRACT AUDIT
4. GRILLME ALIGNMENT
5. CHAT-FIRST PRODUCT CONTRACT
6. FIVE DIVERGENT WIREFRAMES
7. INTERACTIVE HTML ARTIFACT
8. ADHD + APPLE + TASTE + ANTI-SLOP REVIEW
9. GAUNTLET LOOP
10. WINNER + UPGRADE SPEC
11. IMPLEMENTATION HANDOFF

## 1. Load authoritative upstream skills

Before making design decisions, load the current upstream versions listed in `references/UPSTREAM_SKILLS.md`.

Do not replace those skills with memory or a summary. Their current `SKILL.md` files are authoritative.

New Look orchestrates them; it does not overwrite them.

Required:
- Matt Pocock GrillMe / grilling
- Emil Kowalski apple-design, emil-design-eng, prototype, review/improve animations
- i-have-adhd
- Magdoub claude-wireframe-skill
- Gauntlet Loop
- ICM Architect when available
- Pauli Taste / anti-slop source
- Pauli Uncodixfy
- Popebot reference
- UIGen when an OpenAPI/contract audit is useful

If a repo cannot be fetched, record it as unavailable and continue with the last locally installed version if one exists. Never hallucinate unavailable instructions.

## 2. Repo truth before questions

Inspect the repository before interviewing the owner.

Use repo intelligence tools when available. Prefer JCodeMunch/symbol retrieval over whole-repo dumping.

Determine:
- framework(s)
- app entry points
- routes/screens
- API routes / OpenAPI / GraphQL / RPC
- database/schema/models
- authentication and roles
- integrations
- background jobs
- backend actions
- current frontend actions
- current tests
- feature flags / demo modes
- current deployment
- current design system
- current i18n
- current chat/agent code
- error/loading/empty/success states

Produce:

`artifacts/new-look/repo-truth.json`

Do not ask the human a question the repo can answer.

## 3. Build a capability graph

Translate backend reality into user outcomes.

Every capability record:

```json
{
  "capability_id": "schedule-showing",
  "domain_object": "property",
  "user_outcome": "Schedule a showing",
  "backend_operation": "POST /showings",
  "required_inputs": ["property_id", "date_time", "contact_id"],
  "permissions": ["agent"],
  "side_effect": true,
  "reversible": true,
  "human_gate": "required before external booking",
  "ui_surface": "existing modal / missing / disconnected",
  "evidence": ["path or symbol"]
}
```

Produce:

`artifacts/new-look/capability-map.json`

Then classify:
- CHAT-CALLABLE
- CHAT + SUPPORTING VIEW
- HUMAN-APPROVAL REQUIRED
- ADMIN ONLY
- NOT YET CONNECTED
- DO NOT EXPOSE

## 4. Audit the current interface against the backend

Create a bidirectional contract audit:

**Backend → UI**
- useful capability with no reachable UI
- operation only exposed to technical users
- API functionality hidden behind excessive clicks
- missing status/proof/recovery

**UI → Backend**
- dead buttons
- fake/demo data
- unconnected forms
- mocked success
- controls with no server action
- duplicated UI for one backend capability

Produce:

`artifacts/new-look/ui-backend-audit.json`

New Look must preserve functionality unless explicitly classified for removal. Complexity may be hidden; capabilities may not silently disappear.

## 5. Infer domain before generic design

Create a domain brief from evidence:

```text
CATEGORY
PRIMARY USERS
USER TRIGGERS
TOP JOBS
HIGH-CONSEQUENCE ACTIONS
CORE OBJECTS
TRUST REQUIREMENTS
REPEAT WORK
DOMAIN LANGUAGE
NON-TARGET USERS
```

Do not use generic SaaS outcome starters.

Examples must come from the actual capability graph.

Real estate examples might become:
- "Find me 3 homes under $700k near this school."
- "Schedule showings for these two listings Saturday."
- "Compare these properties and explain the tradeoffs."
- "Follow up with every lead who toured this week."

Those are examples only. Generate from the repo.

## 6. GrillMe alignment

Use Matt Pocock's GrillMe/grilling pattern after repo inspection.

Rules:
- one question at a time
- walk unresolved decision branches
- include your recommended answer with each question
- read code instead of asking when code can answer
- do not make the user write prompts
- stop when product intent and safety gates are sufficiently resolved

Questions should clarify:
- primary user
- highest-value outcomes
- what the system may do autonomously
- what always requires approval
- what must remain visible
- what must remain owner-controlled
- what "done" means

Save durable answers to the project's design context / ICM layer.

## 7. Chat-first contract

Popebot is the default front-door interaction model.

The primary UI should support:

**User**
- speaks or types an outcome in ordinary language

**System**
- detects language
- loads existing context
- asks only missing questions
- plans the tool sequence
- explains what it is about to do when consequence requires it
- executes permitted operations
- reports plain-language progress
- pauses for human gates
- returns inspectable results
- preserves a receipt/audit trail

Never lead with:
- model picker
- prompt editor
- agent zoo
- workflow builder
- API selector
- technical configuration
- large template wall

Put those behind progressive disclosure when they genuinely matter.

## 8. Multilingual contract

Required languages:
- English (`en`)
- Spanish (`es`)
- Swahili (`sw`)

Rules:
- detect input language but always provide a visible language override
- keep the conversation in the user's selected/detected language
- translate interface labels and explanations, not identifiers or stored source data unless requested
- backend tool calls remain language-neutral structured data
- locale-specific dates/numbers/currency use the selected locale
- failures and approvals must be fully understandable in all three languages
- do not require the user to change language before speaking

The interactive wireframe must demonstrate all three locales.

## 9. Five divergent wireframes

Use the Magdoub wireframe methodology.

Generate five materially different structures, not cosmetic variants.

Mandatory candidates:
1. Conversation OS — chat + outcome + proof
2. Outcome Command — single outcome command surface
3. Guided Grill — one decision at a time
4. Approval First — returning-user decisions first
5. Ambient Voice — near-zero UI until the system has something useful to show

Adapt the structures to the domain. Do not force all five to look like the examples.

For each option provide:
- Wireframe
- Clean
- Polished

The Polished mode is still a prototype, not permission to implement final aesthetics.

## 10. Interactive HTML artifact is mandatory

Every New Look run must produce:

`artifacts/new-look/<run-id>/index.html`

Self-contained when practical.

It must include:
- repo/domain summary
- current capability audit
- old → new mental model
- five switchable UX directions
- Wireframe / Clean / Polished switcher
- desktop + mobile
- English / Spanish / Swahili switcher
- realistic domain-specific example conversation
- outcome starters generated from actual capabilities
- context-in-use surface
- progress surface
- human-gate surface
- evidence/results surface
- empty/loading/error/success/reconnect states
- capability/tool map
- disconnected-UI findings
- recommended option
- Gauntlet review/status
- upgrade plan

No screenshots pretending to be working UI. Clearly label prototypes.

## 11. ADHD interface gate

Invoke the upstream i-have-adhd skill and apply it to the product UX.

Product rules:
- one dominant next action
- at most 3–5 starter choices
- one bounded question at a time
- visible current state
- visible completed wins
- no unnecessary navigation
- errors say where, cause, and fix
- do not make the user remember hidden state
- preserve work across refresh/session
- advanced complexity is progressively disclosed

The user should be able to leave while the machine works.

## 12. Apple polish gate

Invoke Emil's Apple/design skills.

Apply:
- immediate input feedback
- calm hierarchy
- precise typography and spacing
- predictable controls
- interruptible motion
- continuity during state change
- motion for hierarchy/orientation/feedback only
- keyboard/touch parity
- reduced-motion fallback
- visible focus
- no delayed primary actions

Do not clone Apple's visual identity.

## 13. Taste / Uncodixfy gate

Load the upstream taste and Uncodixfy rules.

Reject:
- generic centered AI hero without a strategic reason
- card grids used as filler
- gradient/glass as identity
- pill-shaped everything
- fake metrics/testimonials
- dashboard mockups as proof
- decorative AI brains/orbs as meaning
- unnecessary rounding
- excessive nav
- feature-section repetition
- vague AI words replacing customer outcomes

Use real content and domain evidence to determine composition.

## 14. ABAC quality gate

No authoritative owner-defined "ABAC scale" was discoverable when this skill was authored.

Therefore:

1. If the target repo or owner provides an authoritative ABAC rubric, LOAD IT and it supersedes this fallback.
2. Otherwise use the New Look fallback defined in `references/ABAC_SCALE.md`.

Never pretend the fallback is the owner's original scale.

## 15. Gauntlet is mandatory

Load the actual Gauntlet Loop skill.

For each meaningful wireframe slice choose a real named, fetchable, comparable bar.

Builder and critic must be separate contexts.

Critic:
- compares actual outputs side by side
- picks one, binary
- gives no praise
- names the single biggest remaining gap

Builder fixes that gap.

Repeat until ours wins or a real blocker stops the run.

No fixed round count.
No self-scored "9/10" exit.

Maintain a live Gauntlet section in the HTML artifact.

## 16. Popebot integration contract

Use Popebot as a reference/adapter, not a blind repo transplant.

New Look's generated implementation spec must map:

```text
conversation
→ intent/outcome
→ context retrieval
→ capability/tool selection
→ authorization
→ execution plan
→ progress events
→ human gate
→ result
→ receipt
→ memory
```

Popebot must be visually integrated into the product's design system.

Preserve owner sovereignty and repo auditability.

See `references/POPEBOT_CONTRACT.md`.

## 17. UIGen / contract-derived UI

When the backend exposes OpenAPI or a comparable contract, inspect it.

Use UIGen concepts where helpful to discover:
- operations
- forms
- auth
- file uploads
- relationships
- live data
- missing admin surfaces

Do not let generated CRUD UI replace the art-directed chat-first primary product.

## 18. Upgrade plan

After the owner selects the winning wireframe (or an already approved winner exists), generate:

`artifacts/new-look/upgrade-plan.html`
`artifacts/new-look/upgrade-spec.json`

Classify existing frontend surfaces:

- KEEP
- REFRAME
- MOVE UNDER CHAT
- SUPPORTING VIEW
- ADMIN ONLY
- REMOVE WITH EVIDENCE
- FIX CONNECTION

Every change must point back to a capability, user outcome, usability problem, or proof requirement.

## 19. Never erase the backend

New Look is not a landing-page redesign skill.

It is an interface architecture skill.

Do not remove functioning backend capabilities merely to make a simpler screenshot.

Simplification means:
**less cognitive load for the human, more orchestration under the hood.**

## 20. Done

A New Look audit/wireframe cycle is complete only when:

- repo truth captured
- domain inferred with evidence
- capability graph exists
- UI/backend disconnects identified
- GrillMe alignment complete
- multilingual chat contract defined
- five divergent options generated
- interactive HTML artifact opens locally
- desktop/mobile and states included
- ADHD gate passes
- Apple/taste/anti-slop gates pass
- Gauntlet winner exists
- upgrade spec preserves capability coverage
- Popebot adapter contract exists
- unresolved risks are explicit

Final response:

```text
DECISION
DOMAIN
PRIMARY USER
PRIMARY OUTCOME
CAPABILITIES MAPPED
DISCONNECTED UI
WIREFRAME WINNER
GAUNTLET RESULT
HTML ARTIFACT
UPGRADE SPEC
RISKS
NEXT
```
