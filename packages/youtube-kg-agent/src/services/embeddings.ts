interface VoyageEmbedding {
  embedding: number[];
}

interface VoyageResponse {
  data: VoyageEmbedding[];
}

export class EmbeddingsService {
  private apiKey: string | undefined;
  private readonly model = "voyage-3";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || undefined;
  }

  async embedText(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      return texts.map((t) => this.hashEmbed(t));
    }

    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Voyage API ${response.status}: ${body}`);
    }

    const data = (await response.json()) as VoyageResponse;
    return data.data.map((d) => d.embedding);
  }

  // Deterministic 1024-dim fallback when no API key is set (useful for tests/dev)
  private hashEmbed(text: string): number[] {
    const dim = 1024;
    const vec = new Array<number>(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      vec[i % dim] += text.charCodeAt(i) / 255;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }

  cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((s, v, i) => s + v * b[i], 0);
    const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    return normA > 0 && normB > 0 ? dot / (normA * normB) : 0;
  }
}

export default EmbeddingsService;
