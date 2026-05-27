-- PI Agent Control Plane — Initial Schema
-- Version: 0.0.4
-- Date: 2026-05-26

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- SOURCE INGESTION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL, -- 'url', 'video', 'document', 'raw_text'
  url TEXT,
  title TEXT,
  author TEXT,
  published_date TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  ingestion_status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sources_source_type_idx ON sources(source_type);
CREATE INDEX IF NOT EXISTS sources_ingestion_status_idx ON sources(ingestion_status);
CREATE INDEX IF NOT EXISTS sources_created_at_idx ON sources(created_at DESC);

CREATE TABLE IF NOT EXISTS source_items (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  item_type TEXT, -- 'chapter', 'page', 'paragraph', 'frame', etc.
  content TEXT,
  extracted_text TEXT,
  media_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS source_items_source_id_idx ON source_items(source_id);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'success', 'failed'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  entity_count INTEGER DEFAULT 0,
  claim_count INTEGER DEFAULT 0,
  relation_count INTEGER DEFAULT 0,
  error_message TEXT,
  metadata_json JSONB
);

CREATE INDEX IF NOT EXISTS ingestion_runs_source_id_idx ON ingestion_runs(source_id);
CREATE INDEX IF NOT EXISTS ingestion_runs_status_idx ON ingestion_runs(status);

