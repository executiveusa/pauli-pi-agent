# SKILL: DESIGN PRINCIPLES — REFACTORING UI & HUMAN-CENTERED DESIGN

**Use this skill whenever:** deciding how to structure a layout, choosing between
design approaches, evaluating information hierarchy, or making any visual design
decision that isn't covered by the motion or color skills.

Core sources: Refactoring UI (Adam Wathan & Steve Schoger), Don't Make Me Think (Steve Krug).

---

## LAW 0 — START WITH A FEATURE, NOT A LAYOUT

Never open a design session by asking "what should the layout look like?"
Ask: "What is the user trying to accomplish?"

Then design the smallest possible interface that accomplishes it.
Add structure (nav, sidebar, header) only when the feature demands it.

> "Design the feature first. Then figure out how to navigate to it."
> — Refactoring UI

---

## LAW 1 — HIERARCHY IS ALL

Every design problem is a hierarchy problem.
If a layout feels wrong, it's almost always because elements competing for
the same visual weight are fighting for attention.

### Fix hierarchy before anything else:

```
Weak: all text same size, same color, same weight
Strong: 3 distinct levels (primary / secondary / muted)

Primary:   full color, largest/boldest
Secondary: slightly dimmer, slightly smaller
Muted:     60% opacity or muted gray, smallest
```

### Font weight creates more hierarchy than font size:
```css
/* Instead of making the label bigger: */
.stat-value { font-size: 3rem; font-weight: 700; }
.stat-label { font-size: 0.75rem; font-weight: 400; color: var(--text-dim); }
/* Label doesn't compete. Value wins. */
```

### Don't use grey to de-emphasize on colored backgrounds:
```css
/* On dark #0c0d0a background: */
color: rgba(255,255,255,0.4); /* muted white — correct ✓ */
color: #888;                   /* medium grey — muddy ✗ */
```

---

## LAW 2 — SYSTEMATIC SPACING

Never pick spacing values arbitrarily. Use a defined scale and never deviate.

### Spacing scale
```
4px  → micro gaps (icon + label, list item padding)
8px  → tight spacing (form field internal padding)
12px → compact components
16px → standard component padding
24px → related-group separation
32px → section subsections
48px → between distinct sections on mobile
64px → between sections on desktop
96px → major section padding (min for premium landing pages)
```

### The spacing law: related things are closer together
```
Section heading:   48px margin-top from previous section
Section heading:   8px  margin-top from its content (they're related)
Form label:        6px  margin-bottom from its input (they're related)
Error message:     4px  margin-top from input (directly attached)
```

If two elements are related, reduce the space between them.
If they're unrelated, increase it.

---

## LAW 3 — VISUAL WEIGHT BALANCE (not just CSS layout)

Layout balance ≠ mathematical symmetry.

Large light elements can balance small dark elements.
Heavy typography can balance an empty whitespace zone.

### Applying this to Kupuri designs:
```
Gold accent: heavy visual weight → needs breathing room (whitespace = counterweight)
Wall of text: heavy weight → break with large image or whitespace
Dark surface + single CTA button: the button IS the focal point (everything else recedes)
```

---

## LAW 4 — DESIGN FOR THE EMPTY STATE FIRST

Every data-driven component needs:
1. Empty state (no data)
2. Loading state (fetching)
3. Error state (failed)
4. Populated state (real content)

An interface without empty states breaks on first use.
Design the empty state to guide the user to fill it (not just "No items yet").

```html
<!-- Don't: -->
<p>No destinations found.</p>

<!-- Do: -->
<div class="empty-state">
  <span class="empty-icon">🗺️</span>
  <h3>No destinations saved</h3>
  <p>Browse our collection and save the ones calling to you.</p>
  <button class="btn-cta">Explore Destinations ↗</button>
</div>
```

---

## LAW 5 — BORDERS ARE A LAST RESORT

Borders create visual noise. Before adding a border, try:
1. Box shadow
2. Background color difference (slightly different surface)
3. Spacing (separation through whitespace)
4. Only then: a subtle border

When you do use borders:
- Keep opacity low: `rgba(255,255,255,0.06)` not `rgba(255,255,255,0.3)`
- Use them for structure, not decoration
- One border direction can carry more weight: lighter top border = glass light refraction

---

## LAW 6 — ACTIONS, NOT LABELS

Every interactive element needs a verb.

```
✗ "Email"      → ✓ "Send confirmation"
✗ "Password"   → ✓ "Update password"
✗ "Settings"   → ✓ "Manage account"
✗ "Submit"     → ✓ "Book your tour"
✗ "OK"         → ✓ "Got it"
```

Generic labels (Submit, Save, OK) cost user trust.
Specific action labels build confidence and reduce hesitation.

---

## LAW 7 — MOBILE FIRST MEANS CONSTRAINTS FIRST

Designing at 375px forces you to:
- Prioritize what actually matters (no room for "nice to have" elements)
- Stack gracefully (never horizontal overflow)
- Use full-width CTAs (easier to tap, more visually clear)
- Reduce nav to maximum 4 items

Then expand to desktop, adding visual flourishes (parallax, horizontal scroll,
atmospheric shader) that enhance the content — never replacing it.

---

## LAW 8 — KRUG'S GOLDEN RULE: DON'T MAKE ME THINK

The best interface is the one where the user never has to consciously deliberate.

Apply this as a test to every UI decision:
```
Would a tired person using this on a phone at 11pm figure it out instantly?
```

If the answer is "probably not," the interface needs to be clearer, not smarter.

**Kupuri application:**
- "Begin Your Journey" beats "Start" (context + action)
- Gold CTA with arrow icon beats "Learn more" text link
- Destination cards with moods/regions beat a plain list
- Cinematic scroll that reveals content beats "read more" accordions

---

## QUICK REFERENCE — COMMON MISTAKES & FIXES

| Mistake | Fix |
|---------|-----|
| Text too small on mobile | Never below 14px for body, 11px for labels |
| Buttons too close together | Min 8px gap between related buttons |
| Everything same emphasis | Introduce a 3-level hierarchy immediately |
| Empty state forgotten | Always ask: "what does this look like with no data?" |
| Border on everything | Remove borders. Try spacing + background first. |
| Input without label | Every form input has a visible label, not just placeholder |
| Hover effects only | Pair every hover with a matching active/focus state |
| Missing loading state | Skeleton screens > spinners for any content >200ms |
| Too many actions at once | Primary action first. Secondary actions dimmed/smaller. |
| Hero section too busy | One message. One button. Everything else is supporting. |
