/**
 * Monetization Analyzer
 *
 * Analyzes a ProjectAudit and generates an intelligent MonetizationStrategy
 * based on project type, tech stack, audience signals, and opportunity patterns.
 */

import type { ProjectAudit } from "../project-audit/types.js";
import type {
	AffiliateOpportunity,
	LeadGenOpportunity,
	MarketplaceOpportunity,
	MonetizationStrategy,
	PartnershipOpportunity,
	RevenuePath,
	SubscriptionOpportunity,
} from "./types.js";

// ---------------------------------------------------------------------------
// Project type classifier
// ---------------------------------------------------------------------------

type ProjectType =
	| "saas-b2b"
	| "saas-b2c"
	| "developer-tool"
	| "marketplace"
	| "content-platform"
	| "api-service"
	| "e-commerce"
	| "community"
	| "data-analytics"
	| "ai-tool"
	| "productivity-app"
	| "unknown";

function classifyProjectType(audit: ProjectAudit): ProjectType {
	const { tech_stack, what_was_being_built, revenue_opportunities } = audit;
	const text = `${what_was_being_built} ${tech_stack.join(" ")} ${revenue_opportunities.map((r) => r.description).join(" ")}`.toLowerCase();

	if (/ai|gpt|llm|openai|anthropic|embedding|vector|ml|model/i.test(text)) return "ai-tool";
	if (/api|sdk|cli|library|package|npm|pip/i.test(text)) return "developer-tool";
	if (/marketplace|listing|directory|exchange|bidding|auction/i.test(text)) return "marketplace";
	if (/blog|cms|content|media|newsletter|article|post/i.test(text)) return "content-platform";
	if (/shop|store|product|cart|checkout|woocommerce|shopify/i.test(text)) return "e-commerce";
	if (/community|forum|discord|slack|social|network/i.test(text)) return "community";
	if (/analytics|dashboard|report|insight|metric|kpi|chart/i.test(text)) return "data-analytics";
	if (/team|enterprise|business|b2b|crm|workflow|saas/i.test(text)) return "saas-b2b";
	if (tech_stack.includes("Stripe") || tech_stack.includes("Clerk Auth")) return "saas-b2c";
	if (tech_stack.includes("Next.js") || tech_stack.includes("React")) return "saas-b2c";
	return "unknown";
}

// ---------------------------------------------------------------------------
// Revenue path generators
// ---------------------------------------------------------------------------

function buildSubscriptionPaths(type: ProjectType, audit: ProjectAudit): RevenuePath[] {
	const hasSaaS = type === "saas-b2b" || type === "saas-b2c" || type === "ai-tool";
	const hasDevTool = type === "developer-tool";
	const paths: RevenuePath[] = [];

	if (hasSaaS) {
		paths.push({
			type: "subscription",
			description: "Freemium SaaS with paid tiers for power users",
			pricing: "Free / $29 / $99 / $299 per month",
			implementation_steps: [
				"Integrate Stripe Billing with subscription plans",
				"Add Clerk or NextAuth for user authentication",
				"Implement feature flags per tier (free/pro/enterprise)",
				"Build upgrade flow with Stripe Customer Portal",
				"Set up webhook handler for subscription lifecycle events",
			],
			estimated_mrr: "$500–$10,000",
			effort: "medium",
			timeline: "4–8 weeks",
		});
	}

	if (hasDevTool) {
		paths.push({
			type: "subscription",
			description: "Developer tool with usage-based billing",
			pricing: "$0 for first 1,000 calls/month, then $0.001/call",
			implementation_steps: [
				"Add Stripe Meters for usage tracking",
				"Implement API key management",
				"Build developer dashboard with usage charts",
				"Set up billing alerts and quotas",
				"Publish to npm or package registry",
			],
			estimated_mrr: "$200–$5,000",
			effort: "medium",
			timeline: "3–6 weeks",
		});
	}

	if (type === "ai-tool") {
		paths.push({
			type: "subscription",
			description: "AI tool with credit-based or seat-based pricing",
			pricing: "$19/month starter, $49/month pro, $199/month teams",
			implementation_steps: [
				"Implement credit system (buy X credits, use for AI calls)",
				"Add usage tracking per user/workspace",
				"Build plan comparison page with clear value metrics",
				"Integrate Stripe Billing Portal for self-serve upgrades",
				"Set up overage billing for high-volume users",
			],
			estimated_mrr: "$1,000–$20,000",
			effort: "medium",
			timeline: "4–8 weeks",
		});
	}

	return paths;
}