-- ============================================================================
-- VIDEO ANALYSIS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_assets (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  title TEXT,
  duration_seconds INTEGER,
  transcript TEXT,
  thumbnail_url TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS video_assets_source_id_idx ON video_assets(source_id);

CREATE TABLE IF NOT EXISTS video_observations (
  id TEXT PRIMARY KEY,
  video_asset_id TEXT NOT NULL REFERENCES video_assets(id) ON DELETE CASCADE,
  timestamp TEXT, -- '00:00:05' format
  observation_type TEXT, -- 'concept', 'entity', 'text', 'visual'
  content TEXT,
  ocr_text TEXT,
  evidence_ref_id TEXT,
  confidence FLOAT DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS video_observations_video_asset_id_idx ON video_observations(video_asset_id);

-- ============================================================================
-- TRANSCRIPT & DOCUMENT TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS transcripts (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'en',
  content TEXT NOT NULL,
  speaker_segments JSONB, -- array of {speaker, start_time, end_time, text}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transcripts_source_id_idx ON transcripts(source_id);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  doc_type TEXT, -- 'pdf', 'docx', 'xlsx', 'epub', etc.
  content TEXT,
  page_count INTEGER,
  extracted_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documents_source_id_idx ON documents(source_id);

-- ============================================================================
-- KNOWLEDGE GRAPH TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT, -- 'person', 'organization', 'concept', 'tool', 'location', etc.
  embedding VECTOR(384),
  importance_score FLOAT DEFAULT 0.5,
  evidence_ref_ids TEXT[],
  source_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS entities_name_idx ON entities(name);
CREATE INDEX IF NOT EXISTS entities_entity_type_idx ON entities(entity_type);
CREATE INDEX IF NOT EXISTS entities_embedding_idx ON entities USING hnsw(embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS entities_importance_score_idx ON entities(importance_score DESC);

CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  subject_entity_id TEXT REFERENCES entities(id) ON DELETE SET NULL,
  predicate TEXT NOT NULL,
  object_entity_id TEXT REFERENCES entities(id) ON DELETE SET NULL,
  description TEXT,
  evidence_ref_ids TEXT[],
  confidence FLOAT DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS claims_subject_entity_id_idx ON claims(subject_entity_id);
CREATE INDEX IF NOT EXISTS claims_object_entity_id_idx ON claims(object_entity_id);
CREATE INDEX IF NOT EXISTS claims_confidence_idx ON claims(confidence DESC);

CREATE TABLE IF NOT EXISTS relations (
  id TEXT PRIMARY KEY,
  source_entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL, -- 'depends_on', 'similar_to', 'causes', 'hierarchy', etc.
  target_entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  weight FLOAT DEFAULT 1.0,
  evidence_ref_ids TEXT[],
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS relations_source_entity_id_idx ON relations(source_entity_id);
CREATE INDEX IF NOT EXISTS relations_target_entity_id_idx ON relations(target_entity_id);
CREATE INDEX IF NOT EXISTS relations_relation_type_idx ON relations(relation_type);

CREATE TABLE IF NOT EXISTS evidence_spans (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  span_text TEXT NOT NULL,
  start_offset INTEGER,
  end_offset INTEGER,
  entity_ids TEXT[],
  claim_ids TEXT[],
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS evidence_spans_source_id_idx ON evidence_spans(source_id);
CREATE INDEX IF NOT EXISTS evidence_spans_entity_ids_idx ON evidence_spans USING GIN(entity_ids);

-- ============================================================================
-- PERSONA TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  expertise TEXT[],
  traits JSONB, -- array of trait objects with descriptions and evidence
  decision_rules TEXT[],
  knowledge_ref_ids TEXT[], -- entity IDs this persona knows well
  evidence_ref_ids TEXT[], -- source evidence IDs this persona was built from
  agent_prompt TEXT,
  allowed_tools TEXT[],
  model_policy TEXT DEFAULT 'free', -- 'free', 'balanced', 'premium', 'local_only'
  confidence FLOAT DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS personas_domain_idx ON personas(domain);
CREATE INDEX IF NOT EXISTS personas_confidence_idx ON personas(confidence DESC);
CREATE INDEX IF NOT EXISTS personas_created_at_idx ON personas(created_at DESC);

CREATE TABLE IF NOT EXISTS persona_traits (
  id TEXT PRIMARY KEY,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  trait_description TEXT NOT NULL,
  evidence_ref_ids TEXT[],
  confidence FLOAT DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS persona_traits_persona_id_idx ON persona_traits(persona_id);

CREATE TABLE IF NOT EXISTS persona_sources (
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  PRIMARY KEY (persona_id, source_id)
);

CREATE INDEX IF NOT EXISTS persona_sources_source_id_idx ON persona_sources(source_id);

CREATE TABLE IF NOT EXISTS persona_agent_configs (
  id TEXT PRIMARY KEY,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  system_prompt TEXT,
  tools_json JSONB, -- array of tool definitions
  model_policy TEXT DEFAULT 'free',
  parameters_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS persona_agent_configs_persona_id_idx ON persona_agent_configs(persona_id);

-- ============================================================================
-- REASONING & SYNTHESIS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS reasoning_runs (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  selected_persona_ids TEXT[],
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
  cost_estimate FLOAT DEFAULT 0.0,
  cost_actual FLOAT,
  model_routes_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reasoning_runs_status_idx ON reasoning_runs(status);
CREATE INDEX IF NOT EXISTS reasoning_runs_created_at_idx ON reasoning_runs(created_at DESC);

CREATE TABLE IF NOT EXISTS reasoning_votes (
  id TEXT PRIMARY KEY,
  reasoning_run_id TEXT NOT NULL REFERENCES reasoning_runs(id) ON DELETE CASCADE,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE SET NULL,
  response TEXT,
  confidence FLOAT DEFAULT 0.5,
  evidence_ref_ids TEXT[],
  reasoning_trace JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reasoning_votes_reasoning_run_id_idx ON reasoning_votes(reasoning_run_id);
CREATE INDEX IF NOT EXISTS reasoning_votes_persona_id_idx ON reasoning_votes(persona_id);

CREATE TABLE IF NOT EXISTS reasoning_syntheses (
  id TEXT PRIMARY KEY,
  reasoning_run_id TEXT NOT NULL REFERENCES reasoning_runs(id) ON DELETE CASCADE,
  synthesis_text TEXT,
  evidence_ref_ids TEXT[],
  disagreements_json JSONB,
  model_used TEXT,
  cost_actual FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reasoning_syntheses_reasoning_run_id_idx ON reasoning_syntheses(reasoning_run_id);

-- ============================================================================
-- FEEDBACK & AUDIT TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback_events (
  id TEXT PRIMARY KEY,
  reasoning_run_id TEXT REFERENCES reasoning_runs(id) ON DELETE SET NULL,
  feedback_type TEXT, -- 'rating', 'correction', 'preferred_answer', 'rejected_claim', 'missing_evidence'
  rating INTEGER, -- 1-5 stars
  correction_text TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_events_reasoning_run_id_idx ON feedback_events(reasoning_run_id);
CREATE INDEX IF NOT EXISTS feedback_events_user_id_idx ON feedback_events(user_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL, -- see security model doc for full list
  user_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  action TEXT,
  details_json JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  redacted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS audit_events_event_type_idx ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS audit_events_user_id_idx ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS audit_events_resource_type_resource_id_idx ON audit_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS audit_events_timestamp_idx ON audit_events(timestamp DESC);

CREATE TABLE IF NOT EXISTS model_calls (
  id TEXT PRIMARY KEY,
  reasoning_run_id TEXT REFERENCES reasoning_runs(id) ON DELETE SET NULL,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'openrouter', etc.
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_estimate FLOAT,
  cost_actual FLOAT,
  latency_ms INTEGER,
  stop_reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS model_calls_reasoning_run_id_idx ON model_calls(reasoning_run_id);
CREATE INDEX IF NOT EXISTS model_calls_provider_idx ON model_calls(provider);
CREATE INDEX IF NOT EXISTS model_calls_timestamp_idx ON model_calls(timestamp DESC);

-- ============================================================================
-- BUDGET & APPROVAL TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_budgets (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL, -- 'daily', 'monthly'
  budget_limit_usd FLOAT NOT NULL,
  spent_usd FLOAT DEFAULT 0.0,
  free_model_calls INTEGER DEFAULT 0,
  paid_model_calls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS model_budgets_period_idx ON model_budgets(period);

CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  request_type TEXT NOT NULL, -- 'expensive_model_route', 'persona_delete', 'code_deploy', etc.
  resource_id TEXT,
  requested_by TEXT NOT NULL,
  requester_context TEXT, -- why the action is needed
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  approved_by TEXT,
  approval_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS approval_requests_status_idx ON approval_requests(status);
CREATE INDEX IF NOT EXISTS approval_requests_created_at_idx ON approval_requests(created_at DESC);

-- ============================================================================
-- SECRETS REFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS secrets_references (
  id TEXT PRIMARY KEY,
  secret_name TEXT NOT NULL,
  provider TEXT,
  infisical_path TEXT,
  last_rotated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS secrets_references_secret_name_idx ON secrets_references(secret_name);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Search entities by vector similarity
CREATE OR REPLACE FUNCTION search_entities(
  query_embedding VECTOR(384),
  match_count INT DEFAULT 10
) RETURNS TABLE(id TEXT, name TEXT, entity_type TEXT, similarity FLOAT) AS $$
  SELECT id, name, entity_type, (embedding <=> query_embedding) AS similarity
  FROM entities
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE SQL;

-- Search claims by relevance
CREATE OR REPLACE FUNCTION search_claims_by_entity(
  entity_id TEXT
) RETURNS TABLE(id TEXT, subject TEXT, predicate TEXT, object TEXT, confidence FLOAT) AS $$
  SELECT
    c.id,
    se.name AS subject,
    c.predicate,
    oe.name AS object,
    c.confidence
  FROM claims c
  LEFT JOIN entities se ON c.subject_entity_id = se.id
  LEFT JOIN entities oe ON c.object_entity_id = oe.id
  WHERE c.subject_entity_id = entity_id OR c.object_entity_id = entity_id
  ORDER BY c.confidence DESC;
$$ LANGUAGE SQL;

-- Get persona expertise stats
CREATE OR REPLACE FUNCTION get_persona_stats(
  persona_id TEXT
) RETURNS TABLE(
  trait_count INT,
  evidence_count INT,
  avg_confidence FLOAT,
  knowledge_entity_count INT
) AS $$
  SELECT
    COALESCE(COUNT(DISTINCT pt.id), 0)::INT AS trait_count,
    COALESCE(ARRAY_LENGTH(p.evidence_ref_ids, 1), 0)::INT AS evidence_count,
    COALESCE(AVG(pt.confidence), 0)::FLOAT AS avg_confidence,
    COALESCE(ARRAY_LENGTH(p.knowledge_ref_ids, 1), 0)::INT AS knowledge_entity_count
  FROM personas p
  LEFT JOIN persona_traits pt ON p.id = pt.persona_id
  WHERE p.id = persona_id
  GROUP BY p.id;
$$ LANGUAGE SQL;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
