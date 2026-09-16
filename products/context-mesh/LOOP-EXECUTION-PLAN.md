# Context Mesh — Loop Engineering Production Plan

## Mission

Turn the real Second Brain archive into a continuously updated, provenance-backed context graph that Pi, Claude Code, Cosmos, StarNet, BARS, Agent Max, Fanni, Codex, Cursor, and any MCP-capable agent can call through one stable Context Mesh contract.

This plan uses Loop Engineering: every phase is a closed feedback loop with an explicit target, proof artifact, judge gate, retry path, and exit condition. No phase is considered complete because an agent says it is complete.

## Definition of done

The system is done when all of the following are true:

1. Every approved Second Brain source file has a manifest entry and ingestion status.
2. Every approved ChatGPT conversation archive part is extracted and normalized without duplicates.
3. Authentication, secret, payment-credential, cookie, token, and other denied classes are excluded by policy and test.
4. The normalized corpus is mapped into a structural knowledge graph with source provenance.
5. Temporal decisions/events are represented chronologically so newer facts can supersede older ones without deleting history.
6. Google Drive, GitHub, and Gmail have incremental sync paths with checkpoints and idempotency.
7. Context Mesh exposes one stable MCP API for local and remote agents.
8. Pi and Claude Code both answer the same real historical questions from the same brain.
9. Important answers can return source evidence.
10. A visual admin/graph console shows sources, entities, relationships, sync health, ingestion failures, and provenance.
11. The hosted/self-hosted MCP endpoint is authenticated, tenant-aware, observable, backed up, and recoverable.
12. The Claude Code plugin passes install/query/remember tests and is packaged for marketplace release.
13. A clean install can be given to a new customer without access to Pauli-specific private data.
14. The product has Community, Sovereign, and Cloud deployment paths.
15. A release receipt records versions, tests, deployment IDs, rollback instructions, and known limitations.

---

# The Loop Engineering law

Every phase runs this loop:

```text
OBSERVE
  ↓
DEFINE TARGET
  ↓
PLAN SMALLEST SAFE SLICE
  ↓
EXECUTE
  ↓
MEASURE
  ↓
PROVE
  ↓
JUDGE
  ├── FAIL → diagnose → patch → rerun
  ├── PARTIAL → continue loop
  └── PASS → freeze receipt → advance
```

## Loop rules

- Builders do not self-approve.
- No receipt = not done.
- Every batch is restartable.
- Every importer is idempotent.
- Raw evidence is never destructively rewritten by normalization.
- One home per fact; derived indexes can be rebuilt.
- New decisions supersede old ones by time, not deletion.
- A failed item goes to quarantine and the rest of the batch continues.
- Secrets are denied before semantic extraction, not after.
- The MCP contract remains stable while storage implementations evolve underneath it.
- Production changes require a rollback path.

---

# Target architecture

```text
                         SOURCE PLANE

 Google Drive          GitHub            Gmail          Agent Events
     │                    │                 │                 │
     └──────────────┬─────┴──────────┬──────┴─────────────────┘
                    ↓                ↓
              SOURCE MANIFEST + POLICY GATE
                    ↓
                  RAW VAULT
              Drive + object mirror
                    ↓
               ICM NORMALIZER
                    ↓
       ┌────────────┴────────────┐
       ↓                         ↓
 STRUCTURAL GRAPH          TEMPORAL CONTEXT
    Graphify              event/entity timeline
       │                         │
       └────────────┬────────────┘
                    ↓
              CONTEXT MESH CORE
                    ↓
         query planner/context builder
                    ↓
              MCP / HTTP GATEWAY
                    ↓
   ┌────────┬────────┬────────┬────────┬────────┐
 Claude    Pi      Cosmos   StarNet   Codex    others
```

## Storage responsibilities

```text
Raw immutable evidence       Google Drive + sovereign object mirror
Human-readable organization  ICM Markdown/YAML + generated manifests
Structural relationships     Graphify graph / graph backend adapter
Temporal memory              temporal event/entity store
Audit/checkpoints             Postgres/Supabase metadata tables
Agent access                  Context Mesh MCP + authenticated HTTP transport
```

Google Drive remains a source/archive. It is not the live query database.

---

# PHASE 0 — Truth ledger and corpus manifest

## Target

Know exactly what exists before extraction.

## Build

Create a manifest database/table with one row per source object:

- source_id
- provider
- provider_file_id
- path/name
- mime type
- byte size
- modified time
- checksum when available
- classification
- allowed/denied/quarantined
- extraction status
- normalization status
- graph status
- last synced revision
- source URI
- error/retry count

