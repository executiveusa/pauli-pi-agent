# Bambu Personal Operating Layer

Status: specification only. No production connection, publishing action, account mutation, or secret change is authorized by this document.

## Outcome

Turn this Pi fork into **Jeremy**, Bambu's private personal operating agent for Second Brain retrieval, personal administration, and approval-gated publishing.

Jeremy is a separate realm:

- **Hermes** — business/shared operating work
- **StarNet / Heisenberg** — StarNet realm
- **Pi / Jeremy** — private personal realm

Do not merge their state, credentials, or authority by default.

## Commercial purpose

Jeremy should make existing knowledge and lived experience reusable as proof, case studies, essays, relationship context, and administrative support. Public output should support qualified attention and paid work; it must not become a separate content-maintenance project.

## Approved initial source roots

Google Drive source roots approved for inventory/ingest planning:

1. `1RXPst2I_QY3btZ1CbmStDsuGKY4eTcwa` — Second Brain ChatGPT exports
2. `10l7H0layX2UL2u974CtkstF8IIYSpmPY` — Mind Mappy 2nd Brain

Known structured source material includes ChatGPT/Claude exports and a Claude data folder with `conversations.json`, `memories.json`, `projects.json`, and `users.json`.

Original exports are immutable source archives. Normalized records and graphs are derived from them; source files are never silently rewritten or deleted.

## Capability modules

### `second-brain-ingest`

- read only explicitly approved roots
- create source manifests before transformation
- retain source ID, path, modified time, content hash when available, and importer version
- support structured chat exports, documents, notes, image/media manifests, and future sources
- do not crawl unrelated Drive content

### `memory-normalizer`

Canonical node types:

`Person, Project, Organization, Place, Event, Idea, Decision, Task, Document, Media, Skill, Value, Goal, Offer`

Canonical edge types:

`knows, worked_with, created, belongs_to, occurred_at, mentioned_in, depends_on, inspired_by, decided, supports, contradicts, duplicate_of, derived_from`

Every canonical fact must preserve provenance to one or more source records.

### `memory-dedupe`

Order of operations:

1. exact-content/hash duplicates
2. normalized-key duplicates
3. identity candidates
4. semantic similarity candidates
5. conflict review

Rules:

- preserve both originals
- create a merge ledger
- distinguish `same_as`, `duplicate_of`, `conflicts_with`, and `supersedes`
- never overwrite conflicting facts without a recorded decision
- identity conflicts require owner review
- dedupe must be reversible

### `graphify-index`

Use `Graphify-Labs/graphify` as a **derived graph/query layer**, not as the canonical memory store.

Expected derived artifacts may include:

- `graphify-out/graph.json`
- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/graph.html`

Preserve Graphify's distinction between `EXTRACTED` and `INFERRED` edges. The graph must be rebuildable from canonical approved records.

### `personal-search`

Natural-language retrieval over canonical records and Graphify subgraphs. Return provenance/confidence with answers. When sources conflict or do not support a claim, surface that uncertainty instead of guessing.

### `blog-editor`

Canonical **Kenneth Bamboo** publishing states:

`idea -> draft -> source/provenance check -> owner review -> approved -> publish`

Output structured post payloads for `executiveusa/animobambu`. The public site never queries the private brain directly.

### `social-strategist`

Convert approved source material into platform-specific content packages:

- hooks
- short text posts
- carousel outlines
- vertical-video scripts
- titles/descriptions
- calls to action

Default strategy: document real work, transformations, lessons, people, and proof. Optimize first for qualified relationships and paid service demand, not vanity posting volume.

### `social-publisher`

External publishing is approval-gated. Platform OAuth remains owner-controlled and server-side. The agent must not create accounts, accept platform terms, purchase ads, spend money, or publish externally without the applicable owner authorization.

### `personal-crm`

Track people, relationships, follow-ups, gratitude, context, and collaboration history. Private relationship context must not automatically become public website copy. Public projection of another person must satisfy an explicit public-safe rule.

### `gmail-postman`

Support search, triage, context extraction, deadline detection, and drafting. Sending, destructive cleanup, unsubscribe, or irreversible external actions remain explicit-action boundaries unless a later narrow policy is approved.

### `calendar-postman`

Support agenda reading, meeting preparation, deadline extraction, and proposed scheduling. If Calendar OAuth is unavailable, report `Not connected`; never invent calendar state.

### `public-projection`

This is the only allowed bridge from private memory to public site/social output.

Each projection should include:

- canonical record/source IDs
- provenance
- sensitivity class
- approved public fields
- owner approval state
- destination(s)
- publication receipt/status

Default is deny.

### `privacy-guardian`

Deny-by-default protection for:

- credentials/tokens
- private third-party correspondence
- personal identifiers that are not approved for publication
- health/medical information
- sensitive financial/legal/private records

Sensitive content must not be written into public prompts, client-side bundles, public graph artifacts, or social drafts unless explicitly approved for that exact destination.

### `legacy-archive`

Maintain immutable source manifests, export versions, checksums, provenance, and restore instructions so the long-term Bambu archive can be reconstructed independently of any one model/provider.

## Second Brain Crew reuse

Reuse `executiveusa/pauli-my-Brain-Is-Full-Crew` instead of re-implementing its ten-agent behavior inside Pi.

Mapping:

- Architect -> structure
- Scribe -> capture
- Sorter -> inbox filing
- Seeker -> retrieval
- Connector -> graph/linking
- Librarian -> maintenance/deduplication
- Transcriber -> media/meeting ingest
- Postman -> Gmail/Calendar

Food Coach and Wellness Guide remain opt-in advisory capabilities. They are not autonomous medical decision makers. Health information is excluded from public projection by default.

## Command Center service contract

Jeremy should expose a private replaceable service interface for the Pi realm. Initial HTTP/JSON operations should cover:

- `GET /health` or equivalent truthful status
- task/chat dispatch
- approvals/conflicts
- brain search with provenance
- publishing queue
- connector truth state

Keep domain logic provider-agnostic so CLI/MCP/RPC adapters can be added without rewriting the memory or publishing model.

## Security contract

- secrets come only from environment/secret broker
- never commit OAuth/API secrets
- no raw Google/social credentials in browser responses or durable memory
- no Drive-wide crawl beyond approved roots
- no silent destructive dedupe
- no automatic public projection
- no synthetic `connected`, `published`, `sent`, `scheduled`, `healthy`, or `completed` states
- public site cannot directly call private brain or Pi administration endpoints

## First verifiable slice

Do not implement every capability simultaneously.

1. create source manifests for the two approved Drive roots
2. normalize a small non-sensitive fixture set
3. produce reversible duplicate candidates + merge ledger
4. build a Graphify-derived graph from that normalized fixture
5. query the graph through a private Pi service endpoint with provenance
6. expose truthful Pi status to Command Center

Only after this path is proven should live Gmail/Calendar and external publishing actions be enabled.

## Proof required before claiming completion

- relevant Pi package READMEs and extension conventions inspected
- personal capabilities isolated from upstream Pi core where practical
- source manifest test proves approved-root scoping
- canonical schema/provenance tests pass
- dedupe test preserves originals and records merge decisions
- Graphify graph is reproducible from normalized fixture data
- private search returns provenance
- public-projection tests reject private/sensitive fixtures by default
- connector state reports real availability only
- publishing pipeline stops at owner approval before external writes
- existing Pi checks remain green
- rollback path removes the personal adapter without corrupting source archives
