import { GoogleMapsResearchAdapter } from "./google-maps-research.adapter";
import { WebsiteAuditAdapter } from "./website-audit.adapter";
import { ProspectBriefGenerator } from "./prospect-brief.generator";
import { OutreachBriefGenerator } from "./outreach-brief.generator";
import { calculateLeadScore, type LeadRecord } from "./lead-scoring";

export class LeadEngineService {
  private maps = new GoogleMapsResearchAdapter();
  private audit = new WebsiteAuditAdapter();
  private briefGen = new ProspectBriefGenerator();
  private outreachGen = new OutreachBriefGenerator();

  async executeLeadScan(niche: string, location: string): Promise<Array<{
    lead: LeadRecord;
    score: number;
    brief: string;
    outreachEmail: string;
  }>> {
    const rawLeads = await this.maps.fetchLocalBusinesses(niche, location);
    const completedprospects = [];

    for (const lead of rawLeads) {
      const score = calculateLeadScore(lead);
      const auditResult = await this.audit.auditProspectWebsite(lead);
      const brief = this.briefGen.generateBrief(lead, auditResult);
      const outreachEmail = this.outreachGen.generateDraftEmail(lead);

      completedprospects.push({
        lead,
        score,
        brief,
        outreachEmail
      });
    }

    return completedprospects;
  }
}
