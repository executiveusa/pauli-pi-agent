# Pauli Verified Partner Verification Flow

## Overview

This document describes the step-by-step process for verifying a business as a Pauli Sent Me OS partner using the proof-sdk provenance system.

Each step is recorded as a document edit, creating a tamper-evident audit trail.

## Step 1: Initiate Verification

PI receives a request to verify a business partner.

Trigger phrases:
- "verify this partner"
- "add Pauli Verified badge"
- "onboard this business to Pauli Sent Me"

PI creates a proof-sdk document:

```text
POST {PROOF_SDK_BASE_URL}/documents
{
  "slug": "pauli-verified-{business-slug}",
  "content": "# Pauli Verified Partner Review\n\nBusiness: {business_name}\nInitiated: {date}\nStatus: PENDING"
}
```

## Step 2: Business Intake

PI runs the business-intake workflow and records results as a document edit:

```text
POST {PROOF_SDK_BASE_URL}/documents/{slug}/edit
{ "content": "## Business Intake\n\n{intake_data}" }
```

## Step 3: Pain Scorecard

PI scores each pain dimension 1–5 and records the scorecard as a document edit.

## Step 4: System Recommendation

PI selects the best revenue system and records the recommendation as a document edit.

## Step 5: Verification Criteria Check

PI checks whether the business meets Pauli Verified standards:

| Criterion | Required |
|---|---|
| Real business with active presence | Yes |
| Genuine service or product | Yes |
| Responsive to customer inquiries | Yes |
| No active fraud reports | Yes |
| Willing to honor "Pauli sent me" phrase | Yes |
| System opportunity identified | Yes |

Records the criteria check as a document edit.

## Step 6: Badge Grant

If all criteria pass, PI updates the proof-sdk document status to `VERIFIED`:

```text
POST {PROOF_SDK_BASE_URL}/documents/{slug}/edit
{
  "content": "## Verification Status\n\nStatus: VERIFIED\nBadge granted: {date}\nRenewal due: {renewal_date}"
}
```

## Step 7: Partner Credential Output

PI outputs the partner credential JSON referencing the proof-sdk document:

```json
{
  "business_name": "{business_name}",
  "business_slug": "{business-slug}",
  "pauli_verified": true,
  "badge_granted_date": "{date}",
  "renewal_date": "{renewal_date}",
  "proof_document_slug": "pauli-verified-{business-slug}",
  "proof_document_url": "{PROOF_SDK_BASE_URL}/documents/pauli-verified-{business-slug}/state",
  "niche": "{niche}",
  "recommended_system": "{system_name}",
  "subscription_tier": "{tier}"
}
```

## Step 8: Ongoing Audit Trail

All future changes to partner status are recorded as edits to the proof-sdk document.

Agents can query partner status anytime:

```text
GET {PROOF_SDK_BASE_URL}/documents/pauli-verified-{business-slug}/state
```

This returns the full current state with the complete edit history.
