import { DEFAULT_POSTIZ_POLICY, validatePostForPublishing } from "./postiz.policy.js";
export class PostizClient {
    baseURL;
    apiKey;
    constructor() {
        this.baseURL = process.env.POSTIZ_API_URL ?? "http://localhost:3000/api/v1";
        this.apiKey = process.env.POSTIZ_API_KEY ?? "mock-postiz-key";
    }
    async getChannels() {
        return [
            { id: "ch-1", name: "Twitter / Bambu", platform: "twitter", connected: true },
            { id: "ch-2", name: "LinkedIn / Agency", platform: "linkedin", connected: true }
        ];
    }
    async createDraftPost(post) {
        const draft = {
            ...post,
            id: `post-${Math.random().toString(36).substr(2, 9)}`,
            status: "draft"
        };
        return draft;
    }
    async schedulePost(post) {
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
//# sourceMappingURL=postiz.client.js.map