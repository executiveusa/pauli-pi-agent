/**
 * Video Analyzer
 * Coordinates video analysis: processing, transcription, scene detection
 */

import type { ProcessingResult, VideoFrame } from "./processor.js";
import type { ExtractedTranscript, TranscriptSegment } from "./transcript.js";
import type { SceneAnalysis, DetectedScene } from "./scene.js";
import { VideoProcessor } from "./processor.js";
import { TranscriptExtractor } from "./transcript.js";
import { SceneDetector } from "./scene.js";

export interface VideoInsight {
	keyMoments: Array<{ time: number; description: string; confidence: number }>;
	themes: string[];
	summary: string;
	sentiment?: string;
}

export interface AnalysisResult {
	videoPath: string;
	processing: ProcessingResult;
	transcript: ExtractedTranscript;
	scenes: SceneAnalysis;
	insights: VideoInsight;
	totalDuration: number;
	completedAt: Date;
	totalProcessingTimeMs: number;
	success: boolean;
	error?: string;
}

export class VideoAnalyzer {
	private processor: VideoProcessor;
	private transcriptExtractor: TranscriptExtractor;
	private sceneDetector: SceneDetector;

	constructor(
		processor: VideoProcessor = new VideoProcessor(),
		transcriptExtractor: TranscriptExtractor = new TranscriptExtractor(),
		sceneDetector: SceneDetector = new SceneDetector(),
	) {
		this.processor = processor;
		this.transcriptExtractor = transcriptExtractor;
		this.sceneDetector = sceneDetector;
	}

	async analyze(videoPath: string): Promise<AnalysisResult> {
		const startTime = Date.now();

		try {
			// Step 1: Process video frames
			const processingResult = await this.processor.process(videoPath);

			if (!processingResult.success) {
				return {
					videoPath,
					processing: processingResult,
					transcript: {} as ExtractedTranscript,
					scenes: {} as SceneAnalysis,
					insights: { keyMoments: [], themes: [], summary: "" },
					totalDuration: 0,
					completedAt: new Date(),
					totalProcessingTimeMs: Date.now() - startTime,
					success: false,
					error: processingResult.error,
				};
			}

			// Step 2: Extract transcript
			const transcript = await this.transcriptExtractor.extract(videoPath);

			// Step 3: Detect scenes
			const totalFrames = processingResult.totalFrames;
			const fps = processingResult.metadata?.fps || 30;
			const scenes = await this.sceneDetector.detect(videoPath, totalFrames, fps);

			// Step 4: Generate insights
			const insights = this.generateInsights(processingResult, transcript, scenes);

			return {
				videoPath,
				processing: processingResult,
				transcript,
				scenes,
				insights,
				totalDuration: transcript.totalDuration,
				completedAt: new Date(),
				totalProcessingTimeMs: Date.now() - startTime,
				success: true,
			};
		} catch (error) {
			return {
				videoPath,
				processing: {} as ProcessingResult,
				transcript: {} as ExtractedTranscript,
				scenes: {} as SceneAnalysis,
				insights: { keyMoments: [], themes: [], summary: "" },
				totalDuration: 0,
				completedAt: new Date(),
				totalProcessingTimeMs: Date.now() - startTime,
				success: false,
				error: String(error),
			};
		}
	}

	private generateInsights(
		_processing: ProcessingResult,
		transcript: ExtractedTranscript,
		scenes: SceneAnalysis,
	): VideoInsight {
		// Generate key moments from scene transitions and transcript
		const keyMoments = scenes.transitionPoints.map((t) => ({
			time: t.frameNumber / 30,
			description: `Scene transition at frame ${t.frameNumber}`,
			confidence: t.confidence,
		}));

		// Extract themes from transcript
		const words = transcript.fullText.toLowerCase().split(/\s+/);
		const uniqueWords = [...new Set(words)].filter((w) => w.length > 5).slice(0, 5);

		return {
			keyMoments,
			themes: uniqueWords,
			summary: transcript.fullText.substring(0, 200),
		};
	}

	async analyzeBatch(videoPaths: string[]): Promise<AnalysisResult[]> {
		const results: AnalysisResult[] = [];
		const concurrency = 2;

		for (let i = 0; i < videoPaths.length; i += concurrency) {
			const batch = videoPaths.slice(i, i + concurrency);
			const batchResults = await Promise.all(batch.map((path) => this.analyze(path)));
			results.push(...batchResults);
		}

		return results;
	}

	compareFrames(frame1: VideoFrame, frame2: VideoFrame): number {
		// Calculate similarity score between two frames (0-1)
		// Placeholder implementation
		return Math.random();
	}

	extractSegmentSummary(segments: TranscriptSegment[]): string {
		// Extract summary from transcript segments
		return segments.map((s) => s.text).join(" ").substring(0, 500);
	}

	getAnalysisMetrics(result: AnalysisResult): {
		framesPerSecond: number;
		transcriptWordCount: number;
		sceneCount: number;
		avgSceneDuration: number;
	} {
		return {
			framesPerSecond: result.processing.metadata?.fps || 0,
			transcriptWordCount: result.transcript.wordCount || 0,
			sceneCount: result.scenes.scenes?.length || 0,
			avgSceneDuration:
				result.scenes.scenes && result.scenes.scenes.length > 0
					? result.scenes.scenes.reduce((sum, s) => sum + s.duration, 0) / result.scenes.scenes.length
					: 0,
		};
	}
}

export function createVideoAnalyzer(): VideoAnalyzer {
	return new VideoAnalyzer();
}
