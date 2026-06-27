import type { StabilityGuardEvaluation, LoopState, GoalPacket } from "./types.js";

export interface StabilityThresholds {
	maxScopeExpansion: number; // percentage
	maxCostExpansion: number; // percentage
	permitPermissionExpansion: boolean;
}

export class StabilityGuard {
	private thresholds: StabilityThresholds = {
		maxScopeExpansion: 0.2, // 20%
		maxCostExpansion: 0.15, // 15%
		permitPermissionExpansion: false,
	};

	evaluate(
		initialGoalPacket: GoalPacket,
		currentGoalPacket: GoalPacket,
		loopState: LoopState
	): StabilityGuardEvaluation {
		const violations: string[] = [];
		const recommendations: string[] = [];

		// Check scope expansion
		const scopeExpanded = this.isScopeExpanded(initialGoalPacket, currentGoalPacket);
		if (scopeExpanded) {
			violations.push("Goal scope has expanded beyond initial request");
			recommendations.push("Review and approve scope changes before proceeding");
		}

		// Check cost expansion
		const costExpanded = this.isCostExpanded(initialGoalPacket, currentGoalPacket);
		if (costExpanded) {
			violations.push("Estimated cost has exceeded initial budget");
			recommendations.push("Reduce depth or token budget to stay within cost limits");
		}

		// Check permission expansion
		const permissionExpanded = this.isPermissionExpanded(
			initialGoalPacket,
			currentGoalPacket
		);
		if (permissionExpanded && !this.thresholds.permitPermissionExpansion) {
			violations.push("New permissions required beyond initial authorization");
			recommendations.push("Request additional authorization before proceeding");
		}

		const isStable = violations.length === 0;

		return {
			isStable,
			scopeExpanded,
			costExpanded,
			permissionExpanded,
			violations,
			recommendations,
		};
	}

	private isScopeExpanded(initial: GoalPacket, current: GoalPacket): boolean {
		// Check if new evidence requirements have been added
		const newRequirements = current.evidenceRequirements.filter(
			(req) => !initial.evidenceRequirements.includes(req)
		);

		// Check if new constraints have been added
		const newConstraints = Object.keys(current.constraints).filter(
			(key) => !(key in initial.constraints)
		);

		// Scope is expanded if significant new requirements or constraints
		return (
			newRequirements.length > initial.evidenceRequirements.length * this.thresholds.maxScopeExpansion ||
			newConstraints.length > 0
		);
	}

	private isCostExpanded(initial: GoalPacket, current: GoalPacket): boolean {
		// Budget expanded if current exceeds initial by threshold
		const budgetRatio = current.costBudget / initial.costBudget;
		return budgetRatio > 1 + this.thresholds.maxCostExpansion;
	}

	private isPermissionExpanded(initial: GoalPacket, current: GoalPacket): boolean {
		// Check if persona changed (different permissions)
		if (current.persona && initial.persona && current.persona !== initial.persona) {
			return true;
		}

		// Check for new tool permissions in constraints
		const currentTools = this.extractToolPermissions(current.constraints);
		const initialTools = this.extractToolPermissions(initial.constraints);

		return currentTools.some((tool) => !initialTools.includes(tool));
	}

	private extractToolPermissions(constraints: Record<string, string | number | boolean>): string[] {
		const allowedTools = constraints["allowedTools"];
		if (typeof allowedTools === "string") {
			return allowedTools.split(",").map((t) => t.trim());
		}
		return [];
	}

	setThresholds(thresholds: Partial<StabilityThresholds>): void {
		this.thresholds = { ...this.thresholds, ...thresholds };
	}

	getThresholds(): StabilityThresholds {
		return { ...this.thresholds };
	}
}
