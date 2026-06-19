# FORMAT.md — Task File Schema
# The Pauli Effect™ AI Design Studio
# Every task in tasks/queue/ must follow this format.
# This is the "why trace" — every task knows why it exists.

---

## TASK FILE ANATOMY

```markdown
---
id: {YYYY-MM-DD}-{project}-{type}         # Unique ID, also the filename
agent: {ralphy|lena|marco|scout|aurora|bass|blender|hermes}
status: pending                            # pending | in_progress | review | done | rejected
project: {project name}                   # human-readable project name
type: {build|iterate|score|research|video|audio|3d}
goal: {client goal in one sentence}       # What the client gets
why: {Trace back to origin}               # → client brief → approved → why now
due: {YYYY-MM-DD}                         # Optional. Skip if no deadline.
---

## Brief
{2-5 sentences. What to build. What to fix. What to preserve.
Be specific. Not "improve the design." Say "fix MOT axis from 6.8 to 8.0 by adding
ScrollTrigger scrub on hero. Preserve TYP score (9.2). Based on {file}."}

## Input
{files this task reads — list file paths}

## Output
{where the deliverable goes — exact path}

## UDEC Gate
{udec >= 8.5}  or  {specific axis targets if iteration}

## References
{optional: reference sites, patterns to draw from}
```

---

## EXAMPLE — NEW BUILD TASK

```markdown
---
id: 2026-03-29-querencia-build
agent: ralphy
status: pending
project: Querencia Eco-Lodge
type: build
goal: Awwwards-caliber homepage for Querencia eco-lodge, Puerto Vallarta
why: → client onboarding signed 2026-03-28 → Hermes approved brief → build starts now
due: 2026-04-01
---

## Brief
Build the Querencia eco-lodge homepage. Vibe: Sacred Earth. Layout: Full-Bleed Cinematic.
Primary CTA: "Reserve Your Stay" — one per viewport, no stacking.
Mood: deep forest, warm candlelight, silence. Competitors to beat: interstellar-lab.com.

## Input
research/2026-03-29-querencia-research.md

## Output
.superdesign/design_iterations/querencia_{1,2,3}.html

## UDEC Gate
udec >= 8.5  |  MOT >= 8.0  |  ATM >= 8.5

## References
https://www.awwwards.com/sites/interstellar-lab
https://dominiozero.es/
```

---

## EXAMPLE — ITERATION TASK (from MARCO)

```markdown
---
id: 2026-03-29-querencia-synthesis-2
agent: ralphy
status: pending
project: Querencia Eco-Lodge
type: iterate
goal: Fix MOT and ATM axes to clear UDEC 8.5 floor
why: → querencia_1.html scored 8.2 composite → MOT 6.8 blocker → MARCO synthesis → iterate
---

## Brief
Iterate on querencia_1.html. MOT (6.8) is the blocker — LENA caught missing ScrollTrigger
on hero. Preserve TYP (9.1) and VHR (9.0) exactly. Fix:
1. Add gsap.to hero image scrub: 1.5 ScrollTrigger
2. Add SplitText stagger: 0.04 on H1 chars
3. Add GLSL noise grain canvas at 3% opacity (ATM was 7.8, needs 8.5+)
4. Replace ease: "power2.out" on cards with cubic-bezier(0.16, 1, 0.3, 1)

## Input
.superdesign/design_iterations/querencia_1.html
audits/querencia-audit-1.json

## Output
.superdesign/design_iterations/querencia_1_{1,2,3}.html

## UDEC Gate
composite >= 8.5  |  MOT >= 7.5  |  ATM >= 8.0
```

---

## STATUS WORKFLOW

```
pending → in_progress → review → done
                    ↘ rejected → (new task from MARCO)
```

Agent updates status in task file when they pick it up and when complete.
HERMES monitors for `status: review` files to trigger LENA.
HERMES monitors for `status: done` to ship to examples/ and Vibe Graph.
