# SKILL: COLOR PSYCHOLOGY — ASSOCIATION-BASED COLOR DESIGN

**Use this skill whenever:** choosing a color palette, assigning accent colors, or
advising on color decisions for Kupuri Media projects. Color is not magic. It works
through association, not inherent emotion.

---

## THE CORE PRINCIPLE: ASSOCIATION, NOT MAGIC

Color psychology works through **association chains** — not through colors having
inherent emotional properties.

**The correct mental model:**
```
Color → Associated Thing → Emotion attached to that thing
```

**The wrong mental model:**
```
Color → Direct emotion (this is pseudoscience)
```

**Example — Why Coca-Cola's red works:**
Red doesn't inherently mean "energy." Coca-Cola's red works because:
1. Billions of people associate red+white with Coca-Cola
2. Coca-Cola triggers reward circuits (pleasure + sugar anticipation)
3. Therefore: red+white → Coca-Cola → pleasure

Someone who has never tasted Coke would not feel that response from the colors alone.

**Implication for design:** Color choices are most effective when they tap into
pre-existing cultural associations in your specific audience's context.
Not universal color rules.

---

## CULTURAL ASSOCIATION MAP (Latin America / Kupuri context)

| Color | Strong Associations | Weak/Negative Associations |
|-------|---------------------|-----------------------------|
| Deep gold `#c4963c` | Sunlight, ancient ruins, quality, warmth, Aztec identity | None in context |
| Sage green `#5a7a52` | Jungle, freshness, eco, authentic, healing | None in context |
| Dark vellum `#0c0d0a` | Night, depth, luxury, mystery, pre-dawn | Death (only in high saturation black) |
| Rust `#b05c38` | Earth, terracotta, clay, handmade | Danger (only in pure red) |
| Emerald `#10b981` | Technology, growth, sustainable, alive | None in context |
| Pure blue | Corporate, trust, cold | Out of place in eco/sacred context |
| Purple | Luxury (mass market), synthetic | Conflicts with Sacred Earth identity — BANNED |
| Neon anything | Gaming, young, cheap, 90s | Breaks premium context immediately |

---

## RULES FOR KUPURI MEDIA PROJECT COLOR SELECTION

### Rule 1 — One accent, always
Every project gets exactly one accent color. The rest are neutrals.
Splitting attention across multiple accents kills hierarchy.

### Rule 2 — Saturation ceiling: 80%
Fully saturated colors feel synthetic and cheap in premium contexts.
`hsl(38, 70%, 55%)` is gold that feels earned. `hsl(38, 100%, 55%)` is a cartoon.

### Rule 3 — Background first, always
Choose your darkest background value first.
All other colors are derived in relation to that background surface.

### Rule 4 — Warm/cool grays don't mix
Pick a gray temperature and commit.
- Warm gray family: add slight golden/brown cast
- Cool gray family: add slight blue cast
- Mixing both in the same project creates visual unease

### Rule 5 — Test in context, not in isolation
A color swatch means nothing. Always test:
- Text on your actual background value
- At the actual font size and weight
- In the light conditions of your target environment (mobile screens have higher gamma)

### Rule 6 — No purple, ever (Kupuri Law)
Purple consistently reads as mass-market luxury (think Cadbury, Hallmark).
It conflicts with every Sacred Earth and Glass aesthetic palette.
There are no exceptions to this rule.

---

## HOW TO CHOOSE ACCENT COLOR FOR A NEW PROJECT

```
1. List the 3 core associations you want to trigger:
   Example: "ancient, alive, premium"

2. Find the color that already exists in that context:
   "ancient" → gold, ochre, terracotta
   "alive"   → deep green, teal, forest
   "premium" → dark surface + restrained accent (not bright)

3. Pick the one that creates the most contrast with your background:
   Dark background → warm gold wins over dark green (insufficient contrast)

4. Run WCAG AA check on all text/button combinations immediately.

5. Never introduce a second accent unless absolutely necessary.
   If you need a second: use the first accent at 30% opacity, not a new hue.
```

---

## WCAG CONTRAST RATIOS (required before any text color decision)

```
4.5:1 — Minimum for normal text (WCAG AA)
3.0:1 — Minimum for large text (≥18px or ≥14px bold) (WCAG AA)
7.0:1 — Enhanced (WCAG AAA) — target for body copy on dark backgrounds

Tool: https://webaim.org/resources/contrastchecker/

Quick mental check for dark backgrounds:
- White #fff on #0c0d0a = excellent (18:1)
- Gold #c4963c on #0c0d0a = 5.8:1 — passes for large text, fails for small body copy
- Gold-dim #a09880 on #0c0d0a = 8.2:1 — passes for body
```

---

## COMMON FAILURES TO AVOID

| Failure | Why it happens | Fix |
|---------|---------------|-----|
| Gold text on light background | Forgot to check contrast | Always check with tool |
| Purple crept in | "Just for one element" | No exceptions. Replace with rust or sage. |
| Two accent colors | "They both felt right" | One must become a tint of the other, not a separate hue |
| Desaturated text that fails AA | Chasing subtlety too hard | Bump lightness up until it passes |
| Warm + cool grays mixed | Copy-pasted from different sources | Audit all gray values, pick a family |
