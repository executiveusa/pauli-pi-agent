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

  async getVideosByIds(ids: string[]): Promise<YouTubeVideo[]> {
    if (!ids.length) return [];
    const { data, error } = await this.supabase
      .from("youtube_videos")
      .select("*")
      .in("id", ids);
    if (error) throw error;
    return (data as YouTubeVideo[]) ?? [];
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
    const [videoRes, conceptRes, importanceRes, accuracyRes] = await Promise.all([
      this.supabase.from("youtube_videos").select("id", { count: "exact", head: true }),
      this.supabase.from("knowledge_concepts").select("id", { count: "exact", head: true }),
      this.supabase.from("youtube_videos").select("importance_score"),
      this.supabase.from("conversation_history").select("citation_accuracy"),
    ]);

    const totalVideos = (videoRes as { count: number | null }).count ?? 0;
    const totalConcepts = (conceptRes as { count: number | null }).count ?? 0;

    const importanceRows =
      (importanceRes.data as Array<{ importance_score: number }> | null) ?? [];
    const avgImportance = importanceRows.length
      ? importanceRows.reduce((s, r) => s + (r.importance_score ?? 0), 0) /
        importanceRows.length
      : 0;

    const accuracyRows =
      (accuracyRes.data as Array<{ citation_accuracy: number }> | null) ?? [];
    const avgAccuracy = accuracyRows.length
      ? accuracyRows.reduce((s, r) => s + (r.citation_accuracy ?? 0), 0) /
        accuracyRows.length
      : 0;

    return {
      totalVideos,
      totalConcepts,
      totalRelationships: 0,
      averageImportanceScore: avgImportance,
      citationAccuracy: avgAccuracy,
      responseQualityScore: 0,
      learningVelocity: 0,
      graphDensity: totalVideos > 0 ? totalConcepts / totalVideos : 0,
      generatedAt: new Date(),
    };
  }

  async health(): Promise<boolean> {
    const { error } = await this.supabase.from("youtube_videos").select("id").limit(1);
    return !error;
  }
}

export default SupabaseService;
