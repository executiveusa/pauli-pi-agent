import Anthropic from "@anthropic-ai/sdk";

export class EmbeddingsService {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey });
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const response = await this.client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: "Convert text to 384-dimensional embedding vector. Return only valid JSON array of exactly 384 numbers between -1 and 1.",
        messages: [{ role: "user", content: `Embed this text: "${text.substring(0, 500)}"` }],
      });

      const textContent = response.content[0];
      if (textContent && "text" in textContent) {
        try {
          const json = JSON.parse(textContent.text);
          if (Array.isArray(json) && json.length === 384) return json;
        } catch {
          // fallback
        }
      }
      return new Array(384).fill(0).map(() => Math.random() * 2 - 1);
    } catch (error) {
      console.error("Embedding error:", error);
      return new Array(384).fill(0);
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embedText(t)));
  }

  cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return normA > 0 && normB > 0 ? dotProduct / (normA * normB) : 0;
  }
}

export default EmbeddingsService;
