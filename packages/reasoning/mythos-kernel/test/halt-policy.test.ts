import { describe, it } from "node:test";
import assert from "node:assert";
import { HaltPolicy } from "../src/halt-policy.js";
import { MythosDepth } from "../src/types.js";
import { GoalPacketFactory } from "../src/goal-packet.js";
import type { LoopState } from "../src/types.js";
import { MythosLoopPhase, MythosRiskLevel } from "../src/types.js";

describe("HaltPolicy", () => {
	const policy = new HaltPolicy();

	it("should evaluate halt based on max loops", () => {
		const packet = GoalPacketFactory.create({
			userQuery: "Test",
			taskType: "analysis",
			initialDepth: MythosDepth.NORMAL,
			maxDepth: MythosDepth.DEEP,
			maxLoops: 3,
			tokenBudget: 10000,
			costBudget: 0.5,
		});

		const state: LoopState = {
			loopNumber: 3,
			currentPhase: MythosLoopPhase.UNDERSTAND,
			depth: MythosDepth.NORMAL,
			phaseResults: [],
			accumulatedMessages: [],
			tokenBudget: { total: 10000, allocated: new Map(), spent: new Map(), remaining: 9000, overflowWarning: false, overflowThreshold: 0.9 },
			riskLevel: MythosRiskLevel.LOW,
			shouldContinue: true,
		};

		const criteria = policy.getHaltCriteria(packet);
		const decision = policy.evaluateHalt(packet, state, 0, criteria);

		assert.equal(decision.shouldHalt, true);
	});

	it("should get remaining loops estimate", () => {
		const state: LoopState = {
			loopNumber: 2,
			currentPhase: MythosLoopPhase.UNDERSTAND,
			depth: MythosDepth.NORMAL,
			phaseResults: [],
			accumulatedMessages: [],
			tokenBudget: { total: 10000, allocated: new Map(), spent: new Map(), remaining: 5000, overflowWarning: false, overflowThreshold: 0.9 },
			riskLevel: MythosRiskLevel.LOW,
			shouldContinue: true,
		};

		const remaining = policy.getEstimatedLoopsRemaining(state, 5);
		assert.strictEqual(remaining, 3);
	});
});
