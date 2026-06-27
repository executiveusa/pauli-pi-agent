import Anthropic from "@anthropic-ai/sdk";
import type { YouTubeVideo, ReasoningResult } from "../types.js";
import { GroundingService } from "./grounding.js";

export class ReasoningEngine {
  private client: Anthropic;
  private grounding = new GroundingService();

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey });
  }

  async query(question: string, videos: YouTubeVideo[]): Promise<ReasoningResult> {
    const context = videos
      .slice(0, 8)
      .map(
        (v, i) =>
          `[${i + 1}] "${v.title}" by ${v.channelName}\n${v.description.substring(0, 300)}`
      )
      .join("\n\n");

    try {
      const response = await this.client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        system:
          "You are a knowledge assistant answering questions from a user's YouTube watch history. " +
          "Cite videos by their title using [N] notation matching the numbered list. Be specific about what each video covers.",
        messages: [
          {
            role: "user",
            content: `Question: ${question}\n\nRelevant videos from watch history:\n\n${context}\n\nAnswer citing specific videos.`,
          },
        ],
      });

      const textContent = response.content[0];
      const answer =
        textContent && "text" in textContent ? textContent.text : "No answer generated";

      const citationAccuracy = await this.grounding.groundAnswerInVideos(answer, videos);

      const sources = videos
        .slice(0, 5)
        .map((v, i) => ({
          videoId: v.id,
          title: v.title,
          relevance: answer.includes(v.title) || answer.includes(`[${i + 1}]`) ? 1.0 : Math.max(0.1, 0.5 - i * 0.1),
        }))
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 3);

      return {
        answer,
        videoSources: sources,
        conceptsInvolved: [],
        reasoningDepth: Math.min(videos.length, 8),
        citationAccuracy,
      };
    } catch (error) {
      console.error("Reasoning error:", error);
      return {
        answer: "Error processing query",
        videoSources: [],
        conceptsInvolved: [],
        reasoningDepth: 0,
        citationAccuracy: 0,
      };
    }
  }
}

export default ReasoningEngine;
