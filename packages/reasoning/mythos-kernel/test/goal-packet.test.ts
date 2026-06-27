import { describe, it } from "node:test";
import assert from "node:assert";
import { GoalPacketFactory } from "../src/goal-packet.js";
import { MythosDepth } from "../src/types.js";

describe("GoalPacketFactory", () => {
	it("should create a valid goal packet", () => {
		const packet = GoalPacketFactory.create({
			userQuery: "What is AI?",
			taskType: "simple_fact",
			initialDepth: MythosDepth.INSTANT,
			maxDepth: MythosDepth.NORMAL,
			maxLoops: 3,
			tokenBudget: 5000,
			costBudget: 0.1,
		});

		assert.ok(packet.id.startsWith("goal-"));
		assert.strictEqual(packet.userQuery, "What is AI?");
		assert.strictEqual(packet.taskType, "simple_fact");
	});

	it("should enforce immutability", () => {
		const packet = GoalPacketFactory.create({
			userQuery: "Test",
			taskType: "analysis",
			initialDepth: MythosDepth.NORMAL,
			maxDepth: MythosDepth.DEEP,
			maxLoops: 5,
			tokenBudget: 8000,
			costBudget: 0.2,
		});

		assert(GoalPacketFactory.isImmutable(packet));
		assert.throws(() => {
			// @ts-ignore
			packet.userQuery = "Modified";
		});
	});

	it("should enforce depth ordering", () => {
		assert.throws(() => {
			GoalPacketFactory.create({
				userQuery: "Test",
				taskType: "analysis",
				initialDepth: MythosDepth.MYTHIC,
				maxDepth: MythosDepth.NORMAL, // Invalid: max < initial
				maxLoops: 5,
				tokenBudget: 8000,
				costBudget: 0.2,
			});
		});
	});

	it("should validate goal packets", () => {
		const packet = GoalPacketFactory.create({
			userQuery: "Valid query",
			taskType: "code_generation",
			initialDepth: MythosDepth.NORMAL,
			maxDepth: MythosDepth.DEEP,
			maxLoops: 7,
			tokenBudget: 10000,
			costBudget: 0.5,
		});

		assert(GoalPacketFactory.validate(packet));
	});

	it("should reject invalid packets", () => {
		assert.equal(GoalPacketFactory.validate(null), false);
		assert.equal(GoalPacketFactory.validate({}), false);
		assert.equal(
			GoalPacketFactory.validate({
				userQuery: "", // Empty query
				taskType: "test",
				initialDepth: MythosDepth.NORMAL,
				maxDepth: MythosDepth.DEEP,
				maxLoops: 5,
				tokenBudget: 5000,
				costBudget: 0.1,
			}),
			false
		);
	});

	it("should include optional fields", () => {
		const packet = GoalPacketFactory.create({
			userQuery: "Complex task",
			taskType: "design",
			initialDepth: MythosDepth.DEEP,
			maxDepth: MythosDepth.MYTHIC,
			maxLoops: 6,
			tokenBudget: 15000,
			costBudget: 1.0,
			persona: "architect",
			constraints: { maxTime: 300 },
			evidenceRequirements: ["primary_source", "peer_review"],
		});

		assert.strictEqual(packet.persona, "architect");
		assert.ok(packet.constraints.maxTime);
		assert.strictEqual(packet.evidenceRequirements.length, 2);
	});

	it("should generate unique IDs", () => {
		const packet1 = GoalPacketFactory.create({
			userQuery: "Test 1",
			taskType: "analysis",
			initialDepth: MythosDepth.NORMAL,
			maxDepth: MythosDepth.DEEP,
			maxLoops: 4,
			tokenBudget: 6000,
			costBudget: 0.15,
		});

		const packet2 = GoalPacketFactory.create({
			userQuery: "Test 2",
			taskType: "analysis",
			initialDepth: MythosDepth.NORMAL,
			maxDepth: MythosDepth.DEEP,
			maxLoops: 4,
			tokenBudget: 6000,
			costBudget: 0.15,
		});

		assert.notEqual(packet1.id, packet2.id);
	});
});
