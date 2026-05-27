# ANTI_SLOP_POLICY.md - AI Slop Prevention Guidelines

AI "slop" refers to low-quality, generic, boilerplate code, text, and visual layouts produced by unguided models. We enforce strict policies to maintain premium craftsmanship.

## 1. Visual Slop Prevention
* **No Basic HTML/Bootstrap Cards**: Reject standard grids, simple solid borders, and un-curated color buttons.
* **Synthia Theming Only**: All UI layouts must use HSL atmospheric palettes, editorial Outfits typography, customized paddings, and glassmorphic overlays.

## 2. Text & Content Slop Prevention
* **No Fake Claims**: Do not write artificial testimonials or fabricate statistics.
* **Professional Tone**: Avoid repetitive transitional phrases ("in summary", "moreover", "it is important to note"). Write direct, active, and localized copy.
* **Bilingual Nuance**: Translation workflows must preserve local context and local idioms rather than literal translation engine equivalents.

## 3. Code & Structural Slop Prevention
* **No inline imports**: Never use inline imports (`await import`) or dynamic type imports unless explicitly approved.
* **No `any` types**: Enforce strict TypeScript types throughout all services and adapters.
* **Idempotency**: All migrations, route handlers, and CLI commands must be idempotent and safely retryable.
