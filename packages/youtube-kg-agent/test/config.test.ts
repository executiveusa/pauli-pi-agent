import { test } from "node:test";
import assert from "node:assert";
import { DEFAULT_CONFIG, loadConfig } from "../src/services/config.js";

test("DEFAULT_CONFIG has required fields", () => {
  assert.strictEqual(typeof DEFAULT_CONFIG.ingestBatchSize, "number");
  assert.strictEqual(DEFAULT_CONFIG.embeddingDimension, 384);
  assert.strictEqual(DEFAULT_CONFIG.citationAccuracyTarget, 0.95);
});

test("loadConfig returns valid config", () => {
  const config = loadConfig();
  assert(config.graphHopDepth > 0);
  assert(config.vectorSearchTopK > 0);
});
