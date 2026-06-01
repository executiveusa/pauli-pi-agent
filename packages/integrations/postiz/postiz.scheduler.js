import { PostizClient } from "./postiz.client.js";
export class PostizScheduler {
    client = new PostizClient();
    async queueApprovedPosts(posts) {
        const results = [];
        for (const post of posts) {
            const outcome = await this.client.schedulePost(post);
            results.push(outcome.post);
        }
        return results;
    }
}
//# sourceMappingURL=postiz.scheduler.js.map