/**
 * Judge Agent Orchestrator
 *
 * The final authority on all deployments and quality decisions in the
 * Pauli Pi Software Factory. Evaluates projects on ten dimensions.
 * Issues PASS, PASS_WITH_CONDITIONS, or FAIL verdicts.
 * No deployment proceeds without a PASS verdict.
 */

import fs from "node:fs/promises";
import path from "node:path";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Verdict = "PASS" | "PASS_WITH_CONDITIONS" | "FAIL";

export type IssueSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type AutoFailCondition =
	| "critical_security_issue"
	| "data_exposure"
	| "sql_injection"
	| "xss_vulnerability";

export type HumanApprovalType =
	| "production_deployment"
	| "dns_changes"
	| "stripe_live"
	| "database_destructive"
	| "mass_communications";

export interface ProjectScores {
	business_viability: number; // 0–10, threshold 7
	design_quality_udec: number; // 0–10, threshold 8.5
	production_readiness: number; // 0–100, threshold 80
	security: number; // 0–10, threshold 9
	accessibility: number; // 0–10, threshold 8
	performance: number; // 0–10, threshold 7
	maintainability: number; // 0–10, threshold 7
	revenue_readiness: number; // 0–10, threshold 6
	user_experience: number; // 0–10, threshold 8
	deployment_readiness: number; // 0–10, threshold 9
}

export interface ScoreThresholds {
	business_viability: number;
	design_quality_udec: number;
	production_readiness: number;
	security: number;
	accessibility: number;
	performance: number;
	maintainability: number;
	revenue_readiness: number;
	user_experience: number;
	deployment_readiness: number;
}

export interface EvaluationIssue {
	dimension: keyof ProjectScores;
	severity: IssueSeverity;
	description: string;
	fix: string;
	autoFail: boolean;
}

export interface Condition {
	dimension: keyof ProjectScores;
	description: string;
	deadline: string; // e.g. "72 hours post-deploy"
}

export interface DesignReport {
	udecScore: number;
	passed: boolean;
	issues: Array<{ dimension: string; severity: string; description: string; fix: string }>;
}

export interface QAReport {
	overallResult: "PASS" | "FAIL";
	deploymentBlocked: boolean;
	blockReasons: string[];
	categories: Record<string, { result: string; issues: unknown[] }>;
	coreWebVitals: {
		lcpMs: number;
		inpMs: number;
		cls: number;
		fcpMs: number;
		ttiMs: number;
	};
}

export interface MonetizationReport {
	revenueScore: number;
	verdict: string;
	primaryMrrEstimate: { low: number; high: number };
	timeToFirstDollarDays: number;
	recommendedPricingModel: string;
}

export interface EvaluationInput {
	projectId: string;
	projectPath: string;
	projectType: string;
	deploymentTarget: string;
	deploymentType?: HumanApprovalType;
	designReport?: DesignReport;
	qaReport?: QAReport;
	monetizationReport?: MonetizationReport;
	// Raw findings from Judge's own checks
	securityFindings?: SecurityFinding[];
	codebaseStats?: CodebaseStats;
}

export interface SecurityFinding {
	type: AutoFailCondition | string;
	severity: IssueSeverity;
	location: string;
	description: string;
}

export interface CodebaseStats {
	hasTypeScript: boolean;
	hasTests: boolean;
	hasReadme: boolean;
	anyCount: number; // number of `any` type usages
	unhandledPromiseRejections: number;
	openCors: boolean;
	hardcodedSecrets: boolean;
	dependencyVulnerabilities: number;
}

export interface JudgeVerdict {
	projectId: string;
	verdict: Verdict;
	scores: ProjectScores;
	autoFailTriggered: boolean;
	autoFailReason: string | null;
	issues: EvaluationIssue[];
	conditions: Condition[];
	humanApprovalRequired: boolean;
	humanApprovalType: HumanApprovalType | null;
	summary: string;
	evaluatedAt: Date;
	durationMs: number;
}

