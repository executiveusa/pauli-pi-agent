/**
 * Scene Detector Tests
 * Verify scene detection, transitions, and key frame extraction
 */

import { describe, expect, test, beforeEach } from "vitest";
import { SceneDetector } from "../../src/video/scene.js";

describe("SceneDetector", () => {
	let detector: SceneDetector;

	beforeEach(() => {
		detector = new SceneDetector();
	});

	test("creates scene detector", () => {
		expect(detector).toBeDefined();
	});

	test("detects scenes in video", async () => {
		const analysis = await detector.detect("test-video.mp4", 1000, 30);

		expect(analysis).toBeDefined();
		expect(analysis.videoPath).toBe("test-video.mp4");
		expect(analysis.scenes).toBeInstanceOf(Array);
		expect(analysis.scenes.length).toBeGreaterThan(0);
	});

	test("detects individual scenes", async () => {
		const scenes = await detector.detectScenes("test-video.mp4");

		expect(scenes).toBeInstanceOf(Array);
		expect(scenes.length).toBeGreaterThan(0);

		for (const scene of scenes) {
			expect(scene).toHaveProperty("sceneNumber");
			expect(scene).toHaveProperty("startFrame");
			expect(scene).toHaveProperty("endFrame");
			expect(scene).toHaveProperty("startTime");
			expect(scene).toHaveProperty("endTime");
			expect(scene.endFrame).toBeGreaterThan(scene.startFrame);
		}
	});

	test("extracts key frames from scenes", async () => {
		const analysis = await detector.detect("test-video.mp4", 1000, 30);

		expect(analysis.keyFrames).toBeInstanceOf(Array);
		expect(analysis.keyFrames.length).toBeGreaterThan(0);

		for (const frame of analysis.keyFrames) {
			expect(frame).toHaveProperty("frameNumber");
			expect(frame).toHaveProperty("timestamp");
			expect(frame).toHaveProperty("confidence");
		}
	});

	test("finds scene transitions", async () => {
		const analysis = await detector.detect("test-video.mp4", 1000, 30);

		expect(analysis.transitionPoints).toBeInstanceOf(Array);

		for (const transition of analysis.transitionPoints) {
			expect(transition).toHaveProperty("frameNumber");
			expect(transition).toHaveProperty("confidence");
			expect(transition.confidence).toBeGreaterThan(0);
			expect(transition.confidence).toBeLessThanOrEqual(1);
		}
	});

	test("calculates scene duration", async () => {
		const analysis = await detector.detect("test-video.mp4", 1000, 30);

		for (const scene of analysis.scenes) {
			const duration = detector.getSceneDuration(scene);
			expect(duration).toBe(scene.duration);
			expect(duration).toBeGreaterThan(0);
		}
	});

	test("scene key frames have confidence scores", async () => {
		const analysis = await detector.detect("test-video.mp4", 1000, 30);

		for (const scene of analysis.scenes) {
			for (const frame of scene.keyFrames) {
				expect(frame.confidence).toBeGreaterThanOrEqual(0);
				expect(frame.confidence).toBeLessThanOrEqual(1);
			}
		}
	});

	test("detects batch of videos", async () => {
		const paths = ["video1.mp4", "video2.mp4", "video3.mp4"];
		const results = await detector.detectBatch(paths);

		expect(results).toHaveLength(3);
		for (const result of results) {
			expect(result.scenes).toBeDefined();
			expect(result.keyFrames).toBeDefined();
		}
	});

	test("stores analysis metadata", async () => {
		const analysis = await detector.detect("test-video.mp4", 1000, 30);

		expect(analysis.analysisDate).toBeInstanceOf(Date);
		expect(analysis.processingTimeMs).toBeGreaterThanOrEqual(0);
	});

	test("scene has description", async () => {
		const analysis = await detector.detect("test-video.mp4", 1000, 30);

		for (const scene of analysis.scenes) {
			expect(scene.description).toBeDefined();
		}
	});

	test("transition confidence is valid", async () => {
		const analysis = await detector.detect("test-video.mp4", 1000, 30);

		for (const transition of analysis.transitionPoints) {
			const confidence = detector.getSceneTransitionConfidence(transition);
			expect(confidence).toBeGreaterThanOrEqual(0);
			expect(confidence).toBeLessThanOrEqual(1);
		}
	});

	test("key frames have timestamps", async () => {
		const analysis = await detector.detect("test-video.mp4", 1000, 30);

		for (const frame of analysis.keyFrames) {
			expect(frame.timestamp).toBeGreaterThanOrEqual(0);
			expect(frame.frameNumber).toBeGreaterThanOrEqual(0);
		}
	});

	test("scenes are ordered by number", async () => {
		const analysis = await detector.detect("test-video.mp4", 1000, 30);

		for (let i = 0; i < analysis.scenes.length - 1; i++) {
			expect(analysis.scenes[i].sceneNumber).toBeLessThan(analysis.scenes[i + 1].sceneNumber);
		}
	});

	test("scene frames do not overlap", async () => {
		const analysis = await detector.detect("test-video.mp4", 1000, 30);

		for (let i = 0; i < analysis.scenes.length - 1; i++) {
			expect(analysis.scenes[i].endFrame).toBeLessThanOrEqual(analysis.scenes[i + 1].startFrame);
		}
	});

	test("key frames are within scene boundaries", async () => {
		const analysis = await detector.detect("test-video.mp4", 1000, 30);

		for (const scene of analysis.scenes) {
			for (const frame of scene.keyFrames) {
				expect(frame.frameNumber).toBeGreaterThanOrEqual(scene.startFrame);
				expect(frame.frameNumber).toBeLessThanOrEqual(scene.endFrame);
			}
		}
	});
});
