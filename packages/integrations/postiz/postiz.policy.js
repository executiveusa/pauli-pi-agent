export const DEFAULT_POSTIZ_POLICY = {
    requireApprovalByDefault: true,
    sandboxMode: process.env.NODE_ENV !== "production",
    autoPublishChannels: [],
};
export function validatePostForPublishing(post, policy) {
    if (policy.sandboxMode) {
        return { safe: true, reason: "Sandbox mode active. Post routed to mock queue." };
    }
    if (policy.requireApprovalByDefault && !post.channels?.includes("auto-approved")) {
        return { safe: false, reason: "Post requires human approval before live publishing." };
    }
    return { safe: true };
}
//# sourceMappingURL=postiz.policy.js.map