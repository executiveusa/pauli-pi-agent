import assert from "node:assert";
import { test } from "vitest";
import { ReasoningEngine } from "../src/services/reasoning.js";

test.skipIf(!process.env.ANTHROPIC_API_KEY)("ReasoningEngine can query", async () => {
	const engine = new ReasoningEngine();
	const result = await engine.query("What is AI?", []);
	assert(typeof result.answer === "string");
	assert(result.citationAccuracy >= 0);
	assert(result.citationAccuracy <= 1);
});
