/**
 * Monetization Agent Orchestrator
 *
 * Analyzes every project for revenue potential and produces a complete
 * monetization package: 3 revenue paths, subscription tiers, affiliate
 * opportunities, lead gen mechanisms, partnerships, marketplace listings,
 * revenue score, MRR estimate, time-to-first-dollar, and pricing model.
 */

import fs from "node:fs/promises";
import path from "node:path";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectType =
	| "saas"
	| "content"
	| "marketplace"
	| "agency"
	| "ecommerce"
	| "community"
	| "developer_tool"
	| "unknown";

export type PricingModel =
	| "freemium"
	| "subscription"
	| "one_time"
	| "usage_based"
	| "marketplace"
	| "affiliate"
	| "lead_gen";

export type RevenuePathType =
	| "subscription"
	| "one_time"
	| "usage_based"
	| "transaction_fee"
	| "affiliate"
	| "lead_gen"
	| "advertising"
	| "white_label"
	| "api_licensing";

export type Complexity = "LOW" | "MEDIUM" | "HIGH";

export type RevenueMomentum = "STRONG" | "VIABLE" | "WEAK" | "NOT_VIABLE";

export interface RevenuePath {
	type: RevenuePathType;
	name: string;
	mechanism: string; // How money is collected
	targetCustomer: string;
	pricePointMin: number;
	pricePointMax: number;
	revenueEstimateCeiling: number; // At scale, monthly USD
	timeToActivateDays: number;
	complexity: Complexity;
	rationale: string;
}

export interface SubscriptionTier {
	name: string;
	monthlyPrice: number;
	annualPrice: number;
	annualDiscountPct: number;
	features: string[];
	limits: Record<string, number | string>;
	targetPersona: string;
	estimatedConversionFromFree: number; // 0–1
}

export interface AffiliateOpportunity {
	partnerName: string;
	partnerCategory: string;
	commissionType: "percentage" | "flat";
	commissionValue: number; // % or $ amount
	integrationMechanism: string;
	estimatedMonthlyRevAt1kUsers: number;
	fitScore: number; // 0–10
}

export interface LeadGenMechanism {
	type: "free_tool" | "content_magnet" | "calculator" | "email_course" | "webinar" | "referral" | "directory_listing";
	name: string;
	implementation: string;
	estimatedMonthlyLeads: number;
	leadQuality: "COLD" | "WARM" | "HOT";
	followUpFunnel: string;
}

export interface PartnershipOpportunity {
	type: "integration" | "distribution" | "co_marketing" | "white_label";
	partnerName: string;
	valueWeOffer: string;
	valueTheyOffer: string;
	revenuePotential: string;
	outreachPath: string;
}

export interface MarketplaceListing {
	marketplace: string;
	listingType: "free" | "paid" | "revenue_share";
	revenueSharePct?: number;
	estimatedMonthlyDiscoveryVisits: number;
	requirements: string[];
	url: string;
}

export interface MRRProjection {
	month: number;
	conservativeMrr: number;
	optimisticMrr: number;
	assumptions: {
		trafficBaseline: number;
		freeToPaidConversion: number;
		arpu: number;
		monthlyChurnRate: number;
	};
}

export interface MonetizationRoadmap {
	month1: string[];
	month2to3: string[];
	month4to6: string[];
	month6to12: string[];
}

export interface MonetizationReport {
	projectId: string;
	projectType: ProjectType;
	audience: string;
	valueProposition: string;
	revenueScore: number; // 0–100
	verdict: RevenueMomentum;
	primaryPath: RevenuePath;
	secondaryPath: RevenuePath;
	tertiaryPath: RevenuePath;
	subscriptionTiers: SubscriptionTier[];
	affiliateOpportunities: AffiliateOpportunity[];
	leadGenMechanisms: LeadGenMechanism[];
	partnershipOpportunities: PartnershipOpportunity[];
	marketplaceListings: MarketplaceListing[];
	mrrProjection: MRRProjection; // Month 6 projection
	timeToFirstDollarDays: number;
	recommendedPricingModel: PricingModel;
	pricingModelRationale: string;
	roadmap: MonetizationRoadmap;
	complete: boolean; // All mandatory outputs present
	analysedAt: Date;
	durationMs: number;
}

export interface ProjectContext {
	projectId: string;
	projectPath: string;
	projectType?: ProjectType;
	description?: string;
	targetAudience?: string;
	existingRevenue?: number;
	techStack?: string[];
}

