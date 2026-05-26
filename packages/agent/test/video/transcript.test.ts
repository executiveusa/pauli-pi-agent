/**
 * Transcript Extractor Tests
 * Verify transcript extraction, segmentation, and processing
 */

import { beforeEach, describe, expect, test } from "vitest";
import { TranscriptExtractor } from "../../src/video/transcript.js";

describe("TranscriptExtractor", () => {
	let extractor: TranscriptExtractor;

	beforeEach(() => {
		extractor = new TranscriptExtractor();
	});

	test("creates transcript extractor", () => {
		expect(extractor).toBeDefined();
	});

	test("extracts transcript from video", async () => {
		const result = await extractor.extract("test-video.mp4");

		expect(result).toBeDefined();
		expect(result.videoPath).toBe("test-video.mp4");
		expect(result.segments).toBeInstanceOf(Array);
		expect(result.segments.length).toBeGreaterThan(0);
	});

	test("generates transcript segments", async () => {
		const segments = await extractor.extractSegments("test-video.mp4");

		expect(segments).toBeInstanceOf(Array);
		expect(segments.length).toBeGreaterThan(0);

		for (const segment of segments) {
			expect(segment).toHaveProperty("startTime");
			expect(segment).toHaveProperty("endTime");
			expect(segment).toHaveProperty("text");
			expect(segment.endTime).toBeGreaterThan(segment.startTime);
		}
	});

	test("merges segments into full text", async () => {
		const segments = await extractor.extractSegments("test-video.mp4");
		const merged = extractor.mergeSegments(segments);

		expect(merged).toBeDefined();
		expect(typeof merged).toBe("string");
		expect(merged.length).toBeGreaterThan(0);
	});

	test("calculates word count", async () => {
		const result = await extractor.extract("test-video.mp4");

		expect(result.wordCount).toBeGreaterThan(0);
		const splitWords = result.fullText.split(/\s+/).filter((w) => w.length > 0);
		expect(result.wordCount).toBe(splitWords.length);
	});

	test("filters segments by confidence", async () => {
		const segments = await extractor.extractSegments("test-video.mp4");
		const filtered = extractor.filterByConfidence(segments, 0.9);

		expect(filtered).toBeInstanceOf(Array);
		for (const segment of filtered) {
			expect((segment.confidence ?? 1) >= 0.9).toBe(true);
		}
	});

	test("calculates segment duration", async () => {
		const segments = await extractor.extractSegments("test-video.mp4");

		for (const segment of segments) {
			const duration = extractor.getSegmentDuration(segment);
			expect(duration).toBe(segment.endTime - segment.startTime);
			expect(duration).toBeGreaterThan(0);
		}
	});

	test("calculates reading time", () => {
		const readingTime = extractor.calculateReadingTime(1000, 200);
		expect(readingTime).toBe(5);

		const readingTime2 = extractor.calculateReadingTime(250, 200);
		expect(readingTime2).toBe(2);
	});

	test("extracts batch of transcripts", async () => {
		const paths = ["video1.mp4", "video2.mp4", "video3.mp4"];
		const results = await extractor.extractBatch(paths);

		expect(results).toHaveLength(3);
		for (const result of results) {
			expect(result.segments).toBeDefined();
			expect(result.fullText).toBeDefined();
			expect(result.wordCount).toBeGreaterThan(0);
		}
	});

	test("stores extraction metadata", async () => {
		const result = await extractor.extract("test-video.mp4");

		expect(result.extractedAt).toBeInstanceOf(Date);
		expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
		expect(result.languageCode).toBeDefined();
	});

	test("handles empty segments", async () => {
		const segments: typeof extractor extends TranscriptExtractor ? any : never = [];
		const merged = extractor.mergeSegments(segments);

		expect(merged).toBeDefined();
	});

	test("segment confidence is between 0 and 1", async () => {
		const segments = await extractor.extractSegments("test-video.mp4");

		for (const segment of segments) {
			expect(segment.confidence).toBeGreaterThanOrEqual(0);
			expect(segment.confidence).toBeLessThanOrEqual(1);
		}
	});

	test("segments have speaker information", async () => {
		const segments = await extractor.extractSegments("test-video.mp4");

		for (const segment of segments) {
			expect(segment.speaker).toBeDefined();
		}
	});

	test("calculates total duration from segments", async () => {
		const result = await extractor.extract("test-video.mp4");

		expect(result.totalDuration).toBeGreaterThanOrEqual(0);

		if (result.segments.length > 0) {
			const lastSegment = result.segments[result.segments.length - 1];
			expect(result.totalDuration).toBe(lastSegment.endTime);
		}
	});

	test("includes segment text content", async () => {
		const segments = await extractor.extractSegments("test-video.mp4");

		for (const segment of segments) {
			expect(segment.text).toBeDefined();
			expect(segment.text.length).toBeGreaterThan(0);
		}
	});
});
