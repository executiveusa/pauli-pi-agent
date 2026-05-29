import type { DepthPolicyDecision } from "./types.js";
import { MythosDepth } from "./types.js";

export interface ModelCapability {
	depth: MythosDepth;
	available: boolean;
	costPerMToken: number;
	contextWindow: number;
	reasoning: boolean;
}

export interface PolicyConstraints {
	maxDepth: MythosDepth;
	allowedModes: string[];
	costLimit: number;
	remainingBudget: number;
}

export class DepthPolicy {
	private modelCatalog = new Map<string, ModelCapability>([
		[
			"claude-instant",
			{
				depth: MythosDepth.INSTANT,
				available: true,
				costPerMToken: 0.003,
				contextWindow: 4000,
				reasoning: false,
			},
		],
		[
			"claude-fast",
			{
				depth: MythosDepth.FAST,
				available: true,
				costPerMToken: 0.008,
				contextWindow: 8000,
				reasoning: false,
			},
		],
		[
			"claude-standard",
			{
				depth: MythosDepth.NORMAL,
				available: true,
				costPerMToken: 0.015,
				contextWindow: 100000,
				reasoning: false,
			},
		],
		[
			"claude-deep",
			{
				depth: MythosDepth.DEEP,
				available: true,
				costPerMToken: 0.03,
				contextWindow: 100000,
				reasoning: true,
			},
		],
		[
			"claude-mythic",
			{
				depth: MythosDepth.MYTHIC,
				available: true,
				costPerMToken: 0.06,
				contextWindow: 100000,
				reasoning: true,
			},
		],
	]);

	evaluateDepth(
		requestedDepth: MythosDepth,
		constraints: PolicyConstraints,
		expectedTokens: number
	): DepthPolicyDecision {
		// Check if requested depth violates policy
		if (this.depthOrder(requestedDepth) > this.depthOrder(constraints.maxDepth)) {
			return {
				approvedDepth: constraints.maxDepth,
				reasoning: `Requested depth ${requestedDepth} exceeds policy limit ${constraints.maxDepth}. Downgraded.`,
				modelAvailable: this.isDepthAvailable(constraints.maxDepth),
				costEstimate: this.estimateCost(constraints.maxDepth, expectedTokens),
				tokenEstimate: expectedTokens,
			};
		}

		// Check cost feasibility
		const estimatedCost = this.estimateCost(requestedDepth, expectedTokens);
		if (estimatedCost > constraints.remainingBudget) {
			// Downgrade depth to fit budget
			const feasibleDepth = this.findFeasibleDepth(expectedTokens, constraints.remainingBudget);
			return {
				approvedDepth: feasibleDepth,
				reasoning: `Cost ${estimatedCost.toFixed(2)} exceeds budget ${constraints.remainingBudget.toFixed(2)}. Downgraded to ${feasibleDepth}.`,
				modelAvailable: this.isDepthAvailable(feasibleDepth),
				costEstimate: this.estimateCost(feasibleDepth, expectedTokens),
				tokenEstimate: expectedTokens,
			};
		}

		// Approved depth
		return {
			approvedDepth: requestedDepth,
			reasoning: `Depth ${requestedDepth} approved within policy and budget constraints.`,
			modelAvailable: this.isDepthAvailable(requestedDepth),
			costEstimate: estimatedCost,
			tokenEstimate: expectedTokens,
		};
	}

	private findFeasibleDepth(expectedTokens: number, budget: number): MythosDepth {
		const depths = [
			MythosDepth.INSTANT,
			MythosDepth.FAST,
			MythosDepth.NORMAL,
			MythosDepth.DEEP,
			MythosDepth.MYTHIC,
		];

		// Try depths from lowest to highest
		for (const depth of depths) {
			const cost = this.estimateCost(depth, expectedTokens);
			if (cost <= budget) {
				return depth;
			}
		}

		// Fallback to instant
		return MythosDepth.INSTANT;
	}

	private estimateCost(depth: MythosDepth, tokens: number): number {
		const capability = this.getCapabilityForDepth(depth);
		if (!capability) return Infinity;
		return (capability.costPerMToken * tokens) / 1000;
	}

	private isDepthAvailable(depth: MythosDepth): boolean {
		const capability = this.getCapabilityForDepth(depth);
		return capability?.available ?? false;
	}

	private getCapabilityForDepth(depth: MythosDepth): ModelCapability | undefined {
		// Find the model capability for this depth
		for (const capability of this.modelCatalog.values()) {
			if (capability.depth === depth && capability.available) {
				return capability;
			}
		}
		return undefined;
	}

	private depthOrder(depth: MythosDepth): number {
		const order = [
			MythosDepth.INSTANT,
			MythosDepth.FAST,
			MythosDepth.NORMAL,
			MythosDepth.DEEP,
			MythosDepth.MYTHIC,
		];
		return order.indexOf(depth);
	}

	getContextWindowForDepth(depth: MythosDepth): number {
		return this.getCapabilityForDepth(depth)?.contextWindow ?? 4000;
	}

	requiresReasoningForDepth(depth: MythosDepth): boolean {
		return this.getCapabilityForDepth(depth)?.reasoning ?? false;
	}
}
