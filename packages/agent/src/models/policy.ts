/**
 * Model Policy Enforcement
 * Enforces user-defined policies for model selection and usage
 */

export interface ModelPolicy {
	id: string;
	userId: string;
	mode: "free" | "balanced" | "premium" | "local_only";
	monthlyBudget: number;
	allowedProviders: string[];
	minContextWindow: number;
	requireReasoning: boolean;
	maxLatencyMs: number;
	blockedModels: string[];
	autoFallback: boolean;
	auditLogging: boolean;
}

export interface PolicyEnforcement {
	isValid: boolean;
	violations: string[];
	warnings: string[];
	appliedConstraints: string[];
}

/**
 * Policy enforcement engine
 */
export class PolicyEnforcer {
	private defaultPolicy: ModelPolicy = {
		id: "default",
		userId: "system",
		mode: "balanced",
		monthlyBudget: 100,
		allowedProviders: ["anthropic", "google", "ollama"],
		minContextWindow: 4096,
		requireReasoning: false,
		maxLatencyMs: 30000,
		blockedModels: [],
		autoFallback: true,
		auditLogging: true,
	};

	validatePolicy(policy: Partial<ModelPolicy>): PolicyEnforcement {
		const violations: string[] = [];
		const warnings: string[] = [];
		const appliedConstraints: string[] = [];

		// Validate budget
		if (policy.monthlyBudget && policy.monthlyBudget <= 0) {
			violations.push("Monthly budget must be greater than 0");
		}

		// Validate mode
		if (policy.mode && !["free", "balanced", "premium", "local_only"].includes(policy.mode)) {
			violations.push("Mode must be one of: free, balanced, premium, local_only");
		}

		// Validate context window
		if (policy.minContextWindow && policy.minContextWindow < 2048) {
			warnings.push("Very small context window may limit functionality");
		}

		// Validate providers
		if (policy.allowedProviders && policy.allowedProviders.length === 0) {
			violations.push("At least one provider must be allowed");
		}

		// Constraints based on mode
		if (policy.mode === "free") {
			appliedConstraints.push("Limited to free-tier models");
			appliedConstraints.push("No advanced reasoning");
			appliedConstraints.push("Rate limited to 10 requests/minute");
		} else if (policy.mode === "premium") {
			appliedConstraints.push("Full access to all models");
			appliedConstraints.push("Advanced reasoning enabled");
			appliedConstraints.push("Priority queue access");
		}

		return {
			isValid: violations.length === 0,
			violations,
			warnings,
			appliedConstraints,
		};
	}

	mergeWithDefault(userPolicy: Partial<ModelPolicy>): ModelPolicy {
		return {
			...this.defaultPolicy,
			...userPolicy,
			id: userPolicy.id || this.defaultPolicy.id,
			userId: userPolicy.userId || this.defaultPolicy.userId,
		};
	}

	enforcePolicy(policy: ModelPolicy, requestConfig: Record<string, unknown>): Record<string, unknown> {
		const enforced: Record<string, unknown> = { ...requestConfig };

		// Enforce budget
		if (policy.mode === "free") {
			enforced.maxTokens = Math.min((enforced.maxTokens as number) || 1000, 1000);
		}

		// Enforce provider whitelist
		if (enforced.provider && !policy.allowedProviders.includes(enforced.provider as string)) {
			enforced.provider = policy.allowedProviders[0];
		}

		// Enforce minimum context window
		enforced.minContextWindow = policy.minContextWindow;

		// Enforce reasoning requirement
		if (policy.requireReasoning) {
			enforced.requireReasoning = true;
		}

		// Enforce timeout
		enforced.timeout = Math.min((enforced.timeout as number) || 30000, policy.maxLatencyMs);

		return enforced;
	}

	getDefaultPolicy(): ModelPolicy {
		return { ...this.defaultPolicy };
	}

	updateDefaultPolicy(updates: Partial<ModelPolicy>): void {
		this.defaultPolicy = {
			...this.defaultPolicy,
			...updates,
		};
	}
}

// Global policy enforcer instance
let globalEnforcer: PolicyEnforcer | null = null;

export function getPolicyEnforcer(): PolicyEnforcer {
	if (!globalEnforcer) {
		globalEnforcer = new PolicyEnforcer();
	}
	return globalEnforcer;
}

export function createPolicyEnforcer(): PolicyEnforcer {
	return new PolicyEnforcer();
}
