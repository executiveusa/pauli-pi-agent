import { EmbeddingsService } from "./embeddings.js";
import type { YouTubeVideo, SearchResult } from "../types.js";

export class SearchService {
  private embeddings: EmbeddingsService;

  constructor(apiKey?: string) {
    this.embeddings = new EmbeddingsService(apiKey);
  }

  async search(query: string, videos: YouTubeVideo[], topK = 10): Promise<SearchResult[]> {
    const queryEmbedding = await this.embeddings.embedText(query);
    const results: SearchResult[] = videos.map((video) => ({
      video,
      similarity: this.embeddings.cosineSimilarity(queryEmbedding, video.embedding),
      reasonForMatch: "Vector similarity match",
    }));
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }
}

export default SearchService;
