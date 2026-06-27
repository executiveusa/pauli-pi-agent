import { describe, expect, it } from "vitest";
import { buildMercuryPayload } from "../../src/mercury/mercury-stream.js";

describe("buildMercuryPayload", () => {
	it("sets model, stream, and stream_options by default", () => {
		const payload = buildMercuryPayload({ messages: [] });
		expect(payload.stream).toBe(true);
		expect(payload.stream_options).toMatchObject({ include_usage: true });
		expect(typeof payload.model).toBe("string");
	});

	it("injects diffusing: true when diffusing=true", () => {
		const payload = buildMercuryPayload({ messages: [], diffusing: true });
		expect(payload.diffusing).toBe(true);
	});

	it("does not include diffusing key when diffusing=false", () => {
		const payload = buildMercuryPayload({ messages: [], diffusing: false });
		expect(payload).not.toHaveProperty("diffusing");
	});

	it("includes reasoning_effort when provided", () => {
		const payload = buildMercuryPayload({ messages: [], reasoningEffort: "low" });
		expect(payload.reasoning_effort).toBe("low");
	});

	it("omits reasoning_effort when not provided", () => {
		const payload = buildMercuryPayload({ messages: [] });
		expect(payload).not.toHaveProperty("reasoning_effort");
	});

	it("uses provided model name", () => {
		const payload = buildMercuryPayload({ messages: [], model: "mercury-2-mini" });
		expect(payload.model).toBe("mercury-2-mini");
	});

	it("includes max_tokens when provided", () => {
		const payload = buildMercuryPayload({ messages: [], maxTokens: 1024 });
		expect(payload.max_tokens).toBe(1024);
	});

	it("omits max_tokens when not provided", () => {
		const payload = buildMercuryPayload({ messages: [] });
		expect(payload).not.toHaveProperty("max_tokens");
	});

	it("includes messages in payload", () => {
		const payload = buildMercuryPayload({ messages: [] });
		expect(Array.isArray(payload.messages)).toBe(true);
	});
});
