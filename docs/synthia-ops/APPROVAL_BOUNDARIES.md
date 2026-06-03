# Financial & Legal Approval Boundaries
# Version: 1.0.0
# Authority: MANDATORY — All agents must comply

## Principle

Cynthia automates creative and operational work heavily. Sensitive actions — money, contracts, publishing, credentials, regulated claims — require explicit human approval.

## Autonomous Actions (No Approval Needed)

| Category | Action |
|----------|--------|
| Design | Generate, iterate, score, refactor design artifacts |
| Copy | Write, revise, score copy and content |
| Research | Analyze sites, extract techniques, produce reports |
| Memory | Record approved patterns, lessons, critiques |
| Internal ops | Health checks, stale work detection, index updates |
| Job management | Create, classify, route, update job records |
| Draft generation | Generate proposals, invoices, emails (not send) |

## Human Approval Required

| Category | Action | Approval From |
|----------|--------|---------------|
| **Payments** | Send invoice to client | Bambu |
| **Payments** | Process refund | Bambu |
| **Payments** | Create payout/withdrawal | Bambu |
| **Payments** | Modify pricing | Bambu |
| **Payments** | Accept payment for new service type | Bambu |
| **Contracts** | Sign or accept contracts | Bambu |
| **Contracts** | Agree to terms of service | Bambu |
| **Publishing** | Deploy to production CDN | Bambu or Hermes |
| **Publishing** | Post to social media | Bambu |
| **Publishing** | Send newsletter/bulletin to list | Bambu |
| **Credentials** | Create API keys or tokens | Bambu |
| **Credentials** | Share credentials | Bambu |
| **Platform** | Submit proposals on job platforms | Bambu |
| **Platform** | Create accounts on external services | Bambu |
| **Repo** | Delete files or branches | Hermes |
| **Repo** | Force push or reset | Bambu |
| **Legal** | Make regulatory claims | Bambu |
| **Legal** | Privacy policy changes | Bambu |
| **Database** | Schema migrations | Hermes |
| **Database** | Delete data | Bambu |

## Approval Mechanism

1. Agent creates approval request in `studio/jobs/review/` with:
   ```yaml
   requires_human_approval: true
   approval_type: payment|contract|publishing|credential|legal|destructive
   description: "Send invoice #INV-2026-042 to client@example.com for $2,500"
   requested_by: packaging_agent
   requested_at: datetime
   ```

2. Notification sent via Telegram/Discord to Bambu

3. Bambu responds with:
   - `approved` → action proceeds
   - `rejected` → action cancelled, reason recorded
   - `modified` → adjusted action proceeds

4. Approval recorded in `studio/memory/decisions/`

## Compliance Notes

- TCPA: No unsolicited calls/texts without opt-in
- CAN-SPAM: Unsubscribe link required in all marketing emails
- GDPR: Data deletion requests honored within 30 days
- Platform ToS: No automated interactions on platforms that prohibit bots
- Tax: Use Creem (merchant of record) or consult accountant for complex jurisdictions
- Accessibility: WCAG AA minimum for all public-facing outputs
