# SCORING GUIDE

**Pauli Pi Software Factory — Complete Scoring System Reference**
**Version**: 1.0.0

The Software Factory uses three scoring dimensions to evaluate projects and system health. This guide explains what each score means, how it's calculated, how scores combine to inform decisions, and how to improve scores.

---

## Overview

| Score | Name | Range | Threshold | Measures |
|-------|------|-------|-----------|---------|
| UDEC | User Design & Experience Completeness | 0–10 | >= 8.5 to pass | Visual and UX quality |
| MOT | Mission Operational Trust | 0–100 | >= 70 to operate | Agent/system reliability |
| ACC | Autonomous Completion Confidence | 0–100 | >= 60 to proceed autonomously | Factory's ability to finish a project |

---

## UDEC — User Design & Experience Completeness

### What It Is
UDEC is the Software Factory's design quality score. It measures how well a project's user interface meets Synthia Superdesign standards across 10 equally-weighted dimensions. A score of 10 is perfection. A score of 8.5 is the minimum for production deployment.

UDEC is not a subjective aesthetic score — it is a structured checklist mapped to observable, measurable criteria.

### The 10 Dimensions

#### 1. Visual Hierarchy (VH) — 10%

**What it measures**: Whether the page communicates importance through visual weight, size, and placement.

| Score | Description |
|-------|-------------|
| 9–10 | Clear primary/secondary/tertiary hierarchy on every page. User's eye flows naturally. F-pattern or Z-pattern established. |
| 7–8 | Hierarchy present but inconsistent across pages. Some pages compete for attention equally. |
| 5–6 | Some hierarchy but major elements compete. Important actions not visually prominent. |
| 3–4 | Flat design with little hierarchy. Hard to know where to look. |
| 0–2 | No visible hierarchy. All elements appear equal weight. |

**How to score**:
- Look at the homepage: can you identify the 1 primary action within 3 seconds?
- Check 3 other pages: is the most important content visually dominant?
- Are headings and body text clearly differentiated in weight and size?

---

#### 2. Color & Contrast (CC) — 10%

**What it measures**: Color system coherence, semantic use of color, and accessibility compliance.

| Score | Description |
|-------|-------------|
| 9–10 | Consistent color system with named tokens. All text passes WCAG AA (4.5:1 ratio). Color used semantically (green = success, red = error). Dark mode consistent. |
| 7–8 | Color system mostly consistent. Minor contrast failures. Some semantic colors. |
| 5–6 | Color used but without system. Some contrast issues. |
| 3–4 | Random color choices. Multiple contrast failures. |
| 0–2 | Colors clash or are inaccessible. No semantic meaning. |

**How to score**:
```
Check 1: Run WCAG contrast checker on primary text color vs. background
  Pass (>= 4.5:1) → +2 points
  Partial (>= 3:1) → +1 point
  Fail → 0 points

Check 2: CSS custom properties for colors exist?
  Yes → +2 points
  No → 0 points

Check 3: Error state uses red/danger color? Success uses green?
  Yes → +2 points
  Partial → +1 point
  No → 0 points

Check 4: Color palette uses <= 5 primary colors?
  Yes → +2 points
  No → +1 point

Check 5: Dark/light mode consistent?
  Yes → +2 points
  N/A (single mode only) → +1 point
  No → 0 points

UDEC-CC = sum / 2 (maps 0-10 to 0-10)
```

---

#### 3. Typography (TY) — 10%

**What it measures**: Font choice, type scale, line height, readability.

| Score | Description |
|-------|-------------|
| 9–10 | Deliberate type scale (e.g., 12/14/16/20/24/32/48). Line height >= 1.5 for body. Consistent weight usage. Geist Mono or equivalent for code. |
| 7–8 | Good font choice, mostly consistent scale. Minor inconsistencies. |
| 5–6 | Readable fonts but arbitrary sizes. Line heights too tight or too loose. |
| 3–4 | System fonts without customization. Mixed sizes without scale. |
| 0–2 | Poor font choice. Hard to read. No type scale. |