## Drive baseline

The current Second Brain folder visibly contains:

- 19 numbered ChatGPT conversation ZIP parts
- 15 additional ZIP chunks
- OpenAI transfer notebook/test artifacts
- authentication export data
- payment/invoice export data

The manifest must enumerate all of it rather than rely on filenames or memory.

## Policy gate

### Allow first

- ChatGPT conversations
- project plans
- architecture docs
- meeting/transcript content
- project files
- verified decisions
- task/handoff documents
- repo documentation

### Deny by default

- authentication exports
- API keys
- access/refresh tokens
- cookies/session material
- private keys
- password manager exports
- payment credentials
- raw secret-bearing configuration

Financial records that are later needed should use a separate governed domain, not the general shared brain.

## Proof

- manifest row count
- total approved bytes
- total denied bytes
- zero unclassified objects
- checksum/size receipt where possible

## Exit gate

`unclassified_count == 0`

---

# PHASE 1 — Safe archive extraction

## Target

Extract every approved archive without losing provenance or allowing a single corrupt archive to stop the run.

## Build

Run archive batches into a sovereign staging area, not directly into the final ICM tree.

Each extracted object gets:

- original archive ID
- archive part number
- internal path
- source hash
- extracted hash
- extraction timestamp

Detect:

- duplicate files
- split archive overlap
- corrupt archives
- unexpected binaries
- oversized single files
- encrypted/password-protected content

Quarantine failures and continue.

## Loop batch size

Start with one archive part, validate schema, then 3, then 5, then full parallel batches. Increase concurrency only after memory/disk/IO measurements prove it is safe.

## Proof

For each archive:

```text
SOURCE FILE
→ source bytes/hash
→ extracted object count
→ extracted bytes
→ errors
→ duplicates
→ receipt
```

## Exit gate

Every approved archive is one of:

- EXTRACTED
- VERIFIED DUPLICATE
- QUARANTINED WITH REASON

Nothing remains UNKNOWN.

---

# PHASE 2 — ChatGPT conversation normalization

## Target

Transform raw export structures into stable conversation/event records without destroying the original export.

## Canonical objects

```text
Conversation
Message
Attachment
Project
Person
Agent
Decision
Task
Event
Source
```

A normalized message should retain:

- conversation ID
- message ID
- parent/branch relationship where present
- author role
- timestamp
- content type
- text/media references
- source archive
- original source locator

Do not flatten away conversation branches if they are available.

## ICM output

Create generated manifests and compact human-readable project/person/agent routing documents, not one giant Markdown dump.

## Entity resolution

Resolve aliases deliberately:

- project aliases
- agent aliases
- repository aliases
- client/person aliases

Do not merge uncertain identities automatically. Mark ambiguity and require confidence/proof.

## Deduplication

Use stable IDs/hashes first. Semantic similarity is advisory, not authority for destructive deduplication.

## Proof

- conversation count
- message count
- attachment count
- duplicate count
- unresolved identity count
- source coverage percentage
- sample round-trip: normalized object → exact original source

## Exit gate

100% of approved conversation objects are normalized or quarantined with a reason.

---

# PHASE 3 — Structural graph build with Graphify

## Target

Create the complete structural map of approved normalized knowledge.

## Build

Run Graphify against the normalized ICM corpus, not the raw secret-bearing Drive folder.

Use incremental graph builds and preserve:

- EXTRACTED vs INFERRED relationship status
- source file
- source object ID
- communities
- entity types
- relationship type

Graph domains initially:

```text
people
agents
projects
repositories
organizations
clients
decisions
tasks
skills
tools
services
deployments
domains
documents
conversations
events
sources
```

## Validation questions

The judge suite must include real multi-hop questions such as:

- Which projects used Rime voice and which agent owned each one?
- What decisions changed DOS2A email delivery over time?
- What repositories implement the StarNet/City Core system?
- Which projects reference Graphify or ICM?
- What work remains unfinished for Buffer Blaster and what evidence supports it?

## Proof

- node count
- edge count
- source coverage
- orphan rate
- ambiguous entities
- graph build receipt
- graph query test results

## Exit gate

All approved normalized sources are represented or have an explicit exclusion reason, and the graph passes the benchmark query suite.

---

# PHASE 4 — Temporal context graph

## Target

Move beyond a static structural graph so agents understand what was true, when it changed, and what superseded it.

## Model

Represent facts/relationships with temporal metadata:

```text
valid_from
valid_until
event_time
ingested_at
supersedes
superseded_by
source_id
confidence
provenance
```

Memory classes:

