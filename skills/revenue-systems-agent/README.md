# Revenue Systems Agent Skill

## Purpose

This skill teaches PI how to turn small-business websites, local businesses, directory partners, and niche service providers into revenue-generating systems.

The core idea:

Business owners do not primarily want a prettier website.
They want more money, better leads, easier operations, more repeat customers, better organization, and less manual work.

This skill helps PI identify the operational pain behind a business, package a simple software system around that pain, create a demo spec, write outreach, and convert the system into a subscription product.

## Architecture Position

This is a PI skill, not a separate agent yet.

PI remains the master agent.

This skill lives in its own branch and folder:

```text
Branch: claude/revenue-systems-skill-0Ke4z
Folder: skills/revenue-systems-agent/
```

PI should lazy-load this skill when the user asks about:

- local business audits
- revenue systems
- business websites
- client offers
- lead generation
- booking systems
- CRM systems
- Pauli Sent Me OS
- directories
- verified partner businesses
- local referrals
- subscription services
- niche software offers
- outreach
- demo systems
- small-business automation

## Promotion Rule

Keep this as a skill while testing niches and offers.

Promote it into a standalone sub-agent only after:

1. The workflow is used repeatedly.
2. The same niche offer is validated.
3. The system needs its own queue, CRM, memory, or outreach database.
4. The workflow can run without touching unrelated PI functions.

Future promoted agent name: `RevenueSystemsAgent`

## Proof SDK Integration

This skill integrates with the [EveryInc proof-sdk](https://github.com/EveryInc/proof-sdk) to provide verifiable partner credentials and audit trail provenance for Pauli Verified businesses.

The proof-sdk provides collaborative document editing with full provenance tracking — a complete operational history of all changes, accessible via a REST API and agent HTTP bridge. When a partner is verified as a Pauli Sent Me OS member:

- A proof-sdk document is created as the canonical verification record
- All verification steps are tracked via the document's operational edit history
- The document slug is stored in the partner credential schema
- Agents can query partner status anytime via proof-sdk's HTTP bridge

See `proof/proof-integration.md` for full implementation details.

## Core Doctrine

Do not sell websites.

Sell systems that create one or more of these outcomes:

1. More qualified leads
2. More bookings
3. More repeat customers
4. Better follow-up
5. Better client intake
6. Higher conversion
7. Better compliance
8. Better organization
9. Easier operations
10. Measurable recurring value

## Best Product Name

**Pauli Sent Me OS**

This skill is part of the Pauli local directory/referral ecosystem:

- verified businesses
- partner pages
- QR codes
- window stickers
- local offers
- customer phrase: "Pauli sent me"
- tracked referrals
- lead routing
- subscription systems
- local trust layer

## Priority Niches

1. Real Estate / Foreign Buyer Property Leads
2. Construction Company Lead Generation
3. Eco-Tours, Hotels, Resorts, and Puerto Vallarta Packages
4. Plumbers and HVAC
5. Anime, Digital Assets, and Digital Products
6. Medical, Dental, and Cosmetic Tourism
7. Destination Weddings, Private Events, Retreats, and Luxury Experiences
