# Vercel Showroom — Future Work

A public-facing showroom deployed to Vercel that lets prospects experience all three
Mercury tiers (Clean / Voice / Diffusion) without needing their own API key.

## Status

**Not started.** This is a placeholder for a future sprint.

## Planned scope

| Item | Notes |
|---|---|
| `/showroom` route | Side-by-side comparison of all three plans |
| Demo tenant API keys | Managed by ArchonX; rate-limited via Upstash |
| Tier switcher UI | Toggle button group — Clean / Voice / Diffusion |
| Copy-to-clipboard embed | One-click Webflow snippet for each tier |
| Analytics | Posthog events: tier_viewed, demo_started, embed_copied |

## Deployment prerequisites

1. Vercel project linked to this repo
2. `INCEPTION_API_KEY` set as a Vercel environment secret (server only)
3. `ARCHONX_TENANT_CONFIG_MODE=remote` with control plane URL configured
4. Rate-limit middleware on `/api/mercury` proxy route
5. CORS configured to allow showroom origin only

## Security requirements (before launch)

- Demo keys must be separate from client BYOK keys and rate-limited
- No real money-movement tools enabled on showroom tenants
- `requiresApprovalForMoneyMovement: true` enforced for all showroom configs
- Usage capped at 100 turns/hour per IP via middleware

## Reference

See `examples/nextjs-demo-client.md` for the base Next.js integration pattern
that the showroom will build on.
