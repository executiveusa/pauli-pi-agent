# @mariozechner/pi-data-processor

Durable data processing pipeline for PAULI's second brain using ABSURD (Absolutely no Stupid Redundancy, Durability).

## Features

- **Durable Imports**: ChatGPT, Claude, Notion, and file ingestion with checkpoint recovery
- **Exactly-Once Semantics**: No duplicate entities, embeddings, or evidence spans
- **Resumable Workflows**: Long-running imports can pause and resume without data loss
- **Audit Trail**: Every step immutably logged with input/output snapshots
- **Budget Gates**: Cost tracking and approval enforcement
- **Circuit Breakers**: Automatic pause on errors, explicit approval required to resume

## Workflows

### ChatGPT Import
Parses OpenAI conversation export JSONs and indexes them:
1. Parse and validate JSON
2. Extract conversations, messages, metadata
3. Create semantic embeddings
4. Link evidence spans back to source
5. Update Notion index (optional)

### Claude Import
Parses Anthropic conversation exports:
1. Parse Claude JSON format
2. Extract personas and reasoning patterns
3. Build entity graph from Q&A pairs
4. Create embeddings
5. Link evidence

### Notion Sync
Pulls your Notion workspace and indexes pages:
1. Authenticate with Notion API
2. Fetch all pages in database(s)
3. Extract text and structured data
4. Create embeddings
5. Track changes for incremental sync

### File Indexer
Indexes personal files (PDFs, docs, notes):
1. Scan filesystem or cloud storage
2. Extract text from documents
3. Parse metadata (author, date, title)
4. Create embeddings
5. Link to entities mentioned in files

## Installation

```bash
npm install @mariozechner/pi-data-processor
```

## Quick Start

```typescript
import { DataProcessor } from '@mariozechner/pi-data-processor';

const processor = new DataProcessor({
  databaseUrl: process.env.DATABASE_URL,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

// Queue a ChatGPT import
await processor.queueWorkflow('import_chatgpt', {
  file: chatgptExportBuffer,
  userId: 'user123',
  approvalRequired: false,
});

// Monitor progress
const status = await processor.getWorkflowStatus('import_chatgpt_task_id');
console.log(status);
// {
//   taskId: 'import_chatgpt_task_id',
//   status: 'in_progress',
//   currentStep: 2,
//   steps: [
//     { name: 'parse_export', status: 'completed', ... },
//     { name: 'extract_entities', status: 'in_progress', ... }
//   ]
// }
```

## Architecture

```
Data Source (ChatGPT/Claude/Notion/Files)
    ↓
ABSURD Workflow (Durable steps with checkpoints)
    ├─ Parse & Validate
    ├─ Extract Entities & Claims
    ├─ Create Embeddings (Anthropic)
    ├─ Link Evidence Spans
    └─ Update Notion (optional)
    ↓
PostgreSQL (Immutable events + evidence)
    ├─ conversations
    ├─ personal_documents
    ├─ entities, claims, relations
    └─ evidence_spans
    ↓
Query Layer (Vector search, reasoning)
```

## License

MIT
