# SKILL: BEHAVIORAL DESIGN LAWS — LUXURY UX IMPLEMENTATION

**Use this skill whenever:** RALPHY is building any interactive experience, LENA is
scoring interaction quality, or any agent is making layout and information architecture
decisions. Behavioral design laws are the scientific substrate beneath aesthetic choices.

Core premise: **Luxury design is not exempt from cognitive science.**
Beautiful interfaces that violate behavioral principles produce elegant confusion.
The goal is interfaces so well-calibrated they feel effortless — luxury users
interpret this as "exceptional quality." The cognitive science is invisible; the
experience is memorable.

---

## LAW 1 — JAKOB'S LAW (Familiarity Creates Fluency)

**Principle:** Users spend most of their time on other interfaces. They expect yours to
work the same way. Violating established patterns forces cognitive effort.

**Luxury application:** Premium interfaces do not "break convention to be memorable."
They refine convention to feel like its best possible version.

**What this looks like:**
- Navigation in expected locations (top or left)
- Primary CTA behaves exactly as expected — click → action, no surprises
- Form fields follow established input patterns
- Scroll direction matches platform convention

**Luxury refinement (not violation):**
```
✓ Navigation in expected position, but with refined typography and spacing
✓ CTA button at expected scale and position, but with premium material quality
✓ Form inputs at standard positions, but with elevated visual treatment
✗ Navigation hidden behind a gesture "for discovery" (punishes unfamiliarity)
✗ CTAs relocated to "unexpected positions for impact" (creates hesitation)
✗ Unconventional scroll behavior "to feel different" (breaks trust)
```

**UDEC implication:** INF and MOB scores penalize pattern violations that cause friction.
A design can score low on ORI by being familiar — but the composite improves because
INF, COM, and MOB benefit from reduced friction. Net win in luxury markets.

---

## LAW 2 — FITTS'S LAW (Size and Distance Determine Effort)

**Principle:** Time to acquire a target = function of distance to target and size of target.
Larger targets that are closer require less effort.

**Luxury application:** Effort has psychological cost. In premium experiences, every
interaction that requires effort damages the "effortless luxury" perception.

**Implementation requirements:**

Minimum touch targets:
- Primary CTA: 48px height minimum, 44px absolute floor (WCAG)
- Navigation links: 44px minimum touch area (can be visually smaller with padding)
- Form fields: 44px height minimum
- Close/dismiss buttons: 44px × 44px minimum

Proximity rules:
- Primary action closest to user's attention center
- Destructive actions (delete, cancel) separated from primary actions
- Related actions grouped, unrelated actions separated

**Anti-pattern: Premium illusion trap**
```
✗ Small, elegant CTAs because "big buttons look cheap"
  → Reality: Small CTAs reduce conversion without increasing perception of quality
  → Fix: Large button with refined typography, premium color, generous padding
```

**Correct luxury implementation:**
```css
/* Premium CTA — large target, refined aesthetics */
.cta-primary {
  min-height: 52px;
  padding: 14px 32px;          /* generous, not aggressive */
  font-size: 0.9375rem;        /* 15px — visible but not loud */
  letter-spacing: 0.08em;      /* refined without being precious */
  font-weight: 500;
  border-radius: 4px;          /* minimal radius — premium not playful */
}
```

---

## LAW 3 — HICK'S LAW (Choice Proliferation Increases Decision Time)

**Principle:** Time to make a decision increases logarithmically with the number of choices.
More options = longer hesitation = higher abandonment.

**Luxury application:** Curation is the premium service. The highest-value offering
in luxury is not more options — it is the curated selection.

**Navigation limits:**
- Primary navigation: 5 items maximum
- Secondary navigation: 7 items maximum
- Dropdown menus: 7 items maximum
- Decision points per page: 1 primary action, 1 secondary maximum

**Copy implication:**
```
✗ "Choose from our Basic, Professional, Enterprise, Custom, or Enterprise Plus plans"
✓ "One engagement model. Complete transparency."
```

**Design implication:**
```
✗ Hero section with 3 CTAs ("Start Free Trial", "View Demo", "Talk to Sales")
✓ Hero section with 1 primary CTA + 1 secondary anchor link
```

