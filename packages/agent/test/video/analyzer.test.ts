/**
 * Video Analyzer Tests
 * Verify comprehensive video analysis and coordination
 */

import { describe, expect, test, beforeEach, vi } from "vitest";
import { VideoAnalyzer } from "../../src/video/analyzer.js";
import { VideoProcessor } from "../../src/video/processor.js";
import { TranscriptExtractor } from "../../src/video/transcript.js";
import { SceneDetector } from "../../src/video/scene.js";

describe("VideoAnalyzer", () => {
	let analyzer: VideoAnalyzer;

	beforeEach(() => {
		analyzer = new VideoAnalyzer();
	});

	test("creates video analyzer", () => {
		expect(analyzer).toBeDefined();
	});

	test("analyzes complete video", async () => {
		const result = await analyzer.analyze("test-video.mp4");

		expect(result).toBeDefined();
		expect(result.videoPath).toBe("test-video.mp4");
		expect(result.success).toBe(true);
		expect(result.processing).toBeDefined();
		expect(result.transcript).toBeDefined();
		expect(result.scenes).toBeDefined();
		expect(result.insights).toBeDefined();
	});

	test("includes processing results", async () => {
		const result = await analyzer.analyze("test-video.mp4");

		expect(result.processing).toHaveProperty("success");
		expect(result.processing).toHaveProperty("filePath");
		expect(result.processing).toHaveProperty("metadata");
		expect(result.processing).toHaveProperty("sampledFrames");
	});

	test("includes transcript results", async () => {
		const result = await analyzer.analyze("test-video.mp4");

		expect(result.transcript).toHaveProperty("segments");
		expect(result.transcript).toHaveProperty("fullText");
		expect(result.transcript).toHaveProperty("wordCount");
	});

	test("includes scene detection results", async () => {
		const result = await analyzer.analyze("test-video.mp4");

		expect(result.scenes).toHaveProperty("scenes");
		expect(result.scenes).toHaveProperty("keyFrames");
		expect(result.scenes).toHaveProperty("transitionPoints");
	});

	test("generates insights", async () => {
		const result = await analyzer.analyze("test-video.mp4");

		expect(result.insights).toHaveProperty("keyMoments");
		expect(result.insights).toHaveProperty("themes");
		expect(result.insights).toHaveProperty("summary");
		expect(result.insights.keyMoments).toBeInstanceOf(Array);
		expect(result.insights.themes).toBeInstanceOf(Array);
	});

	test("calculates total processing time", async () => {
		const result = await analyzer.analyze("test-video.mp4");

		expect(result.totalProcessingTimeMs).toBeGreaterThanOrEqual(0);
	});

	test("records completion date", async () => {
		const result = await analyzer.analyze("test-video.mp4");

		expect(result.completedAt).toBeInstanceOf(Date);
	});

	test("analyzes multiple videos in batch", async () => {
		const paths = ["video1.mp4", "video2.mp4", "video3.mp4"];
		const results = await analyzer.analyzeBatch(paths);

		expect(results).toHaveLength(3);
		for (const result of results) {
			expect(result.processing).toBeDefined();
			expect(result.transcript).toBeDefined();
			expect(result.scenes).toBeDefined();
		}
	});

	test("handles analysis failure", async () => {
		const mockProcessor = vi.fn(() => ({
			success: false,
			filePath: "bad-video.mp4",
			totalFrames: 0,
			sampledFrames: [],
			processingTimeMs: 0,
			error: "Invalid video",
		}));

		const analyzer2 = new VideoAnalyzer(
			{
				process: mockProcessor as any,
				processBatch: vi.fn(),
				estimateFramesNeeded: vi.fn(),
				calculateTimestamp: vi.fn(),
			} as any,
			new TranscriptExtractor(),
			new SceneDetector(),
		);

		const result = await analyzer2.analyze("bad-video.mp4");

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});

	test("compares frames", () => {
		const frame1 = {
			frameNumber: 0,
			timestamp: 0,
			duration: 33,
			width: 1920,
			height: 1080,
		};
		const frame2 = {
			frameNumber: 1,
			timestamp: 33,
			duration: 33,
			width: 1920,
			height: 1080,
		};

		const similarity = analyzer.compareFrames(frame1, frame2);

		expect(similarity).toBeGreaterThanOrEqual(0);
		expect(similarity).toBeLessThanOrEqual(1);
	});

	test("extracts segment summary", async () => {
		const segments = [
			{ startTime: 0, endTime: 1000, text: "Hello world", confidence: 0.9 },
			{ startTime: 1000, endTime: 2000, text: "This is a test", confidence: 0.85 },
			{ startTime: 2000, endTime: 3000, text: "Sample content", confidence: 0.88 },
		];

		const summary = analyzer.extractSegmentSummary(segments);

		expect(summary).toBeDefined();
		expect(typeof summary).toBe("string");
		expect(summary.length).toBeGreaterThan(0);
	});

	test("calculates analysis metrics", async () => {
		const result = await analyzer.analyze("test-video.mp4");

		const metrics = analyzer.getAnalysisMetrics(result);

		expect(metrics).toHaveProperty("framesPerSecond");
		expect(metrics).toHaveProperty("transcriptWordCount");
		expect(metrics).toHaveProperty("sceneCount");
		expect(metrics).toHaveProperty("avgSceneDuration");
		expect(metrics.transcriptWordCount).toBeGreaterThanOrEqual(0);
		expect(metrics.sceneCount).toBeGreaterThanOrEqual(0);
	});

	test("stores total duration", async () => {
		const result = await analyzer.analyze("test-video.mp4");

		expect(result.totalDuration).toBeGreaterThanOrEqual(0);
	});

	test("uses provided dependencies", () => {
		const processor = new VideoProcessor();
		const extractor = new TranscriptExtractor();
		const detector = new SceneDetector();

		const analyzer2 = new VideoAnalyzer(processor, extractor, detector);

		expect(analyzer2).toBeDefined();
	});

	test("scene count matches detected scenes", async () => {
		const result = await analyzer.analyze("test-video.mp4");
		const metrics = analyzer.getAnalysisMetrics(result);

		expect(metrics.sceneCount).toBe(result.scenes.scenes.length);
	});

	test("key moments reference frame numbers", async () => {
		const result = await analyzer.analyze("test-video.mp4");

		for (const moment of result.insights.keyMoments) {
			expect(moment).toHaveProperty("time");
			expect(moment).toHaveProperty("description");
			expect(moment).toHaveProperty("confidence");
		}
	});

	test("analysis includes all processing stages", async () => {
		const result = await analyzer.analyze("test-video.mp4");

		expect(result.processing.metadata).toBeDefined();
		expect(result.transcript.segments).toBeDefined();
		expect(result.scenes.keyFrames).toBeDefined();
		expect(result.insights.summary).toBeDefined();
	});
});
