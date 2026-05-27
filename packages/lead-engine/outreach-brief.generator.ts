import type { LeadRecord } from "./lead-scoring";

export class OutreachBriefGenerator {
  generateDraftEmail(lead: LeadRecord): string {
    return `
Subject: Value-in-Advance: Custom AI-Powered Directory Listing for ${lead.businessName}

Hi Team,

I am writing to share that we have mapped a custom luxury directory listing profile for ${lead.businessName} on our Puerto Vallarta AI travel board.

We noticed that your current mobile user experience has a few SEO gaps and lacks instant booking. We have pre-wired a custom AI widget for your profile. 

You can claim this listing 100% free here: [Claim Profile Link]

Warmly,
Future-Proof Autonomous Agency Team
`;
  }
}
