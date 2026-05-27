import { z } from "zod";

export const YouTubeVideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(""),
  channelName: z.string(),
  publishedAt: z.coerce.date(),
  watchedAt: z.coerce.date(),
  durationSeconds: z.number().int().positive(),
  thumbnailUrl: z.string().optional(),
  embedding: z.array(z.number()).length(384),
  topicCategory: z.string().optional(),
  importanceScore: z.number().min(0).max(1).default(0.5),
  prerequisiteForVideoIds: z.array(z.string()).default([]),
  relatedVideoIds: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  watchedCount: z.number().int().nonnegative().default(1),
});

export type YouTubeVideo = z.infer<typeof YouTubeVideoSchema>;

export const KnowledgeConceptSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string().optional(),
  embedding: z.array(z.number()).length(384),
  importanceScore: z.number().min(0).max(1).default(0.5),
  parentConceptIds: z.array(z.string()).default([]),
  childConceptIds: z.array(z.string()).default([]),
  videoIds: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type KnowledgeConcept = z.infer<typeof KnowledgeConceptSchema>;

export const ConversationMessageSchema = z.object({
  id: z.bigint(),
  sessionId: z.string(),
  userMessage: z.string(),
  assistantResponse: z.string(),
  relevantVideoIds: z.array(z.string()).default([]),
  conceptIds: z.array(z.string()).default([]),
  citationAccuracy: z.number().min(0).max(1),
  userRating: z.number().min(1).max(5).optional(),
  createdAt: z.date().default(() => new Date()),
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

export interface SearchResult {
  video: YouTubeVideo;
  similarity: number;
  reasonForMatch: string;
}

export interface ReasoningResult {
  answer: string;
  videoSources: Array<{
    videoId: string;
    title: string;
    relevance: number;
  }>;
  conceptsInvolved: string[];
  reasoningDepth: number;
  citationAccuracy: number;
}

export interface GraphMetrics {
  totalVideos: number;
  totalConcepts: number;
  totalRelationships: number;
  averageImportanceScore: number;
  citationAccuracy: number;
  responseQualityScore: number;
  learningVelocity: number;
  graphDensity: number;
  generatedAt: Date;
}

export interface AgentConfig {
  ingestBatchSize: number;
  embeddingDimension: number;
  vectorSearchTopK: number;
  graphHopDepth: number;
  citationAccuracyThreshold: number;
  qualityRatingThreshold: number;
  citationAccuracyTarget: number;
  learningCompoundFactor: number;
  anthropicModel: string;
  youtubeApiQuotaPerDay: number;
}
