# Second Brain Recovery and Access

## Purpose

This layer converts the raw ChatGPT export vault into verified, normalized source records that Context Mesh can query.

It does **not** treat Google Drive as the runtime database. Drive remains immutable source evidence.

## Locked architecture

```text
Google Drive: CHATGPT EXPORT 2026-09
        │
        │ read-only sync/mount
        ▼
VPS raw vault
/srv/context-mesh/raw/chatgpt
        │
        ▼
Recovery worker
- manifest
- signature/hash/entropy checks
- format identification
- reconstruction when required
- archive verification
        │
        ▼
Verified extraction
/srv/context-mesh/extracted/chatgpt
        │
        ├── quarantine/
        │   auth, payment/security, unknown binary
        │
        └── allowlist/
            conversations, projects, attachments, timestamps
        │
        ▼
ICM normalization
/srv/context-mesh/normalized
        │
        ▼
Graphify
/srv/context-mesh/normalized/graphify-out/graph.json
        │
        ▼
Context Mesh MCP
        │
        ▼
Pi / Claude / Codex / Cosmos / StarNet / other agents
```

## Access rule

Agents do **not** receive unrestricted Google Drive credentials and do not scan the 20+ GB archive directly.

Agents call Context Mesh tools:

- `brain_status`
- `brain_search`
- `brain_context`
- `brain_entity`
- `brain_path`
- `brain_sources`
- `brain_recent`
- `brain_remember`

For local Pi, Context Mesh can continue running over MCP stdio.

For remote agents, run the hosted gateway on the VPS and expose it only across Tailscale. Authentication belongs at the gateway. The raw vault stays private to the worker.

## VPS directories

```text
/srv/context-mesh/
├── raw/chatgpt/          # read-only Drive mirror/mount
├── work/                 # temporary reconstruction workspace
├── extracted/chatgpt/    # verified extraction
├── quarantine/           # denied/sensitive source classes
├── normalized/           # ICM source tree
├── state/                # manifests, hashes, checkpoints
└── backups/              # rollback snapshots
```

## Drive connection

Preferred sovereign path: configure `rclone` once on the VPS for the user's Google Drive and mount or sync only the export folder.

Example mount:

```bash
sudo mkdir -p /srv/context-mesh/raw/chatgpt
rclone mount gdrive:"CHATGPT EXPORT 2026-09" /srv/context-mesh/raw/chatgpt \
  --read-only \
  --vfs-cache-mode full
```

A scheduled `rclone sync --immutable` into local storage is also valid and is usually better for a one-time 20+ GB recovery job.

Do not commit OAuth tokens, service-account keys, rclone config, or cookies to Git.

## First proof gate

Run the probe against representative files:

```bash
node products/context-mesh/recovery/archive-probe.mjs /srv/context-mesh/raw/chatgpt
```

The probe writes no source data. It reports:

- file size
- SHA-256
- first 16 bytes
- Shannon entropy sample
- known file signature
- ZIP structural checks when applicable

## Reconstruction gate

Do not concatenate numbered parts unless the probe or source format proves that they are segments of one container.

If reconstruction is required, create a separate output under `/srv/context-mesh/work`; never overwrite the raw vault.

## Approval proof

The full corpus is approved for graph ingestion only after one historical conversation is recovered with:

- conversation title
- creation timestamp
- conversation ID
- at least one user message
- at least one assistant message
- source archive path
- source archive SHA-256
- extraction timestamp
- parser/recovery version

## Security classes

Allowlist:
- conversations
- project/context documents
- attachments required for those conversations
- timestamps
- conversation/project relationships

Quarantine:
- authentication exports
- cookies/tokens
- private keys
- payment credentials
- security/session material
- unrestricted financial records
- unknown binary payloads

## Rollback

The raw Drive source is immutable.

All derived layers can be deleted and rebuilt:

```text
raw vault -> recovery -> extracted -> normalized -> Graphify -> Context Mesh
```

That is the rollback strategy: delete derived output, keep raw evidence unchanged, and rebuild from a pinned recovery/parser version.
