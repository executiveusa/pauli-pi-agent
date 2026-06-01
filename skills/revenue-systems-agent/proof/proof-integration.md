# Proof SDK Integration

## What is proof-sdk?

The [EveryInc proof-sdk](https://github.com/EveryInc/proof-sdk) is an open-source platform for collaborative document editing with built-in **provenance tracking**. It provides:

- A markdown editor with real-time collaboration and full change history
- An operational history of all edits — a complete, immutable audit trail
- A REST API for document creation, editing, state queries, and agent integration
- An HTTP bridge connecting AI agents to document state and events
- SQLite persistence for document history

## Why proof-sdk fits Pauli Sent Me OS

The Pauli Sent Me OS trust layer requires **verifiable partner credentials** — evidence that a business was reviewed, audited, and earned the Pauli Verified badge.

proof-sdk's provenance model solves this exactly:

| Pauli Sent Me Need | proof-sdk Capability |
|---|---|
| Verifiable audit record | Document provenance trail |
| Partner verification history | Operational edit history |
| Agent-accessible partner status | Agent HTTP bridge |
| Tamper-evident credentials | Immutable document history |
| Multi-step review workflow | Collaborative document editing |
| Compliance audit log | Full change tracking |

## Integration Architecture

```text
PI Agent
  │
  ├── Runs /pauli-sent-me workflow
  │
  ├── Creates partner verification document via proof-sdk
  │       POST /documents
  │       { slug: "pauli-verified-{business-slug}", content: audit_report }
  │
  ├── Records each verification step as an edit
  │       POST /documents/{slug}/edit
  │
  ├── Stores document slug in partner credential schema
  │       proof_document_slug: "pauli-verified-{business-slug}"
  │
  └── Agents query partner status anytime
          GET /documents/{slug}/state
```

## proof-sdk API Endpoints Used

| Endpoint | Purpose |
|---|---|
| `POST /documents` | Create partner verification document |
| `GET /documents/{slug}/state` | Query current verification status |
| `POST /documents/{slug}/edit` | Record a verification step |
| `POST /documents/{slug}/ops` | Apply operational transforms |
| `GET /documents/{slug}/marks` | Get agent-placed verification marks |
| `POST /documents/{slug}/suggestions` | Add reviewer suggestions |

## Partner Verification Document Structure

When a business is verified as a Pauli Sent Me OS partner, PI creates a proof-sdk document:

**Document slug:** `pauli-verified-{business-slug}`

**Document sections (each written as an edit):**

1. Business Identity
2. Verification Checklist
3. Business Audit Results
4. Pain Scorecard
5. Recommended System
6. Verification Status
7. Badge Granted Date
8. Renewal Date

Each section creates an immutable entry in the provenance trail.

## Setup Requirements

To use proof-sdk integration:

1. Run the proof-sdk server (see proof-sdk docs)
2. Set `PROOF_SDK_BASE_URL` in your `.env` file
3. Set `PROOF_SDK_API_KEY` if authentication is required
4. The `proof_document_slug` field in partner credentials is populated on verification

## Self-Hosted vs Managed

- **Self-hosted**: Run the proof-sdk server on your own infrastructure alongside the Pauli directory
- **Managed**: Use the EveryInc hosted version if available

For Pauli Sent Me OS at scale, self-hosting on a VPS alongside the partner directory is recommended.