- M0 Identity
- M1 Entities
- M2 Decisions
- M3 Events
- M4 Sources

## Implementation boundary

Do not couple agents directly to Graphiti, Neo4j, FalkorDB, or another graph engine. Implement a `TemporalStore` adapter under Context Mesh.

Candidate backends can be benchmarked behind the adapter. The winning backend must pass functional, licensing, operational, backup, and latency gates before becoming production default.

## Proof

Temporal tests must prove that the system can answer:

- what is true now
- what used to be true
- when it changed
- which source caused the change
- what decision superseded another decision

## Exit gate

Temporal benchmark suite passes and no historical fact must be destroyed to represent a newer fact.

---

# PHASE 5 — Google Drive incremental sync

## Target

After the bulk import, new/changed Drive content enters the brain without rebuilding the world.

## Sync loop

```text
LIST/CHANGE DETECT
→ compare provider ID + revision/modified time
→ policy classify
→ fetch changed object
→ normalize
→ graph update
→ temporal update
→ checkpoint
→ receipt
```

Requirements:

- incremental checkpoints
- idempotency
- retries with exponential backoff
- deletion/tombstone policy
- rename/move detection
- no secret ingestion
- per-file error quarantine

## Proof

Create/update/rename one approved test file and prove the same entity/source change becomes queryable without a full rebuild.

## Exit gate

Drive delta test passes repeatedly with no duplicate nodes/events.

---

# PHASE 6 — GitHub live sync

## Target

Repositories, commits, PRs, issues, releases, and relevant docs become first-class project evidence.

## Ingest

- repositories
- default branches
- commit identifiers
- PR state and merge events
- issues/status where useful
- README/architecture/docs
- deployment references

Do not graph every dependency update as high-value memory. Use policy/ranking so operational noise does not dominate the brain.

## Proof

Merge/change a controlled test artifact and prove Context Mesh can answer what changed and point to the GitHub evidence.

## Exit gate

Incremental GitHub sync passes with deterministic source IDs and no duplicate facts.

---

# PHASE 7 — Gmail live sync

## Target

Selected operational email becomes evidence without turning the brain into an unrestricted mailbox dump.

## Policy

Use explicit label/query allowlists, for example project/client communication labels. Exclude authentication, password reset, banking/security, and other sensitive classes by default.

## Normalize

```text
Thread
Message
Sender
Recipients
Subject
Timestamp
Project/Client links
Attachment references
Source locator
```

## Proof

A controlled labeled thread becomes queryable and traceable to Gmail; an excluded authentication/security message must fail ingestion policy.

## Exit gate

Positive and negative policy tests both pass.

---

# PHASE 8 — Context Mesh query planner and agent contract

## Target

Agents call one brain instead of knowing storage internals.

## Stable tools

```text
brain_status
brain_search
brain_context
brain_entity
brain_path
brain_sources
brain_recent
brain_remember
```

Add production tools only when required, such as:

```text
brain_timeline
brain_decisions
brain_sync_status
brain_health
```

## Context assembly policy

Default:

1. resolve intent/entities
2. query structural graph
3. query temporal state
4. rank by provenance/authority/recency/relevance
5. assemble compact context
6. provide source references
7. expand only if needed

Do not fall back to unrestricted raw archive scanning unless indexed context fails.

## Proof

Pi and Claude must answer the same benchmark suite from the same Context Mesh service with materially consistent facts and source paths.

## Exit gate

Cross-agent benchmark passes.

---

# PHASE 9 — Hosted MCP/HTTP gateway

## Target

Any authorized agent can call the brain remotely.

## Requirements

- MCP transport supported by target clients
- authenticated API/HTTP transport where needed
- workspace/tenant isolation
- scoped agent tokens
- rate limits
- audit logs
- TLS
- health/readiness endpoints
- metrics/tracing
- backup/restore
- revocation

The sovereign edition runs on customer-owned infrastructure. Cloud runs the same contract as a managed service.

## Proof

A remote Pi/Claude instance with a scoped credential can query allowed workspace data and cannot query another workspace.

## Exit gate

Auth, isolation, latency, failure, and restore tests pass.

---

# PHASE 10 — Admin / graph UI

## Target

Make the system understandable without exposing implementation complexity.

## Main screens

### Brain

- sources connected
- last sync
- entities
- relationships
- decisions/events
- graph health

### Sources

- Drive
- GitHub
- Gmail
- imports
- allowed/denied/quarantined state

### Explore

- entity search
- graph neighborhood
- path between entities
- timeline
- source/provenance drawer

### Agents

- connected agent/client
- permissions
- last query
- status

