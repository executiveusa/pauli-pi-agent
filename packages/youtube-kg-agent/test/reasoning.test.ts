import { test } from "node:test";
import assert from "node:assert";
import { ReasoningEngine } from "../src/services/reasoning.js";

test("ReasoningEngine can query", async () => {
  const engine = new ReasoningEngine();
  const result = await engine.query("What is AI?", []);
  assert(typeof result.answer === "string");
  assert(result.citationAccuracy >= 0);
  assert(result.citationAccuracy <= 1);
});
