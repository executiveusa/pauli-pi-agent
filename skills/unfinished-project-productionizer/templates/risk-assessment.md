# RISK ASSESSMENT: {{project_name}}

**Date**: {{timestamp}}
**Factory Run ID**: {{factory_run_id}}
**Assessed by**: Pauli Pi Software Factory — Master Agent + Watcher Agent
**Assessment Stage**: {{PRE-BUILD | MID-BUILD | PRE-LAUNCH | POST-LAUNCH}}

---

## Risk Assessment Summary

**Overall Risk Level**: {{LOW | MEDIUM | HIGH | CRITICAL}}
**Deployment Recommendation**: {{PROCEED | PROCEED WITH CAUTION | HOLD PENDING RESOLUTION | DO NOT DEPLOY}}

| Category | Risk Level | Key Risk |
|----------|-----------|----------|
| Technical | {{LOW/MED/HIGH/CRITICAL}} | {{top_risk}} |
| Security | {{LOW/MED/HIGH/CRITICAL}} | {{top_risk}} |
| Data | {{LOW/MED/HIGH/CRITICAL}} | {{top_risk}} |
| Revenue | {{LOW/MED/HIGH/CRITICAL}} | {{top_risk}} |
| Legal / Compliance | {{LOW/MED/HIGH/CRITICAL}} | {{top_risk}} |
| Operational | {{LOW/MED/HIGH/CRITICAL}} | {{top_risk}} |
| Reputational | {{LOW/MED/HIGH/CRITICAL}} | {{top_risk}} |
| Timeline | {{LOW/MED/HIGH/CRITICAL}} | {{top_risk}} |

---

## Risk Scoring Matrix

**Probability** (how likely to occur):
- 1 = Rare (< 5% chance)
- 2 = Unlikely (5–20%)
- 3 = Possible (20–50%)
- 4 = Likely (50–80%)
- 5 = Almost Certain (> 80%)

**Impact** (consequence if it occurs):
- 1 = Negligible (minor inconvenience)
- 2 = Minor (limited impact, easy recovery)
- 3 = Moderate (significant impact, recoverable)
- 4 = Major (serious impact, difficult recovery)
- 5 = Catastrophic (project-ending, data loss, legal exposure)

**Risk Score** = Probability × Impact

| Score | Level | Action |
|-------|-------|--------|
| 1–4 | LOW | Monitor |
| 5–9 | MEDIUM | Mitigate |
| 10–14 | HIGH | Mitigate urgently or avoid |
| 15–25 | CRITICAL | Must resolve before proceeding |

---

## CATEGORY 1: TECHNICAL RISKS

### RISK-T-001: {{risk_name}}
**Description**: {{detailed_description}}
**Probability**: {{1-5}} — {{reasoning}}
**Impact**: {{1-5}} — {{reasoning}}
**Risk Score**: {{score}} — {{LOW | MEDIUM | HIGH | CRITICAL}}

**Mitigation Strategy**:
{{mitigation_approach}}

**Contingency Plan** (if mitigation fails):
{{contingency}}

**Owner**: {{agent or human}}
**Status**: {{OPEN | MITIGATED | ACCEPTED | CLOSED}}
**Resolution**: {{resolution_description_when_closed}}

---

### RISK-T-002: Database Migration Failure
**Description**: Production database migration may fail, leaving the database in a partial state or causing downtime.
**Probability**: 2 — Unlikely (migrations tested in staging)
**Impact**: 4 — Major (data loss or corruption possible)
**Risk Score**: 8 — MEDIUM

**Mitigation Strategy**:
- Test all migrations in staging before production
- Create full database backup immediately before running production migrations
- Use transactions for all migrations (atomic: either all succeeds or all rolls back)
- Have rollback migration scripts ready

**Contingency Plan**:
- Restore database from pre-migration backup
- Roll back application deployment to previous version
- Communicate downtime to users if > 15 minutes

**Owner**: Deployment Agent + Human
**Status**: OPEN

---

### RISK-T-003: Third-Party Service Dependency
**Description**: Application depends on external services ({{list_services}}). Outage of any would degrade or break core functionality.
**Probability**: 3 — Possible (services have occasional outages)
**Impact**: 3 — Moderate (temporary degradation)
**Risk Score**: 9 — MEDIUM

**Mitigation Strategy**:
- Implement graceful degradation for each external service
- Add circuit breakers to prevent cascade failures
- Cache responses where appropriate
- Monitor third-party status pages

**Contingency Plan**:
- Display maintenance message if critical service is down
- Provide offline/cached fallback if possible
- Communicate status to users via status page

**Owner**: Backend Agent
**Status**: {{OPEN | MITIGATED}}

---

### RISK-T-004: {{additional_technical_risk}}

