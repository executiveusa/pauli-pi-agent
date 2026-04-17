import { test } from "node:test";
import assert from "node:assert";
import { YouTubeVideoSchema, KnowledgeConceptSchema } from "../src/types.js";

test("YouTubeVideo schema validation", () => {
  const video = {
    id: "test",
    title: "Test Video",
    description: "Test",
    channelName: "Test Channel",
    publishedAt: new Date(),
    watchedAt: new Date(),
    durationSeconds: 100,
    embedding: new Array(384).fill(0),
  };
  const result = YouTubeVideoSchema.parse(video);
  assert.strictEqual(result.id, "test");
  assert.strictEqual(result.embedding.length, 384);
});

test("KnowledgeConcept schema validation", () => {
  const concept = {
    id: "ml",
    name: "Machine Learning",
    description: "AI subcategory",
    embedding: new Array(384).fill(0),
  };
  const result = KnowledgeConceptSchema.parse(concept);
  assert.strictEqual(result.name, "Machine Learning");
  assert.strictEqual(result.embedding.length, 384);
});
