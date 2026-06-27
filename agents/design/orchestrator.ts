/**
 * Design Agent Orchestrator
 *
 * Enforces Synthia Superdesign standards across all Pauli Pi projects.
 * Audits UI components, scores builds using the UDEC framework,
 * and auto-triggers rebuilds when UDEC < 8.5.
 */

import fs from "node:fs/promises";
import path from "node:path";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DesignIssueSeverity = "HIGH" | "MEDIUM" | "LOW";

export type AuditDimension =
	| "typography"
	| "color_system"
	| "spacing"
	| "animation"
	| "layout_hierarchy"
	| "component_consistency"
	| "responsive_integrity"
	| "accessibility_baseline"
	| "polish";

export interface DesignIssue {
	dimension: AuditDimension;
	severity: DesignIssueSeverity;
	component: string;
	description: string;
	fix: string;
	value?: string; // Actual value found (e.g., "20px", "#ff0000")
	expected?: string; // What it should be (e.g., "16px or 24px", "HSL dark palette")
}

export interface UDECSubScores {
	typography: number; // 0–10, weight: 15%
	color_system: number; // 0–10, weight: 15%
	spacing: number; // 0–10, weight: 10%
	animation: number; // 0–10, weight: 10%
	layout_hierarchy: number; // 0–10, weight: 15%
	component_consistency: number; // 0–10, weight: 10%
	responsive_integrity: number; // 0–10, weight: 15%
	accessibility_baseline: number; // 0–10, weight: 5%
	polish: number; // 0–10, weight: 5%
}

export interface UDECWeights {
	typography: number;
	color_system: number;
	spacing: number;
	animation: number;
	layout_hierarchy: number;
	component_consistency: number;
	responsive_integrity: number;
	accessibility_baseline: number;
	polish: number;
}

export interface ResponsiveCheckResult {
	viewport: string;
	widthPx: number;
	passed: boolean;
	issues: string[];
}

export interface TypographyAudit {
	fontsFound: string[];
	hasEditorialPair: boolean;
	scaleRatioDetected: number | null;
	violations: string[];
}

export interface ColorAudit {
	colorsFound: string[];
	usingHSL: boolean;
	hasDarkPalette: boolean;
	contrastViolations: Array<{ element: string; ratio: number; required: number }>;
	nonPaletteColors: string[];
}

export interface SpacingAudit {
	violatingValues: Array<{ value: string; element: string }>;
	totalViolations: number;
	complianceRate: number; // 0–1
}

export interface AnimationAudit {
	durationsFound: number[]; // in ms
	easingsFound: string[];
	outOfRangeDurations: number[];
	hasReducedMotionSupport: boolean;
	violations: string[];
}

export interface DesignAuditReport {
	projectId: string;
	projectPath: string;
	udecScore: number;
	passed: boolean;
	subScores: UDECSubScores;
	issues: DesignIssue[];
	typography: TypographyAudit;
	color: ColorAudit;
	spacing: SpacingAudit;
	animation: AnimationAudit;
	responsive: ResponsiveCheckResult[];
	rebuildTriggered: boolean;
	rebuildCount: number;
	auditedAt: Date;
	durationMs: number;
}

export interface RebuildManifest {
	projectId: string;
	reason: string;
	udecScore: number;
	corrections: DesignCorrection[];
	generatedAt: Date;
}

export interface DesignCorrection {
	dimension: AuditDimension;
	severity: DesignIssueSeverity;
	component: string;
	currentValue: string;
	requiredValue: string;
	instruction: string;
}

export interface DesignAgentConfig {
	udecPassThreshold: number;
	spacingScalePx: number[];
	animationDurationMin: number;
	animationDurationMax: number;
	contrastRatioMin: number;
	touchTargetMinPx: number;
	borderRadiusAllowedPx: number[];
	breakpointsPx: number[];
	maxRebuildCycles: number;
	logFile: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: DesignAgentConfig = {
	udecPassThreshold: 8.5,
	spacingScalePx: [4, 8, 16, 24, 32, 48, 64],
	animationDurationMin: 200,
	animationDurationMax: 400,
	contrastRatioMin: 7,
	touchTargetMinPx: 44,
	borderRadiusAllowedPx: [4, 8],
	breakpointsPx: [320, 768, 1024, 1440],
	maxRebuildCycles: 3,
	logFile: "logs/design.jsonl",
};

const UDEC_WEIGHTS: UDECWeights = {
	typography: 0.15,
	color_system: 0.15,
	spacing: 0.10,
	animation: 0.10,
	layout_hierarchy: 0.15,
	component_consistency: 0.10,
	responsive_integrity: 0.15,
	accessibility_baseline: 0.05,
	polish: 0.05,
};

const ALLOWED_BODY_FONTS = [
	"Inter",
	"DM Sans",
	"Plus Jakarta Sans",
	"Geist",
	"Manrope",
	"Outfit",
];

const ALLOWED_DISPLAY_FONTS = [
	"Fraunces",
	"Playfair Display",
	"DM Serif Display",
	"Lora",
	"Libre Baskerville",
	"Cabinet Grotesk",
	"Clash Display",
];

// ─── DesignAgent ──────────────────────────────────────────────────────────────

export class DesignAgent {
	private config: DesignAgentConfig;
	private logFilePath: string;

