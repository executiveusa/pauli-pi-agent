export interface LeadRecord {
  businessName: string;
  hasWebsite: boolean;
  websiteStatus: "active" | "broken" | "outdated" | "none";
  googleReviews: number;
  niche: string;
  location: string;
  emailContact?: string;
}

export function calculateLeadScore(lead: LeadRecord): number {
  let score = 0;

  // Has reviews, meaning active local business
  if (lead.googleReviews >= 15) score += 30;
  if (lead.googleReviews <= 350) score += 20; // Sweet spot for SMB niches

  // Pain points: website broken or missing
  if (lead.websiteStatus === "none" || lead.websiteStatus === "broken") {
    score += 40;
  } else if (lead.websiteStatus === "outdated") {
    score += 20;
  }

  // Active email contact exists
  if (lead.emailContact) score += 10;

  return score;
}