**Synthia Standard**:
- Body font: Inter, or system-ui stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`)
- Code font: Geist Mono, or `'Fira Code', 'Cascadia Code', monospace`
- Type scale: multiples of 4px (12, 16, 20, 24, 32, 40, 48, 64)
- Body line height: 1.5–1.7
- Heading line height: 1.1–1.3

---

#### 4. Spacing & Rhythm (SR) — 10%

**What it measures**: Whether the layout uses a consistent spacing grid.

| Score | Description |
|-------|-------------|
| 9–10 | All spacing values are multiples of 8px. Consistent padding within component classes. Visual rhythm is consistent across the page. |
| 7–8 | Mostly 8px grid with minor deviations. Component padding mostly consistent. |
| 5–6 | Some grid adherence but many arbitrary values. Inconsistent component padding. |
| 3–4 | No visible spacing system. Random padding values throughout. |
| 0–2 | Elements are crammed together or have excessive gaps. No rhythm. |

**How to verify**:
```bash
# Check CSS for non-8px values (rough heuristic):
grep -rE "(padding|margin|gap|space).*[0-9]px" src/ | \
  grep -v "node_modules" | \
  awk '{match($0, /[0-9]+px/, m); print m[0]}' | \
  sort -u
# Any non-multiples of 4 are violations:
# 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96 = OK
# 5, 7, 11, 15, 17, 23 = violations
```

---

#### 5. Component Consistency (CO) — 10%

**What it measures**: Whether interactive components (buttons, inputs, cards) behave and look consistently throughout the application.

| Score | Description |
|-------|-------------|
| 9–10 | Single button style family (primary, secondary, ghost, destructive). All inputs look identical. Cards use consistent radius/shadow. |
| 7–8 | Mostly consistent. 1–2 pages have one-off component styles. |
| 5–6 | Multiple button styles that don't belong to a family. Some inputs look different from others. |
| 3–4 | Components vary significantly per page. Buttons look different everywhere. |
| 0–2 | No component system. Everything is custom per-page. |

**Check**: Count how many distinct button visual styles exist:
- 1 family (variants of one style) → 9–10
- 2 families → 6–8
- 3+ families → 0–5

---

#### 6. Interaction & Motion (IM) — 10%

**What it measures**: Whether interactive elements have appropriate micro-animations and transitions.

| Score | Description |
|-------|-------------|
| 9–10 | Hover states on all clickable elements (150ms ease). Page transitions present. Skeleton loaders instead of blank spaces. Form submission shows loading state. |
| 7–8 | Most hover states present. Some loading states. Minor animation gaps. |
| 5–6 | Basic hover states only. No page transitions. Loading is a spinner only. |
| 3–4 | Some hover states. No loading indicators. |
| 0–2 | No hover states. No loading indicators. Jarring instant transitions. |

**Synthia Standard for transitions**:
```css
/* Hover state standard */
.interactive-element {
  transition: all 150ms ease;
}

/* Or more explicit: */
.button {
  transition:
    background-color 150ms ease,
    box-shadow 150ms ease,
    transform 100ms ease;
}
```

---

#### 7. Mobile Responsiveness (MR) — 10%

**What it measures**: How well the interface adapts to mobile screen sizes.

| Score | Description |
|-------|-------------|
| 9–10 | Mobile-first design. Tested at 375px, 768px, 1280px. No horizontal scroll on any breakpoint. Navigation accessible on mobile. Touch targets >= 44px. |
| 7–8 | Works on mobile but not mobile-first. Minor issues at 375px. |
| 5–6 | Desktop design adapted for mobile. Some overflow or cramped elements. |
| 3–4 | Mobile technically works but unusable. Small touch targets. |
| 0–2 | Not responsive. Requires horizontal scrolling on mobile. |

**Test procedure**:
1. Browser DevTools: set viewport to 375×812 (iPhone SE)
2. Verify no horizontal scroll bar
3. Verify navigation is accessible (hamburger menu or equivalent)
4. Tap all interactive elements: verify tap targets not too small
5. Verify text is readable without zooming

---

#### 8. Accessibility (AC) — 10%

**What it measures**: Whether the interface is usable by people with disabilities. Based on WCAG 2.1 AA.

| Score | Description |
|-------|-------------|
| 9–10 | All WCAG 2.1 AA checkpoints met. Screen reader navigable. Keyboard navigable. All images have alt text. Focus indicators visible. |
| 7–8 | Most accessibility requirements met. Minor issues (e.g., missing alt text on some images). |
| 5–6 | Basic accessibility (labels, alt text) but keyboard navigation incomplete. |
| 3–4 | Forms have labels but many other issues. |
| 0–2 | No accessibility consideration. Fails multiple WCAG checkpoints. |

**Quick audit**:
```bash
# In browser console, run:
# (Check for images without alt text)
document.querySelectorAll('img:not([alt])').length

# (Check for inputs without labels)
document.querySelectorAll('input:not([aria-label]):not([id])').length

