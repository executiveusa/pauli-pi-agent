import { describe, it } from "node:test";
import assert from "node:assert";
import { TokenBudgeter } from "../src/token-budgeter.js";
import { MythosLoopPhase } from "../src/types.js";

describe("TokenBudgeter", () => {
	const budgeter = new TokenBudgeter();

	it("should create budget with phase allocations", () => {
		const budget = budgeter.createBudget(10000);

		assert.strictEqual(budget.total, 10000);
		assert.strictEqual(budget.remaining, 10000);
		assert.equal(budget.overflowWarning, false);
		assert(budget.allocated.size > 0);
	});

	it("should track phase usage", () => {
		const budget = budgeter.createBudget(8000);
		budgeter.recordPhaseUsage(budget, MythosLoopPhase.UNDERSTAND, 500);

		assert.strictEqual(budget.spent.get(MythosLoopPhase.UNDERSTAND), 500);
		assert.strictEqual(budget.remaining, 7500);
	});

	it("should allocate tokens per phase", () => {
		const budget = budgeter.createBudget(10000);

		assert(budget.allocated.get(MythosLoopPhase.UNDERSTAND)! > 0);
		assert(budget.allocated.get(MythosLoopPhase.PACKAGE)! > 0);
	});

	it("should check allocation feasibility", () => {
		const budget = budgeter.createBudget(5000);

		const canAllocate = budgeter.canAllocateForPhase(budget, MythosLoopPhase.UNDERSTAND, 100);
		assert.equal(canAllocate, true);
	});

	it("should estimate tokens for phases", () => {
		const tokens = budgeter.estimateTokensForPhase(
			MythosLoopPhase.ANALYZE,
			500,
			200
		);

		assert(tokens > 0);
	});
});
