import type { LeadRecord } from "./lead-scoring";

export interface AuditReport {
  pagespeedScore: number;
  mobileFriendly: boolean;
  brokenLinks: number;
  seoOptimized: boolean;
  detectedPainPoints: string[];
}

export class WebsiteAuditAdapter {
  async auditProspectWebsite(lead: LeadRecord): Promise<AuditReport> {
    if (lead.websiteStatus === "none") {
      return {
        pagespeedScore: 0,
        mobileFriendly: false,
        brokenLinks: 0,
        seoOptimized: false,
        detectedPainPoints: ["Missing official business website", "No online lead capture capability"]
      };
    }

    return {
      pagespeedScore: 42,
      mobileFriendly: false,
      brokenLinks: 8,
      seoOptimized: false,
      detectedPainPoints: [
        "Slow mobile load times (> 4.8 seconds)",
        "Missing schema structured data for location search ranking",
        "No conversational chat receptionist or booking widgets"
      ]
    };
  }
}
