/**
 * Fable 5 Token Optimizer
 * Integrates caveman (65% output reduction) + jCodemunch (95% code token reduction) + opensrc
 * Yogi Mode: Token-heavy reasoning with full Fable 5 capability
 */

import type { Secrets } from '../../../packages/secrets/src/schema.js';

export interface TokenCost {
	inputTokensPerRun: number;
	outputTokensPerRun: number;
	codeExplorationTokensPerRun: number;
	totalTokensPerRun: number;
	costPerRun: number; // in cents
	monthlyTokens: number; // assuming 4 runs/day = 120 runs/month
	monthlyCost: number; // in dollars
}

export interface FableOptimizationStrategy {
	name: 'normal' | 'caveman' | 'yogi';
	description: string;
	outputTokenReduction: number; // percentage
	codeTokenReduction: number; // percentage
	inputTokenEstimate: number;
	outputTokenEstimate: number;
	codeExplorationEstimate: number;
	qualityLevel: 'fast' | 'balanced' | 'maximum';
	costPerRun: number; // in cents
}

/**
 * Fable 5 Pricing (as of 2026)
 * Input: $2 per million tokens
 * Output: $8 per million tokens
 */
const FABLE_5_PRICING = {
	inputCostPerToken: 2 / 1_000_000,
	outputCostPerToken: 8 / 1_000_000,
};

/**
 * Token baseline estimates for typical content generation run
 */
const BASELINE_TOKENS = {
	input: 4000, // Context + signals + prompt
	output: 2500, // Generated content
	codeExploration: 15000, // Reading files/code for context
};

/**
 * Strategy definitions with token multipliers
 */
export const FABLE_STRATEGIES: Record<string, FableOptimizationStrategy> = {
	normal: {
		name: 'normal',
		description: 'Standard Fable 5 - full quality, normal token usage',
		outputTokenReduction: 0,
		codeTokenReduction: 0,
		inputTokenEstimate: BASELINE_TOKENS.input,
		outputTokenEstimate: BASELINE_TOKENS.output,
		codeExplorationEstimate: BASELINE_TOKENS.codeExploration,
		qualityLevel: 'balanced',
		costPerRun: calculateCostCents(
			BASELINE_TOKENS.input,
			BASELINE_TOKENS.output + BASELINE_TOKENS.codeExploration,
		),
	},

	caveman: {
		name: 'caveman',
		description: 'Caveman mode (65% output reduction) + jCodeMunch (95% code token reduction)',
		outputTokenReduction: 65, // 65% fewer output tokens (caveman)
		codeTokenReduction: 95, // 95% fewer code exploration tokens (jcodemunch)
		inputTokenEstimate: BASELINE_TOKENS.input,
		outputTokenEstimate: Math.floor(BASELINE_TOKENS.output * 0.35), // 35% of normal
		codeExplorationEstimate: Math.floor(BASELINE_TOKENS.codeExploration * 0.05), // 5% of normal
		qualityLevel: 'fast',
		costPerRun: 0, // Calculated below
	},

	yogi: {
		name: 'yogi',
		description: '🧘 Yogi Mode - Full Fable 5 with extended reasoning (2x-3x tokens for deep analysis)',
		outputTokenReduction: -150, // 2.5x more output tokens for reasoning
		codeTokenReduction: 0, // Full code context needed
		inputTokenEstimate: BASELINE_TOKENS.input * 2, // 2x input for system prompts + reasoning chain
		outputTokenEstimate: BASELINE_TOKENS.output * 2.5, // 2.5x output for detailed reasoning
		codeExplorationEstimate: BASELINE_TOKENS.codeExploration, // Full context needed
		qualityLevel: 'maximum',
		costPerRun: 0, // Calculated below
	},
};

// Calculate remaining costs
FABLE_STRATEGIES.caveman.costPerRun = calculateCostCents(
	FABLE_STRATEGIES.caveman.inputTokenEstimate,
	FABLE_STRATEGIES.caveman.outputTokenEstimate + FABLE_STRATEGIES.caveman.codeExplorationEstimate,
);

