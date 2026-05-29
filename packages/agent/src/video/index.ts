/**
 * Video Analysis Module
 * Exports: video processor, transcript extractor, scene detector
 */

export type { AnalysisResult, VideoInsight } from "./analyzer.js";
export { createVideoAnalyzer, VideoAnalyzer } from "./analyzer.js";
export type { ProcessingResult, VideoFrame, VideoMetadata } from "./processor.js";
export { createVideoProcessor, VideoProcessor } from "./processor.js";
export type { DetectedScene, SceneAnalysis, SceneFrame } from "./scene.js";
export { createSceneDetector, SceneDetector } from "./scene.js";
export type { ExtractedTranscript, TranscriptSegment } from "./transcript.js";
export { createTranscriptExtractor, TranscriptExtractor } from "./transcript.js";
