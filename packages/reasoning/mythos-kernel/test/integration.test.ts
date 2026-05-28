import { describe, it } from "node:test";
import assert from "node:assert";
import { MythosKernelController } from "../src/mythos-kernel.controller.js";
import { MythosDepth, MythosLoopPhase, MythosRiskLevel } from "../src/types.js";
import type { MythosKernelConfig } from "../src/types.js";

describe("MythosKernelController Integration", () => {
	const config: MythosKernelConfig = {
		enabled: true,
		defaultDepth: MythosDepth.NORMAL,
		maxLoops: 5,
		traceEnabled: false,
		personaRouterEnabled: true,
		evidencePolicy: "balanced",
		confidenceThresholds: {
			minTaskConfidence: 0.7,
			minGoalConfidence: 0.6,
			minCritiquesPass: 0.75,
			minDecisionConfidence: 0.8,
		},
		tokenBudgetPerDepth: new Map([
			[MythosDepth.INSTANT, 2000],
			[MythosDepth.FAST, 4000],
			[MythosDepth.NORMAL, 8000],
			[MythosDepth.DEEP, 15000],
			[MythosDepth.MYTHIC, 25000],
		]),
		costBudgetPerDepth: new Map([
			[MythosDepth.INSTANT, 0.05],
			[MythosDepth.FAST, 0.1],
			[MythosDepth.NORMAL, 0.2],
			[MythosDepth.DEEP, 0.5],
			[MythosDepth.MYTHIC, 1.0],
		]),
	};

	const controller = new MythosKernelController(config);

	it("should initialize goal packet from user query", async () => {
		const packet = await controller.initializeGoalPacket("What is machine learning?");

		assert.ok(packet.id);
		assert.strictEqual(packet.userQuery, "What is machine learning?");
		assert.ok(packet.taskType);
		assert.ok(packet.initialDepth);
	});

	it("should initialize loop state", async () => {
		const packet = await controller.initializeGoalPacket("Analyze this code");
		const state = await controller.initializeLoopState(packet);

		assert.strictEqual(state.loopNumber, 1);
		assert.strictEqual(state.currentPhase, MythosLoopPhase.UNDERSTAND);
		assert.strictEqual(state.depth, packet.initialDepth);
		assert.strictEqual(state.shouldContinue, true);
	});

	it("should evaluate halt policy", async () => {
		const packet = await controller.initializeGoalPacket("Simple query");
		const state = await controller.initializeLoopState(packet);

		const result = controller.evaluateHalt(packet, state, 1000);

		assert.ok(typeof result.shouldHalt === "boolean");
		assert.ok(result.reason.length > 0);
	});

	it("should build valid output package", async () => {
		const packet = await controller.initializeGoalPacket("What is AI?");
		const state = await controller.initializeLoopState(packet);

		const output = await controller.buildOutput(
			packet,
			state,
			"AI is artificial intelligence",
			0.85
		);

		assert.strictEqual(output.goalPacketId, packet.id);
		assert(output.finalAnswer.length > 0);
		assert.equal(output.confidence, 0.85);
		assert.equal(output.loopsUsed, 1);
	});

	it("should track token usage across phases", async () => {
		const packet = await controller.initializeGoalPacket("Code generation task");
		const state = await controller.initializeLoopState(packet);

		const initialRemaining = state.tokenBudget.remaining;
		const phaseAllocation = state.tokenBudget.allocated.get(MythosLoopPhase.UNDERSTAND) || 0;

		assert(initialRemaining > 0);
		assert(phaseAllocation > 0);
		assert.strictEqual(
			state.tokenBudget.total,
			initialRemaining
		);
	});

	it("should register and use phase handlers", async () => {
		const packet = await controller.initializeGoalPacket("Test query");
		const state = await controller.initializeLoopState(packet);

		let handlerCalled = false;

		controller.registerPhaseHandler(MythosLoopPhase.UNDERSTAND, async () => {
			handlerCalled = true;
			return {
				phase: MythosLoopPhase.UNDERSTAND,
				success: true,
				duration: 100,
				tokensUsed: 500,
				confidence: 0.9,
				output: { test: "result" },
			};
		});

		await controller.executePhase(MythosLoopPhase.UNDERSTAND, state, packet);

		assert.equal(handlerCalled, true);
	});

	it("should update configuration", () => {
		const originalDepth = controller.getConfig().defaultDepth;
		controller.updateConfig({ defaultDepth: MythosDepth.DEEP });

		assert.strictEqual(controller.getConfig().defaultDepth, MythosDepth.DEEP);

		// Restore
		controller.updateConfig({ defaultDepth: originalDepth });
	});

	it("should evaluate stability", async () => {
		const packet1 = await controller.initializeGoalPacket("Simple task");
		const packet2 = await controller.initializeGoalPacket("Simple task");
		const state = await controller.initializeLoopState(packet1);

		const result = controller.evaluateStability(packet1, packet2, state);

		assert.ok(typeof result.isStable === "boolean");
		assert.ok(Array.isArray(result.violations));
	});

	it("should maintain configuration with custom tokens", async () => {
		const customConfig: MythosKernelConfig = {
			enabled: true,
			defaultDepth: MythosDepth.DEEP,
			maxLoops: 7,
			traceEnabled: true,
			personaRouterEnabled: true,
			evidencePolicy: "strict",
			confidenceThresholds: {
				minTaskConfidence: 0.8,
				minGoalConfidence: 0.7,
				minCritiquesPass: 0.85,
				minDecisionConfidence: 0.9,
			},
			tokenBudgetPerDepth: new Map([
				[MythosDepth.NORMAL, 12000],
			]),
			costBudgetPerDepth: new Map([
				[MythosDepth.NORMAL, 0.3],
			]),
		};

		const customController = new MythosKernelController(customConfig);
		assert.strictEqual(customController.getConfig().maxLoops, 7);
		assert.strictEqual(customController.getConfig().evidencePolicy, "strict");
	});
});
