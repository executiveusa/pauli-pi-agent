export interface MonetizationStrategy {
	project_id: string;
	project_type: string;
	timestamp: string;
	primary_path: RevenuePath;
	secondary_path: RevenuePath;
	tertiary_path: RevenuePath;
	subscription_opportunities: SubscriptionOpportunity[];
	affiliate_opportunities: AffiliateOpportunity[];
	lead_gen_opportunities: LeadGenOpportunity[];
	partnership_opportunities: PartnershipOpportunity[];
	marketplace_opportunities: MarketplaceOpportunity[];
	revenue_score: number; // 0-100
	estimated_mrr_range: { min: number; max: number };
	time_to_first_dollar: string;
	recommended_pricing_model: string;
}

export interface RevenuePath {
	type: string;
	description: string;
	pricing: string;
	implementation_steps: string[];
	estimated_mrr: string;
	effort: "low" | "medium" | "high";
	timeline: string;
}

export interface SubscriptionOpportunity {
	tier: string;
	price: string;
	features: string[];
	target_customer: string;
}

export interface AffiliateOpportunity {
	program: string;
	commission: string;
	integration_method: string;
}

export interface LeadGenOpportunity {
	mechanism: string;
	target_audience: string;
	value_exchange: string;
}

export interface PartnershipOpportunity {
	partner_type: string;
	value_prop: string;
	revenue_model: string;
}

export interface MarketplaceOpportunity {
	platform: string;
	listing_type: string;
	estimated_revenue: string;
}