function buildOneTimePaths(type: ProjectType): RevenuePath[] {
	const paths: RevenuePath[] = [];

	if (type === "developer-tool") {
		paths.push({
			type: "one-time",
			description: "License-based developer tool (lifetime deal)",
			pricing: "$49–$149 one-time per developer",
			implementation_steps: [
				"Set up Gumroad or Lemon Squeezy for one-time payments",
				"Generate and validate license keys",
				"Build a license check into the CLI/SDK",
				"List on GitHub marketplace or relevant directories",
				"Launch on Product Hunt and Hacker News",
			],
			estimated_mrr: "$500–$3,000 (front-loaded)",
			effort: "low",
			timeline: "1–2 weeks",
		});
	}

	if (type === "content-platform" || type === "data-analytics") {
		paths.push({
			type: "one-time",
			description: "Paid report, template, or data export",
			pricing: "$9–$99 per download",
			implementation_steps: [
				"Create a flagship free resource to drive traffic",
				"Bundle premium content behind a paywall",
				"Use Gumroad or Stripe Payment Links for checkout",
				"Set up email delivery with Resend or Postmark",
				"Cross-sell to newsletter subscribers",
			],
			estimated_mrr: "$300–$2,000",
			effort: "low",
			timeline: "1–3 weeks",
		});
	}

	return paths;
}

// ---------------------------------------------------------------------------
// Subscription tier builder
// ---------------------------------------------------------------------------

function buildSubscriptionTiers(type: ProjectType): SubscriptionOpportunity[] {
	const base: SubscriptionOpportunity[] = [
		{
			tier: "Free",
			price: "$0/month",
			features: ["Core features with limits", "Community support", "Public API access"],
			target_customer: "Individual users, students, tinkerers",
		},
		{
			tier: "Pro",
			price: "$29/month",
			features: ["Unlimited usage", "Priority support", "API rate limit increases", "Advanced features"],
			target_customer: "Freelancers, indie developers, power users",
		},
		{
			tier: "Team",
			price: "$99/month",
			features: ["Up to 10 seats", "Team collaboration features", "SSO integration", "Usage analytics"],
			target_customer: "Small teams, startups",
		},
		{
			tier: "Enterprise",
			price: "Custom pricing",
			features: ["Unlimited seats", "Dedicated support SLA", "Custom integrations", "Compliance (SOC2, GDPR)", "On-premise option"],
			target_customer: "Mid-market and enterprise companies",
		},
	];

	if (type === "ai-tool") {
		return [
			{
				tier: "Starter",
				price: "$19/month",
				features: ["500 AI credits/month", "3 projects", "Standard models"],
				target_customer: "Solo creators and indie makers",
			},
			{
				tier: "Pro",
				price: "$49/month",
				features: ["2,000 AI credits/month", "Unlimited projects", "Advanced models", "API access"],
				target_customer: "Professionals and power users",
			},
			{
				tier: "Teams",
				price: "$199/month",
				features: ["10,000 AI credits/month", "5 team seats", "Shared workspaces", "Priority queue"],
				target_customer: "Agencies and small teams",
			},
		];
	}

	if (type === "developer-tool") {
		return [
			{
				tier: "Free",
				price: "$0/month",
				features: ["1,000 API calls/month", "OSS license", "Community Discord"],
				target_customer: "Solo devs, OSS projects",
			},
			{
				tier: "Builder",
				price: "$39/month",
				features: ["50,000 API calls/month", "Webhooks", "Priority support", "99.9% SLA"],
				target_customer: "Indie SaaS founders, freelancers",
			},
			{
				tier: "Scale",
				price: "$149/month",
				features: ["Unlimited calls", "Dedicated infrastructure", "Custom integrations", "SLA guarantee"],
				target_customer: "Growing startups and agencies",
			},
		];
	}

	return base;
}

// ---------------------------------------------------------------------------
// Affiliate opportunities
// ---------------------------------------------------------------------------

function buildAffiliateOpps(audit: ProjectAudit): AffiliateOpportunity[] {
	const tech = audit.tech_stack;
	const opps: AffiliateOpportunity[] = [];

	opps.push({
		program: "Vercel Affiliate Program",
		commission: "Up to $500/referral",
		integration_method: "Add 'Powered by Vercel' badge with affiliate link in footer",
	});

	if (tech.includes("Supabase")) {
		opps.push({
			program: "Supabase Partner Program",
			commission: "20% recurring commission for 12 months",
			integration_method: "Apply at supabase.com/partners — referral link in 'Deploy to Supabase' button",
		});
	}

	opps.push({
		program: "Stripe Partner Program",
		commission: "Revenue share on referred customers",
		integration_method: "List in Stripe Partner Directory; add Stripe referral tag to payment integration",
	});

	opps.push({
		program: "DigitalOcean Affiliate",
		commission: "$100 per qualified referral",
		integration_method: "Add 'Deploy to DO' button in README with affiliate link",
	});

	if (tech.includes("Clerk Auth")) {
		opps.push({
			program: "Clerk Affiliate Program",
			commission: "20% for 6 months",
			integration_method: "Join Clerk's partner program, add referral in docs/tutorials",
		});
	}

	return opps;
}

