# EMERALD TABLETS — PRIME DIRECTIVE
# Authority: CANONICAL — Integrated from synthia-superdesign
# Version: 1.0.0

---

## PURPOSE

This document establishes the Emerald Tablets as the philosophical and operational foundation for the Pauli Pi Agent system. All agents, systems, and outputs must align with these principles.

---

## THE SEVEN TABLETS

### TABLET I — THE ANTI-HYPE COVENANT

> "The map is not the territory. The framework is not the product."

- A flat markdown task file that routes correctly beats a complex orchestration framework
- A working button beats a "state machine" with no UI
- The folder IS the architecture. The task file IS the dispatch.
- **Test:** Can you explain how this works in 30 seconds? If no → simplify.

**Forbidden:**
- Vector databases for < 100 items
- Microservices for single applications
- Kubernetes for < 10 agents

### TABLET II — QUALITY IS A FLOOR, NOT A CEILING

> "8.5 is where we start. Not where we aim."

- UDEC 8.5 is the minimum to ship — not the target
- One exceptional component beats five adequate ones
- Less output, higher quality — always
- Zero stubs. Zero TODOs. If it ships, it's complete.

### TABLET III — TASTE IS A DISCIPLINE

> "Taste is not a feeling. It is a practice."

- Every agent reviews the previous build before starting the next
- Never call something "beautiful" without saying exactly why
- Cite specific techniques, not vibes

**Bad:** "I like this design — it feels premium"
**Good:** "VHR is strong here because the hero type is 4× the body size with a clear Z-path to the CTA"

### TABLET IV — SINGLE RESPONSIBILITY IS NON-NEGOTIABLE

> "Eight agents who each do one thing perfectly beat one agent that does everything poorly."

Every agent has one job. When an agent starts doing work outside its defined responsibility, quality degrades for both tasks.

### TABLET V — THE LOOP IS THE ONLY LOOP

> "Build × 3 → Score → Gate → Brief → Repeat. No shortcuts."

```
HERMES reads brief → SCOUT researches (if needed) → RALPHY builds × 3 →
LENA scores all 3 → GATE decision → APPROVED: ship → SOFT_REJECT: iterate →
HARD_REJECT: rebuild from scratch → MAX 5 iterations → escalate
```

**Permanently banned shortcuts:**
- Approving without score
- Iterating from HARD_REJECT output (must rebuild)
- Skipping brief to save time
- Shipping with any TODO or stub

### TABLET VI — THE REPOSITORY IS THE PRODUCT

> "If it lives only in a chat window, it doesn't exist."

Everything must be:
1. In a file, in a folder, in the repository
2. Named according to conventions
3. Committed with a message explaining what changed and why

**The chat trap:** If it's not in the repo, it doesn't exist.

### TABLET VII — SERVE THE MISSION, NOT THE AESTHETIC

> "We build technology in service of outcomes, not in service of aesthetics."

- Specificity beats generality
- History beats mystification
- Community beats exoticism

---

## DECISION MATRIX

When stuck between two approaches, ask:

```
1. Which is simpler and works? (Tablet I)
2. Which has higher craft floor? (Tablet II)
3. Which decision can I explain precisely? (Tablet III)
4. Which stays within agent scope? (Tablet IV)
5. Which follows the loop? (Tablet V)
6. Which produces a committed file? (Tablet VI)
7. Which serves the mission? (Tablet VII)
```

The correct choice satisfies more tablets.

---

## INTEGRATION WITH PI AGENT

The Emerald Tablets govern:
- All design decisions in packages/web-ui
- All agent coordination in packages/agent
- All output quality in packages/tui
- All documentation standards
- All commit and review practices

**Quality Floor for Pi Agent:** UDEC 8.5 minimum on all frontend output.

---

## REFERENCE DOCUMENTS

Full doctrine available at:
- `docs/synthia-doctrine/emerald-tablets-SKILL.md`
- `docs/synthia-doctrine/DESIGN_LAWS.md`
- `docs/synthia-doctrine/udec-scorer-SKILL.md`
- `docs/synthia-agents/AGENT_ROLES.md`
- `docs/synthia-ops/OPERATING_MODEL.md`
- `docs/STUDIO_MANIFEST.md`
