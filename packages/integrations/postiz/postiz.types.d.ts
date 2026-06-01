export interface PostizPost {
    id?: string;
    content: string;
    publishAt?: string;
    mediaUrls?: string[];
    channels?: string[];
    status: "draft" | "scheduled" | "published" | "failed";
}
export interface PostizChannel {
    id: string;
    name: string;
    platform: "twitter" | "facebook" | "linkedin" | "instagram";
    connected: boolean;
}
export interface PostizCampaign {
    id: string;
    name: string;
    posts: PostizPost[];
}
//# sourceMappingURL=postiz.types.d.ts.map