import type { TokenBudget } from "./types.js";
import { MythosLoopPhase } from "./types.js";

export class TokenBudgeter {
	private phaseAllocationPercentages = new Map<MythosLoopPhase, number>([
		[MythosLoopPhase.UNDERSTAND, 0.1],
		[MythosLoopPhase.RETRIEVE, 0.15],
		[MythosLoopPhase.STRUCTURE, 0.1],
		[MythosLoopPhase.ROUTE, 0.08],
		[MythosLoopPhase.CRITIQUE, 0.15],
		[MythosLoopPhase.SIMULATE, 0.2],
		[MythosLoopPhase.DECIDE, 0.12],
		[MythosLoopPhase.VERIFY, 0.08],
		[MythosLoopPhase.PACKAGE, 0.02],
	]);

	createBudget(totalTokens: number, overflowThreshold = 0.9): TokenBudget {
		const allocated = new Map<MythosLoopPhase, number>();

		// Allocate tokens per phase
		for (const [phase, percentage] of this.phaseAllocationPercentages) {
			allocated.set(phase, Math.floor(totalTokens * percentage));
		}

		return {
			total: totalTokens,
			allocated,
			spent: new Map(),
			remaining: totalTokens,
			overflowWarning: false,
			overflowThreshold,
		};
	}

	recordPhaseUsage(budget: TokenBudget, phase: MythosLoopPhase, tokensUsed: number): TokenBudget {
		const currentSpent = budget.spent.get(phase) || 0;
		const newSpent = currentSpent + tokensUsed;

		// Update spent
		budget.spent.set(phase, newSpent);

		// Calculate new remaining
		let totalSpent = 0;
		for (const spent of budget.spent.values()) {
			totalSpent += spent;
		}
		budget.remaining = Math.max(0, budget.total - totalSpent);

		// Check for overflow warning
		const usageRatio = totalSpent / budget.total;
		budget.overflowWarning = usageRatio > budget.overflowThreshold;

		return budget;
	}

	canAllocateForPhase(budget: TokenBudget, phase: MythosLoopPhase, tokensNeeded: number): boolean {
		// Check if we have budget remaining
		if (tokensNeeded > budget.remaining) {
			return false;
		}

		// Check phase-specific allocation
		const phaseAllocation = budget.allocated.get(phase) || 0;
		const phaseSpent = budget.spent.get(phase) || 0;
		const phaseRemaining = Math.max(0, phaseAllocation - phaseSpent);

		// Allow some overflow for phases (10% grace)
		return tokensNeeded <= phaseRemaining * 1.1;
	}

	estimateTokensForPhase(
		_phase: MythosLoopPhase,
		estimatedPromptLength: number,
		estimatedOutputLength: number
	): number {
		// Simple token estimation: ~4 chars per token
		// With overhead for reasoning and formatting
		return Math.ceil((estimatedPromptLength + estimatedOutputLength) / 3.5 * 1.2);
	}

	getPhaseAllocation(budget: TokenBudget, phase: MythosLoopPhase): number {
		return budget.allocated.get(phase) || 0;
	}

	getPhaseSpent(budget: TokenBudget, phase: MythosLoopPhase): number {
		return budget.spent.get(phase) || 0;
	}

	getPhaseRemaining(budget: TokenBudget, phase: MythosLoopPhase): number {
		const allocated = this.getPhaseAllocation(budget, phase);
		const spent = this.getPhaseSpent(budget, phase);
		return Math.max(0, allocated - spent);
	}

	isNearLimit(budget: TokenBudget): boolean {
		return budget.overflowWarning;
	}

	getUsagePercentage(budget: TokenBudget): number {
		if (budget.total === 0) return 0;
		return (budget.total - budget.remaining) / budget.total;
	}

	getSummary(budget: TokenBudget): string {
		const used = budget.total - budget.remaining;
		const percentage = this.getUsagePercentage(budget);
		return `${used}/${budget.total} tokens used (${(percentage * 100).toFixed(1)}%)`;
	}
}
