# LAUNCH CHECKLIST: {{project_name}}

**Date**: {{timestamp}}
**Factory Run ID**: {{factory_run_id}}
**Target URL**: {{production_url}}
**Launch Approver**: {{human_approver}}

All items must be checked before production deployment is approved. Items marked REQUIRED must pass. Items marked RECOMMENDED should pass but will not block launch.

---

## LEGEND
- [x] COMPLETE
- [ ] PENDING
- [~] SKIPPED (with justification)
- [!] BLOCKED (requires resolution)

---

## SECTION 1 — SECURITY (ALL REQUIRED)

### Secrets & Credentials
- [ ] No API keys, passwords, or tokens committed to the repository
- [ ] All secrets stored in environment variables
- [ ] `.env` files excluded from git (verify `.gitignore`)
- [ ] `.env.example` file exists with all required keys listed (values are placeholders)
- [ ] Production secrets stored in Vercel environment variables (or equivalent)
- [ ] Secrets have been rotated if they were previously exposed

### Authentication
- [ ] Login flow works end-to-end in production environment
- [ ] Logout correctly destroys session
- [ ] Protected routes redirect unauthenticated users to login
- [ ] Password reset flow works (if applicable)
- [ ] Email verification works (if applicable)
- [ ] OAuth flows work (if applicable)

### Authorization
- [ ] Users can only access their own data
- [ ] Admin-only endpoints require admin role check
- [ ] API endpoints verify authentication (not just UI routes)
- [ ] No horizontal privilege escalation vulnerabilities

### Input & Data
- [ ] All user-facing form inputs are validated server-side
- [ ] File upload type and size restrictions enforced
- [ ] SQL injection protection in place (parameterized queries or ORM)
- [ ] XSS protection in place (output encoding, CSP headers)
- [ ] CSRF protection for state-changing operations

### Network
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] HSTS header set
- [ ] CORS policy restricts origins appropriately
- [ ] Rate limiting on public API endpoints
- [ ] Rate limiting on authentication endpoints (brute force protection)

**SECURITY SECTION VERDICT**: {{PASS | FAIL — list failed items}}

---

## SECTION 2 — FUNCTIONALITY (ALL REQUIRED)

### Core Features
- [ ] {{primary_feature_1}} works as expected
- [ ] {{primary_feature_2}} works as expected
- [ ] {{primary_feature_3}} works as expected
- [ ] All features listed in README work or are documented as coming soon

### User Flows (verified via Browser QA)
- [ ] New user signup → onboarding → first use: complete without errors
- [ ] Returning user login → core feature → logout: complete without errors
- [ ] Error states display correctly (invalid input, server errors)
- [ ] Empty states display correctly (new account, no data)
- [ ] Loading states display during async operations

### Data Integrity
- [ ] Create operations persist correctly
- [ ] Read operations return accurate data
- [ ] Update operations modify only the correct records
- [ ] Delete operations remove data (or soft-delete where appropriate)
- [ ] Data survives a server restart (nothing stored only in memory)

