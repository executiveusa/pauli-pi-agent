/**
 * Budget Tracking and Enforcement
 * Tracks user spending and enforces budget limits
 */

import type { PostgresClient } from "../database/index.js";

export interface BudgetStatus {
	userId: string;
	monthlyLimit: number;
	spent: number;
	remaining: number;
	percentageUsed: number;
	resetDate: Date;
}

export interface CostEvent {
	userId: string;
	provider: string;
	modelId: string;
	inputTokens: number;
	outputTokens: number;
	cost: number;
	timestamp: Date;
}

export class BudgetTracker {
	private db: PostgresClient;
	private cache: Map<string, BudgetStatus> = new Map();
	private cacheExpiry: Map<string, number> = new Map();
	private readonly CACHE_TTL = 60000; // 1 minute

	constructor(db: PostgresClient) {
		this.db = db;
	}

	async getBudgetStatus(userId: string): Promise<BudgetStatus> {
		// Check cache
		const cached = this.cache.get(userId);
		const expiry = this.cacheExpiry.get(userId) || 0;
		if (cached && Date.now() < expiry) {
			return cached;
		}

		// Query database
		const result = await this.db.query(
			`SELECT
       COALESCE(monthly_limit, 100) as monthly_limit,
       COALESCE(SUM(cost), 0) as spent
     FROM personas
     LEFT JOIN model_calls ON personas.id = model_calls.user_id
     WHERE personas.id = $1
     AND model_calls.created_at > NOW() - INTERVAL '30 days'
     GROUP BY personas.id, personas.monthly_limit`,
			[userId],
		);

		let status: BudgetStatus;
		if (result.rows.length > 0) {
			const row = result.rows[0];
			status = {
				userId,
				monthlyLimit: parseFloat(row.monthly_limit),
				spent: parseFloat(row.spent),
				remaining: parseFloat(row.monthly_limit) - parseFloat(row.spent),
				percentageUsed: (parseFloat(row.spent) / parseFloat(row.monthly_limit)) * 100,
				resetDate: this.getNextResetDate(),
			};
		} else {
			status = {
				userId,
				monthlyLimit: 100,
				spent: 0,
				remaining: 100,
				percentageUsed: 0,
				resetDate: this.getNextResetDate(),
			};
		}

		// Cache result
		this.cache.set(userId, status);
		this.cacheExpiry.set(userId, Date.now() + this.CACHE_TTL);

		return status;
	}

	async recordCost(event: CostEvent): Promise<void> {
		const totalCost = event.cost;

		await this.db.query(
			`INSERT INTO model_calls
       (user_id, provider, model_id, input_tokens, output_tokens, cost, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
			[event.userId, event.provider, event.modelId, event.inputTokens, event.outputTokens, totalCost],
		);

		// Invalidate cache
		this.cache.delete(event.userId);
		this.cacheExpiry.delete(event.userId);
	}

	async isWithinBudget(userId: string, estimatedCost: number): Promise<boolean> {
		const status = await this.getBudgetStatus(userId);
		return status.remaining > estimatedCost;
	}

	async checkBudgetAlert(userId: string): Promise<{
		alert: boolean;
		level: "warning" | "critical" | "none";
		message: string;
	}> {
		const status = await this.getBudgetStatus(userId);

		if (status.percentageUsed >= 100) {
			return {
				alert: true,
				level: "critical",
				message: `Budget limit of $${status.monthlyLimit} exceeded`,
			};
		}

		if (status.percentageUsed >= 90) {
			return {
				alert: true,
				level: "warning",
				message: `Budget at ${status.percentageUsed.toFixed(0)}% - $${status.remaining.toFixed(2)} remaining`,
			};
		}

		if (status.percentageUsed >= 75) {
			return {
				alert: true,
				level: "warning",
				message: `Budget at ${status.percentageUsed.toFixed(0)}% - $${status.remaining.toFixed(2)} remaining`,
			};
		}

		return {
			alert: false,
			level: "none",
			message: "Budget is healthy",
		};
	}

	async setBudgetLimit(userId: string, limit: number): Promise<void> {
		if (limit <= 0) {
			throw new Error("Budget limit must be greater than 0");
		}

		await this.db.query(`UPDATE personas SET monthly_limit = $1 WHERE id = $2`, [limit, userId]);

		// Invalidate cache
		this.cache.delete(userId);
		this.cacheExpiry.delete(userId);
	}

	async getSpendingHistory(userId: string, days: number = 30): Promise<CostEvent[]> {
		const result = await this.db.query(
			`SELECT user_id, provider, model_id, input_tokens, output_tokens, cost, created_at
     FROM model_calls
     WHERE user_id = $1
     AND created_at > NOW() - INTERVAL '${days} days'
     ORDER BY created_at DESC`,
			[userId],
		);

		return result.rows.map((row: Record<string, unknown>) => ({
			userId: row.user_id as string,
			provider: row.provider as string,
			modelId: row.model_id as string,
			inputTokens: parseInt(row.input_tokens as string),
			outputTokens: parseInt(row.output_tokens as string),
			cost: parseFloat(row.cost as string),
			timestamp: new Date(row.created_at as string),
		}));
	}

	async getTotalSpentThisMonth(userId: string): Promise<number> {
		const result = await this.db.query(
			`SELECT COALESCE(SUM(cost), 0) as total
     FROM model_calls
     WHERE user_id = $1
     AND created_at > NOW() - INTERVAL '30 days'`,
			[userId],
		);

		return parseFloat(result.rows[0].total);
	}

	private getNextResetDate(): Date {
		const today = new Date();
		const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
		return nextMonth;
	}

	clearCache(userId?: string): void {
		if (userId) {
			this.cache.delete(userId);
			this.cacheExpiry.delete(userId);
		} else {
			this.cache.clear();
			this.cacheExpiry.clear();
		}
	}
}

export function createBudgetTracker(db: PostgresClient): BudgetTracker {
	return new BudgetTracker(db);
}
