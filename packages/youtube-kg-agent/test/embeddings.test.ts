import { test } from "node:test";
import assert from "node:assert";
import { EmbeddingsService } from "../src/services/embeddings.js";

test("EmbeddingsService cosine similarity", () => {
  const service = new EmbeddingsService("dummy");
  const a = new Array(384).fill(1);
  const b = new Array(384).fill(1);
  const similarity = service.cosineSimilarity(a, b);
  assert(similarity > 0.99, `Expected similarity > 0.99, got ${similarity}`);
});

test("Cosine similarity of orthogonal vectors", () => {
  const service = new EmbeddingsService("dummy");
  const a = new Array(384).fill(0);
  const b = new Array(384).fill(0);
  a[0] = 1;
  b[1] = 1;
  const similarity = service.cosineSimilarity(a, b);
  assert.strictEqual(similarity, 0);
});