# (Check for buttons without accessible text)
document.querySelectorAll('button:not([aria-label])').forEach(
  b => { if (!b.textContent.trim()) console.log('Unlabeled button:', b) }
)
```

---

#### 9. Brand Coherence (BC) — 10%

**What it measures**: Whether the visual design communicates a consistent brand identity.

| Score | Description |
|-------|-------------|
| 9–10 | Clear visual identity. Consistent logo usage. Color palette feels intentional. Tone of voice consistent in microcopy. Favicon matches brand. |
| 7–8 | Brand present but minor inconsistencies. Logo used correctly. Some off-brand moments. |
| 5–6 | Some brand elements but not unified. Different "voices" in different parts of the app. |
| 3–4 | Generic design with minimal brand differentiation. |
| 0–2 | No discernible brand. Could be any generic web application. |

**Note**: Brand Coherence is the most subjective UDEC dimension. When scoring is uncertain, default to 5 and document reasoning.

---

#### 10. User Flow Clarity (UF) — 10%

**What it measures**: Whether the user always knows where they are, what they can do, and what will happen next.

| Score | Description |
|-------|-------------|
| 9–10 | Clear navigation structure. Active page indicated. Breadcrumbs where appropriate. CTAs lead logically to next step. Confirmation dialogs for destructive actions. |
| 7–8 | Navigation clear. Active states present. Some flows slightly unclear. |
| 5–6 | Basic navigation works but users might get lost. Some flows end without clear next step. |
| 3–4 | Navigation present but active states missing. Flows often unclear. |
| 0–2 | No clear navigation structure. Users frequently stuck. |

---

### UDEC Calculation

```
UDEC = (VH + CC + TY + SR + CO + IM + MR + AC + BC + UF) / 10
```

**Example**:
- VH: 9, CC: 8, TY: 8, SR: 7, CO: 9, IM: 7, MR: 8, AC: 7, BC: 8, UF: 9
- UDEC = (9+8+8+7+9+7+8+7+8+9) / 10 = 80 / 10 = **8.0**

### UDEC Decision Gates

| Score Range | Decision |
|-------------|---------|
| 9.0–10.0 | EXCEPTIONAL — Document as best practice |
| 8.5–8.9 | PASS — Production ready |
| 6.0–8.4 | PATCH — Targeted improvements required |
| 4.0–5.9 | MAJOR REWORK — Significant design overhaul |
| 0–3.9 | AUTO-REBUILD — Recommend full UI rebuild |

### How to Improve UDEC

**Fastest wins (usually SR, IM, MR)**:
```
SR: Add a spacing tokens file (tailwind.config.ts spacing extension or CSS custom properties)
IM: Add transition classes to all interactive elements
MR: Add Tailwind responsive prefixes (sm:, md:, lg:) to layout containers
```

**Medium effort (CO, VH)**:
```
CO: Extract all button, input, and card variants into a single component file
VH: Use text-xl or larger for primary heading, ensure one clear CTA per page
```

**Higher effort (AC, CC)**:
```
AC: Audit with axe DevTools Chrome extension, fix all violations
CC: Define CSS custom properties for all colors, run through contrast checker
```

---

## MOT — Mission Operational Trust

### What It Is
MOT measures the overall health and reliability of the Software Factory system itself. It is not a per-project score — it is a system score that reflects whether the factory can be trusted to operate autonomously.

MOT is checked before starting any factory run. If MOT < 70, factory operations should be supervised more closely.

### MOT Dimensions

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Agent Uptime | 20% | Are all required agents online and responsive? |
| Recent Success Rate | 25% | What % of factory runs in the last 7 days completed successfully? |
| Human Response Time | 15% | How quickly have humans responded to approval gates recently? |
| Watcher Alert Rate | 15% | How many alerts has Watcher raised per factory run recently? |
| Judge Pass Rate | 15% | What % of Judge reviews pass on first attempt? |
| Data Integrity | 10% | Is the factory's state data (Supabase) consistent and current? |

### MOT Calculation

```typescript
interface MOTInputs {
  agent_uptime_pct: number;          // 0-100: % of time agents were online (7 day window)
  run_success_rate: number;          // 0-100: % of runs that reached PRODUCTION status
  human_response_time_hours: number; // average hours to respond to approval gates
  watcher_alerts_per_run: number;    // average alerts raised per factory run
  judge_first_pass_rate: number;     // 0-100: % of projects that pass Judge on first attempt
  data_integrity_pct: number;        // 0-100: % of factory records with complete, valid data
}

