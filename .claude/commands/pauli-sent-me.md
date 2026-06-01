# Pauli Sent Me — Revenue Systems Agent

## Slash Command: `/pauli-sent-me`

Run the full Revenue Systems Agent workflow for a business, niche, or website.

## Usage

```text
/pauli-sent-me [business name or URL or niche description]
```

## What This Does

1. Loads `skills/revenue-systems-agent/SKILL.md`
2. Runs the full workflow from `skills/revenue-systems-agent/workflow.md`
3. Produces all required outputs:
   - Business Snapshot
   - Current Funnel
   - Likely Pain Points
   - Pain Scorecard (scored 1–5 per dimension)
   - Recommended System (one-sentence pitch)
   - Demo Spec (screens, automations, data model)
   - Offer (result-first framing)
   - Outreach Message (specific, non-generic)
   - Sales Call Script
   - Monthly Subscription Package (Starter/Growth/Premium/Enterprise)
   - Reusable Niche Template
   - Next Build Steps

4. Saves client output to `clients/{business-slug}/` or `prospects/{niche}/{slug}/`
5. Appends learnings to `skills/revenue-systems-agent/learnings/self-improvement-log.md`
6. Updates `niche-pattern-library.md` if a new pattern is discovered

## Self-Improvement

After every run, this skill:
- Logs what worked in `learnings/self-improvement-log.md`
- Flags new niche patterns for the library
- Scores offer quality (1–10) based on specificity and revenue logic
- Suggests improvements to templates based on outcomes

## Priority Niches

1. Real Estate / Foreign Buyer Property Leads
2. Construction Company Lead Generation
3. Eco-Tours, Hotels, Resorts, and Puerto Vallarta Packages
4. Plumbers and HVAC
5. Anime, Digital Assets, and Digital Products
6. Medical, Dental, and Cosmetic Tourism
7. Destination Weddings, Private Events, Retreats, and Luxury Experiences

## Pauli Sent Me OS

When relevant, frame the offer inside the Pauli Sent Me OS trust/referral ecosystem:

- Pauli Verified badge for partner businesses
- QR codes and window stickers for local partner locations
- "Pauli sent me" customer phrase and tracked referral attribution
- Partner directory placement and local trust layer

## Core Rule

**Never lead with "we can build you a better website."**

**Always lead with a business result:** more leads, more bookings, better follow-up, less admin work.
