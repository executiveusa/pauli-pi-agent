import type { UGCProfile } from "./character-profile";

export interface PostizCampaignPost {
  content: string;
  publishAt: string;
  channels: string[];
  mediaUrls?: string[];
}

export class PostizCampaignBuilder {
  buildSocialCampaign(profile: UGCProfile, businessName: string, hookText: string): PostizCampaignPost {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      content: `🎬 NEW UGC REVIEW! 🎬 \n\n${hookText} \n\n#VallartaLuxury #TravelConcierge #TravelAI`,
      publishAt: tomorrow.toISOString(),
      channels: ["twitter", "linkedin"],
      mediaUrls: [`https://assets.pi-agency.dev/ugc/sofia-${profile.characterId}.mp4`]
    };
  }
}
