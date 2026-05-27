/**
 * Model Router Tests
 * Verify routing logic, model selection, and decision logging
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PostgresClient } from "../../src/database/index.js";
import { ModelRouter } from "../../src/models/router.js";

describe("ModelRouter", () => {
	let router: ModelRouter;
	let mockDb: PostgresClient;

	beforeEach(() => {
		mockDb = {
			query: vi.fn(async (sql: string) => {
				if (sql.includes("personas")) {
					return { rows: [{ model_policy: {} }] };
				}
				if (sql.includes("model_calls")) {
					return { rows: [{ spent: 0 }] };
				}
				return { rows: [] };
			}),
		} as unknown as PostgresClient;

		router = new ModelRouter(mockDb);
	});

	test("initializes model catalog", () => {
		expect(router).toBeDefined();
	});

	test("routes free mode request to appropriate model", async () => {
		const decision = await router.route({
			prompt: "Hello, how are you?",
			mode: "free",
			userId: "user-123",
		});

		expect(decision).toBeDefined();
		expect(decision.appliedPolicy).toBe("free_tier");
		expect(decision.model.costPerMToken).toBeLessThan(5);
	});

	test("routes balanced mode request", async () => {
		const decision = await router.route({
			prompt: "Explain quantum mechanics",
			mode: "balanced",
			userId: "user-123",
		});

		expect(decision).toBeDefined();
		expect(decision.appliedPolicy).toBe("balanced");
		expect(decision.model).toBeDefined();
	});

	test("routes premium mode request with reasoning", async () => {
		const decision = await router.route({
			prompt: "Solve this complex problem",
			mode: "premium",
			userId: "user-123",
			requiresReasoning: true,
		});

		expect(decision).toBeDefined();
		expect(decision.appliedPolicy).toBe("premium");
	});

	test("routes local_only mode to local model", async () => {
		const decision = await router.route({
			prompt: "Process offline",
			mode: "local_only",
			userId: "user-123",
		});

		expect(decision).toBeDefined();
		expect(decision.model.provider).toBe("ollama");
		expect(decision.model.costPerMToken).toBe(0.0);
	});

	test("estimates tokens correctly", async () => {
		const shortPrompt = await router.route({
			prompt: "Hi",
			mode: "free",
			userId: "user-123",
		});

		const longPrompt = await router.route({
			prompt:
				"This is a much longer prompt that contains substantially more text to process and analyze thoroughly".repeat(
					10,
				),
			mode: "free",
			userId: "user-123",
		});

		expect(longPrompt.estimatedCost).toBeGreaterThan(shortPrompt.estimatedCost);
	});

	test("calculates cost accurately", async () => {
		const decision = await router.route({
			prompt: "A".repeat(1000000), // ~250k tokens
			mode: "balanced",
			userId: "user-123",
		});

		expect(decision.estimatedCost).toBeGreaterThan(0);
		expect(decision.estimatedCost).toBeLessThan(1000); // Reasonable upper bound
	});

	test("logs routing decision to database", async () => {
		const querySpy = vi.spyOn(mockDb, "query");
		await router.route({
			prompt: "Test",
			mode: "balanced",
			userId: "user-123",
		});

		expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO model_calls"), expect.any(Array));
	});

	test("respects context window constraints", async () => {
		const decision = await router.route({
			prompt: "Test",
			mode: "free",
			userId: "user-123",
			contextWindow: 50000,
		});

		expect(decision.model.contextWindow).toBeGreaterThanOrEqual(50000);
	});

	test("handles missing user policy gracefully", async () => {
		const mockDbNoPolicy = {
			query: vi.fn(async () => ({ rows: [] })),
		} as unknown as PostgresClient;

		const routerNoPol = new ModelRouter(mockDbNoPolicy);
		const decision = await routerNoPol.route({
			prompt: "Test",
			mode: "balanced",
			userId: "unknown-user",
		});

		expect(decision).toBeDefined();
		expect(decision.appliedPolicy).toBe("balanced");
	});

	test("respects rate limits in model selection", async () => {
		const decision = await router.route({
			prompt: "Test",
			mode: "free",
			userId: "user-123",
		});

		expect(decision.model.rateLimitPerMinute).toBeGreaterThan(0);
	});

	test("provides reasoning for routing decision", async () => {
		const decision = await router.route({
			prompt: "Test",
			mode: "free",
			userId: "user-123",
		});

		expect(decision.reasoning).toMatch(/Selected|free|tier|budget/i);
	});

	test("includes timestamp in routing decision", async () => {
		const decision = await router.route({
			prompt: "Test",
			mode: "balanced",
			userId: "user-123",
		});

		expect(decision.timestamp).toBeInstanceOf(Date);
		expect(decision.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
	});
});