*(Add project-specific technical risks here)*

---

## CATEGORY 2: SECURITY RISKS

### RISK-S-001: Credential Exposure
**Description**: {{risk_description — e.g., "API keys found in repository history"}}
**Probability**: {{1-5}} — {{reasoning}}
**Impact**: 5 — Catastrophic (credential theft enables account takeover, data breach)
**Risk Score**: {{score}} — {{level}}

**Mitigation Strategy**:
- Rotate all exposed credentials immediately
- Remove from git history using `git filter-repo`
- Move all credentials to environment variables
- Add secret scanning to CI/CD pipeline
- Implement pre-commit hook to detect secrets before commit

**Contingency Plan**:
- If credentials already compromised: audit access logs for unauthorized use
- Notify affected parties per data breach regulations
- Document incident

**Owner**: Master Agent (coordination), Human (credential rotation)
**Status**: {{OPEN | RESOLVED}}

---

### RISK-S-002: Authentication Bypass
**Description**: Risk that authentication can be bypassed on API endpoints, allowing unauthorized data access.
**Probability**: {{1-5}}
**Impact**: 5 — Catastrophic (unauthorized data access)
**Risk Score**: {{score}}

**Mitigation Strategy**:
- Verify auth middleware applied to ALL API routes (not just UI routes)
- Add automated security tests for protected endpoints
- Penetration test authentication flow before launch
- Implement row-level security in database (Supabase RLS)

**Contingency Plan**:
- Immediately disable affected endpoints
- Audit access logs for unauthorized access
- Force re-authentication for all users
- Notify affected users

**Owner**: Backend Agent
**Status**: {{OPEN | MITIGATED | CLOSED}}

---

### RISK-S-003: {{additional_security_risk}}

*(Add project-specific security risks here)*

---

## CATEGORY 3: DATA RISKS

### RISK-D-001: Data Loss
**Description**: User data could be lost due to accidental deletion, failed migration, or infrastructure failure.
**Probability**: 2 — Unlikely
**Impact**: 5 — Catastrophic
**Risk Score**: 10 — HIGH

**Mitigation Strategy**:
- Automated daily database backups
- Point-in-time recovery configured
- Soft deletes for user-generated content (not hard deletes)
- Pre-migration backup procedure mandatory

**Contingency Plan**:
- Restore from most recent backup
- Communicate data loss to affected users
- Review and tighten backup procedures

**Owner**: Deployment Agent + Human
**Status**: {{OPEN | MITIGATED}}

---

### RISK-D-002: Data Privacy Violation
**Description**: Inadvertent exposure of PII or sensitive user data through logs, error messages, or API responses.
**Probability**: {{1-5}}
**Impact**: 4 — Major (legal liability, GDPR fines)
**Risk Score**: {{score}}

**Mitigation Strategy**:
- Audit all logs to ensure no PII is logged
- Review API responses to ensure no over-exposure of user data
- Implement data minimization principles
- Define and document data retention policy

**Contingency Plan**:
- If PII exposed: identify scope of exposure
- Notify affected users within 72 hours (GDPR requirement)
- File regulatory notification if required
- Implement immediate fix

**Owner**: Backend Agent + Human
**Status**: {{OPEN | MITIGATED}}

---

## CATEGORY 4: REVENUE RISKS

### RISK-R-001: Low Conversion Rate
**Description**: The free-to-paid conversion rate is lower than projected, limiting revenue growth.
**Probability**: 3 — Possible (common for early SaaS)
**Impact**: 3 — Moderate (slower revenue growth, not project-ending)
**Risk Score**: 9 — MEDIUM

**Mitigation Strategy**:
- A/B test pricing page copy and structure
- Implement usage-based upgrade prompts (show value before paywall)
- Offer limited-time founding member discount
- Conduct user interviews to understand conversion barriers

**Contingency Plan**:
- Reassess pricing (may be too high for the market)
- Change free tier limits to create more upgrade urgency
- Add or remove features from paid tiers based on feedback

**Owner**: Human (product decisions) + Monetization Agent (analysis)
**Status**: OPEN (monitor post-launch)

---

### RISK-R-002: Competitor Response
**Description**: A competitor launches a similar feature or reduces pricing in response to this product.
**Probability**: 2 — Unlikely (short term)
**Impact**: 3 — Moderate
**Risk Score**: 6 — MEDIUM

**Mitigation Strategy**:
- Differentiate on {{key_differentiators}}
- Build switching costs (integrations, data lock-in, community)
- Focus on customer success to build loyalty

**Contingency Plan**:
- Reassess positioning and pricing
- Accelerate roadmap to maintain differentiation
- Focus on customer segments competitors don't serve well

**Owner**: Human
**Status**: OPEN (ongoing monitoring)

