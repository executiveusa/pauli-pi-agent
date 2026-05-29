/**
 * Database Module
 * Centralized exports for database types and migration utilities
 */

export interface PostgresClient {
	query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

export {
	type MigrationResult,
	MigrationRunner,
	runMigrations,
} from "./migrations.js";
export * from "./types.js";
