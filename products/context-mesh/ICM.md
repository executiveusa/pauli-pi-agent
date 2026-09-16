# Context Mesh ICM Architecture

## Intent

Organize the Second Brain so humans and agents can find the right context without duplicating facts or loading entire archives.

## Canonical layout

```text
second-brain/
├── AGENTS.md
├── CONTEXT.md
├── _system/
│   ├── schema.md
│   ├── ontology.md
│   ├── governance.md
│   └── ingestion-policy.md
├── people/
├── organizations/
├── projects/
├── agents/
├── decisions/
├── events/
├── knowledge/
├── skills/
├── sources/
│   ├── drive/
│   ├── github/
│   ├── gmail/
│   └── chatgpt/
└── _archive/
```

## One home per fact

- project identity belongs under `projects/`
- person identity belongs under `people/`
- decisions belong under `decisions/`
- event history belongs under `events/`
- source manifests belong under `sources/`
- generated graph/index output does not become a second manually maintained source of truth

## Routing files

`AGENTS.md` and `CONTEXT.md` must remain small. They explain where context lives and how agents retrieve it; they should not become encyclopedias.

## Ingestion classes

### Allow by default

- conversations
- project plans
- repo documentation
- tasks and handoffs
- verified decisions
- architecture documents
- meeting/transcript content

### Deny by default

- credentials
- API keys
- session cookies
- authentication exports
- private keys
- payment credentials
- password manager exports
- unrestricted financial/security records

## Data planes

```text
RAW EVIDENCE      Google Drive / object storage
NORMALIZED ICM    Markdown + YAML manifests
STRUCTURAL GRAPH  Graphify graph
TEMPORAL MEMORY   append-only events now; graph backend next
AGENT ACCESS      MCP
```

## Query policy

1. Ask Context Mesh for a compact context pack.
2. Expand to entity/path/source tools only as needed.
3. Follow provenance to original source systems for high-impact proof.
4. Do not scan raw archives unless indexed context is insufficient.

## Update policy

- Structural source changes rebuild/update Graphify.
- Operational facts are appended as events.
- New facts supersede older facts by chronology rather than destructive overwrite.
- Derived summaries may be regenerated; raw evidence should remain immutable where practical.