---

### RISK-R-003: {{additional_revenue_risk}}

---

## CATEGORY 5: LEGAL / COMPLIANCE RISKS

### RISK-L-001: Data Protection Regulations
**Description**: Non-compliance with GDPR, CCPA, or other data protection laws if serving users in regulated jurisdictions.
**Probability**: {{1-5}} — based on user geography
**Impact**: 4 — Major (fines, enforcement action)
**Risk Score**: {{score}}

**Affected Regulations**:
- GDPR: if serving EU/UK users
- CCPA: if serving California users
- PIPEDA: if serving Canadian users
- {{other_regulations}}

**Mitigation Strategy**:
- Publish clear Privacy Policy before launch
- Implement cookie consent for EU users
- Add user data export and deletion functions
- Define and document data retention and deletion policies

**Contingency Plan**:
- Engage privacy law counsel
- Implement required compliance changes
- Notify regulators proactively if violation discovered

**Owner**: Human
**Status**: {{OPEN | MITIGATED | NOT_APPLICABLE}}

---

### RISK-L-002: Payment Compliance
**Description**: Payment processing compliance (PCI DSS) if handling card data directly.
**Probability**: {{1-5}}
**Impact**: 4 — Major (fines, loss of payment processing ability)
**Risk Score**: {{score}}

**Mitigation Strategy**:
- Use Stripe Elements or Checkout (card data never touches our servers)
- Verify PCI SAQ-A compliance status with Stripe
- Never log or store card numbers, CVV, or track data

**Contingency Plan**:
- Engage Stripe support if compliance questions arise
- Switch to Stripe Checkout if custom form has compliance risk

**Owner**: Backend Agent (implementation) + Human (compliance decisions)
**Status**: {{OPEN | MITIGATED}}

---

## CATEGORY 6: OPERATIONAL RISKS

### RISK-O-001: Traffic Spike on Launch
**Description**: Product Hunt or HN launch drives traffic spike that overwhelms the application.
**Probability**: 3 — Possible (if launch is successful)
**Impact**: 3 — Moderate (temporary downtime, first impression damage)
**Risk Score**: 9 — MEDIUM

**Mitigation Strategy**:
- Verify Vercel auto-scaling is enabled (it is by default)
- Pre-warm database connection pool
- Enable Redis caching for expensive queries
- Load test the application at 10x expected launch traffic
- Have circuit breaker ready to throttle signups if needed

**Contingency Plan**:
- Enable waiting list if overwhelmed
- Scale database vertically immediately
- Post status update on Twitter/status page
- Communicate estimated resolution time

**Owner**: Deployment Agent + Human
**Status**: {{OPEN | MITIGATED}}

---

### RISK-O-002: Key Person Dependency
**Description**: Critical knowledge about this system is concentrated in one person.
**Probability**: 3 — Possible
**Impact**: 3 — Moderate (bus factor = 1)
**Risk Score**: 9 — MEDIUM

**Mitigation Strategy**:
- Document all non-obvious architectural decisions
- Document all credentials and how to access/rotate them
- Write runbooks for common operational tasks
- This Risk Assessment itself is part of the mitigation

**Contingency Plan**:
- Factory documentation at /docs/software-factory/ provides sufficient context for any engineer
- All secrets are in Vercel environment (not personal knowledge)

**Owner**: Human
**Status**: MITIGATED (via this documentation)

---

## CATEGORY 7: REPUTATIONAL RISKS

### RISK-REP-001: Security Incident
**Description**: A security breach or data exposure that becomes public.
**Probability**: 2 — Unlikely
**Impact**: 5 — Catastrophic (brand damage, user trust loss)
**Risk Score**: 10 — HIGH

**Mitigation Strategy**:
- All security risks in Category 2 are addressed before launch
- Incident response plan documented (below)
- No sensitive data stored beyond what is necessary

**Contingency Plan — Incident Response**:
```
HOUR 0-1: Containment
  → Take affected systems offline if necessary
  → Identify scope of breach
  → Preserve logs for forensic analysis

HOUR 1-4: Assessment
  → Determine what data was exposed
  → Determine how many users affected
  → Determine how breach occurred

HOUR 4-24: Notification
  → Notify affected users via email
  → Post public disclosure on status page
  → Notify regulators if required (GDPR: 72 hours)

WEEK 1: Remediation
  → Fix the vulnerability
  → Rotate all credentials
  → Implement additional controls

WEEK 2+: Review
  → Post-mortem document
  → Systematic review of similar vulnerabilities
  → Update security practices
```

**Owner**: Human (communications) + Master Agent (technical response)
**Status**: OPEN (ongoing)

---

## CATEGORY 8: TIMELINE RISKS