export interface JudgeConfig {
	thresholds: ScoreThresholds;
	autoFailConditions: AutoFailCondition[];
	humanApprovalRequired: HumanApprovalType[];
	logFile: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: JudgeConfig = {
	thresholds: {
		business_viability: 7,
		design_quality_udec: 8.5,
		production_readiness: 80,
		security: 9,
		accessibility: 8,
		performance: 7,
		maintainability: 7,
		revenue_readiness: 6,
		user_experience: 8,
		deployment_readiness: 9,
	},
	autoFailConditions: [
		"critical_security_issue",
		"data_exposure",
		"sql_injection",
		"xss_vulnerability",
	],
	humanApprovalRequired: [
		"production_deployment",
		"dns_changes",
		"stripe_live",
		"database_destructive",
		"mass_communications",
	],
	logFile: "logs/judge.jsonl",
};

// ─── JudgeAgent ───────────────────────────────────────────────────────────────

export class JudgeAgent {
	private config: JudgeConfig;
	private logFilePath: string;

	constructor(config: Partial<JudgeConfig> = {}) {
		this.config = {
			...DEFAULT_CONFIG,
			...config,
			thresholds: { ...DEFAULT_CONFIG.thresholds, ...config.thresholds },
		};
		this.logFilePath = path.resolve(process.cwd(), this.config.logFile);
	}

	/**
	 * Run a full Judge evaluation on a project.
	 * This is the main entry point.
	 */
	async evaluate(input: EvaluationInput): Promise<JudgeVerdict> {
		const startMs = Date.now();
		await this.ensureLogDir();

		const issues: EvaluationIssue[] = [];
		const conditions: Condition[] = [];

		// 1. Collect scores from all dimensions
		const scores = await this.scoreAllDimensions(input, issues);

		// 2. Check auto-fail conditions
		const autoFail = this.checkAutoFailConditions(input, issues);

		// 3. Determine human approval requirement
		const humanApproval = this.checkHumanApproval(input);

		// 4. Generate verdict
		let verdict: Verdict;

		if (autoFail.triggered) {
			verdict = "FAIL";
		} else {
			const failingDimensions = this.getFailingDimensions(scores);
			const criticalFailures = issues.filter((i) => i.severity === "CRITICAL");

			if (criticalFailures.length > 0 || failingDimensions.length > 0) {
				verdict = "FAIL";
			} else {
				// Check for near-threshold dimensions that warrant conditions
				const nearThreshold = this.getNearThresholdDimensions(scores);
				if (nearThreshold.length > 0) {
					verdict = "PASS_WITH_CONDITIONS";
					for (const dim of nearThreshold) {
						conditions.push({
							dimension: dim.dimension,
							description: `${dim.label} score is ${dim.score.toFixed(1)} (threshold: ${dim.threshold}). Must reach ${(dim.threshold + 0.5).toFixed(1)} within 72 hours.`,
							deadline: "72 hours post-deploy",
						});
					}
				} else {
					verdict = "PASS";
				}
			}
		}

		const durationMs = Date.now() - startMs;

		const judgeVerdict: JudgeVerdict = {
			projectId: input.projectId,
			verdict,
			scores,
			autoFailTriggered: autoFail.triggered,
			autoFailReason: autoFail.reason,
			issues,
			conditions,
			humanApprovalRequired: humanApproval.required,
			humanApprovalType: humanApproval.type,
			summary: this.generateSummary(verdict, scores, issues, conditions, autoFail),
			evaluatedAt: new Date(),
			durationMs,
		};

		// Log the verdict
		await this.logVerdict(judgeVerdict);

		return judgeVerdict;
	}

	/**
	 * Score business viability dimension.
	 */
	async scoreBusinessViability(
		input: EvaluationInput,
		issues: EvaluationIssue[],
	): Promise<number> {
		let score = 10;

		// Revenue readiness from monetization report
		if (input.monetizationReport) {
			const revenueScore = input.monetizationReport.revenueScore;
			if (revenueScore < 30) {
				score -= 4;
				issues.push({
					dimension: "business_viability",
					severity: "CRITICAL",
					description: `Revenue score critically low: ${revenueScore}/100`,
					fix: "Define a clear monetization path. Revenue score must reach 50+.",
					autoFail: false,
				});
			} else if (revenueScore < 50) {
				score -= 2;
				issues.push({
					dimension: "business_viability",
					severity: "HIGH",
					description: `Revenue score below threshold: ${revenueScore}/100`,
					fix: "Strengthen revenue model. Add subscription tiers or affiliate paths.",
					autoFail: false,
				});
			}
		} else {
			// No monetization report at all
			score -= 3;
			issues.push({
				dimension: "business_viability",
				severity: "HIGH",
				description: "No monetization analysis found",
				fix: "Run Monetization Agent before Judge review.",
				autoFail: false,
			});
		}

		return Math.max(0, Math.min(10, score));
	}