FABLE_STRATEGIES.yogi.costPerRun = calculateCostCents(
	FABLE_STRATEGIES.yogi.inputTokenEstimate,
	FABLE_STRATEGIES.yogi.outputTokenEstimate + FABLE_STRATEGIES.yogi.codeExplorationEstimate,
);

/**
 * Calculate cost in cents for token usage
 */
export function calculateCostCents(inputTokens: number, outputTokens: number): number {
	const inputCost = inputTokens * FABLE_5_PRICING.inputCostPerToken;
	const outputCost = outputTokens * FABLE_5_PRICING.outputCostPerToken;
	return Math.round((inputCost + outputCost) * 100); // Convert to cents
}

/**
 * Get token cost breakdown for strategy
 */
export function getTokenCostBreakdown(strategy: FableOptimizationStrategy): TokenCost {
	const totalTokensPerRun =
		strategy.inputTokenEstimate +
		strategy.outputTokenEstimate +
		strategy.codeExplorationEstimate;

	const costPerRun = strategy.costPerRun / 100; // Convert cents to dollars

	// Monthly estimate: 4 runs per day * 30 days = 120 runs/month
	const monthlyRuns = 120;
	const monthlyTokens = totalTokensPerRun * monthlyRuns;
	const monthlyCost = costPerRun * monthlyRuns;

	return {
		inputTokensPerRun: strategy.inputTokenEstimate,
		outputTokensPerRun: strategy.outputTokenEstimate,
		totalTokensPerRun,
		codeExplorationTokensPerRun: strategy.codeExplorationEstimate,
		costPerRun,
		monthlyTokens,
		monthlyCost,
	};
}

/**
 * Calculate token savings: compare two strategies
 */
export function calculateTokenSavings(
	from: FableOptimizationStrategy,
	to: FableOptimizationStrategy,
): {
	tokensSaved: number;
	tokensSavedPercentage: number;
	costSavedPerRun: number;
	costSavedPerMonth: number;
	monthlyCOSavings: number; // kg CO2 prevented
} {
	const fromBreakdown = getTokenCostBreakdown(from);
	const toBreakdown = getTokenCostBreakdown(to);

	const tokensSaved = fromBreakdown.totalTokensPerRun - toBreakdown.totalTokensPerRun;
	const tokensSavedPercentage = (tokensSaved / fromBreakdown.totalTokensPerRun) * 100;
	const costSavedPerRun = fromBreakdown.costPerRun - toBreakdown.costPerRun;
	const costSavedPerMonth = costSavedPerRun * 120; // 120 runs/month

	// Rough CO2 estimate: 0.000037 kg CO2 per 1M tokens (OpenAI estimate)
	const monthlyCOSavings = (tokensSaved * 120 * 0.000037) / 1_000_000;

	return {
		tokensSaved,
		tokensSavedPercentage,
		costSavedPerRun,
		costSavedPerMonth,
		monthlyCOSavings,
	};
}

/**
 * Estimate annual savings across all agents
 */
export function getAnnualAgentSavings(): {
	agentCount: number;
	tokensPerAgent: number;
	totalTokensSaved: number;
	totalCostSaved: number;
	totalCOSaved: number;
} {
	const agents = ['hermes', 'vyapari', 'pauli', 'kupuri', 'cheggie', 'cascadia'];
	const cavermanBreakdown = getTokenCostBreakdown(FABLE_STRATEGIES.caveman);
	const normalBreakdown = getTokenCostBreakdown(FABLE_STRATEGIES.normal);

	const tokensPerAgent = cavermanBreakdown.monthlyTokens * 12;
	const costPerAgent = cavermanBreakdown.monthlyCost * 12;
	const savings = calculateTokenSavings(FABLE_STRATEGIES.normal, FABLE_STRATEGIES.caveman);

	return {
		agentCount: agents.length,
		tokensPerAgent: tokensPerAgent,
		totalTokensSaved: savings.tokensSaved * 120 * 12 * agents.length, // per agent per month per year
		totalCostSaved: savings.costSavedPerMonth * 12 * agents.length,
		totalCOSaved: savings.monthlyCOSavings * 12 * agents.length,
	};
}