function calculateMOT(inputs: MOTInputs): number {
  // Agent uptime: full points at 99%+, scaled down below
  const agentScore = Math.min(inputs.agent_uptime_pct, 100) * 0.20;

  // Success rate: direct percentage
  const successScore = inputs.run_success_rate * 0.25;

  // Human response time: 1 hour = 100, 24 hours = 60, 48 hours = 30, > 48 hours = 0
  const responseScore = inputs.human_response_time_hours <= 1 ? 100 :
                       inputs.human_response_time_hours <= 24 ? 80 :
                       inputs.human_response_time_hours <= 48 ? 50 : 20;
  const humanScore = responseScore * 0.15;

  // Watcher alerts: 0 alerts = 100, 1-2 = 80, 3-5 = 60, 6-10 = 40, > 10 = 20
  const alertScore = inputs.watcher_alerts_per_run === 0 ? 100 :
                    inputs.watcher_alerts_per_run <= 2 ? 80 :
                    inputs.watcher_alerts_per_run <= 5 ? 60 :
                    inputs.watcher_alerts_per_run <= 10 ? 40 : 20;
  const watcherScore = alertScore * 0.15;

  // Judge first-pass rate
  const judgeScore = inputs.judge_first_pass_rate * 0.15;

  // Data integrity
  const dataScore = inputs.data_integrity_pct * 0.10;

  return Math.round(agentScore + successScore + humanScore + watcherScore + judgeScore + dataScore);
}
```

### MOT Score Interpretation

| Score | Level | Meaning |
|-------|-------|---------|
| 90–100 | EXCELLENT | Factory is operating optimally |
| 70–89 | GOOD | Normal operations. Minor issues being managed |
| 50–69 | DEGRADED | Operate with increased human oversight. Investigate issues |
| 30–49 | POOR | Significant reliability issues. Pause non-critical runs. |
| 0–29 | CRITICAL | Factory should not be used for new runs until issues resolved |

### How to Improve MOT

```
Low agent uptime → Check MCP server connections, verify Watcher process is running
Low success rate → Review failed runs; common causes: human blocker timeout, missing env vars
Slow human response → Set up notification in Slack/email for approval gates
High Watcher alerts → Review recent alerts; most common: test failures, design regressions
Low Judge first-pass → Common: UDEC < 8.5, security issues not resolved, missing features
Low data integrity → Run consistency check on Supabase factory tables
```

---

## ACC — Autonomous Completion Confidence

### What It Is
ACC predicts the probability that the Software Factory can complete a specific project run to production status without human intervention beyond the mandatory approval gates.

ACC is calculated per project run, not for the factory overall (that's MOT). It helps the Master Agent and human assess whether a project needs elevated oversight.

### When ACC Is Calculated
- After Phase 2 (Audit) is complete — before Phase 6 (Build Plan) starts
- Updated after Phase 5 (Production Readiness evaluation)
- Updated mid-Phase 7 if significant deviations occur

### ACC Dimensions

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Project Completeness | 20% | How much already works (higher = easier to finish) |
| Technical Clarity | 20% | How well the project's intent and architecture are documented |
| Human Blocker Count | 20% | Fewer human blockers = higher ACC |
| Tech Stack Familiarity | 15% | How well the factory handles this specific stack |
| Security Complexity | 10% | Number and severity of security issues found |
| Revenue Clarity | 15% | Clear revenue model = clear definition of "done" |

### ACC Calculation

```typescript
interface ACCInputs {
  completeness_pct: number;     // From project audit (0-100)
  tech_clarity_score: number;   // README quality + inline docs (0-100)
  human_blocker_count: number;  // Number of unresolved human blockers
  stack_familiarity: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  critical_security_issues: number;  // Count of critical security findings
  revenue_clarity: 'CLEAR' | 'POSSIBLE' | 'UNCLEAR' | 'NONE';
}