export interface RevenueScoreBreakdown {
	primaryPathStrength: number; // 0–30
	marketSize: number; // 0–20
	pricingPower: number; // 0–20
	competitiveMoat: number; // 0–15
	timeToRevenue: number; // 0–15
	total: number; // 0–100
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AFFILIATE_CATALOG: Record<ProjectType, AffiliateOpportunity[]> = {
	saas: [
		{
			partnerName: "Vercel",
			partnerCategory: "Hosting",
			commissionType: "percentage",
			commissionValue: 20,
			integrationMechanism: "Referral link in deploy docs and onboarding",
			estimatedMonthlyRevAt1kUsers: 400,
			fitScore: 9,
		},
		{
			partnerName: "Supabase",
			partnerCategory: "Database",
			commissionType: "percentage",
			commissionValue: 20,
			integrationMechanism: "Integration page + recommended stack",
			estimatedMonthlyRevAt1kUsers: 350,
			fitScore: 8,
		},
	],
	content: [
		{
			partnerName: "Amazon Associates",
			partnerCategory: "E-commerce",
			commissionType: "percentage",
			commissionValue: 4,
			integrationMechanism: "In-content product recommendations",
			estimatedMonthlyRevAt1kUsers: 120,
			fitScore: 7,
		},
		{
			partnerName: "ConvertKit / Kit",
			partnerCategory: "Email Marketing",
			commissionType: "percentage",
			commissionValue: 30,
			integrationMechanism: "Recommended tool for newsletter growth",
			estimatedMonthlyRevAt1kUsers: 200,
			fitScore: 8,
		},
	],
	marketplace: [
		{
			partnerName: "Stripe",
			partnerCategory: "Payments",
			commissionType: "flat",
			commissionValue: 500,
			integrationMechanism: "Stripe Connect integration referral",
			estimatedMonthlyRevAt1kUsers: 300,
			fitScore: 9,
		},
		{
			partnerName: "Shippo",
			partnerCategory: "Shipping",
			commissionType: "percentage",
			commissionValue: 15,
			integrationMechanism: "Shipping integration within marketplace",
			estimatedMonthlyRevAt1kUsers: 180,
			fitScore: 7,
		},
	],
	agency: [
		{
			partnerName: "HubSpot",
			partnerCategory: "CRM",
			commissionType: "percentage",
			commissionValue: 20,
			integrationMechanism: "CRM referral for client onboarding",
			estimatedMonthlyRevAt1kUsers: 600,
			fitScore: 8,
		},
		{
			partnerName: "Webflow",
			partnerCategory: "Website Builder",
			commissionType: "percentage",
			commissionValue: 30,
			integrationMechanism: "Webflow partner program for client sites",
			estimatedMonthlyRevAt1kUsers: 400,
			fitScore: 9,
		},
	],
	ecommerce: [
		{
			partnerName: "Klaviyo",
			partnerCategory: "Email Automation",
			commissionType: "percentage",
			commissionValue: 20,
			integrationMechanism: "Email marketing integration recommendation",
			estimatedMonthlyRevAt1kUsers: 350,
			fitScore: 9,
		},
		{
			partnerName: "Gorgias",
			partnerCategory: "Customer Support",
			commissionType: "flat",
			commissionValue: 200,
			integrationMechanism: "Support tool recommendation",
			estimatedMonthlyRevAt1kUsers: 250,
			fitScore: 7,
		},
	],
	community: [
		{
			partnerName: "Circle.so",
			partnerCategory: "Community Platform",
			commissionType: "percentage",
			commissionValue: 20,
			integrationMechanism: "Platform migration referral",
			estimatedMonthlyRevAt1kUsers: 200,
			fitScore: 8,
		},
		{
			partnerName: "Beehiiv",
			partnerCategory: "Newsletter",
			commissionType: "percentage",
			commissionValue: 25,
			integrationMechanism: "Newsletter tool recommendation",
			estimatedMonthlyRevAt1kUsers: 180,
			fitScore: 7,
		},
	],
	developer_tool: [
		{
			partnerName: "Railway",
			partnerCategory: "Hosting",
			commissionType: "percentage",
			commissionValue: 20,
			integrationMechanism: "Deploy button in README",
			estimatedMonthlyRevAt1kUsers: 300,
			fitScore: 9,
		},
		{
			partnerName: "Resend",
			partnerCategory: "Transactional Email",
			commissionType: "flat",
			commissionValue: 100,
			integrationMechanism: "Email sending integration recommendation",
			estimatedMonthlyRevAt1kUsers: 150,
			fitScore: 8,
		},
	],
	unknown: [
		{
			partnerName: "Stripe",
			partnerCategory: "Payments",
			commissionType: "flat",
			commissionValue: 500,
			integrationMechanism: "Payment integration referral",
			estimatedMonthlyRevAt1kUsers: 200,
			fitScore: 7,
		},
		{
			partnerName: "Vercel",
			partnerCategory: "Hosting",
			commissionType: "percentage",
			commissionValue: 20,
			integrationMechanism: "Hosting referral link",
			estimatedMonthlyRevAt1kUsers: 150,
			fitScore: 6,
		},
	],
};

// ─── MonetizationAgent ────────────────────────────────────────────────────────

export class MonetizationAgent {
	private logFilePath: string;

	constructor(logFile = "logs/monetization.jsonl") {
		this.logFilePath = path.resolve(process.cwd(), logFile);
	}

