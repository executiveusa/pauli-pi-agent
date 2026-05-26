/**
 * Database Migration Runner
 * Applies and manages PostgreSQL migrations
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { Pool } from 'pg';

export interface MigrationResult {
  name: string;
  applied: boolean;
  error?: string;
  duration_ms: number;
}

export class MigrationRunner {
  private migrationsDir: string;

  constructor(migrationsDir: string = join(__dirname, '../ops/migrations')) {
    this.migrationsDir = migrationsDir;
  }

  /**
   * Get all migration files sorted by version
   */
  private getMigrationFiles(): string[] {
    try {
      return readdirSync(this.migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
    } catch (error) {
      console.error('Failed to read migrations directory:', error);
      return [];
    }
  }

  /**
   * Apply all pending migrations
   */
  async applyMigrations(pool: Pool): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    // Create migrations tracking table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const files = this.getMigrationFiles();

    for (const file of files) {
      const startTime = Date.now();

      try {
        // Check if migration already applied
        const { rows } = await pool.query(
          'SELECT name FROM _migrations WHERE name = $1',
          [file]
        );

        if (rows.length > 0) {
          results.push({
            name: file,
            applied: false, // Already applied, not newly applied
            duration_ms: 0,
          });
          continue;
        }

        // Read and apply migration
        const filePath = join(this.migrationsDir, file);
        const sql = readFileSync(filePath, 'utf-8');

        // Apply migration in transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query(
            'INSERT INTO _migrations (name) VALUES ($1)',
            [file]
          );
          await client.query('COMMIT');

          const duration = Date.now() - startTime;
          results.push({
            name: file,
            applied: true,
            duration_ms: duration,
          });

          console.log(`✓ Applied migration: ${file} (${duration}ms)`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        results.push({
          name: file,
          applied: false,
          error: errorMessage,
          duration_ms: duration,
        });

        console.error(`✗ Failed to apply migration: ${file}`);
        console.error(errorMessage);
      }
    }

    return results;
  }

  /**
   * Get list of applied migrations
   */
  async getAppliedMigrations(pool: Pool): Promise<string[]> {
    try {
      const { rows } = await pool.query(
        'SELECT name FROM _migrations ORDER BY applied_at'
      );
      return rows.map(r => r.name);
    } catch {
      return [];
    }
  }

  /**
   * Check migration status
   */
  async getMigrationStatus(pool: Pool): Promise<{
    appliedCount: number;
    totalCount: number;
    pending: string[];
  }> {
    const applied = await this.getAppliedMigrations(pool);
    const allFiles = this.getMigrationFiles();
    const pending = allFiles.filter(f => !applied.includes(f));

    return {
      appliedCount: applied.length,
      totalCount: allFiles.length,
      pending,
    };
  }
}

export async function runMigrations(pool: Pool): Promise<boolean> {
  console.log('Running database migrations...');

  const runner = new MigrationRunner();
  const results = await runner.applyMigrations(pool);

  let success = true;
  let appliedCount = 0;

  for (const result of results) {
    if (result.error) {
      success = false;
      console.error(`Migration ${result.name} failed: ${result.error}`);
    } else if (result.applied) {
      appliedCount++;
    }
  }

  if (appliedCount > 0) {
    console.log(`Applied ${appliedCount} new migration(s)`);
  }

  if (success) {
    console.log('✓ All migrations completed successfully');
  } else {
    console.error('✗ Some migrations failed');
  }

  return success;
}
