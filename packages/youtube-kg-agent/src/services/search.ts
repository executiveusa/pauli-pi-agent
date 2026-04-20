import { EmbeddingsService } from "./embeddings.js";
import type { SupabaseService } from "./supabase.js";
import type { YouTubeVideo, SearchResult } from "../types.js";

export class SearchService {
  private embeddings: EmbeddingsService;
  private supabase?: SupabaseService;

  constructor(apiKey?: string, supabase?: SupabaseService) {
    this.embeddings = new EmbeddingsService(apiKey);
    this.supabase = supabase;
  }

  async search(query: string, videos?: YouTubeVideo[], topK = 10): Promise<SearchResult[]> {
    const queryEmbedding = await this.embeddings.embedText(query);

    if (this.supabase) {
      const rows = (await this.supabase.vectorSearch(queryEmbedding, topK)) as Array<{
        id: string;
        title: string;
        similarity: number;
      }>;
      if (!rows.length) return [];
      const ids = rows.map((r) => r.id);
      const fullVideos = await this.supabase.getVideosByIds(ids);
      const simMap = new Map(rows.map((r) => [r.id, r.similarity]));
      return fullVideos
        .map((v) => ({
          video: v,
          similarity: simMap.get(v.id) ?? 0,
          reasonForMatch: "pgvector cosine similarity",
        }))
        .sort((a, b) => b.similarity - a.similarity);
    }

    // In-memory fallback when videos are passed directly (used in tests / local dev)
    if (!videos?.length) return [];
    return videos
      .map((v) => ({
        video: v,
        similarity: this.embeddings.cosineSimilarity(queryEmbedding, v.embedding),
        reasonForMatch: "In-memory cosine similarity",
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}

export default SearchService;