### Operations

- failed ingestion
- retries
- checkpoints
- backup state
- graph build version

The UI should expose complexity progressively; it should not become a graph-database admin tool for ordinary users.

## Proof

A nontechnical user can connect a source, see sync status, search an entity, inspect its timeline, and open provenance without documentation.

## Exit gate

Usability walkthrough and mobile QA pass.

---

# PHASE 11 — Claude Code plugin productionization

## Target

Install Context Mesh into Claude Code as a real product, not a repo-local experiment.

## Work

- finalize plugin manifest
- installer/bootstrap command
- health check
- configuration wizard
- local vs hosted endpoint selection
- brain skill
- remember skill
- source/provenance behavior
- update/uninstall path
- version compatibility matrix
- marketplace docs/assets

## Proof

Fresh machine/profile test:

```text
install plugin
→ configure Context Mesh
→ brain_status
→ ask benchmark question
→ brain_sources
→ brain_remember controlled event
→ restart Claude
→ event remains available
```

## Exit gate

Fresh-install test passes from documented instructions.

---

# PHASE 12 — Sellable production release

## Editions

### Community

- local Graphify graph
- local temporal/event store
- local MCP
- Claude Code plugin
- generic MCP support
- ICM templates

### Sovereign

- one-command/container installation
- persistent temporal/structural graph backend
- Drive/GitHub/Gmail ingestion
- admin console
- authenticated MCP endpoint
- backups
- audit/provenance
- customer-owned data/infrastructure

### Cloud

- managed workspaces
- hosted MCP endpoint
- sync workers
- team controls
- managed backups
- usage/billing

## Customer isolation

Pauli's private Second Brain is the dogfood tenant, never the product template. The distributable package contains schemas, policies, examples, migration/installer code, and synthetic demo data only.

## Release proof

Every release produces:

```text
version
commit SHA
container/package digest
deployment ID
schema version
migration status
unit/integration/e2e results
benchmark results
backup test
restore test
known limitations
rollback command/path
```

## Exit gate

A clean customer workspace can be installed, ingest an approved sample corpus, connect Claude/Pi, answer benchmark questions with provenance, survive restart, sync a changed source, and restore from backup.

---

# The autonomous outer loop

Once the pipeline exists, the factory should run this continuously:

```text
while system != DONE:
    observe_truth_ledger()
    select_highest_blocking_failed_gate()
    reproduce_failure()
    design_smallest_patch()
    execute_patch()
    run_targeted_tests()
    run_integration_tests()
    run_benchmark_queries()
    judge_against_definition_of_done()
    write_receipt()

    if regression:
        rollback()
    elif gate_passed:
        advance_gate()
    else:
        continue_loop()
```

## Stop conditions

The loop stops only when:

- all DoD gates pass, or
- a real owner gate is reached: credentials, paid service/spend, legal/commercial approval, destructive action, public release, or irreversible external change.

It must not stop for:

- one bad archive
- one failed extraction
- one malformed conversation
- one unreachable optional source
- one test failure it can diagnose and repair

Those go through retry/quarantine/patch loops.

---

# First executable slice

Do not attempt all phases at once.

The first slice is:

```text
Drive corpus manifest
→ security classification
→ extract ONE ChatGPT archive
→ normalize conversations/messages
→ Graphify normalized sample
→ start Context Mesh MCP
→ Pi query
→ Claude query
→ provenance proof
```

Then expand:

```text
1 archive → 3 → 5 → all 19 numbered parts → remaining approved ZIPs
```

This proves the complete vertical architecture before spending resources graphing the full archive.

## First benchmark question

> Find every project where Rime voice was discussed, show the agent/project relationships, order the relevant decisions chronologically, and identify the source evidence for each material claim.

Expected proof:

- Pi answer
- Claude answer
- matching core facts
- graph paths
- temporal ordering
- provenance pointers
- no raw full-archive scan during the query

---

# Priority order

1. Corpus manifest + security gate
2. Safe extraction
3. ChatGPT normalization
4. Structural graph
5. Context Mesh query proof from Pi + Claude
6. Full approved archive ingestion
7. Temporal graph adapter
8. Drive incremental sync
9. GitHub incremental sync
10. Gmail policy-scoped sync
11. Hosted MCP/auth
12. Admin UI
13. Claude marketplace packaging
14. Sovereign installer
15. Cloud tenant/billing layer
16. Production sellable release

The key rule is that the full archive is not allowed to become a multi-day blind batch job. The system proves one vertical slice, then scales the exact same loop with receipts and checkpoints until approved corpus coverage reaches 100%.
