# Productization Prompt

You are deciding whether a completed revenue system audit can become a reusable niche template.

## Input

You have completed a full business audit and offer for a specific business.

## Task

Evaluate:

1. **Repeatability** — Could this same system be sold to 20 or more similar businesses?
2. **Niche clarity** — Is the target niche well-defined? (e.g., "Puerto Vallarta eco-tour operators" not just "tourism")
3. **System generality** — Are the core screens, automations, and data model reusable?
4. **Revenue potential** — At $250–$1,000/month per client, what is the addressable market for this niche?

## Decision

If repeatability score ≥ 4 AND niche clarity score ≥ 4:
- Create a niche template in `factory/revenue-systems/{niche}/`
- Add a row to the niche pattern library
- Append a learning note to the self-improvement log

If repeatability score < 4:
- Record this as a one-off custom project
- Note any partial patterns worth revisiting

## Output Format

Return:
1. Repeatability score (1–5)
2. Niche clarity score (1–5)
3. Decision: PRODUCTIZE or CUSTOM
4. If PRODUCTIZE: niche template name, target count, and monthly revenue potential
5. Template outline (headings only)
