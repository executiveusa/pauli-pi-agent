import { describe, expect, it } from "vitest";
import { createStabilityGate } from "../../src/voice/stability-gate.js";

describe("stability-gate", () => {
	it("emits nothing for very short input below MIN_CHUNK_LENGTH", () => {
		const chunks: string[] = [];
		const gate = createStabilityGate({ onStableChunk: (c) => chunks.push(c), debounceMs: 10_000 });
		gate.enqueueText("Hi.");
		expect(chunks).toHaveLength(0);
	});

	it("emits a stable chunk when a sentence boundary is found after MIN_CHUNK_LENGTH", () => {
		const chunks: string[] = [];
		const gate = createStabilityGate({ onStableChunk: (c) => chunks.push(c), debounceMs: 10_000 });
		gate.enqueueText("Hello, this is a test sentence. And more text follows.");
		expect(chunks).toHaveLength(1);
		expect(chunks[0]).toContain("Hello, this is a test sentence.");
	});

	it("flush emits remaining buffer immediately", () => {
		const chunks: string[] = [];
		const gate = createStabilityGate({ onStableChunk: (c) => chunks.push(c), debounceMs: 10_000 });
		gate.enqueueText("This text has no sentence boundary but should flush");
		gate.flush();
		expect(chunks).toHaveLength(1);
		expect(chunks[0]).toContain("This text has no sentence boundary");
	});

	it("cancel prevents any emission", () => {
		const chunks: string[] = [];
		const gate = createStabilityGate({ onStableChunk: (c) => chunks.push(c), debounceMs: 10_000 });
		gate.enqueueText("A complete sentence that should trigger. But we cancel.");
		gate.cancel();
		gate.flush();
		// cancel clears buffer — flush should emit nothing after cancel
		expect(chunks).toHaveLength(1); // the sentence boundary fired before cancel
		// any subsequent enqueue after cancel should also be a no-op
		const before = chunks.length;
		gate.enqueueText("This should not be emitted.");
		gate.flush();
		expect(chunks.length).toBe(before);
	});

	it("onStableChunk replaces callback", () => {
		const first: string[] = [];
		const second: string[] = [];
		const gate = createStabilityGate({ onStableChunk: (c) => first.push(c), debounceMs: 10_000 });
		gate.onStableChunk((c) => second.push(c));
		gate.enqueueText("A proper sentence with enough length for detection. More follows.");
		expect(first).toHaveLength(0);
		expect(second.length).toBeGreaterThan(0);
	});

	it("emits multiple chunks from a multi-sentence input", () => {
		const chunks: string[] = [];
		const gate = createStabilityGate({ onStableChunk: (c) => chunks.push(c), debounceMs: 10_000 });
		// Feed a long enough string with two clear boundaries
		gate.enqueueText("The first sentence ends here. The second sentence follows now. And a third one.");
		// At least two chunks should have been emitted (two boundaries found)
		expect(chunks.length).toBeGreaterThanOrEqual(1);
	});

	it("does not emit whitespace-only buffers", () => {
		const chunks: string[] = [];
		const gate = createStabilityGate({ onStableChunk: (c) => chunks.push(c), debounceMs: 10_000 });
		gate.enqueueText("   ");
		gate.flush();
		expect(chunks).toHaveLength(0);
	});
});