### Edge Cases
- [ ] App handles expired sessions gracefully (doesn't crash)
- [ ] App handles network disconnection gracefully
- [ ] App handles empty/null data without crashing
- [ ] Long strings don't break layouts
- [ ] Special characters in inputs are handled correctly

**FUNCTIONALITY SECTION VERDICT**: {{PASS | FAIL — list failed items}}

---

## SECTION 3 — PERFORMANCE (REQUIRED: items marked *, RECOMMENDED: others)

### Load Performance
- [ ]* Homepage: Largest Contentful Paint < 2.5s on fast 3G
- [ ]* Time to Interactive < 5s on fast 3G
- [ ]* Initial JavaScript bundle < 500KB (uncompressed)
- [ ] Lighthouse Performance Score > 75
- [ ] Core Web Vitals all in GREEN zone

### Images & Assets
- [ ] All images use next-gen formats (WebP, AVIF) where possible
- [ ] Images have explicit width and height attributes
- [ ] Images are lazy-loaded where appropriate
- [ ]* No images > 500KB served to users
- [ ] Fonts are preloaded if custom fonts used

### Backend Performance
- [ ] No N+1 database query patterns on main pages
- [ ] Database queries use appropriate indexes
- [ ] API response time < 500ms for p95 (excluding external services)
- [ ] Connection pooling configured for database

### Caching
- [ ] Static assets have appropriate cache headers (1 year for fingerprinted assets)
- [ ] CDN configured for static assets
- [ ] API responses cached where appropriate

**PERFORMANCE SECTION VERDICT**: {{PASS | FAIL | CONDITIONAL}}

---

## SECTION 4 — RELIABILITY (ALL REQUIRED)

### Error Handling
- [ ] Global error handler catches unhandled exceptions
- [ ] Error boundaries prevent UI crashes from propagating (React)
- [ ] API errors return appropriate HTTP status codes with helpful messages
- [ ] Failed third-party API calls are handled gracefully (not silent failures)
- [ ] Database connection failures are handled gracefully

### Monitoring
- [ ] Error tracking configured (Sentry / Rollbar / equivalent)
- [ ] Error tracking verified: throw a test error, confirm it appears in dashboard
- [ ] Uptime monitoring configured (UptimeRobot / Checkly / equivalent)
- [ ] Alert set up for > 5 minutes downtime

### Health Checks
- [ ] Health check endpoint exists at `/api/health` or `/health`
- [ ] Health check returns 200 with status information
- [ ] Health check verifies database connectivity
- [ ] Health check used in Vercel deployment configuration

### Backups
- [ ] Database backup strategy documented
- [ ] Backup frequency defined (daily minimum recommended)
- [ ] Backup restore procedure tested at least once
- [ ] Backup retention period defined

**RELIABILITY SECTION VERDICT**: {{PASS | FAIL — list failed items}}

---

## SECTION 5 — OBSERVABILITY (RECOMMENDED)

### Logging
- [ ] Structured logging implemented (JSON format recommended)
- [ ] Request logs capture: method, path, status code, duration, user_id (if authenticated)
- [ ] Error logs capture: message, stack trace, context
- [ ] Logs do NOT contain PII or secrets
- [ ] Log retention period configured

### Metrics
- [ ] Key business metrics tracked (signups, logins, core feature uses)
- [ ] Error rate metric tracked
- [ ] Response time percentiles tracked (p50, p95, p99)

### Alerting
- [ ] Alert on error rate spike (> X errors per minute)
- [ ] Alert on slow response (p95 > 2s for > 5 minutes)
- [ ] Alert on uptime failure
- [ ] Alert notifications go to: {{alert_destination}}

**OBSERVABILITY SECTION VERDICT**: {{PASS | PARTIAL | NOT_CONFIGURED}}

---

## SECTION 6 — DESIGN & UX (REQUIRED: items marked *, RECOMMENDED: others)

### UDEC Compliance
- [ ]* UDEC Score >= 8.5/10 (verified by Design Agent)
- [ ]* Synthia Superdesign standards met (see design audit)

### Accessibility (WCAG 2.1 AA)
- [ ]* All images have descriptive alt text
- [ ]* All form inputs have associated labels
- [ ]* Color contrast ratio >= 4.5:1 for normal text
- [ ]* Color contrast ratio >= 3:1 for large text
- [ ]* All interactive elements reachable via keyboard
- [ ]* Focus indicators visible on all interactive elements
- [ ] ARIA roles used correctly where needed
- [ ] Screen reader test performed (VoiceOver / NVDA)

### Responsive Design
- [ ]* Layout works at 375px (mobile)
- [ ]* Layout works at 768px (tablet)
- [ ]* Layout works at 1280px (desktop)
- [ ]* Navigation accessible on mobile
- [ ]* Touch targets >= 44px on mobile

### Copy & Content
- [ ]* No placeholder text ("Lorem ipsum") visible
- [ ]* No "TODO" or "FIXME" visible to users
- [ ]* App name and branding consistent throughout
- [ ] About/contact information present
- [ ] Privacy policy accessible (required if collecting user data)
- [ ] Terms of service accessible (required if paid service)
- [ ] Cookie consent banner (required in EU)

### Error Messages
- [ ]* 404 page is custom and helpful (links to homepage)
- [ ]* 500 error page is custom and apologetic
- [ ]* Form validation error messages are specific and actionable
- [ ] Empty states have clear calls to action

**DESIGN SECTION VERDICT**: {{PASS | FAIL — list failed items}}

---

## SECTION 7 — DEPLOYMENT & INFRASTRUCTURE (ALL REQUIRED)

### Environment Configuration
- [ ] Separate configurations for development, staging, and production
- [ ] No dev-only code paths active in production
- [ ] Debug mode OFF in production
- [ ] Production environment variables set in Vercel (or equivalent)
- [ ] NODE_ENV=production set

### Database
- [ ] Production database is separate from development database
- [ ] Database migrations are automated and versioned
- [ ] Migration has been run in production
- [ ] Database connection string points to production database
- [ ] Database is NOT publicly accessible (only accessible from app server)

### Deployment Pipeline
- [ ] CI/CD pipeline defined (GitHub Actions or equivalent)
- [ ] Tests run on every pull request
- [ ] No deployment if tests fail
- [ ] Preview deployments for pull requests
- [ ] Production deploys only from main/master branch

### Rollback
- [ ] Rollback procedure documented
- [ ] Previous deployment available for instant rollback (Vercel instant rollback)
- [ ] Database rollback procedure documented (if migrations ran)

### Domain & DNS
- [ ] Custom domain configured (or staging URL confirmed)
- [ ] SSL certificate active (auto-via Vercel or equivalent)
- [ ] DNS TTL set appropriately for launch
- [ ] www redirect configured (www → bare domain or vice versa)

**DEPLOYMENT SECTION VERDICT**: {{PASS | FAIL — list failed items}}

---

## SECTION 8 — BUSINESS & LEGAL (REQUIRED where applicable)

### Payments (if applicable)
- [ ] Stripe account in production mode (not test mode)
- [ ] Stripe webhook endpoints configured for production
- [ ] Test purchase completed successfully
- [ ] Refund flow tested
- [ ] Subscription cancellation flow tested
- [ ] Failed payment handling configured

### Legal (REQUIRED if collecting user data or charging)
- [ ] Privacy policy published and linked in footer
- [ ] Terms of service published and linked in footer
- [ ] Cookie policy / cookie consent (if applicable)
- [ ] GDPR compliance if serving EU users
- [ ] CCPA compliance if serving California users
- [ ] Data retention policy defined

### Analytics (RECOMMENDED)
- [ ] Privacy-respecting analytics configured (Plausible / PostHog / Fathom)
- [ ] Conversion events tracked (signup, first feature use, upgrade)
- [ ] UTM parameter tracking working

**BUSINESS SECTION VERDICT**: {{PASS | PARTIAL | NOT_APPLICABLE}}

---

## SECTION 9 — JUDGE REVIEW (REQUIRED)

- [ ] Judge Agent review requested
- [ ] Judge verdict received: {{PASS | PASS_WITH_CONDITIONS | FAIL}}
- [ ] Judge verdict date: {{date}}
- [ ] All DEPLOYMENT-BLOCKING conditions resolved (if PASS WITH CONDITIONS)
- [ ] POST-DEPLOYMENT conditions documented in launch notes

**JUDGE VERDICT**: {{verdict}}
**Judge Decision Document**: `/audit-output/judge-decision.md`

---

## SECTION 10 — HUMAN APPROVAL (REQUIRED)

- [ ] Human approver has reviewed this checklist
- [ ] Human approver has reviewed staging deployment
- [ ] Human approver has reviewed Judge decision
- [ ] Human approver has explicitly confirmed: `[APPROVE PRODUCTION DEPLOYMENT]`
- [ ] Approval timestamp: {{approval_timestamp}}
- [ ] Approval given by: {{approver_name}}

**This checklist requires explicit human approval before production deployment.**

---

## LAUNCH DAY RUNBOOK

In order, on launch day:

```
T-60 min: Final staging smoke test
T-30 min: Confirm human is available for launch window
T-15 min: Verify all environment variables are set in production
T-0:      Execute production deployment
T+5 min:  Smoke test production URL (homepage, login, core feature)
T+10 min: Verify no error spike in error tracking dashboard
T+15 min: Confirm uptime monitor is showing green
T+30 min: Send launch announcement (if applicable)
T+60 min: Check analytics for first real users
T+4 hr:   Review error logs for any post-launch issues
T+24 hr:  Send first post-launch review to stakeholders
```

**Emergency rollback command**:
```bash
vercel rollback {{deployment_id}} --yes
```

**Support escalation chain**:
1. {{first_contact}} — {{method}}
2. {{second_contact}} — {{method}}
3. {{third_contact}} — {{method}}

---

## CHECKLIST COMPLETION SUMMARY

| Section | Required | Passed | Failed | Skipped |
|---------|----------|--------|--------|---------|
| Security | {{n}} | {{n}} | {{n}} | {{n}} |
| Functionality | {{n}} | {{n}} | {{n}} | {{n}} |
| Performance | {{n}} | {{n}} | {{n}} | {{n}} |
| Reliability | {{n}} | {{n}} | {{n}} | {{n}} |
| Observability | {{n}} | {{n}} | {{n}} | {{n}} |
| Design & UX | {{n}} | {{n}} | {{n}} | {{n}} |
| Deployment | {{n}} | {{n}} | {{n}} | {{n}} |
| Business | {{n}} | {{n}} | {{n}} | {{n}} |
| Judge Review | {{n}} | {{n}} | {{n}} | {{n}} |
| Human Approval | {{n}} | {{n}} | {{n}} | {{n}} |
| **TOTAL** | **{{n}}** | **{{n}}** | **{{n}}** | **{{n}}** |

**LAUNCH VERDICT**: {{APPROVED | BLOCKED — list blockers}}

---

## Post-Launch Notes

{{post_launch_notes}}

*Known limitations, deferred items, and monitoring notes go here.*

---

*Launch Checklist generated by Pauli Pi Software Factory — Unfinished Project Productionizer v1.0.0*