### RISK-TL-001: Scope Creep During Build
**Description**: Additional features or fixes are added to the build plan after approval, extending the timeline.
**Probability**: 4 — Likely (always happens)
**Impact**: 2 — Minor (manageable with discipline)
**Risk Score**: 8 — MEDIUM

**Mitigation Strategy**:
- Strict change control: all amendments to build plan require Watcher notification
- New items go to P3 backlog unless they are P0 security issues
- Timeline updates communicated to human immediately

**Contingency Plan**:
- If timeline exceeds estimate by > 50%: human review of scope
- Consider cutting P2 items to meet timeline

**Owner**: Watcher Agent + Human
**Status**: OPEN (ongoing)

---

### RISK-TL-002: Human Blocker Delay
**Description**: Human input is required and takes longer than 48 hours to receive.
**Probability**: 3 — Possible
**Impact**: 3 — Moderate (project stalls)
**Risk Score**: 9 — MEDIUM

**Mitigation Strategy**:
- Parallel-track all non-blocked tasks
- Set clear expectation with human: respond within 24 hours
- Reminder notification at 24 hours, escalation at 48 hours

**Contingency Plan**:
- Skip feature if it's P2 or P3 (document as known gap)
- If P0/P1: cannot proceed without human. Project paused.

**Owner**: Watcher Agent (monitoring) + Human (resolution)
**Status**: OPEN (ongoing)

---

## Risk Register Summary

| ID | Category | Risk | Probability | Impact | Score | Level | Status |
|----|----------|------|------------|--------|-------|-------|--------|
| RISK-T-001 | Technical | {{name}} | {{1-5}} | {{1-5}} | {{score}} | {{level}} | {{status}} |
| RISK-T-002 | Technical | Database Migration Failure | 2 | 4 | 8 | MEDIUM | OPEN |
| RISK-T-003 | Technical | Third-Party Dependency | 3 | 3 | 9 | MEDIUM | OPEN |
| RISK-S-001 | Security | Credential Exposure | {{1-5}} | 5 | {{score}} | {{level}} | {{status}} |
| RISK-S-002 | Security | Authentication Bypass | {{1-5}} | 5 | {{score}} | {{level}} | {{status}} |
| RISK-D-001 | Data | Data Loss | 2 | 5 | 10 | HIGH | OPEN |
| RISK-D-002 | Data | Data Privacy Violation | {{1-5}} | 4 | {{score}} | {{level}} | {{status}} |
| RISK-R-001 | Revenue | Low Conversion | 3 | 3 | 9 | MEDIUM | OPEN |
| RISK-R-002 | Revenue | Competitor Response | 2 | 3 | 6 | MEDIUM | OPEN |
| RISK-L-001 | Legal | Data Protection | {{1-5}} | 4 | {{score}} | {{level}} | {{status}} |
| RISK-L-002 | Legal | Payment Compliance | {{1-5}} | 4 | {{score}} | {{level}} | {{status}} |
| RISK-O-001 | Operational | Launch Traffic Spike | 3 | 3 | 9 | MEDIUM | OPEN |
| RISK-O-002 | Operational | Key Person Dependency | 3 | 3 | 9 | MEDIUM | MITIGATED |
| RISK-REP-001 | Reputational | Security Incident | 2 | 5 | 10 | HIGH | OPEN |
| RISK-TL-001 | Timeline | Scope Creep | 4 | 2 | 8 | MEDIUM | OPEN |
| RISK-TL-002 | Timeline | Human Blocker Delay | 3 | 3 | 9 | MEDIUM | OPEN |
| {{RISK-X-00N}} | | | | | | | |

---

## Pre-Launch Risk Clearance

Before proceeding to deployment, all CRITICAL and HIGH risks must be either MITIGATED or ACCEPTED (with human sign-off).

| Risk Level | Count | Mitigated | Accepted | Remaining Open |
|-----------|-------|-----------|----------|----------------|
| CRITICAL | {{n}} | {{n}} | {{n}} | {{n}} |
| HIGH | {{n}} | {{n}} | {{n}} | {{n}} |
| MEDIUM | {{n}} | {{n}} | {{n}} | {{n}} |
| LOW | {{n}} | {{n}} | {{n}} | {{n}} |

**Pre-Launch Risk Clearance**: {{CLEARED | BLOCKED — list open CRITICAL/HIGH risks}}

**Human Risk Acceptance Sign-off**:
I have reviewed the risk register and accept the remaining open risks:
- Accepted by: {{human_name}}
- Date: {{date}}
- Open risks accepted: {{list risk IDs}}

---

*Risk Assessment generated by Pauli Pi Software Factory — Unfinished Project Productionizer v1.0.0*
*Review and update this document at each phase transition and again 30 days post-launch.*
