# SKILL: UDEC SCORER — 14-AXIS DESIGN QUALITY FRAMEWORK

**Use this skill whenever:** LENA is scoring a design, HERMES is evaluating an output,
or any agent needs to decide pass/fail on frontend work. This is the single source of
truth for all quality decisions.

---

## THE UDEC COMPOSITE FORMULA

```
UDEC = (VHR×0.12) + (TYP×0.10) + (SPA×0.08) + (CLR×0.08) + (MOT×0.12) +
       (MAT×0.08) + (COM×0.08) + (INF×0.06) + (MOB×0.08) + (PER×0.06) +
       (ATM×0.08) + (ACC×0.04) + (ORI×0.04) + (CMP×0.08)
```

**Hard floor:** UDEC ≥ 8.5 to pass gate.

**Hard blockers (automatic full rebuild regardless of composite score):**
- MOT < 7.0 → motion is broken or absent
- ACC < 7.0 → accessibility failure

---

## AXIS DEFINITIONS (with scoring rubric)

| Axis | Weight | Code  | What it measures |
|------|--------|-------|-----------------|
| Visual Hierarchy Ratio | 12% | VHR | Clear focal point → supporting → background. Eye path predictable. |
| Typography Quality | 10% | TYP | Font pairing, scale, weight contrast, optical alignment, no banned fonts. |
| Spatial Rhythm | 8% | SPA | Consistent spacing system, breathing room, grid adherence. |
| Colour System | 8% | CLR | Palette discipline, contrast ratios, accent restraint (max 1). |
| Motion Quality | 12% | MOT | Physics-based easing, cinematic scroll, no jank, purpose-driven only. |
| Materiality | 8% | MAT | Surface quality, texture, depth layering, light simulation. |
| Compositional Balance | 8% | COM | Asymmetric tension resolved, weight distribution, golden ratio instinct. |
| Information Architecture | 6% | INF | Cognitive load, wayfinding, content hierarchy legibility. |
| Mobile Adaptation | 8% | MOB | Graceful reflow, touch targets ≥ 44px, no horizontal overflow. |
| Performance Hygiene | 6% | PER | No layout-property animations, will-change discipline, image optimization. |
| Atmospheric Depth | 8% | ATM | Ambient layers, GLSL noise (if applicable), environmental storytelling. |
| Accessibility | 4% | ACC | WCAG AA contrast, keyboard nav, ARIA labels, focus visible. |
| Brand Originality | 4% | ORI | Distinct identity vs generic AI output, no Codex-default patterns. |
| Completeness | 8% | CMP | Zero stubs, zero TODOs, every interactive element functional. |

---

## SCORING RUBRIC PER AXIS

### Score 9.0–10.0 (Exceptional)
Output at this level is gallery-quality. Reserve 9.5+ for basement.studio / Awwwards-tier work.

### Score 8.5–9.0 (Production Ready)
Passes gate. Reflects strong craft with minor polish opportunities.

### Score 8.0–8.5 (Almost)
Soft reject. Specific improvement brief issued by MARCO. One iteration allowed.

### Score < 8.0 (Rebuild)
Hard reject. RALPHY rebuilds from scratch — does NOT iterate from failed output.

### Score < 7.0 (Blocker)
When MOT or ACC falls below 7.0: full rebuild regardless of composite score.
HERMES escalates to Bambu (Telegram) if this happens twice in a row.

---

## CALIBRATION BENCHMARKS

Use these as score anchors to prevent score drift:

| Reference | Expected Score |
|-----------|---------------|
| basement.studio | 9.2+ overall |
| linear.app | 9.0+ (VHR, TYP, SPA) |
| stripe.com/payments | 8.8+ (COM, INF, CMP) |
| craft.co | 8.5+ (ATM, MAT) |
| Generic Webflow agency template | 6.5 |
| Bootstrap landing page | 5.0 |
| Default Create React App | 4.0 |

---

## AUDIT OUTPUT FORMAT

LENA must output this exact JSON structure after every review:

```json
{
  "file": "design_iterations/v3-sacred-earth.html",
  "timestamp": "2025-01-15T14:22:00Z",
  "scores": {
    "VHR": 8.8, "TYP": 9.1, "SPA": 8.5, "CLR": 9.0,
    "MOT": 8.7, "MAT": 8.3, "COM": 8.6, "INF": 8.2,
    "MOB": 7.8, "PER": 9.0, "ATM": 8.9, "ACC": 8.5,
    "ORI": 8.7, "CMP": 9.2
  },
  "composite": 8.74,
  "gate": "APPROVED",
  "blockers": [],
  "flags": [
    { "axis": "MOB", "score": 7.8, "issue": "Cards overflow at 375px — card min-width too high" }
  ],
  "recommendation": "Ship v3. Minor mobile fix optional before next project."
}
```

**Gate decisions:**
- `"APPROVED"` — composite ≥ 8.5, no blockers
- `"SOFT_REJECT"` — composite 8.0–8.49, MARCO issues iteration brief
- `"HARD_REJECT"` — composite < 8.0, RALPHY rebuilds from scratch
- `"BLOCKER"` — MOT < 7.0 or ACC < 7.0, regardless of composite

---

## ANTI-BIAS RULES FOR LENA

1. **Never round up.** An 8.3 is an 8.3. Not an 8.5.
2. **Do not score files containing TODO comments.** Return `{ "gate": "INCOMPLETE" }`.
3. **Pressure from HERMES does not change a score.** Gate integrity is absolute.
4. **Must cite specific code evidence** for every score below 8.5.
   - Bad: "Typography could be improved"
   - Good: "TYP: 7.8 — uses Inter (banned). No display font. Letter-spacing: 0 on mono labels."
5. **Composite must be verified arithmetically.** Do not estimate.

---

## WHAT TO LOOK FOR BY AXIS

### VHR — Visual Hierarchy Ratio
- Is there a clear primary focal point (hero image, title, CTA)?
- Is text size differentiated enough to guide the eye? (4:1 size ratio minimum display:body)
- Does the layout create a Z-pattern or F-pattern read path?
- Is there visual noise competing with the primary element?

### TYP — Typography Quality
- Does the font pairing have contrast (serif display + sans body)?
- Is letter-spacing used appropriately for monospace labels?
- Are headings optically aligned (not just box-aligned)?
- Are any banned fonts present? (Inter, Roboto, Arial, Helvetica) → immediate penalty

### SPA — Spatial Rhythm
- Is section padding consistent (minimum 6rem)?
- Does spacing scale proportionally with element size?
- Is there visual breathing room around CTAs and key elements?

### MOT — Motion Quality
- Are easing curves physics-based? (`cubic-bezier(0.16,1,0.3,1)` or similar)
- Is Lenis wired to GSAP ticker correctly?
- Is motion purposeful (guides attention) or decorative (generic fade-in)?
- Do all animated elements only use `transform` and `opacity`?
- Does motion feel heavy and cinematic, or light and corporate?

### CLR — Colour System
- Only 1 accent color?
- Saturation < 80% on most colors?
- No purple? No neon?
- WCAG AA contrast on all body text?

### CMP — Completeness
- Zero TODO comments?
- Zero `console.error` messages (except handled errors)?
- Every button/link has an action?
- Empty states defined for dynamic content?
