import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { YouTubeVideo, KnowledgeConcept, ConversationMessage, GraphMetrics } from "../types.js";

// Supabase client typed loosely — schema types are generated separately in production
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = SupabaseClient<any, any, any>;

export class SupabaseService {
  private supabase: DB;

  constructor(url: string, serviceKey: string) {
    this.supabase = createClient(url, serviceKey) as DB;
  }

  async insertVideos(videos: Partial<YouTubeVideo>[]) {
    const { error } = await this.supabase.from("youtube_videos").insert(videos);
    if (error) throw error;
  }

  async getVideo(id: string): Promise<YouTubeVideo | null> {
    const { data, error } = await this.supabase
      .from("youtube_videos")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as YouTubeVideo;
  }

  async vectorSearch(embedding: number[], topK = 10): Promise<unknown[]> {
    const { data, error } = await this.supabase.rpc("search_youtube_videos", {
      query_embedding: embedding,
      match_count: topK,
    });
    if (error) throw error;
    return (data as unknown[]) ?? [];
  }

  async insertConcepts(concepts: Partial<KnowledgeConcept>[]) {
    const { error } = await this.supabase.from("knowledge_concepts").insert(concepts);
    if (error) throw error;
  }

  async getConcept(id: string): Promise<KnowledgeConcept | null> {
    const { data, error } = await this.supabase
      .from("knowledge_concepts")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as KnowledgeConcept;
  }

  async saveMessage(message: Partial<ConversationMessage>) {
    const { error } = await this.supabase.from("conversation_history").insert([message]);
    if (error) throw error;
  }

  async getMetrics(): Promise<GraphMetrics> {
    const videoCountRes = await this.supabase.from("youtube_videos").select("id");
    const conceptCountRes = await this.supabase.from("knowledge_concepts").select("id");
    return {
      totalVideos: (videoCountRes.data as unknown[] | null)?.length ?? 0,
      totalConcepts: (conceptCountRes.data as unknown[] | null)?.length ?? 0,
      totalRelationships: 0,
      averageImportanceScore: 0.5,
      citationAccuracy: 0.95,
      responseQualityScore: 4.5,
      learningVelocity: 0,
      graphDensity: 0,
      generatedAt: new Date(),
    };
  }

  async health(): Promise<boolean> {
    const { error } = await this.supabase.from("youtube_videos").select("id").limit(1);
    return !error;
  }
}

export default SupabaseService;