	constructor(config: Partial<DesignAgentConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.logFilePath = path.resolve(process.cwd(), this.config.logFile);
	}

	/**
	 * Run a full design audit on a project path.
	 * Returns the complete audit report with UDEC score.
	 */
	async audit(projectId: string, projectPath: string): Promise<DesignAuditReport> {
		const startMs = Date.now();
		await this.ensureLogDir();

		const issues: DesignIssue[] = [];

		// Run all audit phases in parallel where possible
		const [typography, color, spacing, animation, responsive] = await Promise.all([
			this.auditTypography(projectPath, issues),
			this.auditColor(projectPath, issues),
			this.auditSpacing(projectPath, issues),
			this.auditAnimation(projectPath, issues),
			this.auditResponsive(projectPath, issues),
		]);

		// These depend on results above
		const layout = await this.auditLayout(projectPath, issues);
		const components = await this.auditComponents(projectPath, issues);
		const polish = await this.auditPolish(projectPath, issues);
		const a11yBaseline = await this.auditAccessibilityBaseline(projectPath, issues);

		// Compute sub-scores
		const subScores = this.computeSubScores(
			typography,
			color,
			spacing,
			animation,
			responsive,
			layout,
			components,
			polish,
			a11yBaseline,
			issues,
		);

		// Compute final UDEC score
		const udecScore = this.computeUDEC(subScores);
		const passed = udecScore >= this.config.udecPassThreshold;

		const report: DesignAuditReport = {
			projectId,
			projectPath,
			udecScore,
			passed,
			subScores,
			issues,
			typography,
			color,
			spacing,
			animation,
			responsive,
			rebuildTriggered: false,
			rebuildCount: 0,
			auditedAt: new Date(),
			durationMs: Date.now() - startMs,
		};

		await this.logReport(report);

		return report;
	}

	/**
	 * Generate a rebuild manifest from a failed audit.
	 * Contains specific, actionable correction instructions.
	 */
	generateRebuildManifest(report: DesignAuditReport): RebuildManifest {
		const corrections: DesignCorrection[] = report.issues.map((issue) => ({
			dimension: issue.dimension,
			severity: issue.severity,
			component: issue.component,
			currentValue: issue.value ?? "unknown",
			requiredValue: issue.expected ?? "see Synthia standards",
			instruction: issue.fix,
		}));

		// Sort: CRITICAL first, then HIGH, then MEDIUM
		corrections.sort((a, b) => {
			const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
			return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
		});

		return {
			projectId: report.projectId,
			reason: `UDEC score ${report.udecScore.toFixed(1)} below threshold ${this.config.udecPassThreshold}`,
			udecScore: report.udecScore,
			corrections,
			generatedAt: new Date(),
		};
	}

	/**
	 * Run audit-rebuild cycles until UDEC passes or max cycles reached.
	 */
	async auditWithRebuild(
		projectId: string,
		projectPath: string,
		onRebuild: (manifest: RebuildManifest) => Promise<void>,
	): Promise<DesignAuditReport> {
		let report = await this.audit(projectId, projectPath);
		let rebuildCount = 0;

		while (!report.passed && rebuildCount < this.config.maxRebuildCycles) {
			rebuildCount++;
			const manifest = this.generateRebuildManifest(report);
			manifest; // pass to builder

			await onRebuild(manifest);

			// Re-audit after rebuild
			report = await this.audit(projectId, projectPath);
			report.rebuildCount = rebuildCount;
		}

		report.rebuildTriggered = rebuildCount > 0;

		if (!report.passed && rebuildCount >= this.config.maxRebuildCycles) {
			// Max cycles exhausted — must escalate
			const escalationEntry = {
				timestamp: new Date().toISOString(),
				project_id: projectId,
				event: "MAX_REBUILD_CYCLES_EXCEEDED",
				udec_score: report.udecScore,
				rebuild_count: rebuildCount,
				message: "Design Agent exhausted rebuild cycles. Escalating to Watcher.",
			};
			await fs.appendFile(
				this.logFilePath,
				`${JSON.stringify(escalationEntry)}\n`,
				"utf-8",
			);
		}

		return report;
	}

