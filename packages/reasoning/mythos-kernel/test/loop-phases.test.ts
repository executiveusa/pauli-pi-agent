import { describe, it } from "node:test";
import assert from "node:assert";
import { LoopPhaseOrchestrator } from "../src/loop-phases.js";
import { MythosLoopPhase } from "../src/types.js";

describe("LoopPhaseOrchestrator", () => {
	const orchestrator = new LoopPhaseOrchestrator();

	it("should return correct phase sequence", () => {
		const sequence = orchestrator.getPhaseSequence();

		assert.strictEqual(sequence[0], MythosLoopPhase.UNDERSTAND);
		assert.strictEqual(sequence[sequence.length - 1], MythosLoopPhase.PACKAGE);
		assert.strictEqual(sequence.length, 9);
	});

	it("should track phase dependencies", () => {
		const deps = orchestrator.getDependencies(MythosLoopPhase.RETRIEVE);

		assert(deps.includes(MythosLoopPhase.UNDERSTAND));
	});

	it("should get next phase", () => {
		const next = orchestrator.getNextPhase(MythosLoopPhase.UNDERSTAND);

		assert.strictEqual(next, MythosLoopPhase.RETRIEVE);
	});

	it("should validate phase ordering", () => {
		const validOrder = [MythosLoopPhase.UNDERSTAND, MythosLoopPhase.RETRIEVE];
		assert.equal(orchestrator.validatePhaseOrder(validOrder), true);

		const invalidOrder = [MythosLoopPhase.RETRIEVE, MythosLoopPhase.UNDERSTAND];
		assert.equal(orchestrator.validatePhaseOrder(invalidOrder), false);
	});
});
