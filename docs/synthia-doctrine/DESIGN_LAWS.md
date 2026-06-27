# Cynthia Design Laws
# Version: 1.0.0
# Authority: CANONICAL — Do not modify without version bump
# Sources: Refactoring UI (Wathan/Schoger), Don't Make Me Think (Krug),
#          Kupuri Frontend Skill, Emerald Tablets, Studio Experience

---

## Law 0 — Feature First, Not Layout First

Design the feature. Then find where it lives.
Never start with "I need a sidebar" or "I need a hero section."
Start with: "What does the user need to accomplish?"

## Law 1 — Hierarchy Is Foundation

Every screen must have exactly 3 levels of visual hierarchy:
1. **Primary**: The one thing you see first (display type, ≥5rem)
2. **Secondary**: Supporting context (body, subheadings)
3. **Tertiary**: De-emphasized metadata (timestamps, labels, captions)

If everything is bold, nothing is bold.

## Law 2 — Spacing Is Meaning

Spacing communicates relationships:
- Elements that belong together are close
- Elements that are separate have breathing room
- Minimum section padding: `py-24` (6rem)
- Never use arbitrary values — use a spacing scale

## Law 3 — Visual Weight Creates Flow

Direct the eye through intentional contrast:
- Size (larger = more important)
- Color (saturated = attention, muted = background)
- Weight (bold vs. regular)
- Space (isolated elements draw attention)
- Position (F-pattern / Z-pattern)

## Law 4 — Empty States Are Part of the Design

Every component must have 4 states:
1. Empty / zero data
2. Loading / skeleton
3. Populated / normal
4. Error / failure

If you only designed the populated state, you designed 25% of the experience.

## Law 5 — Borders Are the Last Resort

Create separation through:
1. Spacing (best)
2. Background color difference
3. Box shadow (subtle)
4. Border (last resort, only if nothing else works)

## Law 6 — Labels Describe Actions, Not Fields

Buttons say what they do: "Save Changes", "Send Invoice", "Start Audit"
Not what they are: "Submit", "OK", "Click Here"

## Law 7 — One Action Per Viewport

Each scroll-stop should have exactly one clear next action.
If a user has to choose between 5 things at once, they choose nothing.

## Law 8 — Mobile Is Not a Smaller Desktop

At 375px:
- Touch targets ≥ 44px
- No parallax (disable)
- No horizontal overflow
- Text readable without zooming
- Forms optimized for thumb reach

## Law 9 — Motion Communicates Meaning

Animation is information:
- Entrance = something arrived
- Exit = something left
- Transition = state changed
- Stagger = items are related but sequential

Motion without meaning is decoration. Decoration without purpose is noise.

## Law 10 — Performance Is a Design Decision

- Animate only `transform` and `opacity` (composited properties)
- Use `IntersectionObserver`, not scroll listeners
- Lazy-load below-the-fold content
- Images: WebP/AVIF, responsive srcsets
- Fonts: `font-display: swap`, preload critical weights

## Law 11 — Accessibility Is Non-Negotiable

- Semantic HTML (headings, landmarks, lists)
- ARIA labels on interactive elements
- Keyboard navigation must work
- Color contrast: WCAG AA minimum
- Focus indicators: visible, not browser-default
- `prefers-reduced-motion`: respect it

## Law 12 — Never Ship What You Haven't Scored

Every artifact must pass through the UDEC 14-axis review.
No exceptions. No "it looks good to me."
Score it. Fix what's below threshold. Ship only what passes.

## Law 13 — The Studio Gets Smarter

After every project:
- Record what worked
- Record what failed
- Record what you'd do differently
- Add reusable patterns to the library
- Add anti-patterns to the registry

Compounding knowledge is the only durable competitive advantage.

---

## Forbidden Practices (Hard Failures)

Any of these in output = automatic rejection:

- [ ] TODO / stub / placeholder / "coming soon" / lorem ipsum
- [ ] Font: Inter, Roboto, Arial, Helvetica, Open Sans
- [ ] Color: Purple anywhere. Blue-purple gradient on white.
- [ ] `window.addEventListener('scroll', ...)` — use IntersectionObserver
- [ ] Layout thrashing: animating `top`, `left`, `width`, `height`
- [ ] Generic hero + card grid + CTA layout (the "AI landing page")
- [ ] Shadcn as default foundation
- [ ] Linear easing on any animation (use spring/ease-out)
- [ ] Missing Lenis + GSAP on landing pages
- [ ] Fewer than 5 cinematic techniques on landing pages
- [ ] Missing mobile optimization at 375px
- [ ] Missing keyboard navigation
- [ ] Missing semantic HTML structure
