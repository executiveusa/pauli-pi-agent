import assert from "node:assert";
import { test } from "node:test";
import { ReasoningEngine } from "../src/services/reasoning.js";

const skip = !process.env.ANTHROPIC_API_KEY ? "ANTHROPIC_API_KEY not set" : false;

test("ReasoningEngine can query", { skip }, async () => {
	const engine = new ReasoningEngine();
	const result = await engine.query("What is AI?", []);
	assert(typeof result.answer === "string");
	assert(result.citationAccuracy >= 0);
	assert(result.citationAccuracy <= 1);
});
