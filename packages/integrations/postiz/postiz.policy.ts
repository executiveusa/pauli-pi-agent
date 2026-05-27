import type { PostizPost } from "./postiz.types";

export interface PublishPolicy {
  requireApprovalByDefault: boolean;
  sandboxMode: boolean;
  autoPublishChannels: string[];
}

export const DEFAULT_POSTIZ_POLICY: PublishPolicy = {
  requireApprovalByDefault: true,
  sandboxMode: process.env.NODE_ENV !== "production",
  autoPublishChannels: [],
};

export function validatePostForPublishing(post: PostizPost, policy: PublishPolicy): { safe: boolean; reason?: string } {
  if (policy.sandboxMode) {
    return { safe: true, reason: "Sandbox mode active. Post routed to mock queue." };
  }
  
  if (policy.requireApprovalByDefault && !post.channels?.includes("auto-approved")) {
    return { safe: false, reason: "Post requires human approval before live publishing." };
  }

  return { safe: true };
}