	/**
	 * Score design quality using UDEC from the Design Agent's report.
	 */
	async scoreDesignQuality(
		input: EvaluationInput,
		issues: EvaluationIssue[],
	): Promise<number> {
		if (!input.designReport) {
			issues.push({
				dimension: "design_quality_udec",
				severity: "CRITICAL",
				description: "No design audit report found",
				fix: "Run Design Agent before Judge review.",
				autoFail: false,
			});
			return 0;
		}

		const score = input.designReport.udecScore;

		if (!input.designReport.passed) {
			for (const issue of input.designReport.issues.slice(0, 5)) {
				issues.push({
					dimension: "design_quality_udec",
					severity: issue.severity === "HIGH" ? "HIGH" : "MEDIUM",
					description: issue.description,
					fix: issue.fix,
					autoFail: false,
				});
			}
		}

		return score;
	}

	/**
	 * Score production readiness (0–100).
	 */
	async scoreProductionReadiness(
		input: EvaluationInput,
		issues: EvaluationIssue[],
	): Promise<number> {
		let score = 100;
		const stats = input.codebaseStats;

		if (!stats) {
			// Without codebase stats, we can only give a partial score
			return 70;
		}

		if (stats.unhandledPromiseRejections > 0) {
			score -= 20;
			issues.push({
				dimension: "production_readiness",
				severity: "HIGH",
				description: `${stats.unhandledPromiseRejections} unhandled Promise rejections detected`,
				fix: "Add .catch() handlers or try/catch blocks to all async operations.",
				autoFail: false,
			});
		}

		if (!stats.hasTests) {
			score -= 15;
			issues.push({
				dimension: "production_readiness",
				severity: "MEDIUM",
				description: "No test files detected",
				fix: "Add tests for critical paths before production deployment.",
				autoFail: false,
			});
		}

		if (!stats.hasReadme) {
			score -= 5;
			issues.push({
				dimension: "production_readiness",
				severity: "LOW",
				description: "No README found",
				fix: "Add README with setup instructions and project overview.",
				autoFail: false,
			});
		}

		return Math.max(0, Math.min(100, score));
	}

	/**
	 * Score security. Any critical finding = auto-fail condition triggered.
	 */
	async scoreSecurity(
		input: EvaluationInput,
		issues: EvaluationIssue[],
	): Promise<number> {
		let score = 10;
		const stats = input.codebaseStats;
		const findings = input.securityFindings ?? [];

		if (stats?.hardcodedSecrets) {
			score -= 5;
			issues.push({
				dimension: "security",
				severity: "CRITICAL",
				description: "Hardcoded secrets detected in codebase",
				fix: "Move all secrets to environment variables. Rotate any exposed keys immediately.",
				autoFail: true,
			});
		}

		if (stats?.openCors) {
			score -= 3;
			issues.push({
				dimension: "security",
				severity: "CRITICAL",
				description: "Open CORS policy (Access-Control-Allow-Origin: *) in production",
				fix: "Restrict CORS to specific allowed origins.",
				autoFail: false,
			});
		}

		if (stats?.dependencyVulnerabilities && stats.dependencyVulnerabilities > 0) {
			score -= Math.min(3, stats.dependencyVulnerabilities);
			issues.push({
				dimension: "security",
				severity: "HIGH",
				description: `${stats.dependencyVulnerabilities} dependency vulnerabilities detected`,
				fix: "Run `npm audit fix` and update vulnerable dependencies.",
				autoFail: stats.dependencyVulnerabilities > 3,
			});
		}

		for (const finding of findings) {
			const isAutoFail = (this.config.autoFailConditions as string[]).includes(
				finding.type,
			);
			issues.push({
				dimension: "security",
				severity: finding.severity,
				description: `${finding.type}: ${finding.description} (${finding.location})`,
				fix: `Fix ${finding.type} vulnerability at ${finding.location}`,
				autoFail: isAutoFail,
			});
			if (isAutoFail) score -= 5;
			else if (finding.severity === "HIGH") score -= 2;
			else score -= 1;
		}

		return Math.max(0, Math.min(10, score));
	}

