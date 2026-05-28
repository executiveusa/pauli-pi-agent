import type { HaltPolicyDecision, LoopState, GoalPacket } from "./types.js";

export interface HaltCriteria {
	maxLoops: number;
	minConfidence: number;
	maxTokens: number;
	maxDuration: number; // milliseconds
	allPhasesComplete: boolean;
}

export class HaltPolicy {
	evaluateHalt(
		goalPacket: GoalPacket,
		loopState: LoopState,
		elapsedTime: number,
		criteria: HaltCriteria
	): HaltPolicyDecision {
		const reasons: string[] = [];

		// Check loop count limit
		if (loopState.loopNumber >= criteria.maxLoops) {
			reasons.push(
				`Max loops reached: ${loopState.loopNumber} >= ${criteria.maxLoops}`
			);
		}

		// Check token budget
		const tokensUsed = loopState.tokenBudget.total - loopState.tokenBudget.remaining;
		if (tokensUsed >= criteria.maxTokens) {
			reasons.push(
				`Token budget exceeded: ${tokensUsed} >= ${criteria.maxTokens}`
			);
		}

		// Check time limit
		if (elapsedTime >= criteria.maxDuration) {
			reasons.push(
				`Time limit exceeded: ${elapsedTime}ms >= ${criteria.maxDuration}ms`
			);
		}

		// Check confidence threshold
		const lowestConfidence = this.getLowestPhaseConfidence(loopState);
		if (lowestConfidence >= criteria.minConfidence && loopState.phaseResults.length > 0) {
			reasons.push(
				`Confidence threshold met: ${(lowestConfidence * 100).toFixed(0)}% >= ${(criteria.minConfidence * 100).toFixed(0)}%`
			);
		}

		// Check if all phases completed successfully
		if (criteria.allPhasesComplete && loopState.phaseResults.length >= 9) {
			const allComplete = loopState.phaseResults.slice(0, 9).every((r) => r.success);
			if (allComplete) {
				reasons.push("All phases completed successfully");
			}
		}

		// Determine if we should halt
		const shouldHalt = reasons.length > 0;

		// Calculate confidence based on reasons
		let confidence = 0.5;
		if (reasons.includes(`Max loops reached`)) confidence = 0.95;
		if (reasons.includes("Token budget exceeded")) confidence = 0.95;
		if (reasons.includes("Time limit exceeded")) confidence = 0.95;
		if (reasons.includes("Confidence threshold met")) confidence = 0.85;
		if (reasons.includes("All phases completed")) confidence = 0.9;

		return {
			shouldHalt,
			reason:
				reasons.length > 0
					? reasons.join(" | ")
					: "Continuing - no halt conditions met",
			confidence,
		};
	}

	private getLowestPhaseConfidence(loopState: LoopState): number {
		if (loopState.phaseResults.length === 0) return 0;

		let lowest = 1;
		for (const result of loopState.phaseResults) {
			if (result.success && result.confidence < lowest) {
				lowest = result.confidence;
			}
		}

		return lowest;
	}

	getHaltCriteria(goalPacket: GoalPacket): HaltCriteria {
		return {
			maxLoops: goalPacket.maxLoops,
			minConfidence: 0.75, // Default 75% confidence
			maxTokens: goalPacket.tokenBudget,
			maxDuration: 300000, // 5 minutes default
			allPhasesComplete: true,
		};
	}

	getEstimatedLoopsRemaining(
		loopState: LoopState,
		maxLoops: number
	): number {
		return Math.max(0, maxLoops - loopState.loopNumber);
	}

	shouldEnterFinalPhase(loopState: LoopState, maxLoops: number): boolean {
		// Enter final phase when we're near the limit
		return loopState.loopNumber >= Math.max(1, maxLoops - 1);
	}
}
