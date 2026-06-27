import { describe, it } from "node:test";
import assert from "node:assert";
import { StabilityGuard } from "../src/stability-guard.js";
import { GoalPacketFactory } from "../src/goal-packet.js";
import { MythosDepth, MythosLoopPhase, MythosRiskLevel } from "../src/types.js";

describe("StabilityGuard", () => {
	const guard = new StabilityGuard();

	it("should evaluate stability of goal packets", () => {
		const packet1 = GoalPacketFactory.create({
			userQuery: "Original query",
			taskType: "analysis",
			initialDepth: MythosDepth.NORMAL,
			maxDepth: MythosDepth.DEEP,
			maxLoops: 5,
			tokenBudget: 10000,
			costBudget: 0.5,
		});

		const packet2 = GoalPacketFactory.create({
			userQuery: "Original query",
			taskType: "analysis",
			initialDepth: MythosDepth.NORMAL,
			maxDepth: MythosDepth.DEEP,
			maxLoops: 5,
			tokenBudget: 10000,
			costBudget: 0.5,
		});

		const state: any = {
			loopNumber: 1,
			currentPhase: MythosLoopPhase.UNDERSTAND,
			depth: MythosDepth.NORMAL,
		};

		const result = guard.evaluate(packet1, packet2, state);
		assert.ok(typeof result.isStable === "boolean");
	});
});