	/**
	 * Score accessibility from QA report.
	 */
	async scoreAccessibility(
		input: EvaluationInput,
		issues: EvaluationIssue[],
	): Promise<number> {
		if (!input.qaReport) {
			issues.push({
				dimension: "accessibility",
				severity: "HIGH",
				description: "No Browser QA report — accessibility not verified",
				fix: "Run Browser QA Agent before Judge review.",
				autoFail: false,
			});
			return 5;
		}

		const a11y = input.qaReport.categories.accessibility;
		if (!a11y) return 7;

		if (a11y.result === "FAIL") {
			for (const issue of (a11y.issues as EvaluationIssue[]).slice(0, 3)) {
				issues.push({
					dimension: "accessibility",
					severity: "HIGH",
					description: String(issue),
					fix: "Fix identified accessibility violations.",
					autoFail: false,
				});
			}
			return 5;
		}

		return 9;
	}

	/**
	 * Score performance from QA report Core Web Vitals.
	 */
	async scorePerformance(
		input: EvaluationInput,
		issues: EvaluationIssue[],
	): Promise<number> {
		if (!input.qaReport?.coreWebVitals) {
			issues.push({
				dimension: "performance",
				severity: "MEDIUM",
				description: "No performance metrics available",
				fix: "Run Browser QA Agent to capture Core Web Vitals.",
				autoFail: false,
			});
			return 6;
		}

		const vitals = input.qaReport.coreWebVitals;
		let score = 10;

		if (vitals.lcpMs > 4000) {
			score -= 4;
			issues.push({
				dimension: "performance",
				severity: "CRITICAL",
				description: `LCP is ${vitals.lcpMs}ms (must be < 2500ms)`,
				fix: "Optimize largest contentful paint: compress images, preload hero assets.",
				autoFail: false,
			});
		} else if (vitals.lcpMs > 2500) {
			score -= 2;
			issues.push({
				dimension: "performance",
				severity: "HIGH",
				description: `LCP is ${vitals.lcpMs}ms (target: < 2500ms)`,
				fix: "Optimize image sizes and reduce render-blocking resources.",
				autoFail: false,
			});
		}

		if (vitals.cls > 0.25) {
			score -= 3;
			issues.push({
				dimension: "performance",
				severity: "HIGH",
				description: `CLS is ${vitals.cls} (must be < 0.1)`,
				fix: "Set explicit width/height on images and ads. Avoid inserting content above existing content.",
				autoFail: false,
			});
		} else if (vitals.cls > 0.1) {
			score -= 1;
		}

		if (vitals.inpMs > 500) {
			score -= 2;
			issues.push({
				dimension: "performance",
				severity: "HIGH",
				description: `INP is ${vitals.inpMs}ms (must be < 200ms)`,
				fix: "Break up long JavaScript tasks. Defer non-critical JS.",
				autoFail: false,
			});
		}

		return Math.max(0, Math.min(10, score));
	}

	/**
	 * Score maintainability from codebase stats.
	 */
	async scoreMaintainability(
		input: EvaluationInput,
		issues: EvaluationIssue[],
	): Promise<number> {
		const stats = input.codebaseStats;
		let score = 10;

		if (!stats) return 7;

		if (!stats.hasTypeScript) {
			score -= 2;
			issues.push({
				dimension: "maintainability",
				severity: "MEDIUM",
				description: "Project is not using TypeScript",
				fix: "Migrate to TypeScript for improved maintainability.",
				autoFail: false,
			});
		}

		if (stats.anyCount > 20) {
			score -= 2;
			issues.push({
				dimension: "maintainability",
				severity: "MEDIUM",
				description: `High usage of TypeScript \`any\` type: ${stats.anyCount} occurrences`,
				fix: "Replace `any` with proper type definitions.",
				autoFail: false,
			});
		}

		if (!stats.hasTests) {
			score -= 1;
		}

		return Math.max(0, Math.min(10, score));
	}

