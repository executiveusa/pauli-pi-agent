# GATE.md — UDEC Quality Gate
# The Pauli Effect™ AI Design Studio
# This file is the single source of truth for all quality decisions.

---

## THE FLOOR

**UDEC 8.5 composite score. Nothing ships below this. Ever.**
"Close to 8.5" is not 8.5. 8.49 is a rejection.

---

## THE 14 AXES

| Code | Weight | Axis Name               | What It Measures                                    | Hard Blocker |
|------|--------|-------------------------|-----------------------------------------------------|-------------|
| VHR  | 12%    | Visual Hierarchy        | F/Z-pattern. Clear 3-level hierarchy (hero/mid/foot)| ≥ 6.0       |
| TYP  | 10%    | Typography Mastery      | ≤2 typefaces. Display ≥5rem. No banned fonts.       | ≥ 6.0       |
| SPA  | 8%     | Spatial Composition     | py-24 min. Asymmetric. Grid-breaking moments.       | ≥ 6.0       |
| CLR  | 8%     | Color System            | 1 accent. WCAG AA. No purple on white.              | ≥ 6.0       |
| MOT  | 12%    | Motion & Interaction    | Lenis + GSAP. Spring physics. No linear easing.     | **≥ 7.0 ★** |
| MAT  | 8%     | Material & Surface      | Double-bezel. Glass or grain. Depth cues.           | ≥ 5.0       |
| COM  | 8%     | Component Architecture  | CTA variation. State design. Functional structure.  | ≥ 5.0       |
| INF  | 6%     | Information Architecture| Krug laws. One primary action per viewport.         | ≥ 5.0       |
| MOB  | 8%     | Mobile Responsiveness   | 375px clean. Touch ≥44px. No parallax on mobile.   | ≥ 6.0       |
| PER  | 6%     | Performance Discipline  | transform/opacity only. IntersectionObserver.       | ≥ 5.0       |
| ATM  | 8%     | Atmospheric Immersion   | GLSL or grain. Ambient motion. Spatial depth.       | ≥ 5.0       |
| ACC  | 4%     | Accessibility           | ARIA labels. Focus rings. 4.5:1 text contrast.      | **≥ 7.0 ★** |
| ORI  | 4%     | Originality             | Anti-cliché. Not a template. Human-made feel.       | ≥ 5.0       |
| CMP  | 8%     | Craft & Polish          | Microinteractions. Icon consistency. Zero glitches. | ≥ 5.0       |

★ = HARD BLOCKER — composite score irrelevant if these fail

---

## COMPOSITE CALCULATION

```
composite = (VHR × 0.12) + (TYP × 0.10) + (SPA × 0.08) + (CLR × 0.08)
          + (MOT × 0.12) + (MAT × 0.08) + (COM × 0.08) + (INF × 0.06)
          + (MOB × 0.08) + (PER × 0.06) + (ATM × 0.08) + (ACC × 0.04)
          + (ORI × 0.04) + (CMP × 0.08)
```

---

## GATE DECISIONS

| UDEC Result           | Decision         | Next Step                               |
|-----------------------|------------------|-----------------------------------------|
| composite ≥ 8.5       | APPROVED ✓       | → examples/ + Vibe Graph + text Bambu   |
| composite 8.0–8.49    | SOFT REJECT      | → MARCO synthesis brief → RALPHY round |
| composite < 8.0       | HARD REJECT      | → MARCO full redesign brief             |
| MOT < 7.0             | BLOCKER REJECT ★ | → RALPHY full rebuild (motion focus)    |
| ACC < 7.0             | BLOCKER REJECT ★ | → RALPHY full rebuild (a11y focus)      |
| Stubs / TODOs found   | INVALID          | → Return to RALPHY, no score            |

---

## LENA'S CALIBRATION BENCHMARKS

```
9.0+  = Awwwards SOTD nominee (basement.studio, alejandroschintu.com)
8.5   = Floor. Ships to client. Awwwards honorable mention territory.
8.0   = Polished but not exceptional. Common SaaS premium tier.
7.0   = Competent. No differentiation.
6.0   = Generic AI output. Needs complete rethink.
< 6.0 = Do not show to client under any circumstances.
```

---

## WHY THIS FLOOR EXISTS

The transcript said it: clients don't care how you do it. They only care that the stuff gets done — and done right.

A 7.5 design ships in 30 minutes. A 8.5 design ships in 3 hours.
The client sees the 8.5 for 3 years. The 30 minutes was a rounding error.

This is not a quality standard. It is a business decision.
