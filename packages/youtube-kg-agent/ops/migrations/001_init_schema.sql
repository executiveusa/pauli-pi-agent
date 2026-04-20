-- YouTube Knowledge Graph Agent — Initial Schema
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS youtube_videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  channel_name TEXT,
  published_at TIMESTAMPTZ,
  watched_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  embedding VECTOR(1024),
  topic_category TEXT,
  importance_score FLOAT DEFAULT 0.5,
  prerequisite_for TEXT[],
  related_videos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  watched_count INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS youtube_videos_embedding_idx
  ON youtube_videos USING hnsw(embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS knowledge_concepts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  embedding VECTOR(1024),
  importance_score FLOAT DEFAULT 0.5,
  parent_concepts TEXT[],
  child_concepts TEXT[],
  video_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS knowledge_concepts_embedding_idx
  ON knowledge_concepts USING hnsw(embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS conversation_history (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_message TEXT,
  assistant_response TEXT,
  relevant_video_ids TEXT[],
  concept_ids TEXT[],
  citation_accuracy FLOAT,
  user_rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversation_history_session_idx
  ON conversation_history(session_id);

CREATE OR REPLACE FUNCTION search_youtube_videos(
  query_embedding VECTOR(1024),
  match_count INT DEFAULT 10
) RETURNS TABLE(id TEXT, title TEXT, similarity FLOAT) AS $$
  SELECT id, title, (embedding <=> query_embedding) AS similarity
  FROM youtube_videos
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE SQL;