**Pricing pages:**
- Maximum 3 tiers for AFFLUENT
- Maximum 2 tiers for HNW (with "Custom" as implicit third)
- Inquiry-only for VHNW/UHNW (Hick's Law becomes irrelevant — only one option)

---

## LAW 4 — MILLER'S LAW (Working Memory Has 7±2 Slots)

**Principle:** The average person can hold 7±2 chunks of information in working memory
at once. Exceeding this produces cognitive overload and poor recall.

**Luxury application:** Dense information architecture signals desperation, not comprehensiveness.
Premium communicators know that constraint improves retention and perceived value.

**Section architecture:**
- Maximum 5-7 distinct value propositions per page
- Bullet points: 3–5 items, never more than 7
- Feature lists: group into categories of 3–4 rather than listing 12 individually
- Case studies: 3 examples communicate breadth; 12 examples create fatigue

**Typography chunking:**
```
✓ Short paragraphs (3–4 sentences max for body copy)
✓ Subheadings every 150–200 words for scanning
✓ Pull quotes to interrupt and re-engage
✗ Walls of text regardless of quality
```

**Navigation chunking:**
Apply the Rule of 5: if your navigation needs more than 5 items, the information
architecture is wrong — not the navigation limit.

---

## LAW 5 — PEAK-END RULE (Memory Biased to Peak and Conclusion)

**Principle:** People judge an experience primarily by its most intense moment (peak)
and its final moment (end). Not by the average.

**Luxury application:** Design for extraordinary peaks and satisfying conclusions.
Three mediocre sections and one extraordinary moment scores better in memory than
five competent sections with no peaks.

**Peak engineering:**
Identify the one element in each page that should produce a strong positive reaction.
Allocate disproportionate craft investment to that element.

```
Landing page peak candidates:
- Hero animation (if cinematic)
- A piece of copy that lands perfectly
- A visual element that stops scroll
- An interaction that feels surprisingly refined

Deliberately mediocre: supporting sections, footer, FAQ
Deliberately exceptional: hero, primary CTA zone, one proof element
```

**End engineering:**
The last experience before a decision point must be positive.
- Before contact form: the most compelling proof element
- End of pricing page: strongest social proof or most confident statement
- Exit page: a memorable line, not a discount offer

**Application to scroll patterns:**
Design scroll journey as: medium → peak → recovery → satisfying resolution
Not as: uniform quality throughout (forgettable) or declining quality (negative end)

---

## LAW 6 — VON RESTORFF EFFECT (Distinctiveness Creates Memory)

**Principle:** Among a series of similar objects, the one that differs from the rest
is most likely to be remembered.

**Luxury application:** One distinctive element per view creates a memory anchor.
Multiple distinctive elements cancel each other (all backgrounds, nothing foreground).

**Implementation:**
- Primary CTA: 1 accent color on a neutral page → remembered
- Pull quote: different typography treatment on a body-text page → stands out
- Signature element: one unusual layout decision per page → ownable aesthetic

**Anti-pattern: Accent inflation**
```
✗ Gold accent on headers
✗ Gold accent on CTAs  
✗ Gold accent on navigation hover
✗ Gold accent on pricing numbers
→ All gold → no gold (the accent becomes the default, the default loses contrast)
```

**Correct implementation:**
```
✓ Gold accent: primary CTA only
✓ All other elements: neutral palette
→ The single gold element creates the memorable contrast
```

**Typography application:**
```
✓ One display size significantly larger than others (6:1 ratio to body)
✓ One weight significantly heavier than others
✗ Three different "large" sizes competing for attention
```

---

## LAW 7 — AESTHETIC-USABILITY EFFECT (Beauty Improves Perceived Function)

**Principle:** Users perceive aesthetically pleasing designs as more usable and
trustworthy, even when objective usability is equivalent.

**Luxury application:** This is the design law that most justifies the investment in
premium aesthetics. In luxury markets, where competition is on quality signal rather
than price, this effect is amplified. A beautiful interface is perceived as more capable.

**Quantified impact:**
Studies show aesthetically superior interfaces are rated 60%+ higher on trust and
perceived functionality, even when functional parity exists.

**Implementation for SYNTHIA outputs:**
Every design decision must pass the aesthetic-usability filter:
```
"Does this element communicate capability or limitation?"

✓ Generous spacing → communicates confidence, capability
✓ Premium typography → communicates attention and craft
✓ Restrained color → communicates discipline, sophistication
✓ Cinematic motion → communicates technological investment

✗ Dense layout → communicates fear of white space, insecurity
✗ Many different fonts → communicates lack of discipline
✗ Saturated palette → communicates inexperience with restraint
✗ Jerky motion → communicates technical limitation
```

---

## LAW 8 — SERIAL POSITION EFFECT (First and Last Are Remembered Best)

**Principle:** In a list or sequence, items at the beginning (primacy) and end (recency)
are remembered better than items in the middle.

**Luxury application:** The most important message goes first. The second-most important
goes last. The middle is where supporting evidence lives.

**Page architecture:**
```
Position 1 (hero): Primary value proposition — the one thing they must remember
Position 2-N-1 (body): Supporting evidence, proof, process
Position N (final): Second most important message OR the action
```

**Navigation architecture:**
Most important item first (Home/Product) and last (Contact/CTA).
The most important secondary items should not live in the middle.

**Copy architecture:**
```
✓ Lead with the strongest claim
✓ Close with the strongest proof or the most confident statement
✗ Burying the key benefit in paragraph 3
✗ Ending with weak supporting copy ("and much more...")
```

---

## LAW 9 — DOHERTY THRESHOLD (< 400ms = Flow; > 400ms = Friction)

**Principle:** Productivity soars when interaction feedback is received within 400ms.
Above 400ms, perceived waiting begins.

**Luxury application:** Premium experience implies immediate responsiveness.
A slow interaction in an expensive-looking interface creates cognitive dissonance.
The beautiful shell promises something the technology doesn't deliver.

**Performance requirements:**
- Initial visible content: < 1.5s on 4G (LCP)
- Interaction response (hover, click feedback): < 100ms visual
- Route transitions: < 300ms
- Form submissions: immediate optimistic UI update

**Animation timing within Doherty threshold:**
```
Hover states: 150–200ms transition (fast enough to feel responsive)
Button press: immediate visual feedback (scale/color change: < 50ms)
Page transitions: 250–350ms (cinematic but not waiting)
Scroll reveals: triggered at 20% visibility, 600ms duration (feels earned)
```

---

## LAW 10 — TESLER'S LAW (Irreducible Complexity Must Go Somewhere)

**Principle:** Every application has an irreducible complexity. The question is where
it lives — in the user experience or in the system design.

**Luxury application:** Premium products absorb complexity so the user doesn't have to.
The more complex the system behind the interface, the simpler the interface should appear.

**Implementation:**
```
✓ Complex form validation: happen silently, inline, without modal interruption
✓ Multi-step processes: wizard patterns with progress indicators, not all at once
✓ Pricing complexity: surface the simple version, link to the complete version
✓ Technical specifications: progressive disclosure, not overwhelming detail
```

**The Luxury Paradox (Tesler applied):**
The most sophisticated offerings should have the simplest presentations.
The harder the underlying problem, the more the interface should hide that difficulty.

---

## BEHAVIORAL LAWS SCORING MATRIX

For LENA to apply during INF + COM + MOB axis scoring:

| Law | Axis Impact | UDEC Weight |
|-----|-------------|-------------|
| Jakob's — Pattern familiarity | INF | High |
| Fitts's — Target sizing | MOB + ACC | High |
| Hick's — Choice limitation | INF + CON | High |
| Miller's — Chunking | INF + CON | Medium |
| Peak-End — Journey design | ATM + CON | Medium |
| Von Restorff — Distinctiveness | VHR + CLR | High |
| Aesthetic-Usability — Beauty signal | VHR + MAT | High |
| Serial Position — Priority sequencing | INF + VHR | Medium |
| Doherty — Responsiveness | PER + MOT | High |
| Tesler — Complexity absorption | INF + CMP | Medium |

**Scoring directive for LENA:**
When VHR, INF, or COM scores are contested, apply the relevant behavioral law
to adjudicate. Cite the law in the scoring rationale:
```
"INF: 8.1 — Hick's Law violation: hero presents 3 equal-weight CTAs.
 Primary action unclear. Reduce to 1 primary + 1 secondary anchor."
```

---

## INTEGRATION WITH LUXURY PSYCHOLOGY

Behavioral design laws and luxury psychology are complementary layers:

**Psychology → Why** (what motivates the behavior)
**Behavioral laws → How** (what enables or prevents the behavior)

A VHNW buyer motivated by exclusivity (psychology) who encounters a cluttered
navigation (Hick's Law violation) will experience cognitive friction that the
exclusivity trigger cannot overcome.

The hierarchy is:
1. Luxury Psychology identifies the right trigger
2. Behavioral Design Laws ensure the interface doesn't obstruct it
3. UDEC scoring verifies both layers are present

---

## REFERENCE SOURCES

- Laws of UX by Jon Yablonski (primary compilation source)
- Paul Fitts: "The information capacity of the human motor system" (1954)
- George Miller: "The Magical Number Seven, Plus or Minus Two" (1956)
- Daniel Kahneman: "Thinking, Fast and Slow" (System 1/2 implications)
- Donald Norman: "The Design of Everyday Things" (affordance theory)
- Larry Tesler: Tesler's Law original formulation (1980s Xerox PARC)
