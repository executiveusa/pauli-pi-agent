import { test } from "node:test";
import assert from "node:assert";
import { GroundingService } from "../src/services/grounding.js";
import type { YouTubeVideo } from "../src/types.js";

const mockVideo: YouTubeVideo = {
  id: "v1",
  title: "Machine Learning Basics",
  description: "Introduction to machine learning concepts",
  channelName: "ML Channel",
  publishedAt: new Date(),
  watchedAt: new Date(),
  durationSeconds: 600,
  embedding: new Array(384).fill(0),
  importanceScore: 0.5,
  prerequisiteForVideoIds: [],
  relatedVideoIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  watchedCount: 1,
};

test("GroundingService verifies matching claims", async () => {
  const service = new GroundingService();
  const result = await service.verifyCitation("Machine Learning", [mockVideo]);
  assert.strictEqual(result.isGrounded, true);
  assert.strictEqual(result.accuracy, 0.95);
});

test("GroundingService rejects non-matching claims", async () => {
  const service = new GroundingService();
  const result = await service.verifyCitation("quantum physics xyz", [mockVideo]);
  assert.strictEqual(result.isGrounded, false);
  assert.strictEqual(result.accuracy, 0);
});