	// ─── Audit Phases ─────────────────────────────────────────────────────────

	private async auditTypography(
		projectPath: string,
		issues: DesignIssue[],
	): Promise<TypographyAudit> {
		// In production: parse CSS/Tailwind config to extract font-family declarations
		// Here we read from the project's CSS files and detect font usage
		const cssFiles = await this.findFiles(projectPath, "**/*.css", "**/*.tsx", "**/*.ts");
		const fontsFound: string[] = [];
		const violations: string[] = [];

		// Check for font declarations in CSS/config files
		for (const file of cssFiles.slice(0, 20)) {
			try {
				const content = await fs.readFile(file, "utf-8");
				// Extract font-family declarations
				const fontMatches = content.match(/font-family:\s*['"]?([^;'"]+)/g) ?? [];
				for (const match of fontMatches) {
					const font = match.replace(/font-family:\s*['"]?/, "").trim();
					if (!fontsFound.includes(font)) fontsFound.push(font);
				}
			} catch {
				// Skip unreadable files
			}
		}

		const hasEditorialPair =
			fontsFound.some((f) => ALLOWED_BODY_FONTS.some((allowed) => f.includes(allowed))) &&
			fontsFound.some((f) => ALLOWED_DISPLAY_FONTS.some((allowed) => f.includes(allowed)));

		if (!hasEditorialPair && fontsFound.length > 0) {
			violations.push("No editorial serif/sans pair detected");
			issues.push({
				dimension: "typography",
				severity: "HIGH",
				component: "global",
				description: "Missing editorial font pairing. Fonts found: " + fontsFound.slice(0, 3).join(", "),
				fix: "Add an editorial serif for display (e.g., Fraunces, Playfair Display) paired with a clean sans for body (e.g., Inter, DM Sans).",
				value: fontsFound.join(", ") || "none",
				expected: "Editorial serif + humanist sans pair",
			});
		}

		return {
			fontsFound,
			hasEditorialPair,
			scaleRatioDetected: null, // Would require deeper CSS parsing
			violations,
		};
	}

	private async auditColor(
		projectPath: string,
		issues: DesignIssue[],
	): Promise<ColorAudit> {
		const cssFiles = await this.findFiles(projectPath, "**/*.css");
		const colorsFound: string[] = [];
		const nonPaletteColors: string[] = [];
		const contrastViolations: Array<{ element: string; ratio: number; required: number }> = [];

		for (const file of cssFiles.slice(0, 10)) {
			try {
				const content = await fs.readFile(file, "utf-8");
				// Extract color values
				const hexColors = content.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
				const hslColors = content.match(/hsl\([^)]+\)/g) ?? [];
				colorsFound.push(...hexColors, ...hslColors);

				// Flag pure black and pure white
				if (hexColors.includes("#000") || hexColors.includes("#000000")) {
					nonPaletteColors.push("#000 (use HSL near-black instead)");
					issues.push({
						dimension: "color_system",
						severity: "MEDIUM",
						component: file,
						description: "Pure black (#000) used. Synthia standards require HSL dark palette.",
						fix: "Replace #000 with hsl(220, 15%, 6%) or similar near-black with blue-grey tint.",
						value: "#000",
						expected: "hsl(220, 15%, 6%)",
					});
				}
			} catch {
				// Skip
			}
		}

		const usingHSL = colorsFound.some((c) => c.startsWith("hsl"));
		const hasDarkPalette = colorsFound.some((c) =>
			c.match(/hsl\(\s*2[012]\d\s*,\s*\d+%\s*,\s*[456789]%\s*\)/),
		);

		if (!usingHSL) {
			issues.push({
				dimension: "color_system",
				severity: "HIGH",
				component: "global",
				description: "No HSL color values detected. Synthia requires HSL-based dark palette.",
				fix: "Convert color palette to HSL. Define CSS custom properties using hsl() notation.",
				value: colorsFound.slice(0, 3).join(", "),
				expected: "hsl(hue, saturation%, lightness%)",
			});
		}

		return {
			colorsFound: [...new Set(colorsFound)].slice(0, 20),
			usingHSL,
			hasDarkPalette,
			contrastViolations,
			nonPaletteColors,
		};
	}

	private async auditSpacing(
		projectPath: string,
		issues: DesignIssue[],
	): Promise<SpacingAudit> {
		const cssFiles = await this.findFiles(projectPath, "**/*.css");
		const violatingValues: Array<{ value: string; element: string }> = [];
		let totalSpacingValues = 0;
		let violations = 0;

		const allowedSet = new Set(this.config.spacingScalePx.map((v) => `${v}px`));

		for (const file of cssFiles.slice(0, 10)) {
			try {
				const content = await fs.readFile(file, "utf-8");
				const spacingProps = content.match(
					/(margin|padding|gap|top|left|right|bottom):\s*[\d.]+px/g,
				) ?? [];

				for (const prop of spacingProps) {
					totalSpacingValues++;
					const match = prop.match(/([\d.]+)px/);
					if (match) {
						const value = `${Math.round(Number.parseFloat(match[1]))}px`;
						if (!allowedSet.has(value) && value !== "0px") {
							violations++;
							violatingValues.push({ value, element: file });
						}
					}
				}
			} catch {
				// Skip
			}
		}

		if (violatingValues.length > 0) {
			issues.push({
				dimension: "spacing",
				severity: "MEDIUM",
				component: "global",
				description: `${violatingValues.length} spacing values outside 4/8px grid scale`,
				fix: `Use only: ${this.config.spacingScalePx.join(", ")}px. Found violations: ${violatingValues.slice(0, 3).map((v) => v.value).join(", ")}`,
				value: violatingValues.slice(0, 3).map((v) => v.value).join(", "),
				expected: this.config.spacingScalePx.map((v) => `${v}px`).join(", "),
			});
		}

		return {
			violatingValues: violatingValues.slice(0, 20),
			totalViolations: violations,
			complianceRate: totalSpacingValues > 0
				? (totalSpacingValues - violations) / totalSpacingValues
				: 1,
		};
	}

	private async auditAnimation(
		projectPath: string,
		issues: DesignIssue[],
	): Promise<AnimationAudit> {
		const cssFiles = await this.findFiles(projectPath, "**/*.css");
		const durationsFound: number[] = [];
		const easingsFound: string[] = [];
		const outOfRangeDurations: number[] = [];
		let hasReducedMotionSupport = false;
		const violations: string[] = [];

		for (const file of cssFiles.slice(0, 10)) {
			try {
				const content = await fs.readFile(file, "utf-8");

				// Check for reduced motion media query
				if (content.includes("prefers-reduced-motion")) {
					hasReducedMotionSupport = true;
				}

				// Extract transition/animation durations
				const durationMatches = content.match(/transition[^;]*(\d+)ms/g) ?? [];
				for (const match of durationMatches) {
					const ms = Number.parseInt(match.match(/(\d+)ms/)?.[1] ?? "0");
					if (ms > 0) {
						durationsFound.push(ms);
						if (ms < this.config.animationDurationMin || ms > this.config.animationDurationMax) {
							outOfRangeDurations.push(ms);
						}
					}
				}
			} catch {
				// Skip
			}
		}

		if (!hasReducedMotionSupport) {
			violations.push("No prefers-reduced-motion support");
			issues.push({
				dimension: "animation",
				severity: "HIGH",
				component: "global",
				description: "No @media (prefers-reduced-motion: reduce) rules found",
				fix: "Add reduced motion overrides for all CSS transitions and animations.",
				expected: "@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }",
			});
		}

		if (outOfRangeDurations.length > 0) {
			issues.push({
				dimension: "animation",
				severity: "MEDIUM",
				component: "global",
				description: `Animation durations outside 200–400ms range: ${outOfRangeDurations.join(", ")}ms`,
				fix: `All transitions must be 200–400ms. Adjust: ${outOfRangeDurations.join(", ")}ms`,
				value: outOfRangeDurations.join(", ") + "ms",
				expected: "200–400ms",
			});
		}

		return {
			durationsFound,
			easingsFound,
			outOfRangeDurations,
			hasReducedMotionSupport,
			violations,
		};
	}

	private async auditResponsive(
		projectPath: string,
		issues: DesignIssue[],
	): Promise<ResponsiveCheckResult[]> {
		// In production: launch browser and test each viewport
		// Here we check for responsive CSS patterns in stylesheets
		const results: ResponsiveCheckResult[] = [];

		for (const widthPx of this.config.breakpointsPx) {
			const viewportIssues: string[] = [];

			// Check if breakpoint has media query coverage
			const cssFiles = await this.findFiles(projectPath, "**/*.css");
			let hasBreakpointQuery = false;

			for (const file of cssFiles.slice(0, 5)) {
				try {
					const content = await fs.readFile(file, "utf-8");
					if (content.includes(`${widthPx}px`) || content.includes(`min-width`)) {
						hasBreakpointQuery = true;
					}
				} catch {
					// Skip
				}
			}

			if (!hasBreakpointQuery && widthPx !== 1440) {
				viewportIssues.push(`No media query coverage found for ${widthPx}px`);
			}

			results.push({
				viewport: `${widthPx}px`,
				widthPx,
				passed: viewportIssues.length === 0,
				issues: viewportIssues,
			});
		}

		const failedBreakpoints = results.filter((r) => !r.passed);
		if (failedBreakpoints.length > 0) {
			issues.push({
				dimension: "responsive_integrity",
				severity: "HIGH",
				component: "global",
				description: `Missing responsive coverage for: ${failedBreakpoints.map((r) => r.viewport).join(", ")}`,
				fix: "Add media queries for all four breakpoints: 320px, 768px, 1024px, 1440px.",
				value: failedBreakpoints.map((r) => r.viewport).join(", "),
				expected: this.config.breakpointsPx.map((p) => `${p}px`).join(", "),
			});
		}

		return results;
	}

	private async auditLayout(
		_projectPath: string,
		_issues: DesignIssue[],
	): Promise<number> {
		// Returns score 0–10 for layout dimension
		// In production: analyze component structure, visual hierarchy
		return 8;
	}

	private async auditComponents(
		projectPath: string,
		issues: DesignIssue[],
	): Promise<number> {
		// Check for border-radius consistency
		const cssFiles = await this.findFiles(projectPath, "**/*.css");
		const radiiFound = new Set<string>();

		for (const file of cssFiles.slice(0, 10)) {
			try {
				const content = await fs.readFile(file, "utf-8");
				const matches = content.match(/border-radius:\s*[\d.]+px/g) ?? [];
				for (const m of matches) {
					const val = m.replace("border-radius:", "").trim();
					radiiFound.add(val);
				}
			} catch {
				// Skip
			}
		}

		const allowedRadii = new Set(
			this.config.borderRadiusAllowedPx.map((v) => `${v}px`),
		);
		const nonCompliantRadii = [...radiiFound].filter((r) => !allowedRadii.has(r));

		if (nonCompliantRadii.length > 0) {
			issues.push({
				dimension: "component_consistency",
				severity: "MEDIUM",
				component: "global",
				description: `Non-standard border radii: ${nonCompliantRadii.join(", ")}`,
				fix: `Use only ${this.config.borderRadiusAllowedPx.join("px or ")}px. Choose one and apply consistently.`,
				value: nonCompliantRadii.join(", "),
				expected: this.config.borderRadiusAllowedPx.map((v) => `${v}px`).join(" or "),
			});
			return 6;
		}

		return 9;
	}

	private async auditPolish(
		_projectPath: string,
		_issues: DesignIssue[],
	): Promise<number> {
		// In production: check for loading states, empty states, skeleton screens
		return 8;
	}

	private async auditAccessibilityBaseline(
		projectPath: string,
		issues: DesignIssue[],
	): Promise<number> {
		let score = 10;

		// Check for alt text patterns in JSX
		const componentFiles = await this.findFiles(projectPath, "**/*.tsx", "**/*.jsx");
		let imgWithoutAlt = 0;

		for (const file of componentFiles.slice(0, 20)) {
			try {
				const content = await fs.readFile(file, "utf-8");
				const imgTags = content.match(/<img[^>]*>/g) ?? [];
				for (const tag of imgTags) {
					if (!tag.includes("alt=")) imgWithoutAlt++;
				}
			} catch {
				// Skip
			}
		}

		if (imgWithoutAlt > 0) {
			score -= Math.min(4, imgWithoutAlt);
			issues.push({
				dimension: "accessibility_baseline",
				severity: "HIGH",
				component: "multiple",
				description: `${imgWithoutAlt} <img> element(s) missing alt attribute`,
				fix: 'Add descriptive alt text to all non-decorative images. Use alt="" for purely decorative images.',
				value: `${imgWithoutAlt} images without alt`,
				expected: "alt attribute on all <img> elements",
			});
		}

		return Math.max(0, score);
	}

	// ─── Scoring ──────────────────────────────────────────────────────────────

	private computeSubScores(
		typography: TypographyAudit,
		color: ColorAudit,
		spacing: SpacingAudit,
		animation: AnimationAudit,
		responsive: ResponsiveCheckResult[],
		_layoutScore: number,
		componentScore: number,
		polishScore: number,
		a11yScore: number,
		issues: DesignIssue[],
	): UDECSubScores {
		// Typography score
		const typographyScore = typography.hasEditorialPair ? 9 : 5;

		// Color score
		const colorScore = color.usingHSL && color.hasDarkPalette ? 9
			: color.usingHSL ? 7
			: 4;

		// Spacing score — based on compliance rate
		const spacingScore = Math.round(spacing.complianceRate * 10);

		// Animation score
		const animationViolations = animation.outOfRangeDurations.length;
		const animationScore = !animation.hasReducedMotionSupport
			? 5
			: animationViolations > 3
			? 6
			: animationViolations > 0
			? 7.5
			: 9;

		// Responsive score
		const passedBreakpoints = responsive.filter((r) => r.passed).length;
		const responsiveScore = (passedBreakpoints / responsive.length) * 10;

		// Layout score — use issue count as proxy
		const layoutIssues = issues.filter((i) => i.dimension === "layout_hierarchy").length;
		const layoutScore = Math.max(4, 10 - layoutIssues * 2);

		return {
			typography: typographyScore,
			color_system: colorScore,
			spacing: spacingScore,
			animation: animationScore,
			layout_hierarchy: layoutScore,
			component_consistency: componentScore,
			responsive_integrity: responsiveScore,
			accessibility_baseline: a11yScore,
			polish: polishScore,
		};
	}

	private computeUDEC(subScores: UDECSubScores): number {
		let weighted = 0;
		for (const [dim, score] of Object.entries(subScores)) {
			const weight = UDEC_WEIGHTS[dim as AuditDimension];
			weighted += score * weight;
		}
		return Math.round(weighted * 10) / 10;
	}

	// ─── Utilities ────────────────────────────────────────────────────────────

	private async findFiles(basePath: string, ...patterns: string[]): Promise<string[]> {
		const results: string[] = [];

		for (const pattern of patterns) {
			try {
				const ext = pattern.replace("**/*", "");
				const files = await this.walkDir(basePath, ext);
				results.push(...files);
			} catch {
				// Skip patterns that fail
			}
		}

		return [...new Set(results)];
	}

	private async walkDir(dir: string, ext: string, depth = 0): Promise<string[]> {
		if (depth > 5) return [];

		const results: string[] = [];
		let entries: string[];

		try {
			entries = await fs.readdir(dir);
		} catch {
			return [];
		}

		for (const entry of entries) {
			if (entry.startsWith(".") || entry === "node_modules") continue;
			const fullPath = path.join(dir, entry);

			try {
				const stat = await fs.stat(fullPath);
				if (stat.isDirectory()) {
					const nested = await this.walkDir(fullPath, ext, depth + 1);
					results.push(...nested);
				} else if (entry.endsWith(ext)) {
					results.push(fullPath);
				}
			} catch {
				// Skip
			}
		}

		return results;
	}

	private async logReport(report: DesignAuditReport): Promise<void> {
		const entry = {
			timestamp: report.auditedAt.toISOString(),
			project_id: report.projectId,
			udec_score: report.udecScore,
			passed: report.passed,
			sub_scores: report.subScores,
			issues: report.issues,
			rebuild_triggered: report.rebuildTriggered,
			rebuild_count: report.rebuildCount,
			audit_duration_ms: report.durationMs,
		};

		try {
			await fs.appendFile(
				this.logFilePath,
				`${JSON.stringify(entry)}\n`,
				"utf-8",
			);
		} catch (err) {
			process.stderr.write(`[DESIGN] Log write failed: ${String(err)}\n`);
		}
	}

	private async ensureLogDir(): Promise<void> {
		await fs.mkdir(path.dirname(this.logFilePath), { recursive: true });
	}
}