	/**
	 * Score revenue readiness from monetization report.
	 */
	async scoreRevenueReadiness(
		input: EvaluationInput,
		issues: EvaluationIssue[],
	): Promise<number> {
		if (!input.monetizationReport) {
			issues.push({
				dimension: "revenue_readiness",
				severity: "HIGH",
				description: "No monetization analysis found",
				fix: "Run Monetization Agent before Judge review.",
				autoFail: false,
			});
			return 3;
		}

		const revenueScore = input.monetizationReport.revenueScore;
		// Map 0–100 revenue score to 0–10 dimension score
		return Math.max(0, Math.min(10, revenueScore / 10));
	}

	/**
	 * Score user experience from QA categories.
	 */
	async scoreUserExperience(
		input: EvaluationInput,
		issues: EvaluationIssue[],
	): Promise<number> {
		if (!input.qaReport) return 6;

		let score = 10;
		const cats = input.qaReport.categories;

		if (cats.navigation?.result === "FAIL") {
			score -= 3;
			issues.push({
				dimension: "user_experience",
				severity: "HIGH",
				description: "Navigation failures detected in QA",
				fix: "Fix all broken navigation links and dead ends.",
				autoFail: false,
			});
		}

		if (cats.forms?.result === "FAIL") {
			score -= 2;
			issues.push({
				dimension: "user_experience",
				severity: "HIGH",
				description: "Form submission issues detected",
				fix: "Fix form validation and submission flows.",
				autoFail: false,
			});
		}

		return Math.max(0, Math.min(10, score));
	}

	/**
	 * Score deployment readiness.
	 */
	async scoreDeploymentReadiness(
		input: EvaluationInput,
		issues: EvaluationIssue[],
	): Promise<number> {
		let score = 10;

		if (input.qaReport?.deploymentBlocked) {
			score -= 5;
			for (const reason of input.qaReport.blockReasons.slice(0, 3)) {
				issues.push({
					dimension: "deployment_readiness",
					severity: "CRITICAL",
					description: `QA blocking deployment: ${reason}`,
					fix: `Resolve QA failure: ${reason}`,
					autoFail: false,
				});
			}
		}

		return Math.max(0, Math.min(10, score));
	}

	// ─── Private Methods ───────────────────────────────────────────────────────

	private async scoreAllDimensions(
		input: EvaluationInput,
		issues: EvaluationIssue[],
	): Promise<ProjectScores> {
		const [
			business_viability,
			design_quality_udec,
			production_readiness,
			security,
			accessibility,
			performance,
			maintainability,
			revenue_readiness,
			user_experience,
			deployment_readiness,
		] = await Promise.all([
			this.scoreBusinessViability(input, issues),
			this.scoreDesignQuality(input, issues),
			this.scoreProductionReadiness(input, issues),
			this.scoreSecurity(input, issues),
			this.scoreAccessibility(input, issues),
			this.scorePerformance(input, issues),
			this.scoreMaintainability(input, issues),
			this.scoreRevenueReadiness(input, issues),
			this.scoreUserExperience(input, issues),
			this.scoreDeploymentReadiness(input, issues),
		]);

		return {
			business_viability,
			design_quality_udec,
			production_readiness,
			security,
			accessibility,
			performance,
			maintainability,
			revenue_readiness,
			user_experience,
			deployment_readiness,
		};
	}

	private checkAutoFailConditions(
		input: EvaluationInput,
		issues: EvaluationIssue[],
	): { triggered: boolean; reason: string | null } {
		// Check auto-fail from security findings
		const autoFailIssue = issues.find((i) => i.autoFail);
		if (autoFailIssue) {
			return {
				triggered: true,
				reason: `Auto-fail: ${autoFailIssue.description}`,
			};
		}

		// Check explicit auto-fail conditions from security findings
		for (const finding of input.securityFindings ?? []) {
			if ((this.config.autoFailConditions as string[]).includes(finding.type)) {
				return {
					triggered: true,
					reason: `Auto-fail condition triggered: ${finding.type} at ${finding.location}`,
				};
			}
		}

		return { triggered: false, reason: null };
	}

	private checkHumanApproval(
		input: EvaluationInput,
	): { required: boolean; type: HumanApprovalType | null } {
		if (
			input.deploymentType &&
			(this.config.humanApprovalRequired as string[]).includes(input.deploymentType)
		) {
			return { required: true, type: input.deploymentType };
		}
		return { required: false, type: null };
	}

