import { test } from "node:test";
import assert from "node:assert";
import { EmbeddingsService } from "../src/services/embeddings.js";

test("Cosine similarity of identical vectors", () => {
  const service = new EmbeddingsService();
  const a = new Array(1024).fill(1);
  const b = new Array(1024).fill(1);
  const similarity = service.cosineSimilarity(a, b);
  assert(similarity > 0.99, `Expected > 0.99, got ${similarity}`);
});

test("Cosine similarity of orthogonal vectors", () => {
  const service = new EmbeddingsService();
  const a = new Array(1024).fill(0);
  const b = new Array(1024).fill(0);
  a[0] = 1;
  b[1] = 1;
  assert.strictEqual(service.cosineSimilarity(a, b), 0);
});

test("Hash fallback produces deterministic 1024-dim vector", async () => {
  const service = new EmbeddingsService(); // no API key → hash fallback
  const v1 = await service.embedText("machine learning fundamentals");
  const v2 = await service.embedText("machine learning fundamentals");
  assert.strictEqual(v1.length, 1024);
  assert.deepStrictEqual(v1, v2);
});

test("Hash fallback produces distinct vectors for different texts", async () => {
  const service = new EmbeddingsService();
  const v1 = await service.embedText("machine learning");
  const v2 = await service.embedText("cooking recipes");
  assert.notDeepStrictEqual(v1, v2);
});

test("embedBatch returns one vector per text", async () => {
  const service = new EmbeddingsService();
  const results = await service.embedBatch(["text one", "text two", "text three"]);
  assert.strictEqual(results.length, 3);
  for (const v of results) assert.strictEqual(v.length, 1024);
});
