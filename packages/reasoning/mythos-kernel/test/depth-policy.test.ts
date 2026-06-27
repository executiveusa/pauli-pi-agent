import { describe, it } from "node:test";
import assert from "node:assert";
import { DepthPolicy } from "../src/depth-policy.js";
import { MythosDepth } from "../src/types.js";

describe("DepthPolicy", () => {
	const policy = new DepthPolicy();

	it("should evaluate depth within policy constraints", () => {
		const constraints = {
			maxDepth: MythosDepth.DEEP,
			allowedModes: ["balanced", "premium"],
			costLimit: 1.0,
			remainingBudget: 0.8,
		};

		const decision = policy.evaluateDepth(MythosDepth.NORMAL, constraints, 5000);
		assert.strictEqual(decision.approvedDepth, MythosDepth.NORMAL);
		assert.equal(decision.modelAvailable, true);
	});

	it("should downgrade depth if exceeds policy", () => {
		const constraints = {
			maxDepth: MythosDepth.NORMAL,
			allowedModes: ["free"],
			costLimit: 0.5,
			remainingBudget: 0.2,
		};

		const decision = policy.evaluateDepth(MythosDepth.MYTHIC, constraints, 5000);
		assert.strictEqual(decision.approvedDepth, MythosDepth.NORMAL);
		assert(decision.reasoning.includes("Downgraded"));
	});

	it("should estimate cost based on tokens and depth", () => {
		const constraints = {
			maxDepth: MythosDepth.MYTHIC,
			allowedModes: ["premium"],
			costLimit: 10.0,
			remainingBudget: 9.0,
		};

		const decision = policy.evaluateDepth(MythosDepth.DEEP, constraints, 10000);
		assert(decision.costEstimate > 0);
	});

	it("should downgrade depth to fit budget", () => {
		const constraints = {
			maxDepth: MythosDepth.MYTHIC,
			allowedModes: ["premium"],
			costLimit: 0.5,
			remainingBudget: 0.1, // Very limited budget
		};

		const decision = policy.evaluateDepth(MythosDepth.MYTHIC, constraints, 5000);
		// Should downgrade to something cheaper
		assert(
			decision.approvedDepth === MythosDepth.INSTANT ||
			decision.approvedDepth === MythosDepth.FAST
		);
	});

	it("should provide context window for depth", () => {
		const instant = policy.getContextWindowForDepth(MythosDepth.INSTANT);
		const mythic = policy.getContextWindowForDepth(MythosDepth.MYTHIC);

		assert(instant > 0);
		assert(mythic >= instant); // Mythic should have same or larger context
	});

	it("should indicate reasoning requirement for depths", () => {
		const instant = policy.requiresReasoningForDepth(MythosDepth.INSTANT);
		const mythic = policy.requiresReasoningForDepth(MythosDepth.MYTHIC);

		assert.equal(instant, false);
		assert.equal(mythic, true);
	});

	it("should include token estimate in decision", () => {
		const constraints = {
			maxDepth: MythosDepth.NORMAL,
			allowedModes: ["balanced"],
			costLimit: 1.0,
			remainingBudget: 0.9,
		};

		const decision = policy.evaluateDepth(MythosDepth.NORMAL, constraints, 7000);
		assert.strictEqual(decision.tokenEstimate, 7000);
	});

	it("should approve depths within both policy and budget", () => {
		const constraints = {
			maxDepth: MythosDepth.MYTHIC,
			allowedModes: ["premium"],
			costLimit: 5.0,
			remainingBudget: 4.5,
		};

		const decision = policy.evaluateDepth(MythosDepth.NORMAL, constraints, 5000);
		assert.equal(decision.modelAvailable, true);
		assert(decision.reasoning.includes("approved"));
	});
});