// ---------------------------------------------------------------------------
// Lead gen opportunities
// ---------------------------------------------------------------------------

function buildLeadGenOpps(type: ProjectType, audit: ProjectAudit): LeadGenOpportunity[] {
	const opps: LeadGenOpportunity[] = [
		{
			mechanism: "Email waitlist with lead magnet",
			target_audience: "Early adopters and potential customers",
			value_exchange: "Free template, ebook, or early access in exchange for email",
		},
		{
			mechanism: "Interactive demo / playground",
			target_audience: "Developers and decision makers evaluating the tool",
			value_exchange: "Try before buying — show value immediately",
		},
	];

	if (type === "saas-b2b" || type === "data-analytics") {
		opps.push({
			mechanism: "Free ROI calculator or audit tool",
			target_audience: "B2B prospects evaluating business impact",
			value_exchange: "Personalized report in exchange for business email",
		});
	}

	if (type === "content-platform") {
		opps.push({
			mechanism: "Newsletter with premium tier",
			target_audience: audit.what_was_being_built.includes("developer") ? "Developers" : "General audience",
			value_exchange: "Weekly insights + exclusive paid subscriber content",
		});
	}

	return opps;
}

// ---------------------------------------------------------------------------
// Partnership opportunities
// ---------------------------------------------------------------------------

function buildPartnershipOpps(type: ProjectType, audit: ProjectAudit): PartnershipOpportunity[] {
	const opps: PartnershipOpportunity[] = [];

	if (type === "developer-tool" || type === "ai-tool") {
		opps.push({
			partner_type: "Developer educator / influencer",
			value_prop: "Co-create tutorial content, reach their audience",
			revenue_model: "Revenue share on referred signups",
		});
		opps.push({
			partner_type: "Complementary SaaS tool",
			value_prop: "Native integration increases both products' stickiness",
			revenue_model: "Co-marketing agreement; referral bounty per shared customer",
		});
	}

	if (type === "marketplace" || type === "saas-b2b") {
		opps.push({
			partner_type: "Agency or consulting firm",
			value_prop: "Agencies white-label or recommend the platform to their clients",
			revenue_model: "30% recurring commission on referred accounts",
		});
	}

	opps.push({
		partner_type: "Community / Discord server",
		value_prop: "Sponsored tool for a relevant developer or maker community",
		revenue_model: "Free/discounted access to community; visibility + backlinks",
	});

	// Stack-based partnerships
	if (audit.tech_stack.includes("Stripe")) {
		opps.push({
			partner_type: "Stripe integration listing",
			value_prop: "Listed in Stripe App Marketplace for distribution",
			revenue_model: "Inbound leads from Stripe customers searching for your category",
		});
	}

	return opps;
}

// ---------------------------------------------------------------------------
// Marketplace opportunities
// ---------------------------------------------------------------------------

function buildMarketplaceOpps(type: ProjectType): MarketplaceOpportunity[] {
	const opps: MarketplaceOpportunity[] = [];

	opps.push({
		platform: "Product Hunt",
		listing_type: "New product launch",
		estimated_revenue: "Spike in signups; 500–5,000 new users from a top 5 launch",
	});

	if (type === "developer-tool" || type === "ai-tool") {
		opps.push({
			platform: "GitHub Marketplace",
			listing_type: "GitHub App or Action",
			estimated_revenue: "$100–$5,000/month from organic GitHub traffic",
		});
		opps.push({
			platform: "VS Code Extension Marketplace",
			listing_type: "IDE extension",
			estimated_revenue: "Usage funnel into paid SaaS plan",
		});
	}

	if (type === "saas-b2b") {
		opps.push({
			platform: "G2 / Capterra",
			listing_type: "Software review listing",
			estimated_revenue: "B2B lead gen; reviewers convert to paid at 15–25%",
		});
		opps.push({
			platform: "HubSpot App Marketplace",
			listing_type: "HubSpot integration",
			estimated_revenue: "Access to 200K+ HubSpot customers; $500–$10K/month",
		});
	}

	if (type === "content-platform" || type === "community") {
		opps.push({
			platform: "Gumroad / Lemon Squeezy",
			listing_type: "Digital product / course",
			estimated_revenue: "$500–$10,000 per launch",
		});
	}

	return opps;
}

// ---------------------------------------------------------------------------
// Revenue score
// ---------------------------------------------------------------------------

