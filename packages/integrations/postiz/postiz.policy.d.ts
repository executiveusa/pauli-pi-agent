import type { PostizPost } from "./postiz.types.js";
export interface PublishPolicy {
    requireApprovalByDefault: boolean;
    sandboxMode: boolean;
    autoPublishChannels: string[];
}
export declare const DEFAULT_POSTIZ_POLICY: PublishPolicy;
export declare function validatePostForPublishing(post: PostizPost, policy: PublishPolicy): {
    safe: boolean;
    reason?: string;
};
//# sourceMappingURL=postiz.policy.d.ts.map