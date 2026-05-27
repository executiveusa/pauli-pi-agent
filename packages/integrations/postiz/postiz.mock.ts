import type { PostizPost } from "./postiz.types";

export class MockPostizServer {
  private queue: PostizPost[] = [];

  async pushToMockQueue(post: PostizPost): Promise<void> {
    this.queue.push({
      ...post,
      status: "scheduled"
    });
  }

  getQueue(): PostizPost[] {
    return this.queue;
  }
}
