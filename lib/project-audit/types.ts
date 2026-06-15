export interface ProjectAudit {
	project_id: string;
	repo_path: string;
	timestamp: string;
	what_was_being_built: string;
	current_state: "early-prototype" | "mvp" | "beta" | "production" | "abandoned";
	completeness_score: number; // 0-100
	missing_functionality: string[];
	broken_functionality: string[];
	revenue_opportunities: RevenueOpportunity[];
	design_issues: string[];
	technical_debt: string[];
	deployment_readiness: number; // 0-100
	production_readiness: number; // 0-100
	human_blockers: string[];
	tech_stack: string[];
	has_tests: boolean;
	has_ci: boolean;
	has_env_config: boolean;
	has_readme: boolean;
	has_deployment_config: boolean;
	dependencies_current: boolean;
	security_issues: string[];
}

export interface RevenueOpportunity {
	type: "subscription" | "one-time" | "affiliate" | "lead-gen" | "partnership" | "marketplace" | "advertising";
	description: string;
	estimated_mrr: string;
	effort: "low" | "medium" | "high";
	priority: number;
}