function estimateRevenueScore(type: ProjectType, audit: ProjectAudit): number {
	let score = 30; // base

	// Project type modifiers
	const typeScores: Record<ProjectType, number> = {
		"saas-b2b": 40,
		"ai-tool": 35,
		"developer-tool": 30,
		marketplace: 30,
		"data-analytics": 30,
		"saas-b2c": 25,
		"productivity-app": 25,
		"e-commerce": 25,
		"content-platform": 20,
		community: 15,
		"api-service": 25,
		unknown: 5,
	};
	score += typeScores[type] ?? 5;

	// Production signals
	if (audit.has_tests) score += 5;
	if (audit.has_deployment_config) score += 5;
	if (audit.tech_stack.includes("Stripe")) score += 10;
	if (audit.current_state === "production") score += 10;
	else if (audit.current_state === "beta") score += 5;

	return Math.min(100, score);
}

// ---------------------------------------------------------------------------
// MRR range estimator
// ---------------------------------------------------------------------------

function estimateMRRRange(type: ProjectType, revenueScore: number): { min: number; max: number } {
	const baseRanges: Record<ProjectType, [number, number]> = {
		"saas-b2b": [500, 20000],
		"ai-tool": [300, 15000],
		"developer-tool": [200, 10000],
		marketplace: [200, 10000],
		"data-analytics": [300, 12000],
		"saas-b2c": [200, 8000],
		"productivity-app": [100, 5000],
		"e-commerce": [500, 25000],
		"content-platform": [100, 5000],
		community: [50, 3000],
		"api-service": [200, 10000],
		unknown: [50, 2000],
	};

	const [baseMin, baseMax] = baseRanges[type] ?? [50, 2000];
	const multiplier = revenueScore / 100;

	return {
		min: Math.round(baseMin * multiplier),
		max: Math.round(baseMax * multiplier),
	};
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function analyzeMonetization(audit: ProjectAudit): Promise<MonetizationStrategy> {
	const type = classifyProjectType(audit);
	const revenueScore = estimateRevenueScore(type, audit);
	const mrrRange = estimateMRRRange(type, revenueScore);

	const subscriptionPaths = buildSubscriptionPaths(type, audit);
	const oneTimePaths = buildOneTimePaths(type);

	// Build a pool of all revenue paths and pick primary/secondary/tertiary
	const allPaths = [...subscriptionPaths, ...oneTimePaths];

	const defaultPath: RevenuePath = {
		type: "lead-gen",
		description: "Capture leads with email waitlist while building product",
		pricing: "Free (invest in list building now, monetize later)",
		implementation_steps: [
			"Add an email capture form with a compelling lead magnet",
			"Set up Resend or ConvertKit for email automation",
			"Deliver value via email sequence",
			"Survey subscribers to validate pricing and features",
			"Launch paid product to warm audience",
		],
		estimated_mrr: "$0 (pre-revenue; pipeline building)",
		effort: "low",
		timeline: "1–2 weeks",
	};

	const primaryPath = allPaths[0] ?? defaultPath;
	const secondaryPath = allPaths[1] ?? {
		type: "affiliate",
		description: "Affiliate partnerships with tools you already use",
		pricing: "Commission-based — no upfront cost",
		implementation_steps: [
			"Sign up for Vercel, Supabase, Stripe affiliate programs",
			"Add affiliate links in documentation and tutorials",
			"Create comparison content that ranks in search",
			"Track conversions with UTM parameters",
		],
		estimated_mrr: "$50–$500",
		effort: "low",
		timeline: "1 week",
	};
	const tertiaryPath = allPaths[2] ?? defaultPath;

	const time_to_first_dollar =
		type === "saas-b2c" || type === "ai-tool"
			? "1–4 weeks (if Stripe is integrated)"
			: type === "developer-tool"
				? "2–6 weeks (publish + outreach)"
				: type === "saas-b2b"
					? "4–12 weeks (sales cycle)"
					: "2–8 weeks";

	const recommended_pricing_model =
		type === "ai-tool"
			? "Credit-based + seat-based hybrid (credits for AI usage, seats for collaboration)"
			: type === "developer-tool"
				? "Usage-based with generous free tier (first 1K calls free, then pay-per-call)"
				: type === "saas-b2b"
					? "Seat-based annual contracts with volume discounts"
					: type === "marketplace"
						? "Transaction fee (5–15% GMV) + optional seller subscriptions"
						: "Freemium with monthly/annual subscription toggle";

	return {
		project_id: audit.project_id,
		project_type: type,
		timestamp: new Date().toISOString(),
		primary_path: primaryPath,
		secondary_path: secondaryPath,
		tertiary_path: tertiaryPath,
		subscription_opportunities: buildSubscriptionTiers(type),
		affiliate_opportunities: buildAffiliateOpps(audit),
		lead_gen_opportunities: buildLeadGenOpps(type, audit),
		partnership_opportunities: buildPartnershipOpps(type, audit),
		marketplace_opportunities: buildMarketplaceOpps(type),
		revenue_score: revenueScore,
		estimated_mrr_range: mrrRange,
		time_to_first_dollar,
		recommended_pricing_model,
	};
}
