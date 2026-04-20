import { test } from "node:test";
import assert from "node:assert";
import { GroundingService } from "../src/services/grounding.js";
import type { YouTubeVideo } from "../src/types.js";

const mockVideo: YouTubeVideo = {
  id: "v1",
  title: "Machine Learning Basics",
  description: "Introduction to machine learning concepts and neural networks",
  channelName: "ML Channel",
  publishedAt: new Date(),
  watchedAt: new Date(),
  durationSeconds: 600,
  embedding: new Array(1024).fill(0),
  importanceScore: 0.5,
  prerequisiteForVideoIds: [],
  relatedVideoIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  watchedCount: 1,
};

test("GroundingService verifies matching claims", async () => {
  const service = new GroundingService();
  const result = await service.verifyCitation("machine learning basics", [mockVideo]);
  assert.strictEqual(result.isGrounded, true);
  assert(result.accuracy > 0, `Expected accuracy > 0, got ${result.accuracy}`);
});

test("GroundingService rejects non-matching claims", async () => {
  const service = new GroundingService();
  const result = await service.verifyCitation("quantum physics astrophysics", [mockVideo]);
  assert.strictEqual(result.isGrounded, false);
  assert.strictEqual(result.accuracy, 0);
});

test("GroundingService groundAnswerInVideos returns proportion", async () => {
  const service = new GroundingService();
  const answer = "Machine learning is covered. Neural networks basics explained. Quantum physics unrelated.";
  const score = await service.groundAnswerInVideos(answer, [mockVideo]);
  assert(score >= 0 && score <= 1, `Expected [0,1], got ${score}`);
  assert(score > 0, "Expected some grounding for ML-related answer");
});