	/**
	 * Main entry point: analyze a project and produce a full monetization report.
	 */
	async analyzeMonetization(context: ProjectContext): Promise<MonetizationReport> {
		const startMs = Date.now();
		await this.ensureLogDir();

		const projectType = context.projectType ?? await this.detectProjectType(context);

		// Phase 1: Understand the project
		const { audience, valueProposition } = await this.analyzeProject(context, projectType);

		// Phase 2: Generate revenue paths
		const [primaryPath, secondaryPath, tertiaryPath] = await this.generateRevenuePaths(
			context,
			projectType,
			audience,
		);

		// Phase 3: Subscription architecture
		const subscriptionTiers = this.buildSubscriptionTiers(projectType, primaryPath);

		// Phase 4: Affiliates
		const affiliateOpportunities = this.findAffiliateOpportunities(projectType);

		// Phase 5: Lead generation
		const leadGenMechanisms = this.buildLeadGenMechanisms(projectType, audience);

		// Phase 6: Partnerships
		const partnershipOpportunities = this.buildPartnerships(projectType);

		// Phase 7: Marketplace listings
		const marketplaceListings = this.buildMarketplaceListings(projectType);

		// Phase 8: Revenue score
		const revenueScore = this.calculateRevenueScore(
			primaryPath,
			projectType,
			audience,
			tertiaryPath.timeToActivateDays,
		);
		const verdict = this.scoreToVerdict(revenueScore);

		// Phase 9: MRR projection
		const mrrProjection = this.projectMRR(
			subscriptionTiers,
			primaryPath,
			revenueScore,
		);

		// Phase 10: Time to first dollar
		const timeToFirstDollarDays = this.estimateTimeToFirstDollar(primaryPath, projectType);

		// Phase 11: Pricing model
		const { model: recommendedPricingModel, rationale: pricingModelRationale } =
			this.recommendPricingModel(projectType, primaryPath, audience);

		// Phase 12: Roadmap
		const roadmap = this.buildRoadmap(primaryPath, secondaryPath, tertiaryPath);

		const report: MonetizationReport = {
			projectId: context.projectId,
			projectType,
			audience,
			valueProposition,
			revenueScore,
			verdict,
			primaryPath,
			secondaryPath,
			tertiaryPath,
			subscriptionTiers,
			affiliateOpportunities,
			leadGenMechanisms,
			partnershipOpportunities,
			marketplaceListings,
			mrrProjection,
			timeToFirstDollarDays,
			recommendedPricingModel,
			pricingModelRationale,
			roadmap,
			complete: this.validateComplete({
				subscriptionTiers,
				affiliateOpportunities,
				leadGenMechanisms,
				partnershipOpportunities,
			}),
			analysedAt: new Date(),
			durationMs: Date.now() - startMs,
		};

		await this.logReport(report);

		return report;
	}

	// ─── Private: Analysis Phase ──────────────────────────────────────────────

	private async detectProjectType(context: ProjectContext): Promise<ProjectType> {
		// Read package.json and key files to detect project type
		try {
			const pkgPath = path.join(context.projectPath, "package.json");
			const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
			const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });

			if (deps.includes("stripe") || deps.includes("@stripe/stripe-js")) return "ecommerce";
			if (deps.includes("next") || deps.includes("remix")) return "saas";
			if (deps.some((d) => d.includes("shopify"))) return "ecommerce";
		} catch {
			// fallback
		}