function calculateACC(inputs: ACCInputs): number {
  // Completeness: already at 50% complete → 50 points, 80% → 80 points
  const completenessScore = inputs.completeness_pct * 0.20;

  // Technical clarity: direct mapping
  const clarityScore = inputs.tech_clarity_score * 0.20;

  // Human blockers: 0 = 100, 1 = 80, 2 = 60, 3 = 40, 4+ = 20
  const blockerScore = inputs.human_blocker_count === 0 ? 100 :
                      inputs.human_blocker_count === 1 ? 80 :
                      inputs.human_blocker_count === 2 ? 60 :
                      inputs.human_blocker_count === 3 ? 40 : 20;
  const humanScore = blockerScore * 0.20;

  // Stack familiarity
  const famMap = { 'HIGH': 100, 'MEDIUM': 75, 'LOW': 40, 'UNKNOWN': 20 };
  const stackScore = famMap[inputs.stack_familiarity] * 0.15;

  // Security: 0 critical = 100, 1 = 70, 2 = 50, 3+ = 20
  const secScore = (inputs.critical_security_issues === 0 ? 100 :
                   inputs.critical_security_issues === 1 ? 70 :
                   inputs.critical_security_issues === 2 ? 50 : 20) * 0.10;

  // Revenue clarity
  const revMap = { 'CLEAR': 100, 'POSSIBLE': 70, 'UNCLEAR': 40, 'NONE': 10 };
  const revScore = revMap[inputs.revenue_clarity] * 0.15;

  return Math.round(completenessScore + clarityScore + humanScore + stackScore + secScore + revScore);
}
```

### ACC Score Interpretation

| Score | Level | Recommendation |
|-------|-------|---------------|
| 85–100 | HIGH | Factory can proceed with minimal human involvement |
| 60–84 | MEDIUM | Standard oversight. Human approval gates are sufficient |
| 40–59 | LOW | Elevated oversight required. Consider additional human checkpoints |
| 0–39 | VERY LOW | Consider whether to proceed. Human should stay closely involved |

### ACC and Build Plan Presentation

When ACC is LOW or VERY LOW, the build plan approval request includes additional information:

```
ACC SCORE: {{score}}/100 — ELEVATED OVERSIGHT RECOMMENDED

Reasons for low ACC:
- {{reason_1}}
- {{reason_2}}

Recommended additional checkpoints:
- {{checkpoint_suggestion_1}}
- {{checkpoint_suggestion_2}}

Human time investment estimate: {{hours}} hours (vs. {{hours}} for HIGH ACC project)
```

### How to Improve ACC

Most ACC scores can be improved before starting implementation:

```
Low completeness → ACC reflects reality; ACC will improve as Phase 7 progresses
Low clarity → Ask human to clarify intent, purpose, and any missing specs
Many human blockers → Resolve blockers in Phase 2 before proceeding
Unknown stack → Research the stack; update familiarity assessment
Critical security → Resolve as P0 tasks in Phase 7
Unclear revenue → Spend more time in Phase 3 with Monetization Agent
```

---

## How Scores Combine

The three scores serve different decision contexts:

### Before Starting a Factory Run
```
MOT < 70?
  → WARN: Factory health is degraded. Consider waiting.

ACC after Phase 2:
  < 40 → WARN: Low confidence. Recommend elevated oversight.
  40–60 → NORMAL: Standard workflow with normal approval gates.
  > 60 → PROCEED AUTONOMOUSLY with standard gates.
```

### During Phase 4 (Design Audit)
```
UDEC < 6.0 → AUTO-REBUILD trigger (requires human confirmation)
UDEC 6.0–8.4 → Patch plan added to build
UDEC >= 8.5 → No design gate issues
```

### Before Judge Review (Phase 8)
```
UDEC must be >= 8.5 before Judge review is requested
Production readiness must be >= 70 before Judge review is requested
If either fails: continue implementation until thresholds met
```

### Factory Health Dashboard (Mission Control)

Mission Control displays all three scores simultaneously:
```
FACTORY HEALTH
  MOT: 84/100 — GOOD
  
CURRENT PROJECT (if run active)
  UDEC: 8.7/10 — PASS
  ACC: 73/100 — MEDIUM
  Prod Readiness: 78/100 — NEARLY READY
```

---

## Score History and Trending

All scores are logged to Supabase at each calculation point:

```sql
-- Table: score_history
CREATE TABLE score_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  factory_run_id uuid REFERENCES factory_runs(id),
  score_type text CHECK (score_type IN ('UDEC', 'MOT', 'ACC', 'PROD_READINESS')),
  score numeric(5,2) NOT NULL,
  calculated_at timestamptz DEFAULT now(),
  phase text,
  notes text
);
```

Mission Control `ProjectHealthCard` shows score trends as sparklines.

---

## Configuring Score Thresholds

Default thresholds are set in agent configs. Override in `/agents/judge/config.json`:

```json
{
  "scoreThresholds": {
    "udec_pass": 8.5,
    "udec_rebuild": 6.0,
    "production_readiness_pass": 70,
    "production_readiness_deploy": 55,
    "mot_operational": 70,
    "mot_degraded": 50,
    "acc_autonomous": 60,
    "acc_elevated_oversight": 40
  }
}
```

**Warning**: Lowering these thresholds means accepting lower quality in deployments. Only lower thresholds when there is a documented, time-bound reason (e.g., MVP launch with known planned improvements).

---

*Scoring Guide v1.0.0 — Pauli Pi Software Factory*
*Scoring engines: /lib/scoring/udec.ts, /lib/scoring/mot.ts, /lib/scoring/acc.ts*
