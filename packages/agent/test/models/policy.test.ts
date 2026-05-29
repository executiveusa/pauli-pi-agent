/**
 * Policy Enforcement Tests
 * Verify policy validation, merging, and enforcement
 */

import { describe, expect, test } from "vitest";
import { createPolicyEnforcer, type PolicyEnforcer } from "../../src/models/policy.js";

describe("PolicyEnforcer", () => {
	let enforcer: PolicyEnforcer;

	test("creates policy enforcer", () => {
		enforcer = createPolicyEnforcer();
		expect(enforcer).toBeDefined();
	});

	test("validates correct policy", () => {
		const enforcement = enforcer.validatePolicy({
			mode: "balanced",
			monthlyBudget: 100,
			allowedProviders: ["anthropic"],
		});

		expect(enforcement.isValid).toBe(true);
		expect(enforcement.violations.length).toBe(0);
	});

	test("detects invalid mode", () => {
		const enforcement = enforcer.validatePolicy({
			mode: "invalid" as any,
		});

		expect(enforcement.isValid).toBe(false);
		expect(enforcement.violations.length).toBeGreaterThan(0);
	});

	test("detects negative budget", () => {
		const enforcement = enforcer.validatePolicy({
			monthlyBudget: -50,
		});

		expect(enforcement.isValid).toBe(false);
		expect(enforcement.violations.length).toBeGreaterThan(0);
	});

	test("detects zero budget", () => {
		const enforcement = enforcer.validatePolicy({
			monthlyBudget: 0,
		});

		expect(enforcement.isValid).toBe(true);
	});

	test("warns on small context window", () => {
		const enforcement = enforcer.validatePolicy({
			minContextWindow: 1024,
		});

		expect(enforcement.warnings.length).toBeGreaterThan(0);
	});

	test("detects empty provider list", () => {
		const enforcement = enforcer.validatePolicy({
			allowedProviders: [],
		});

		expect(enforcement.isValid).toBe(false);
	});

	test("applies constraints for free mode", () => {
		const enforcement = enforcer.validatePolicy({
			mode: "free",
		});

		expect(enforcement.appliedConstraints.some((c) => c.includes("free-tier"))).toBe(true);
		expect(enforcement.appliedConstraints.some((c) => c.includes("reasoning"))).toBe(true);
	});

	test("applies constraints for premium mode", () => {
		const enforcement = enforcer.validatePolicy({
			mode: "premium",
		});

		expect(enforcement.appliedConstraints.some((c) => c.includes("all models"))).toBe(true);
	});

	test("merges user policy with defaults", () => {
		const merged = enforcer.mergeWithDefault({
			mode: "free",
			monthlyBudget: 50,
		});

		expect(merged.mode).toBe("free");
		expect(merged.monthlyBudget).toBe(50);
		expect(merged.allowedProviders).toBeDefined();
		expect(merged.minContextWindow).toBeDefined();
	});

	test("preserves all fields when merging", () => {
		const merged = enforcer.mergeWithDefault({
			mode: "premium",
			monthlyBudget: 500,
			requireReasoning: true,
		});

		expect(merged.mode).toBe("premium");
		expect(merged.monthlyBudget).toBe(500);
		expect(merged.requireReasoning).toBe(true);
	});

	test("enforces budget limit on request config", () => {
		const policy = enforcer.mergeWithDefault({ mode: "free" });
		const config = { maxTokens: 10000 };

		const enforced = enforcer.enforcePolicy(policy, config);

		expect(enforced.maxTokens).toBeLessThanOrEqual(1000);
	});

	test("enforces provider whitelist", () => {
		const policy = enforcer.mergeWithDefault({
			allowedProviders: ["google"],
		});
		const config = { provider: "anthropic" };

		const enforced = enforcer.enforcePolicy(policy, config);

		expect(enforced.provider).toBe("google");
	});

	test("enforces minimum context window", () => {
		const policy = enforcer.mergeWithDefault({
			minContextWindow: 100000,
		});
		const config = { contextWindow: 50000 };

		const enforced = enforcer.enforcePolicy(policy, config);

		expect(enforced.minContextWindow).toBe(100000);
	});

	test("enforces reasoning requirement", () => {
		const policy = enforcer.mergeWithDefault({ requireReasoning: true });
		const config = { requireReasoning: false };

		const enforced = enforcer.enforcePolicy(policy, config);

		expect(enforced.requireReasoning).toBe(true);
	});

	test("enforces timeout limit", () => {
		const policy = enforcer.mergeWithDefault({ maxLatencyMs: 5000 });
		const config = { timeout: 60000 };

		const enforced = enforcer.enforcePolicy(policy, config);

		expect(enforced.timeout).toBeLessThanOrEqual(5000);
	});

	test("returns default policy", () => {
		const defaultPolicy = enforcer.getDefaultPolicy();

		expect(defaultPolicy.mode).toBe("balanced");
		expect(defaultPolicy.monthlyBudget).toBe(100);
		expect(defaultPolicy.autoFallback).toBe(true);
	});

	test("updates default policy", () => {
		const originalDefault = enforcer.getDefaultPolicy();
		enforcer.updateDefaultPolicy({ monthlyBudget: 200 });

		const updated = enforcer.getDefaultPolicy();
		expect(updated.monthlyBudget).toBe(200);
		expect(updated.mode).toBe(originalDefault.mode);
	});

	test("multiple enforcers are independent", () => {
		const enforcer1 = createPolicyEnforcer();
		const enforcer2 = createPolicyEnforcer();

		enforcer1.updateDefaultPolicy({ monthlyBudget: 500 });

		expect(enforcer1.getDefaultPolicy().monthlyBudget).toBe(500);
		expect(enforcer2.getDefaultPolicy().monthlyBudget).toBe(100);
	});
});
