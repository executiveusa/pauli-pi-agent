import type { PostizPost, PostizChannel } from "./postiz.types.js";
export declare class PostizClient {
    private baseURL;
    private apiKey;
    constructor();
    getChannels(): Promise<PostizChannel[]>;
    createDraftPost(post: Omit<PostizPost, "status">): Promise<PostizPost>;
    schedulePost(post: PostizPost): Promise<{
        success: boolean;
        message: string;
        post: PostizPost;
    }>;
}
//# sourceMappingURL=postiz.client.d.ts.map