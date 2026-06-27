---
name: online-shopper
description: Autonomous online shopping agent. Activates whenever the user wants to find a product, compare prices, track a deal, apply coupons, or interact with any shopping website. Spins up its own Orgo virtual computer, uses Firecrawl for fast page extraction, and Bright Data for bot-protected or geo-locked sites.
---

# Online Shopper Skill

## Activation Triggers

Activate this skill whenever the user says anything like:
- "find me / buy me / order / get me [product]"
- "what's the best price for..."
- "is [product] on sale?"
- "check Amazon / eBay / Walmart / Target for..."
- "apply a coupon at..."
- "track this product URL..."
- "add to cart" / "check out" / "place the order"
- Any intent to search, browse, or purchase on the web

## Required MCP Servers

| Server | Purpose | Config |
|--------|---------|--------|
| **Firecrawl** | Fast product page scraping | Firecrawl API key in env |
| **Bright Data** | Bot-protected & geo-locked sites | Bright Data credentials in env |
| **Orgo** | Full virtual browser, login, cart, checkout | `ORGO_API_KEY` in env |

**Orgo API key (testing):** stored in environment as `ORGO_API_KEY`
**Rotate key at:** https://orgo.ai/dashboard

## System Prompt

See: `prompts/system.md`

Load this as the system prompt when the skill activates.

## Tool Selection Logic

```
User request
     │
     ├── Public product page, major retailer?
     │        └── Firecrawl → fallback: Bright Data
     │
     ├── Bot-protected, geo-locked, or SERP?
     │        └── Bright Data → fallback: Orgo
     │
     ├── Requires login / cart / checkout / JS-heavy SPA?
     │        └── Orgo (virtual browser) — see Orgo Workflow below
     │
     └── Price compare across 5+ stores?
              └── Firecrawl in parallel → Bright Data for blocked ones
```

## Orgo Workflow (Standard)

Every Orgo session follows this sequence:

```
1. orgo_list_computers          → find existing computer or note none exist
2. orgo_create_computer         → spin up a new cloud computer (if needed)
3. orgo_ensure_running          → confirm it's active
4. orgo_screenshot              → verify clean desktop state
5. orgo_bash "chromium-browser --no-sandbox <url> &"
6. orgo_wait + orgo_screenshot  → confirm page loaded
7. orgo_click / orgo_type / orgo_scroll / orgo_key  → navigate
8. orgo_screenshot after each action  → verify state before next step
9. Report findings to user
10. orgo_delete_computer (optional) → clean up when session done
```

**Hard rules:**
- Always screenshot before and after any click
- PAUSE and confirm with user before any add-to-cart or checkout step
- Never enter payment details unless user pastes them in the same message
- Never leave accounts logged in after session ends

## Output Format

```
Product: [name + key specs]
Best Option: [store] — $[price] (+ $[shipping] = $[total])

| Store | Price | Shipping | Total | In Stock | Link |
|-------|-------|----------|-------|----------|------|

Recommendation: [1-2 sentences]
Active Deals: [coupons / promos found]
Notes: [return policy, seller trust, subscription traps]
```

## Test Connection

Run `test-connection.sh` to verify Orgo API key is valid and a computer can be listed or created.
