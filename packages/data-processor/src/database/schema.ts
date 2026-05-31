import type { Pool } from "pg";

/**
 * Extended PostgreSQL schema for second brain data storage
 * Integrates with existing PAULI schema and adds conversation/file tables
 */

const SCHEMA_SQL = `
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS hstore;

-- ============================================================================
-- CONVERSATION TABLES (ChatGPT/Claude exports)
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'chatgpt', 'claude'
  source_version TEXT,
  title TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  metadata_json JSONB,
  cost_estimate FLOAT DEFAULT 0.0,
  token_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_source_type_idx ON conversations(source_type);
CREATE INDEX IF NOT EXISTS conversations_imported_at_idx ON conversations(imported_at DESC);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  content_hash TEXT,
  token_count INTEGER DEFAULT 0,
  message_index INTEGER,
  parent_message_id TEXT REFERENCES conversation_messages(id) ON DELETE SET NULL,
  embedded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversation_messages_conversation_id_idx ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_messages_role_idx ON conversation_messages(role);
CREATE INDEX IF NOT EXISTS conversation_messages_embedded_at_idx ON conversation_messages(embedded_at);

-- ============================================================================
-- PERSONAL FILE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS personal_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT, -- 'pdf', 'docx', 'txt', 'md', etc.
  file_size_bytes INTEGER,
  extracted_text TEXT,
  text_hash TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  metadata_json JSONB,
  token_count INTEGER DEFAULT 0,
  embedding_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS personal_documents_user_id_idx ON personal_documents(user_id);
CREATE INDEX IF NOT EXISTS personal_documents_file_type_idx ON personal_documents(file_type);
CREATE INDEX IF NOT EXISTS personal_documents_imported_at_idx ON personal_documents(imported_at DESC);

-- ============================================================================
-- NOTION SYNC TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS notion_pages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  notion_page_id TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT,
  url TEXT,
  icon TEXT,
  cover TEXT,
  archived BOOLEAN DEFAULT FALSE,
  last_edited_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  metadata_json JSONB,
  token_count INTEGER DEFAULT 0,
  embedding_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notion_pages_user_id_idx ON notion_pages(user_id);
CREATE INDEX IF NOT EXISTS notion_pages_notion_page_id_idx ON notion_pages(notion_page_id);
CREATE INDEX IF NOT EXISTS notion_pages_last_synced_at_idx ON notion_pages(last_synced_at DESC);

-- ============================================================================
-- WORKFLOW EXECUTION TABLES (ABSURD integration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  workflow_type TEXT NOT NULL, -- 'import_chatgpt', 'import_claude', 'sync_notion', 'index_files'
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress', -- 'pending', 'in_progress', 'completed', 'failed', 'paused'
  current_step INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  input_json JSONB,
  output_json JSONB,
  error_message TEXT,
  cost_estimate FLOAT DEFAULT 0.0,
  cost_actual FLOAT,
  approval_token TEXT,
  approval_requested_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workflow_executions_task_id_idx ON workflow_executions(task_id);
CREATE INDEX IF NOT EXISTS workflow_executions_user_id_idx ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS workflow_executions_status_idx ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS workflow_executions_workflow_type_idx ON workflow_executions(workflow_type);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  input_json JSONB,
  output_json JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workflow_steps_execution_id_idx ON workflow_steps(execution_id);
CREATE INDEX IF NOT EXISTS workflow_steps_step_number_idx ON workflow_steps(step_number);

-- ============================================================================
-- APPROVAL & BUDGET GATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_approvals (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  approval_type TEXT, -- 'cost_exceeds_budget', 'high_risk_content', 'manual_review'
  cost_estimate FLOAT,
  budget_limit FLOAT,
  risk_level TEXT, -- 'low', 'medium', 'high'
  reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  approved_by TEXT,
  approval_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS import_approvals_execution_id_idx ON import_approvals(execution_id);
CREATE INDEX IF NOT EXISTS import_approvals_user_id_idx ON import_approvals(user_id);
CREATE INDEX IF NOT EXISTS import_approvals_requested_at_idx ON import_approvals(requested_at DESC);

-- ============================================================================
-- DATA INTEGRITY & DEDUPLICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_hashes (
  hash TEXT PRIMARY KEY,
  content_type TEXT, -- 'conversation_message', 'document', 'notion_page'
  source_id TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_hashes_source_id_idx ON content_hashes(source_id);

-- ============================================================================
-- CIRCUIT BREAKERS & AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_circuit_breakers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  breaker_type TEXT, -- 'cost_limit', 'rate_limit', 'duplicate_detection', 'error_threshold'
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  threshold_value TEXT,
  current_value TEXT,
  auto_resume_at TIMESTAMPTZ,
  require_manual_approval BOOLEAN DEFAULT TRUE,
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS import_circuit_breakers_user_id_idx ON import_circuit_breakers(user_id);
CREATE INDEX IF NOT EXISTS import_circuit_breakers_triggered_at_idx ON import_circuit_breakers(triggered_at DESC);

-- ============================================================================
-- LINK TABLES (Relationships)
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_entities (
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  mention_count INTEGER DEFAULT 1,
  confidence FLOAT DEFAULT 0.5,
  PRIMARY KEY (conversation_id, entity_id)
);

CREATE INDEX IF NOT EXISTS conversation_entities_entity_id_idx ON conversation_entities(entity_id);

CREATE TABLE IF NOT EXISTS document_entities (
  document_id TEXT NOT NULL REFERENCES personal_documents(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  mention_count INTEGER DEFAULT 1,
  confidence FLOAT DEFAULT 0.5,
  PRIMARY KEY (document_id, entity_id)
);

CREATE INDEX IF NOT EXISTS document_entities_entity_id_idx ON document_entities(entity_id);
`;

export async function initializeSchema(pool: Pool): Promise<void> {
	try {
		await pool.query(SCHEMA_SQL);
		console.log("[DataProcessor] Schema initialized successfully");
	} catch (error) {
		console.error("[DataProcessor] Schema initialization failed:", error);
		throw error;
	}
}