/**
 * Format token cost for display
 */
export function formatTokenCost(cost: TokenCost): string {
	return `
💰 Token Economics (${FABLE_STRATEGIES.caveman.name.toUpperCase()})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Per Run:
  Input:          ${cost.inputTokensPerRun.toLocaleString()} tokens
  Output:         ${cost.outputTokensPerRun.toLocaleString()} tokens
  Code Explore:   ${cost.codeExplorationTokensPerRun.toLocaleString()} tokens
  ──────────────────────────────────────
  Total:          ${cost.totalTokensPerRun.toLocaleString()} tokens
  Cost:           $${cost.costPerRun.toFixed(4)}

Monthly (120 runs):
  Tokens:         ${cost.monthlyTokens.toLocaleString()}
  Cost:           $${cost.monthlyCost.toFixed(2)}

Annual:
  Tokens:         ${(cost.monthlyTokens * 12).toLocaleString()}
  Cost:           $${(cost.monthlyCost * 12).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

/**
 * Format savings comparison
 */
export function formatSavingsComparison(from: string, to: string): string {
	const fromStrategy = FABLE_STRATEGIES[from as keyof typeof FABLE_STRATEGIES];
	const toStrategy = FABLE_STRATEGIES[to as keyof typeof FABLE_STRATEGIES];

	if (!fromStrategy || !toStrategy) return 'Invalid strategy';

	const savings = calculateTokenSavings(fromStrategy, toStrategy);

	return `
🚀 SAVINGS: ${from.toUpperCase()} → ${to.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Per Run:
  Tokens Saved:   ${savings.tokensSaved.toLocaleString()} (${savings.tokensSavedPercentage.toFixed(1)}%)
  Cost Saved:     $${savings.costSavedPerRun.toFixed(4)}

Monthly (120 runs):
  Cost Saved:     $${savings.costSavedPerMonth.toFixed(2)}
  CO₂ Avoided:    ${savings.monthlyCOSavings.toFixed(2)} kg

Annual (6 agents):
  Total Saved:    $${(savings.costSavedPerMonth * 12 * 6).toFixed(2)}
  CO₂ Prevented:  ${(savings.monthlyCOSavings * 12 * 6).toFixed(2)} kg
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

/**
 * Get Fable 5 model ID with optimization
 */
export function getFable5ModelId(
	strategy: 'normal' | 'caveman' | 'yogi' = 'caveman',
): string {
	switch (strategy) {
		case 'yogi':
			return 'claude-fable-5'; // Full Fable 5
		case 'caveman':
		case 'normal':
		default:
			return 'claude-fable-5';
	}
}

/**
 * Generate system prompt for strategy
 */
export function generateFableSystemPrompt(strategy: 'normal' | 'caveman' | 'yogi'): string {
	if (strategy === 'caveman') {
		return `You are caveman AI. Talk like caveman.
- Use short words. Cut filler.
- Skip explanations. Give code, commands, errors exact.
- Brain big. Mouth small.
- Be terse. Be accurate. Be done.
- When explain needed, use minimal words.
Example: "inline object = new ref each render → re-render. wrap in useMemo."`;
	}

	if (strategy === 'yogi') {
		return `You are Yogi Mode - deep reasoning expert.
- Engage in extended analysis and thoughtful consideration
- Explore multiple perspectives and implications
- Provide detailed explanations with full context
- Use structured reasoning chains (step-by-step thinking)
- Consider edge cases, performance, security, and maintainability
- Reference relevant patterns, best practices, and tradeoffs
- Be thorough. Be insightful. Be complete.`;
	}

	return `You are helpful AI assistant using Fable 5.
Provide clear, accurate, and helpful responses.`;
}

export const Fable5Optimizer = {
	FABLE_STRATEGIES,
	calculateCostCents,
	getTokenCostBreakdown,
	calculateTokenSavings,
	getAnnualAgentSavings,
	formatTokenCost,
	formatSavingsComparison,
	getFable5ModelId,
	generateFableSystemPrompt,
};

export default Fable5Optimizer;
