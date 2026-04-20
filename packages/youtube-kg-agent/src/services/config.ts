import type { AgentConfig } from "../types.js";

export const DEFAULT_CONFIG: AgentConfig = {
  ingestBatchSize: 50,
  embeddingDimension: 1024,
  vectorSearchTopK: 10,
  graphHopDepth: 3,
  citationAccuracyThreshold: 0.95,
  qualityRatingThreshold: 4.5,
  citationAccuracyTarget: 0.95,
  learningCompoundFactor: 1.1,
  anthropicModel: "claude-3-5-sonnet-20241022",
  youtubeApiQuotaPerDay: 10000,
};

export function loadConfig(): AgentConfig {
  return DEFAULT_CONFIG;
}
