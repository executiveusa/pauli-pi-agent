/**
 * Model Router
 * Routes requests to appropriate models based on budget, policy, and performance requirements
 */

import type { PostgresClient } from "../database/index.js";
import { getSecret } from "../secrets/index.js";

export type RoutingMode = "free" | "balanced" | "premium" | "local_only";

export interface RoutingRequest {
	prompt: string;
	maxTokens?: number;
	mode: RoutingMode;
	userId: string;
	contextWindow?: number;
	requiresReasoning?: boolean;
}

export interface RoutedModel {
	provider: string;
	modelId: string;
	costPerMToken: number;
	contextWindow: number;
	reasoning: boolean;
	rateLimitPerMinute: number;
}

export interface RoutingDecision {
	model: RoutedModel;
	estimatedCost: number;
	reasoning: string;
	appliedPolicy: string;
	timestamp: Date;
}

/**
 * Model Router - Selects optimal models based on user policy and budget
 */
export class ModelRouter {
	private db: PostgresClient;
	private modelCatalog: Map<string, RoutedModel> = new Map();

	constructor(db: PostgresClient) {
		this.db = db;
		this.initializeModelCatalog();
	}

	private initializeModelCatalog(): void {
		// Free tier models - high latency, no reasoning
		this.modelCatalog.set("free-claude-haiku", {
			provider: "anthropic",
			modelId: "claude-3-5-haiku-20241022",
			costPerMToken: 0.8,
			contextWindow: 200000,
			reasoning: false,
			rateLimitPerMinute: 10,
		});

		this.modelCatalog.set("free-gemini", {
			provider: "google",
			modelId: "gemini-2.0-flash",
			costPerMToken: 0.5,
			contextWindow: 1000000,
			reasoning: false,
			rateLimitPerMinute: 5,
		});

		// Balanced tier - moderate cost, basic reasoning
		this.modelCatalog.set("balanced-claude-sonnet", {
			provider: "anthropic",
			modelId: "claude-3-5-sonnet-20241022",
			costPerMToken: 3.0,
			contextWindow: 200000,
			reasoning: false,
			rateLimitPerMinute: 100,
		});

		// Premium tier - advanced reasoning, best quality
		this.modelCatalog.set("premium-claude-opus", {
			provider: "anthropic",
			modelId: "claude-opus-4.1",
			costPerMToken: 15.0,
			contextWindow: 200000,
			reasoning: true,
			rateLimitPerMinute: 100,
		});

		// Local-only models
		this.modelCatalog.set("local-llama2", {
			provider: "ollama",
			modelId: "llama2-7b",
			costPerMToken: 0.0,
			contextWindow: 4096,
			reasoning: false,
			rateLimitPerMinute: 1000,
		});
	}

	async route(request: RoutingRequest): Promise<RoutingDecision> {
		const userPolicy = await this.getUserPolicy(request.userId);
		const budget = await this.getUserBudget(request.userId);
		const estimatedTokens = this.estimateTokens(request.prompt);

		let selectedModel: RoutedModel | null = null;
		let reasoning = "";
		let appliedPolicy = "";

		switch (request.mode) {
			case "local_only":
				selectedModel = this.modelCatalog.get("local-llama2")!;
				reasoning = "Selected local model per user preference";
				appliedPolicy = "local_only";
				break;

			case "free":
				selectedModel = this.selectFreeTierModel(request, estimatedTokens, userPolicy);
				reasoning = `Selected free-tier model within budget constraints`;
				appliedPolicy = "free_tier";
				break;

			case "balanced":
				selectedModel = this.selectBalancedModel(request, estimatedTokens, budget, userPolicy);
				reasoning = `Selected balanced model with cost control`;
				appliedPolicy = "balanced";
				break;

			case "premium":
				selectedModel = this.selectPremiumModel(request, estimatedTokens, budget, userPolicy);
				reasoning = `Selected premium model for best quality`;
				appliedPolicy = "premium";
				break;
		}

		if (!selectedModel) {
			throw new Error(`No suitable model found for mode: ${request.mode}`);
		}

		const estimatedCost = this.calculateCost(estimatedTokens, selectedModel.costPerMToken);

		const decision: RoutingDecision = {
			model: selectedModel,
			estimatedCost,
			reasoning,
			appliedPolicy,
			timestamp: new Date(),
		};

		await this.logRoutingDecision(request.userId, decision);

		return decision;
	}