		return context.description?.toLowerCase().includes("api") ? "developer_tool" : "unknown";
	}

	private async analyzeProject(
		context: ProjectContext,
		projectType: ProjectType,
	): Promise<{ audience: string; valueProposition: string }> {
		// Default audience and value prop based on project type
		const defaults: Record<ProjectType, { audience: string; valueProposition: string }> = {
			saas: { audience: "SMB founders and product teams", valueProposition: "Automate and scale core business workflows" },
			content: { audience: "Enthusiasts and professionals seeking curated expertise", valueProposition: "High-quality content that saves time and builds skills" },
			marketplace: { audience: "Buyers and sellers in a niche vertical", valueProposition: "Efficient, trusted exchange platform" },
			agency: { audience: "Business owners needing specialized services", valueProposition: "Expert execution without full-time hire overhead" },
			ecommerce: { audience: "End consumers interested in specific product category", valueProposition: "Quality products with convenient purchasing experience" },
			community: { audience: "Practitioners seeking peers and knowledge", valueProposition: "Access to a vetted, active professional community" },
			developer_tool: { audience: "Software developers and engineering teams", valueProposition: "Accelerate development with purpose-built tooling" },
			unknown: { audience: "Target audience to be defined", valueProposition: "Value proposition to be defined" },
		};

		return context.targetAudience
			? { audience: context.targetAudience, valueProposition: defaults[projectType].valueProposition }
			: defaults[projectType];
	}

	// ─── Private: Revenue Path Generation ────────────────────────────────────

	private async generateRevenuePaths(
		context: ProjectContext,
		projectType: ProjectType,
		_audience: string,
	): Promise<[RevenuePath, RevenuePath, RevenuePath]> {
		const paths = this.getRevenuePathTemplates(projectType);

		return [
			paths[0] ?? this.fallbackPath("primary"),
			paths[1] ?? this.fallbackPath("secondary"),
			paths[2] ?? this.fallbackPath("tertiary"),
		];
	}

	private getRevenuePathTemplates(projectType: ProjectType): RevenuePath[] {
		const templates: Record<ProjectType, RevenuePath[]> = {
			saas: [
				{
					type: "subscription",
					name: "SaaS Subscription",
					mechanism: "Monthly/annual recurring billing via Stripe. Tiered by usage, seats, or features.",
					targetCustomer: "Product teams and founders",
					pricePointMin: 29,
					pricePointMax: 299,
					revenueEstimateCeiling: 50_000,
					timeToActivateDays: 14,
					complexity: "MEDIUM",
					rationale: "Subscription is native to SaaS. Predictable MRR, compounding growth with low churn.",
				},
				{
					type: "usage_based",
					name: "Usage-Based Overage",
					mechanism: "Metered billing above plan limits. Customers pay for what they use beyond their tier.",
					targetCustomer: "High-volume users on growth plans",
					pricePointMin: 0.01,
					pricePointMax: 0.10,
					revenueEstimateCeiling: 15_000,
					timeToActivateDays: 21,
					complexity: "HIGH",
					rationale: "Captures value from power users. Grows with customer success.",
				},
				{
					type: "white_label",
					name: "White-Label Licensing",
					mechanism: "License the platform to agencies and resellers who sell it to their own clients.",
					targetCustomer: "Agencies and consultants",
					pricePointMin: 299,
					pricePointMax: 999,
					revenueEstimateCeiling: 20_000,
					timeToActivateDays: 45,
					complexity: "HIGH",
					rationale: "Passive revenue from resellers. No direct sales effort after initial partnership.",
				},
			],
			content: [
				{
					type: "subscription",
					name: "Premium Content Membership",
					mechanism: "Paid newsletter or members-only content access via Stripe or Lemon Squeezy.",
					targetCustomer: "Engaged readers wanting depth",
					pricePointMin: 9,
					pricePointMax: 49,
					revenueEstimateCeiling: 25_000,
					timeToActivateDays: 7,
					complexity: "LOW",
					rationale: "Converts existing audience into recurring revenue. Low overhead.",
				},
				{
					type: "affiliate",
					name: "Affiliate Revenue",
					mechanism: "Commission on referred products/services embedded naturally in content.",
					targetCustomer: "All readers",
					pricePointMin: 0,
					pricePointMax: 0,
					revenueEstimateCeiling: 8_000,
					timeToActivateDays: 3,
					complexity: "LOW",
					rationale: "Passive. No product required. Scales with audience.",
				},
				{
					type: "one_time",
					name: "Paid Guides and Templates",
					mechanism: "One-time purchase digital products (guides, templates, toolkits) via Gumroad.",
					targetCustomer: "Action-takers who want a shortcut",
					pricePointMin: 29,
					pricePointMax: 197,
					revenueEstimateCeiling: 10_000,
					timeToActivateDays: 14,
					complexity: "LOW",
					rationale: "High margin. No support overhead. Can be produced once and sold forever.",
				},
			],
			marketplace: [
				{
					type: "transaction_fee",
					name: "Marketplace Transaction Fee",
					mechanism: "Take-rate (%) on every transaction processed through the platform.",
					targetCustomer: "All buyers and sellers",
					pricePointMin: 5,
					pricePointMax: 15,
					revenueEstimateCeiling: 100_000,
					timeToActivateDays: 30,
					complexity: "HIGH",
					rationale: "Scales directly with GMV. Aligns incentives with platform success.",
				},
				{
					type: "subscription",
					name: "Seller Subscription",
					mechanism: "Monthly fee for sellers to list on platform, with tiered exposure and features.",
					targetCustomer: "Active sellers",
					pricePointMin: 29,
					pricePointMax: 199,
					revenueEstimateCeiling: 30_000,
					timeToActivateDays: 21,
					complexity: "MEDIUM",
					rationale: "Predictable revenue independent of transaction volume.",
				},
				{
					type: "advertising",
					name: "Sponsored Listings",
					mechanism: "Sellers pay for premium placement in search results and category pages.",
					targetCustomer: "Sellers with marketing budgets",
					pricePointMin: 50,
					pricePointMax: 500,
					revenueEstimateCeiling: 20_000,
					timeToActivateDays: 60,
					complexity: "MEDIUM",
					rationale: "Additional revenue layer on top of transaction fees. Low marginal cost.",
				},
			],
			agency: [
				{
					type: "subscription",
					name: "Monthly Retainer",
					mechanism: "Fixed monthly fee for ongoing services. Charged automatically via Stripe.",
					targetCustomer: "SMBs needing ongoing support",
					pricePointMin: 500,
					pricePointMax: 5_000,
					revenueEstimateCeiling: 80_000,
					timeToActivateDays: 7,
					complexity: "LOW",
					rationale: "Highest stability. Retainers compound. 3 clients = stable base.",
				},
				{
					type: "one_time",
					name: "Project-Based Engagements",
					mechanism: "Fixed-price project delivery. Deposit + completion milestone payment.",
					targetCustomer: "Businesses with defined project needs",
					pricePointMin: 2_000,
					pricePointMax: 25_000,
					revenueEstimateCeiling: 40_000,
					timeToActivateDays: 14,
					complexity: "MEDIUM",
					rationale: "Higher per-transaction revenue. Good for specialized expertise.",
				},
				{
					type: "lead_gen",
					name: "Referral Fee Income",
					mechanism: "Collect referral fees from partners for qualified business introductions.",
					targetCustomer: "Partner businesses",
					pricePointMin: 200,
					pricePointMax: 2_000,
					revenueEstimateCeiling: 5_000,
					timeToActivateDays: 30,
					complexity: "LOW",
					rationale: "Passive income from existing relationships. No delivery overhead.",
				},
			],
			ecommerce: [
				{
					type: "one_time",
					name: "Direct Product Sales",
					mechanism: "E-commerce checkout via Stripe or Shopify. One-time purchase.",
					targetCustomer: "End consumers",
					pricePointMin: 20,
					pricePointMax: 500,
					revenueEstimateCeiling: 60_000,
					timeToActivateDays: 7,
					complexity: "LOW",
					rationale: "Core revenue. Optimize conversion, AOV, and repeat purchase rate.",
				},
				{
					type: "subscription",
					name: "Product Subscription / Replenishment",
					mechanism: "Auto-ship recurring orders for consumables or curated products.",
					targetCustomer: "Loyal repeat buyers",
					pricePointMin: 25,
					pricePointMax: 150,
					revenueEstimateCeiling: 25_000,
					timeToActivateDays: 21,
					complexity: "MEDIUM",
					rationale: "LTV multiplier. Reduces churn from one-time buyer behavior.",
				},
				{
					type: "affiliate",
					name: "Influencer and Creator Affiliate Program",
					mechanism: "Affiliates promote products for % commission on referred sales.",
					targetCustomer: "Creators and influencers in niche",
					pricePointMin: 0,
					pricePointMax: 0,
					revenueEstimateCeiling: 15_000,
					timeToActivateDays: 14,
					complexity: "LOW",
					rationale: "Low-cost distribution. Scales awareness without ad spend.",
				},
			],
			community: [
				{
					type: "subscription",
					name: "Community Membership",
					mechanism: "Monthly or annual membership fee for community access and benefits.",
					targetCustomer: "Practitioners and professionals",
					pricePointMin: 19,
					pricePointMax: 99,
					revenueEstimateCeiling: 30_000,
					timeToActivateDays: 7,
					complexity: "LOW",
					rationale: "Native to community model. Members pay for access, connection, and status.",
				},
				{
					type: "one_time",
					name: "Events and Workshops",
					mechanism: "Paid virtual or in-person events, workshops, and masterminds.",
					targetCustomer: "Members wanting intensive experiences",
					pricePointMin: 97,
					pricePointMax: 997,
					revenueEstimateCeiling: 15_000,
					timeToActivateDays: 30,
					complexity: "MEDIUM",
					rationale: "High-value, high-margin. Deepens community relationships.",
				},
				{
					type: "advertising",
					name: "Sponsor and Partner Integrations",
					mechanism: "Brands pay for access to community via sponsored posts, newsletters, events.",
					targetCustomer: "Brands targeting community's audience",
					pricePointMin: 500,
					pricePointMax: 5_000,
					revenueEstimateCeiling: 10_000,
					timeToActivateDays: 45,
					complexity: "MEDIUM",
					rationale: "Zero marginal cost. Valuable at scale.",
				},
			],
			developer_tool: [
				{
					type: "subscription",
					name: "Developer Plan Subscription",
					mechanism: "Monthly/annual tiered plans with usage limits, API rate limits, or features.",
					targetCustomer: "Individual developers and engineering teams",
					pricePointMin: 19,
					pricePointMax: 199,
					revenueEstimateCeiling: 40_000,
					timeToActivateDays: 14,
					complexity: "MEDIUM",
					rationale: "Developer tools monetize well through subscription once value is proven.",
				},
				{
					type: "usage_based",
					name: "API Usage Billing",
					mechanism: "Metered billing per API call, per token, or per compute unit.",
					targetCustomer: "High-volume developers and teams",
					pricePointMin: 0.001,
					pricePointMax: 0.10,
					revenueEstimateCeiling: 20_000,
					timeToActivateDays: 21,
					complexity: "HIGH",
					rationale: "Aligns price with value. Grows naturally with customer success.",
				},
				{
					type: "api_licensing",
					name: "Enterprise License",
					mechanism: "Annual site license for teams. Custom pricing, SLA, priority support.",
					targetCustomer: "Enterprise engineering teams",
					pricePointMin: 5_000,
					pricePointMax: 50_000,
					revenueEstimateCeiling: 30_000,
					timeToActivateDays: 90,
					complexity: "HIGH",
					rationale: "High ACV. Enterprise has budget and needs. Long sales cycle but high retention.",
				},
			],
			unknown: [
				this.fallbackPath("primary"),
				this.fallbackPath("secondary"),
				this.fallbackPath("tertiary"),
			],
		};

		return templates[projectType] ?? templates.unknown;
	}

	private fallbackPath(role: string): RevenuePath {
		return {
			type: "subscription",
			name: `${role.charAt(0).toUpperCase() + role.slice(1)} Revenue Path`,
			mechanism: "Subscription or one-time purchase to be defined based on project type",
			targetCustomer: "Primary audience to be defined",
			pricePointMin: 19,
			pricePointMax: 99,
			revenueEstimateCeiling: 10_000,
			timeToActivateDays: 30,
			complexity: "MEDIUM",
			rationale: "Generic path pending deeper project analysis",
		};
	}

	// ─── Private: Subscription Tiers ─────────────────────────────────────────

	private buildSubscriptionTiers(
		projectType: ProjectType,
		primaryPath: RevenuePath,
	): SubscriptionTier[] {
		const midPrice = Math.round(
			(primaryPath.pricePointMin + primaryPath.pricePointMax) / 2,
		);

		return [
			{
				name: "Free",
				monthlyPrice: 0,
				annualPrice: 0,
				annualDiscountPct: 0,
				features: ["Core feature (limited)", "Community access", "Public documentation"],
				limits: { usage: 100, seats: 1 },
				targetPersona: "Evaluators and casual users",
				estimatedConversionFromFree: 0,
			},
			{
				name: "Pro",
				monthlyPrice: primaryPath.pricePointMin,
				annualPrice: Math.round(primaryPath.pricePointMin * 10),
				annualDiscountPct: 17,
				features: ["Full core features", "Priority support", "Advanced analytics", "API access"],
				limits: { usage: 10_000, seats: 3 },
				targetPersona: "Individual professionals and founders",
				estimatedConversionFromFree: 0.04,
			},
			{
				name: "Business",
				monthlyPrice: midPrice,
				annualPrice: Math.round(midPrice * 10),
				annualDiscountPct: 17,
				features: ["Everything in Pro", "Team seats", "Advanced integrations", "Custom domains", "SLA"],
				limits: { usage: 100_000, seats: 10 },
				targetPersona: "Growing teams and SMBs",
				estimatedConversionFromFree: 0.01,
			},
			{
				name: "Enterprise",
				monthlyPrice: primaryPath.pricePointMax,
				annualPrice: Math.round(primaryPath.pricePointMax * 10),
				annualDiscountPct: 17,
				features: ["Everything in Business", "Unlimited seats", "Custom contracts", "Dedicated support", "SSO", "Audit logs"],
				limits: { usage: -1, seats: -1 },
				targetPersona: "Large teams and enterprise buyers",
				estimatedConversionFromFree: 0.002,
			},
		];
	}

	// ─── Private: Supporting Revenue Streams ─────────────────────────────────

	private findAffiliateOpportunities(projectType: ProjectType): AffiliateOpportunity[] {
		return AFFILIATE_CATALOG[projectType] ?? AFFILIATE_CATALOG.unknown;
	}

	private buildLeadGenMechanisms(projectType: ProjectType, _audience: string): LeadGenMechanism[] {
		const mechanisms: LeadGenMechanism[] = [
			{
				type: "free_tool",
				name: "Free Tier / Freemium",
				implementation: "Offer a limited but genuinely useful free version. Track activation events to identify upgrade triggers.",
				estimatedMonthlyLeads: 500,
				leadQuality: "WARM",
				followUpFunnel: "In-app upgrade prompts when limits are hit → email sequence → Sales call for enterprise",
			},
			{
				type: "content_magnet",
				name: "SEO Content Hub",
				implementation: `Publish 10+ articles targeting long-tail keywords relevant to ${projectType} use cases. Each article ends with a CTA to sign up.`,
				estimatedMonthlyLeads: 200,
				leadQuality: "COLD",
				followUpFunnel: "Email capture → welcome sequence → feature education → upgrade offer",
			},
		];

		if (projectType === "saas" || projectType === "developer_tool") {
			mechanisms.push({
				type: "calculator",
				name: "ROI / Cost Calculator",
				implementation: "Interactive calculator showing cost savings or ROI from using the product. Shareable results require email.",
				estimatedMonthlyLeads: 150,
				leadQuality: "HOT",
				followUpFunnel: "Email with calculation PDF → sales demo offer → trial activation",
			});
		}

		return mechanisms;
	}

	private buildPartnerships(projectType: ProjectType): PartnershipOpportunity[] {
		const partnerMap: Record<ProjectType, PartnershipOpportunity> = {
			saas: {
				type: "integration",
				partnerName: "Slack / Notion / Linear",
				valueWeOffer: "Native integration with our platform, co-marketing to shared audience",
				valueTheyOffer: "Distribution to their user base, marketplace listing",
				revenuePotential: "$500–$5,000/month in referred signups from marketplace",
				outreachPath: "Apply to partner/integration program → build integration → submit to marketplace",
			},
			content: {
				type: "co_marketing",
				partnerName: "Complementary newsletter operators",
				valueWeOffer: "Cross-promotion to our audience",
				valueTheyOffer: "Cross-promotion to their audience",
				revenuePotential: "100–500 new subscribers per swap",
				outreachPath: "DM on Twitter/X → propose newsletter swap → track subscriber acquisition",
			},
			marketplace: {
				type: "distribution",
				partnerName: "Industry associations and vertical media",
				valueWeOffer: "Rev share on referred sellers/buyers",
				valueTheyOffer: "Endorsement and distribution to members",
				revenuePotential: "$1,000–$10,000/month in referred GMV",
				outreachPath: "Contact editorial team → propose affiliate/media partnership",
			},
			agency: {
				type: "distribution",
				partnerName: "Complementary service agencies",
				valueWeOffer: "Referral fee on client introductions",
				valueTheyOffer: "Referral fee on client introductions",
				revenuePotential: "$500–$5,000 per referred project",
				outreachPath: "LinkedIn outreach to agency owners → propose reciprocal referral",
			},
			ecommerce: {
				type: "co_marketing",
				partnerName: "Complementary product brands",
				valueWeOffer: "Bundle deal or cross-promotion to our customer base",
				valueTheyOffer: "Bundle deal or cross-promotion to their customer base",
				revenuePotential: "10–20% lift in conversion from bundled offers",
				outreachPath: "Brand outreach via email → propose bundle or co-promotion",
			},
			community: {
				type: "co_marketing",
				partnerName: "Tool/platform vendors serving the same audience",
				valueWeOffer: "Access to community for sponsored content",
				valueTheyOffer: "Co-marketing to their user base, tool discounts for members",
				revenuePotential: "$500–$2,000/month in sponsor revenue",
				outreachPath: "Outreach to vendor partner teams → propose community sponsorship",
			},
			developer_tool: {
				type: "integration",
				partnerName: "Cloud providers (AWS, GCP, Azure) partner programs",
				valueWeOffer: "Marketplace listing and co-sell motion",
				valueTheyOffer: "Distribution via cloud marketplace, co-sell support",
				revenuePotential: "10–30% pipeline lift from marketplace discovery",
				outreachPath: "Apply to AWS Partner Network or GCP Partner Advantage → list on marketplace",
			},
			unknown: {
				type: "distribution",
				partnerName: "Industry-relevant partner (TBD)",
				valueWeOffer: "Product integration or referral arrangement",
				valueTheyOffer: "Distribution to their audience",
				revenuePotential: "To be quantified after project type is confirmed",
				outreachPath: "Identify partners after defining project type and target audience",
			},
		};

		return [partnerMap[projectType] ?? partnerMap.unknown];
	}

	private buildMarketplaceListings(projectType: ProjectType): MarketplaceListing[] {
		const listings: MarketplaceListing[] = [
			{
				marketplace: "Product Hunt",
				listingType: "free",
				estimatedMonthlyDiscoveryVisits: 500,
				requirements: ["Product live at URL", "Tagline", "Screenshots", "Maker profile"],
				url: "https://www.producthunt.com/ship",
			},
		];

		if (projectType === "saas" || projectType === "developer_tool") {
			listings.push({
				marketplace: "AlternativeTo",
				listingType: "free",
				estimatedMonthlyDiscoveryVisits: 200,
				requirements: ["Product description", "Website URL"],
				url: "https://alternativeto.net/add-product/",
			});
		}

		if (projectType === "content" || projectType === "community") {
			listings.push({
				marketplace: "Gumroad",
				listingType: "revenue_share",
				revenueSharePct: 10,
				estimatedMonthlyDiscoveryVisits: 300,
				requirements: ["Digital product", "Product description", "Preview content"],
				url: "https://gumroad.com",
			});
		}

		return listings;
	}

	// ─── Private: Scoring and Projections ────────────────────────────────────

	private calculateRevenueScore(
		primaryPath: RevenuePath,
		projectType: ProjectType,
		_audience: string,
		tertiaryActivationDays: number,
	): number {
		const breakdown: RevenueScoreBreakdown = {
			primaryPathStrength: this.scorePrimaryPath(primaryPath),
			marketSize: this.scoreMarketSize(projectType),
			pricingPower: this.scorePricingPower(primaryPath),
			competitiveMoat: this.scoreMoat(primaryPath.complexity),
			timeToRevenue: this.scoreTimeToRevenue(tertiaryActivationDays),
			total: 0,
		};

		breakdown.total =
			breakdown.primaryPathStrength +
			breakdown.marketSize +
			breakdown.pricingPower +
			breakdown.competitiveMoat +
			breakdown.timeToRevenue;

		return Math.min(100, Math.max(0, breakdown.total));
	}

	private scorePrimaryPath(path: RevenuePath): number {
		// 0–30 pts based on ceiling and complexity
		if (path.revenueEstimateCeiling >= 50_000) return 28;
		if (path.revenueEstimateCeiling >= 20_000) return 22;
		if (path.revenueEstimateCeiling >= 10_000) return 16;
		return 10;
	}

	private scoreMarketSize(projectType: ProjectType): number {
		const scores: Record<ProjectType, number> = {
			saas: 18,
			marketplace: 20,
			ecommerce: 18,
			content: 14,
			community: 13,
			developer_tool: 16,
			agency: 12,
			unknown: 10,
		};
		return scores[projectType] ?? 10;
	}

	private scorePricingPower(path: RevenuePath): number {
		// 0–20 pts
		if (path.pricePointMax >= 500) return 18;
		if (path.pricePointMax >= 100) return 15;
		if (path.pricePointMax >= 29) return 12;
		return 7;
	}

	private scoreMoat(complexity: Complexity): number {
		// Higher complexity = stronger moat
		return complexity === "HIGH" ? 13 : complexity === "MEDIUM" ? 10 : 7;
	}

	private scoreTimeToRevenue(activationDays: number): number {
		// Faster is better — 0–15 pts
		if (activationDays <= 7) return 14;
		if (activationDays <= 14) return 12;
		if (activationDays <= 30) return 10;
		if (activationDays <= 60) return 7;
		return 4;
	}

	private scoreToVerdict(score: number): RevenueMomentum {
		if (score >= 70) return "STRONG";
		if (score >= 50) return "VIABLE";
		if (score >= 30) return "WEAK";
		return "NOT_VIABLE";
	}

	private projectMRR(
		tiers: SubscriptionTier[],
		primaryPath: RevenuePath,
		revenueScore: number,
	): MRRProjection {
		const trafficBaseline = 2_000; // Monthly visitors at Month 6
		const freeToPaidConversion = 0.03; // 3% baseline
		const arpu = tiers[1]?.monthlyPrice ?? primaryPath.pricePointMin;
		const monthlyChurnRate = 0.05;

		const paidUsers = trafficBaseline * freeToPaidConversion;
		const baseMrr = paidUsers * arpu;

		const scoreMult = revenueScore / 100;
		const conservativeMrr = Math.round(baseMrr * 0.6 * scoreMult);
		const optimisticMrr = Math.round(baseMrr * 1.4 * scoreMult);

		return {
			month: 6,
			conservativeMrr,
			optimisticMrr,
			assumptions: {
				trafficBaseline,
				freeToPaidConversion,
				arpu,
				monthlyChurnRate,
			},
		};
	}

	private estimateTimeToFirstDollar(path: RevenuePath, _projectType: ProjectType): number {
		// Add buffer to activation time
		return path.timeToActivateDays + 7;
	}

	private recommendPricingModel(
		projectType: ProjectType,
		primaryPath: RevenuePath,
		_audience: string,
	): { model: PricingModel; rationale: string } {
		const model: PricingModel =
			primaryPath.type === "subscription" ? "freemium"
			: primaryPath.type === "usage_based" ? "usage_based"
			: primaryPath.type === "one_time" ? "one_time"
			: primaryPath.type === "transaction_fee" ? "marketplace"
			: primaryPath.type === "affiliate" ? "affiliate"
			: primaryPath.type === "lead_gen" ? "lead_gen"
			: "subscription";

		const rationale = `For a ${projectType} project with ${primaryPath.type} as the primary revenue type, ${model} is the optimal pricing model. It aligns price with value delivery, reduces friction for new users, and creates natural upgrade triggers as usage grows. Alternative models (one-time purchase, pure advertising) were considered but offer lower LTV and less predictable revenue for this project type.`;

		return { model, rationale };
	}

	private buildRoadmap(
		primary: RevenuePath,
		secondary: RevenuePath,
		tertiary: RevenuePath,
	): MonetizationRoadmap {
		return {
			month1: [
				`Activate primary revenue: ${primary.name}`,
				"Set up Stripe and checkout flow",
				"Launch free tier to build user base",
				"Get first paying customer",
			],
			month2to3: [
				"Optimize onboarding-to-paid conversion",
				`Activate affiliate stream: ${tertiary.name}`,
				"Launch all subscription tiers",
				"Submit Product Hunt listing",
				"Start SEO content hub (3 articles)",
			],
			month4to6: [
				"Launch lead gen mechanisms",
				"Pursue first partnership opportunity",
				"Submit additional marketplace listings",
				"A/B test pricing page",
				`Begin activating: ${secondary.name}`,
			],
			month6to12: [
				"Finalize and formalize first partnership",
				"Explore enterprise tier if ARR > $10k",
				"Expand affiliate program",
				"Evaluate adjacent revenue opportunities",
				"Build referral program for existing customers",
			],
		};
	}

	private validateComplete(outputs: {
		subscriptionTiers: SubscriptionTier[];
		affiliateOpportunities: AffiliateOpportunity[];
		leadGenMechanisms: LeadGenMechanism[];
		partnershipOpportunities: PartnershipOpportunity[];
	}): boolean {
		return (
			outputs.subscriptionTiers.length >= 3 &&
			outputs.affiliateOpportunities.length >= 2 &&
			outputs.leadGenMechanisms.length >= 2 &&
			outputs.partnershipOpportunities.length >= 1
		);
	}

	// ─── Logging ──────────────────────────────────────────────────────────────

	private async logReport(report: MonetizationReport): Promise<void> {
		const entry = {
			timestamp: report.analysedAt.toISOString(),
			project_id: report.projectId,
			revenue_score: report.revenueScore,
			verdict: report.verdict,
			primary_mrr_estimate: {
				low: report.mrrProjection.conservativeMrr,
				high: report.mrrProjection.optimisticMrr,
			},
			time_to_first_dollar_days: report.timeToFirstDollarDays,
			recommended_pricing_model: report.recommendedPricingModel,
			report_complete: report.complete,
			duration_ms: report.durationMs,
		};

		try {
			await fs.appendFile(
				this.logFilePath,
				`${JSON.stringify(entry)}\n`,
				"utf-8",
			);
		} catch (err) {
			process.stderr.write(`[MONETIZATION] Log write failed: ${String(err)}\n`);
		}
	}

	private async ensureLogDir(): Promise<void> {
		await fs.mkdir(path.dirname(this.logFilePath), { recursive: true });
	}
}
