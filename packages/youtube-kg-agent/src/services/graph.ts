import Anthropic from "@anthropic-ai/sdk";
import type { YouTubeVideo, KnowledgeConcept } from "../types.js";

export class ConceptService {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey });
  }

  async extractConcepts(video: YouTubeVideo) {
    try {
      const response = await this.client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Extract 5-10 key concepts from this video:
Title: ${video.title}
Description: ${video.description}

Return JSON with: { concepts: [{name: string, description: string, category: string}] }`,
        }],
      });

      const textContent = response.content[0];
      if (textContent && "text" in textContent) {
        try {
          const parsed = JSON.parse(textContent.text);
          return { concepts: parsed.concepts || [], videoId: video.id, extractedAt: new Date(), confidence: 0.85 };
        } catch {
          // fallback
        }
      }
      return { concepts: [], videoId: video.id, extractedAt: new Date(), confidence: 0 };
    } catch (error) {
      console.error("Concept extraction error:", error);
      return { concepts: [], videoId: video.id, extractedAt: new Date(), confidence: 0 };
    }
  }

  async buildRelationships(concepts: KnowledgeConcept[]) {
    return concepts;
  }
}

export default ConceptService;
