import type { PostizPost, PostizChannel, PostizCampaign } from "./postiz.types.js";
import { DEFAULT_POSTIZ_POLICY, validatePostForPublishing } from "./postiz.policy.js";

export class PostizClient {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.POSTIZ_API_URL ?? "http://localhost:3000/api/v1";
    this.apiKey = process.env.POSTIZ_API_KEY ?? "mock-postiz-key";
  }

  async getChannels(): Promise<PostizChannel[]> {
    return [
      { id: "ch-1", name: "Twitter / Bambu", platform: "twitter", connected: true },
      { id: "ch-2", name: "LinkedIn / Agency", platform: "linkedin", connected: true }
    ];
  }

  async createDraftPost(post: Omit<PostizPost, "status">): Promise<PostizPost> {
    const draft: PostizPost = {
      ...post,
      id: `post-${Math.random().toString(36).substr(2, 9)}`,
      status: "draft"
    };
    return draft;
  }

  async schedulePost(post: PostizPost): Promise<{ success: boolean; message: string; post: PostizPost }> {
    const validation = validatePostForPublishing(post, DEFAULT_POSTIZ_POLICY);
    if (!validation.safe) {
      return {
        success: false,
        message: validation.reason ?? "Blocked by approval policy",
        post: { ...post, status: "failed" }
      };
    }

    return {
      success: true,
      message: "Post successfully scheduled",
      post: { ...post, status: "scheduled" }
    };
  }
}
