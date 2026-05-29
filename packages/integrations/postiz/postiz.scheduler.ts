import type { PostizPost } from "./postiz.types.js";
import { PostizClient } from "./postiz.client.js";

export class PostizScheduler {
  private client = new PostizClient();

  async queueApprovedPosts(posts: PostizPost[]): Promise<PostizPost[]> {
    const results: PostizPost[] = [];
    for (const post of posts) {
      const outcome = await this.client.schedulePost(post);
      results.push(outcome.post);
    }
    return results;
  }
}
