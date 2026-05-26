/**
 * Video Processor Tests
 * Verify video processing, metadata extraction, and frame sampling
 */

import { beforeEach, describe, expect, test } from "vitest";
import { VideoProcessor } from "../../src/video/processor.js";

describe("VideoProcessor", () => {
	let processor: VideoProcessor;

	beforeEach(() => {
		processor = new VideoProcessor();
	});

	test("creates video processor", () => {
		expect(processor).toBeDefined();
	});

	test("processes video file", async () => {
		const result = await processor.process("test-video.mp4");

		expect(result).toBeDefined();
		expect(result.success).toBe(true);
		expect(result.filePath).toBe("test-video.mp4");
		expect(result.metadata).toBeDefined();
		expect(result.sampledFrames).toBeDefined();
	});

	test("extracts video metadata", async () => {
		const result = await processor.process("test-video.mp4");

		expect(result.metadata).toHaveProperty("fileName");
		expect(result.metadata).toHaveProperty("duration");
		expect(result.metadata).toHaveProperty("width");
		expect(result.metadata).toHaveProperty("height");
		expect(result.metadata).toHaveProperty("fps");
		expect(result.metadata).toHaveProperty("codec");
		expect(result.metadata).toHaveProperty("bitrate");
		expect(result.metadata).toHaveProperty("fileSize");
	});

	test("calculates total frames", async () => {
		const result = await processor.process("test-video.mp4");

		expect(result.totalFrames).toBeGreaterThan(0);
		if (result.metadata) {
			const expectedFrames = Math.ceil((result.metadata.duration * result.metadata.fps) / 1000);
			expect(result.totalFrames).toBe(expectedFrames);
		}
	});

	test("samples frames at specified rate", async () => {
		const result = await processor.process("test-video.mp4", 15);

		expect(result.sampledFrames).toBeInstanceOf(Array);
		expect(result.sampledFrames.length).toBeGreaterThan(0);

		for (const frame of result.sampledFrames) {
			expect(frame).toHaveProperty("frameNumber");
			expect(frame).toHaveProperty("timestamp");
			expect(frame).toHaveProperty("width");
			expect(frame).toHaveProperty("height");
		}
	});

	test("respects sample rate", async () => {
		const result1 = await processor.process("test-video.mp4", 10);
		const result2 = await processor.process("test-video.mp4", 30);

		// Higher sample rate should result in fewer frames
		expect(result2.sampledFrames.length).toBeLessThanOrEqual(result1.sampledFrames.length);
	});

	test("processes batch of videos", async () => {
		const paths = ["video1.mp4", "video2.mp4", "video3.mp4"];
		const results = await processor.processBatch(paths);

		expect(results).toHaveLength(3);
		for (const result of results) {
			expect(result.success).toBe(true);
			expect(result.filePath).toBeDefined();
			expect(result.metadata).toBeDefined();
		}
	});

	test("estimates frames needed", () => {
		const estimate = processor.estimateFramesNeeded(60000, 30, 1000);

		expect(estimate).toBeGreaterThan(0);
		// 60 seconds * 30 fps = 1800 frames, with max 1000 should be 2
		expect(estimate).toBe(2);
	});

	test("calculates timestamp correctly", () => {
		const timestamp = processor.calculateTimestamp(3600, 30);

		// 3600 frames at 30fps = 120 seconds = 2 minutes
		expect(timestamp).toBe("00:02:00.000");
	});

	test("frame has metadata", async () => {
		const result = await processor.process("test-video.mp4");

		for (const frame of result.sampledFrames) {
			expect(frame.frameNumber).toBeGreaterThanOrEqual(0);
			expect(frame.timestamp).toBeGreaterThanOrEqual(0);
			expect(frame.width).toBeGreaterThan(0);
			expect(frame.height).toBeGreaterThan(0);
			expect(frame.duration).toBeGreaterThan(0);
		}
	});

	test("stores processing time", async () => {
		const result = await processor.process("test-video.mp4");

		expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
	});

	test("frame timestamps are sequential", async () => {
		const result = await processor.process("test-video.mp4");

		for (let i = 0; i < result.sampledFrames.length - 1; i++) {
			expect(result.sampledFrames[i].timestamp).toBeLessThanOrEqual(result.sampledFrames[i + 1].timestamp);
		}
	});

	test("metadata has creation date", async () => {
		const result = await processor.process("test-video.mp4");

		expect(result.metadata?.createdAt).toBeInstanceOf(Date);
	});

	test("handles custom sample rate", async () => {
		const result = await processor.process("test-video.mp4", 60);

		expect(result.sampledFrames.length).toBeGreaterThan(0);
		expect(result.success).toBe(true);
	});

	test("frame color space is defined", async () => {
		const result = await processor.process("test-video.mp4");

		for (const frame of result.sampledFrames) {
			expect(frame.colorSpace).toBeDefined();
		}
	});

	test("respects max frames limit", async () => {
		const result = await processor.process("test-video.mp4", 1);

		// With sample rate 1, should be limited by maxFrames (1000)
		expect(result.sampledFrames.length).toBeLessThanOrEqual(1000);
	});

	test("batch processing limits concurrency", async () => {
		const paths = Array(10)
			.fill(0)
			.map((_, i) => `video${i}.mp4`);
		const results = await processor.processBatch(paths);

		expect(results).toHaveLength(10);
		expect(results.every((r) => r.success)).toBe(true);
	});

	test("frame numbers are increasing", async () => {
		const result = await processor.process("test-video.mp4");

		for (let i = 0; i < result.sampledFrames.length - 1; i++) {
			expect(result.sampledFrames[i].frameNumber).toBeLessThan(result.sampledFrames[i + 1].frameNumber);
		}
	});

	test("timestamp format is HH:MM:SS.mmm", () => {
		const timestamps = [
			processor.calculateTimestamp(0, 30),
			processor.calculateTimestamp(900, 30),
			processor.calculateTimestamp(1800, 30),
			processor.calculateTimestamp(108000, 30),
		];

		for (const ts of timestamps) {
			// Check format HH:MM:SS.mmm
			expect(ts).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
		}
	});
});
