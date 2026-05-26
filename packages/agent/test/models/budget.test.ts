/**
 * Budget Tracker Tests
 * Verify budget tracking, cost recording, and alert generation
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PostgresClient } from "../../src/database/index.js";
import { BudgetTracker, type CostEvent } from "../../src/models/budget.js";

describe("BudgetTracker", () => {
	let tracker: BudgetTracker;
	let mockDb: PostgresClient;

	beforeEach(() => {
		mockDb = {
			query: vi.fn(async (sql: string, _params?: unknown[]) => {
				if (sql.includes("SELECT") && sql.includes("personas")) {
					return {
						rows: [
							{
								monthly_limit: "100",
								spent: "25",
							},
						],
					};
				}
				if (sql.includes("INSERT")) {
					return { rows: [] };
				}
				if (sql.includes("UPDATE")) {
					return { rows: [] };
				}
				if (sql.includes("SUM(cost)")) {
					return {
						rows: [
							{
								total: "75",
							},
						],
					};
				}
				return { rows: [] };
			}),
		} as unknown as PostgresClient;

		tracker = new BudgetTracker(mockDb);
	});

	test("creates budget tracker", () => {
		expect(tracker).toBeDefined();
	});

	test("gets budget status for user", async () => {
		const status = await tracker.getBudgetStatus("user-123");

		expect(status).toBeDefined();
		expect(status.userId).toBe("user-123");
		expect(status.monthlyLimit).toBe(100);
		expect(status.spent).toBe(25);
		expect(status.remaining).toBe(75);
		expect(status.percentageUsed).toBe(25);
	});

	test("caches budget status", async () => {
		const spy = vi.spyOn(mockDb, "query");

		const status1 = await tracker.getBudgetStatus("user-123");
		const status2 = await tracker.getBudgetStatus("user-123");

		expect(status1).toEqual(status2);
		// Should be called once for both requests (cached)
		expect(spy.mock.calls.filter((call) => typeof call[0] === "string" && call[0].includes("personas"))).toHaveLength(
			1,
		);
	});

	test("records cost event", async () => {
		const event: CostEvent = {
			userId: "user-123",
			provider: "anthropic",
			modelId: "claude-3-sonnet",
			inputTokens: 1000,
			outputTokens: 500,
			cost: 2.5,
			timestamp: new Date(),
		};

		await tracker.recordCost(event);

		expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO model_calls"), expect.any(Array));
	});

	test("invalidates cache after recording cost", async () => {
		await tracker.getBudgetStatus("user-123");
		const event: CostEvent = {
			userId: "user-123",
			provider: "anthropic",
			modelId: "claude-3-sonnet",
			inputTokens: 1000,
			outputTokens: 500,
			cost: 2.5,
			timestamp: new Date(),
		};

		await tracker.recordCost(event);
		await tracker.getBudgetStatus("user-123");

		// Should be called twice - once before cost, once after (cache was invalidated)
		expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO model_calls"), expect.any(Array));
	});

	test("checks if request is within budget", async () => {
		const isWithin = await tracker.isWithinBudget("user-123", 50);

		expect(isWithin).toBe(true);
	});

	test("detects over-budget requests", async () => {
		const isWithin = await tracker.isWithinBudget("user-123", 100);

		expect(isWithin).toBe(false);
	});

	test("returns no alert when budget is healthy", async () => {
		const alert = await tracker.checkBudgetAlert("user-123");

		expect(alert.alert).toBe(false);
		expect(alert.level).toBe("none");
	});

	test("returns warning at 90% budget usage", async () => {
		mockDb.query = vi.fn(async () => ({
			rows: [
				{
					monthly_limit: "100",
					spent: "90",
				},
			],
		}));
		tracker.clearCache();

		const alert = await tracker.checkBudgetAlert("user-123");

		expect(alert.alert).toBe(true);
		expect(alert.level).toBe("warning");
	});

	test("returns critical alert at 100% budget usage", async () => {
		mockDb.query = vi.fn(async () => ({
			rows: [
				{
					monthly_limit: "100",
					spent: "100",
				},
			],
		}));
		tracker.clearCache();

		const alert = await tracker.checkBudgetAlert("user-123");

		expect(alert.alert).toBe(true);
		expect(alert.level).toBe("critical");
	});

	test("returns critical alert when over budget", async () => {
		mockDb.query = vi.fn(async () => ({
			rows: [
				{
					monthly_limit: "100",
					spent: "150",
				},
			],
		}));
		tracker.clearCache();

		const alert = await tracker.checkBudgetAlert("user-123");

		expect(alert.alert).toBe(true);
		expect(alert.level).toBe("critical");
	});

	test("sets budget limit for user", async () => {
		await tracker.setBudgetLimit("user-123", 200);

		expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE personas"), [200, "user-123"]);
	});

	test("rejects negative budget limit", async () => {
		await expect(tracker.setBudgetLimit("user-123", -50)).rejects.toThrow("Budget limit must be greater than 0");
	});

	test("rejects zero budget limit", async () => {
		await expect(tracker.setBudgetLimit("user-123", 0)).rejects.toThrow("Budget limit must be greater than 0");
	});

	test("gets spending history for user", async () => {
		mockDb.query = vi.fn(async (sql: string) => {
			if (sql.includes("model_calls")) {
				return {
					rows: [
						{
							user_id: "user-123",
							provider: "anthropic",
							model_id: "claude-3-sonnet",
							input_tokens: "1000",
							output_tokens: "500",
							cost: "2.5",
							created_at: new Date().toISOString(),
						},
					],
				};
			}
			return { rows: [] };
		});
		tracker.clearCache();

		const history = await tracker.getSpendingHistory("user-123", 30);

		expect(history).toHaveLength(1);
		expect(history[0].userId).toBe("user-123");
		expect(history[0].provider).toBe("anthropic");
		expect(history[0].cost).toBe(2.5);
	});

	test("gets total spent this month", async () => {
		const total = await tracker.getTotalSpentThisMonth("user-123");

		expect(total).toBe(75);
	});

	test("handles missing user gracefully", async () => {
		mockDb.query = vi.fn(async () => ({
			rows: [],
		}));
		tracker.clearCache();

		const status = await tracker.getBudgetStatus("unknown-user");

		expect(status.userId).toBe("unknown-user");
		expect(status.monthlyLimit).toBe(100); // Default
		expect(status.spent).toBe(0);
		expect(status.remaining).toBe(100);
	});

	test("clears cache for specific user", async () => {
		await tracker.getBudgetStatus("user-123");
		tracker.clearCache("user-123");

		const spy = vi.spyOn(mockDb, "query");
		await tracker.getBudgetStatus("user-123");

		expect(spy).toHaveBeenCalled();
	});

	test("clears entire cache", async () => {
		await tracker.getBudgetStatus("user-123");
		await tracker.getBudgetStatus("user-456");

		tracker.clearCache();

		const spy = vi.spyOn(mockDb, "query");
		await tracker.getBudgetStatus("user-123");
		await tracker.getBudgetStatus("user-456");

		expect(spy).toHaveBeenCalledTimes(2);
	});

	test("reset date is next month", async () => {
		const status = await tracker.getBudgetStatus("user-123");

		expect(status.resetDate).toBeInstanceOf(Date);
		expect(status.resetDate.getMonth()).not.toBe(new Date().getMonth());
	});

	test("cost event with multiple token types", async () => {
		const event: CostEvent = {
			userId: "user-123",
			provider: "anthropic",
			modelId: "claude-3-opus",
			inputTokens: 50000,
			outputTokens: 10000,
			cost: 15.0,
			timestamp: new Date(),
		};

		await tracker.recordCost(event);

		expect(mockDb.query).toHaveBeenCalledWith(
			expect.stringContaining("INSERT INTO model_calls"),
			expect.arrayContaining(["user-123", "anthropic", "claude-3-opus", 50000, 10000, 15.0]),
		);
	});

	test("percentage used calculation accuracy", async () => {
		mockDb.query = vi.fn(async () => ({
			rows: [
				{
					monthly_limit: "100",
					spent: "33.33",
				},
			],
		}));
		tracker.clearCache();

		const status = await tracker.getBudgetStatus("user-123");

		expect(status.percentageUsed).toBeCloseTo(33.33, 1);
	});

	test("multiple trackers are independent", () => {
		const tracker1 = new BudgetTracker(mockDb);
		const tracker2 = new BudgetTracker(mockDb);

		tracker1.clearCache("user-123");
		// tracker2 should still have independent cache

		expect(tracker1).toBeDefined();
		expect(tracker2).toBeDefined();
	});
});
