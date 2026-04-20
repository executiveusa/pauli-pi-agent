import { test } from "node:test";
import assert from "node:assert";
import { SearchService } from "../src/services/search.js";
import type { YouTubeVideo } from "../src/types.js";

const makeVideo = (id: string, title: string): YouTubeVideo => ({
  id,
  title,
  description: title,
  channelName: "Channel",
  publishedAt: new Date(),
  watchedAt: new Date(),
  durationSeconds: 300,
  embedding: new Array(1024).fill(0).map((_, i) => (i === 0 ? 1 : 0)),
  importanceScore: 0.5,
  prerequisiteForVideoIds: [],
  relatedVideoIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  watchedCount: 1,
});

test("SearchService in-memory search returns sorted results", async () => {
  const service = new SearchService(); // no API key, no supabase → in-memory hash
  const videos = [makeVideo("v1", "AI fundamentals"), makeVideo("v2", "Python cooking")];
  const results = await service.search("test query", videos, 2);
  assert.strictEqual(results.length, 2);
  assert(results[0].similarity >= results[1].similarity);
});

test("SearchService returns empty array when no videos and no supabase", async () => {
  const service = new SearchService();
  const results = await service.search("anything");
  assert.deepStrictEqual(results, []);
});