	private selectFreeTierModel(
		request: RoutingRequest,
		estimatedTokens: number,
		policy: Record<string, unknown>,
	): RoutedModel {
		// Prefer Gemini for free tier (cheaper)
		if (estimatedTokens < 50000) {
			return this.modelCatalog.get("free-gemini")!;
		}
		return this.modelCatalog.get("free-claude-haiku")!;
	}

	private selectBalancedModel(
		request: RoutingRequest,
		estimatedTokens: number,
		budget: { monthlyLimit: number; spent: number },
		policy: Record<string, unknown>,
	): RoutedModel {
		const remaining = budget.monthlyLimit - budget.spent;
		const estimatedCost =
			(estimatedTokens / 1000000) * this.modelCatalog.get("balanced-claude-sonnet")!.costPerMToken;

		if (estimatedCost > remaining) {
			return this.modelCatalog.get("free-claude-haiku")!;
		}

		return this.modelCatalog.get("balanced-claude-sonnet")!;
	}

	private selectPremiumModel(
		request: RoutingRequest,
		estimatedTokens: number,
		budget: { monthlyLimit: number; spent: number },
		policy: Record<string, unknown>,
	): RoutedModel {
		const remaining = budget.monthlyLimit - budget.spent;
		const estimatedCost = (estimatedTokens / 1000000) * this.modelCatalog.get("premium-claude-opus")!.costPerMToken;

		if (estimatedCost > remaining) {
			return this.modelCatalog.get("balanced-claude-sonnet")!;
		}

		if (request.requiresReasoning) {
			return this.modelCatalog.get("premium-claude-opus")!;
		}

		return this.modelCatalog.get("balanced-claude-sonnet")!;
	}

	private estimateTokens(prompt: string): number {
		// Approximate: 1 token ≈ 4 characters
		return Math.ceil(prompt.length / 4);
	}

	private calculateCost(tokens: number, costPerMToken: number): number {
		return (tokens / 1000000) * costPerMToken;
	}

	private async getUserPolicy(userId: string): Promise<Record<string, unknown>> {
		try {
			const result = await this.db.query(`SELECT model_policy FROM personas WHERE id = $1`, [userId]);
			if (result.rows.length > 0) {
				return result.rows[0].model_policy || {};
			}
		} catch {
			// Policy not found, use defaults
		}
		return {};
	}

	private async getUserBudget(userId: string): Promise<{
		monthlyLimit: number;
		spent: number;
	}> {
		try {
			const result = await this.db.query(
				`SELECT SUM(cost) as spent FROM model_calls
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
				[userId],
			);
			const spent = result.rows[0]?.spent || 0;
			return {
				monthlyLimit: 100, // Default $100 monthly limit
				spent: parseFloat(spent),
			};
		} catch {
			return { monthlyLimit: 100, spent: 0 };
		}
	}

	private async logRoutingDecision(userId: string, decision: RoutingDecision): Promise<void> {
		try {
			await this.db.query(
				`INSERT INTO model_calls (user_id, provider, model_id, cost, policy, decision_reasoning)
       VALUES ($1, $2, $3, $4, $5, $6)`,
				[
					userId,
					decision.model.provider,
					decision.model.modelId,
					decision.estimatedCost,
					decision.appliedPolicy,
					decision.reasoning,
				],
			);
		} catch (error) {
			console.error("Failed to log routing decision:", error);
		}
	}
}

export function createModelRouter(db: PostgresClient): ModelRouter {
	return new ModelRouter(db);
}
