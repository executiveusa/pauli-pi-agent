import type { LeadRecord } from "./lead-scoring";
import type { AuditReport } from "./website-audit.adapter";

export class ProspectBriefGenerator {
  generateBrief(lead: LeadRecord, audit: AuditReport): string {
    return `
# Prospect Audit Brief: ${lead.businessName}
* **Location**: ${lead.location}
* **Niche**: ${lead.niche}
* **Active Review Volume**: ${lead.googleReviews} reviews

## Detected Pain Points
${audit.detectedPainPoints.map(p => `* [PAIN] ${p}`).join("\n")}

## Recommended Synthia Pitch
* Build a premium **Synthia Smart Site** white-labeled directory listing profile.
* Embed an **AI Receptionist widget** to convert local searches.
* Setup automated **Missed-Call Text-Back** SMS triggers.
`;
  }
}
