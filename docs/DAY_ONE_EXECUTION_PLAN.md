# DAY_ONE_EXECUTION_PLAN.md - Agency Launch Blueprint

This plan outlines the first 10 high-leverage milestones to activate your autonomous agency on Day One.

## Day-One Action Checklist

1. **Local Proxy Activation**: Launch `fcc-server` locally on port 8082 with key `freecc`.
2. **Health check verification**: Trigger a server-side health check against the local proxy to verify OpenRouter, Groq, and Gemini routing status.
3. **Database connection**: Confirm PostgreSQL/Supabase connections and run initial schema migrations.
4. **Teammate onboarding**: Load the 16-agent team YAML metadata into the Paperclip company engine.
5. **Wake executive cron**: Execute the first `daily-executive-heartbeat` to check for active bottlenecks.
6. **Smart Site brief generation**: Generate the first localized spa brochure sitemap.
7. **Lead Scraper run**: Execute `pi-agency leads find --niche "luxury hotel" --location "Puerto Vallarta"` using mock data.
8. **Outreach drafting**: Compile the first B2B personalized value-in-advance pitch.
9. **Draft social campaign**: Create the first concierge Sofia UGC video script draft.
10. **Board sync**: Output the first metric signal report to Bambu for final approval.