	private getFailingDimensions(scores: ProjectScores): Array<keyof ProjectScores> {
		const failing: Array<keyof ProjectScores> = [];
		const t = this.config.thresholds;

		if (scores.business_viability < t.business_viability) failing.push("business_viability");
		if (scores.design_quality_udec < t.design_quality_udec) failing.push("design_quality_udec");
		if (scores.production_readiness < t.production_readiness) failing.push("production_readiness");
		if (scores.security < t.security) failing.push("security");
		if (scores.accessibility < t.accessibility) failing.push("accessibility");
		if (scores.performance < t.performance) failing.push("performance");
		if (scores.maintainability < t.maintainability) failing.push("maintainability");
		if (scores.revenue_readiness < t.revenue_readiness) failing.push("revenue_readiness");
		if (scores.user_experience < t.user_experience) failing.push("user_experience");
		if (scores.deployment_readiness < t.deployment_readiness) failing.push("deployment_readiness");

		return failing;
	}

	private getNearThresholdDimensions(scores: ProjectScores): Array<{
		dimension: keyof ProjectScores;
		label: string;
		score: number;
		threshold: number;
	}> {
		const near: Array<{ dimension: keyof ProjectScores; label: string; score: number; threshold: number }> = [];
		const t = this.config.thresholds;

		const checks: Array<[keyof ProjectScores, string, number]> = [
			["business_viability", "Business Viability", t.business_viability],
			["design_quality_udec", "Design Quality (UDEC)", t.design_quality_udec],
			["accessibility", "Accessibility", t.accessibility],
			["performance", "Performance", t.performance],
			["maintainability", "Maintainability", t.maintainability],
			["revenue_readiness", "Revenue Readiness", t.revenue_readiness],
			["user_experience", "User Experience", t.user_experience],
		];

		for (const [dim, label, threshold] of checks) {
			const score = scores[dim] as number;
			// "Near threshold" = passes but within 10% margin above threshold
			if (score >= threshold && score < threshold * 1.1) {
				near.push({ dimension: dim, label, score, threshold });
			}
		}

		return near;
	}

	private generateSummary(
		verdict: Verdict,
		scores: ProjectScores,
		issues: EvaluationIssue[],
		conditions: Condition[],
		autoFail: { triggered: boolean; reason: string | null },
	): string {
		if (autoFail.triggered) {
			return `FAIL — Auto-fail condition triggered: ${autoFail.reason}. Deployment blocked.`;
		}

		const criticals = issues.filter((i) => i.severity === "CRITICAL");
		const highs = issues.filter((i) => i.severity === "HIGH");

		if (verdict === "FAIL") {
			return `FAIL — ${criticals.length} critical and ${highs.length} high-severity issues detected. Deployment blocked pending resolution.`;
		}

		if (verdict === "PASS_WITH_CONDITIONS") {
			return `PASS WITH CONDITIONS — Project meets minimum thresholds but has ${conditions.length} condition(s) that must be addressed within 72 hours post-deploy.`;
		}

		const avg =
			Object.values(scores).reduce((a, b) => a + b, 0) /
			Object.keys(scores).length;
		return `PASS — All dimensions meet or exceed thresholds. Average score: ${avg.toFixed(1)}. Deployment approved.`;
	}

	private async logVerdict(verdict: JudgeVerdict): Promise<void> {
		const entry = {
			timestamp: verdict.evaluatedAt.toISOString(),
			project_id: verdict.projectId,
			verdict: verdict.verdict,
			scores: verdict.scores,
			auto_fail_triggered: verdict.autoFailTriggered,
			auto_fail_reason: verdict.autoFailReason,
			conditions: verdict.conditions,
			critical_issues: verdict.issues.filter((i) => i.severity === "CRITICAL"),
			human_approval_required: verdict.humanApprovalRequired,
			human_approval_type: verdict.humanApprovalType,
			evaluator: "judge",
			duration_ms: verdict.durationMs,
		};

		try {
			await fs.appendFile(
				this.logFilePath,
				`${JSON.stringify(entry)}\n`,
				"utf-8",
			);
		} catch (err) {
			process.stderr.write(`[JUDGE] Log write failed: ${String(err)}\n`);
		}
	}

	private async ensureLogDir(): Promise<void> {
		await fs.mkdir(path.dirname(this.logFilePath), { recursive: true });
	}
}
