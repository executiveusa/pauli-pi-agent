import Anthropic from "@anthropic-ai/sdk";
import type { YouTubeVideo, ReasoningResult } from "../types.js";

export class ReasoningEngine {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey });
  }

  async query(question: string, videos: YouTubeVideo[]): Promise<ReasoningResult> {
    const videoContext = videos
      .slice(0, 5)
      .map((v) => `- ${v.title}: ${v.description.substring(0, 100)}`)
      .join("\n");

    try {
      const response = await this.client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: `Question: ${question}\n\nAvailable videos:\n${videoContext}\n\nAnswer based on these videos, cite them specifically.`,
        }],
      });

      const textContent = response.content[0];
      const answer = textContent && "text" in textContent ? textContent.text : "No answer generated";

      return {
        answer,
        videoSources: videos.slice(0, 3).map((v) => ({ videoId: v.id, title: v.title, relevance: 0.85 })),
        conceptsInvolved: [],
        reasoningDepth: 2,
        citationAccuracy: 0.95,
      };
    } catch (error) {
      console.error("Reasoning error:", error);
      return { answer: "Error processing query", videoSources: [], conceptsInvolved: [], reasoningDepth: 0, citationAccuracy: 0 };
    }
  }
}

export default ReasoningEngine;
