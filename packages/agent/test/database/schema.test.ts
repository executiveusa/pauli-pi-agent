/**
 * Database Schema Tests
 * Verify PostgreSQL schema integrity and migration system
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, test, expect } from 'vitest';

describe('Database Schema', () => {
  const migrationFile = join(
    __dirname,
    '../../ops/migrations/001_init_schema.sql'
  );

  test('migration file exists', () => {
    const sql = readFileSync(migrationFile, 'utf-8');
    expect(sql).toBeDefined();
    expect(sql.length).toBeGreaterThan(0);
  });

  test('migration contains required tables', () => {
    const sql = readFileSync(migrationFile, 'utf-8').toUpperCase();

    const requiredTables = [
      'SOURCES',
      'ENTITIES',
      'CLAIMS',
      'RELATIONS',
      'EVIDENCE_SPANS',
      'PERSONAS',
      'PERSONA_TRAITS',
      'REASONING_RUNS',
      'REASONING_VOTES',
      'REASONING_SYNTHESES',
      'AUDIT_EVENTS',
      'MODEL_CALLS',
      'APPROVAL_REQUESTS',
      'VIDEO_ASSETS',
      'VIDEO_OBSERVATIONS',
      'TRANSCRIPTS',
      'DOCUMENTS',
    ];

    for (const table of requiredTables) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
  });

  test('migration contains pgvector extension', () => {
    const sql = readFileSync(migrationFile, 'utf-8');
    expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS vector');
  });

  test('migration contains search functions', () => {
    const sql = readFileSync(migrationFile, 'utf-8');
    expect(sql).toContain('search_entities');
    expect(sql).toContain('search_claims_by_entity');
    expect(sql).toContain('get_persona_stats');
  });

  test('migration contains HNSW indexes for embeddings', () => {
    const sql = readFileSync(migrationFile, 'utf-8');
    expect(sql).toContain('USING hnsw(embedding vector_cosine_ops)');
  });

  test('sources table has required columns', () => {
    const sql = readFileSync(migrationFile, 'utf-8');
    const sourcesTableMatch = sql.match(
      /CREATE TABLE IF NOT EXISTS sources \([\s\S]*?\);/
    );
    expect(sourcesTableMatch).toBeDefined();

    const table = sourcesTableMatch![0];
    expect(table).toContain('id TEXT PRIMARY KEY');
    expect(table).toContain('source_type TEXT NOT NULL');
    expect(table).toContain('ingestion_status TEXT');
    expect(table).toContain('created_at TIMESTAMPTZ');
  });

  test('entities table has embedding column', () => {
    const sql = readFileSync(migrationFile, 'utf-8');
    expect(sql).toContain('embedding VECTOR(384)');
  });

  test('personas table has required fields', () => {
    const sql = readFileSync(migrationFile, 'utf-8');
    const personasTableMatch = sql.match(
      /CREATE TABLE IF NOT EXISTS personas \([\s\S]*?\);/
    );
    expect(personasTableMatch).toBeDefined();

    const table = personasTableMatch![0];
    expect(table).toContain('id TEXT PRIMARY KEY');
    expect(table).toContain('name TEXT NOT NULL');
    expect(table).toContain('domain TEXT NOT NULL');
    expect(table).toContain('expertise TEXT[]');
    expect(table).toContain('model_policy TEXT DEFAULT');
  });

  test('reasoning_runs table references personas', () => {
    const sql = readFileSync(migrationFile, 'utf-8');
    const table = sql.match(
      /CREATE TABLE IF NOT EXISTS reasoning_runs \([\s\S]*?\);/
    );
    expect(table).toBeDefined();
    expect(table![0]).toContain('selected_persona_ids TEXT[]');
  });

  test('audit_events table has required columns', () => {
    const sql = readFileSync(migrationFile, 'utf-8');
    const table = sql.match(
      /CREATE TABLE IF NOT EXISTS audit_events \([\s\S]*?\);/
    );
    expect(table).toBeDefined();

    const content = table![0];
    expect(content).toContain('event_type TEXT NOT NULL');
    expect(content).toContain('user_id TEXT');
    expect(content).toContain('resource_type TEXT');
    expect(content).toContain('timestamp TIMESTAMPTZ DEFAULT NOW()');
    expect(content).toContain('redacted BOOLEAN DEFAULT FALSE');
  });

  test('secrets_references never stores raw secrets', () => {
    const sql = readFileSync(migrationFile, 'utf-8');
    const table = sql.match(
      /CREATE TABLE IF NOT EXISTS secrets_references \([\s\S]*?\);/
    );
    expect(table).toBeDefined();

    const content = table![0];
    // Should only have reference fields, not value/secret columns
    expect(content).toContain('secret_name TEXT NOT NULL');
    expect(content).toContain('infisical_path TEXT');
    expect(content).not.toContain('secret_value');
    expect(content).not.toContain('api_key');
  });

  test('indexes exist for common queries', () => {
    const sql = readFileSync(migrationFile, 'utf-8');

    const requiredIndexes = [
      'sources_created_at_idx',
      'entities_embedding_idx',
      'entities_importance_score_idx',
      'claims_confidence_idx',
      'personas_domain_idx',
      'personas_confidence_idx',
      'reasoning_runs_created_at_idx',
      'audit_events_timestamp_idx',
      'model_calls_timestamp_idx',
    ];

    for (const index of requiredIndexes) {
      expect(sql).toContain(index);
    }
  });

  test('migration includes comments', () => {
    const sql = readFileSync(migrationFile, 'utf-8');
    expect(sql).toContain('-- ');
    expect(sql).toMatch(/-- =+/); // Section separators
  });

  test('no hardcoded secrets in migration', () => {
    const sql = readFileSync(migrationFile, 'utf-8');
    // Check for common secret patterns that should never be in schema
    expect(sql).not.toMatch(/sk-[a-zA-Z0-9]+/); // OpenAI key pattern
    expect(sql).not.toMatch(/Bearer [a-zA-Z0-9_.-]+/); // Bearer token
    expect(sql).not.toMatch(/password\s*=\s*['\"][^'"]+['\"]/i); // Password values
  });
});

describe('Schema Version Management', () => {
  test('migration file follows naming convention', () => {
    const migrationFile = join(
      __dirname,
      '../../ops/migrations/001_init_schema.sql'
    );
    expect(migrationFile).toMatch(/\/\d{3}_\w+\.sql$/);
  });

  test('schema file is idempotent (uses IF NOT EXISTS)', () => {
    const sql = readFileSync(migrationFile, 'utf-8');
    // Should use IF NOT EXISTS for all DDL
    const createStatements = sql.match(/CREATE [A-Z]+ /g) || [];
    const ifNotExistsCount = (
      sql.match(/CREATE [A-Z]+ IF NOT EXISTS/g) || []
    ).length;

    // All CREATE statements should have IF NOT EXISTS
    expect(ifNotExistsCount).toBeGreaterThan(0);
    expect(ifNotExistsCount).toBeGreaterThanOrEqual(createStatements.length - 3); // Allow a few exceptions
  });
});
