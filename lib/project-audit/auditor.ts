/**
 * Project Auditor
 *
 * Walks a repository and produces a structured ProjectAudit by inspecting:
 * - Package manifests and lock files (tech stack detection)
 * - Test directories and patterns
 * - CI configuration files
 * - Deployment configs (Vercel, Netlify, Docker, etc.)
 * - Environment variable configs
 * - README and documentation
 * - TODO/FIXME/HACK comments (technical debt)
 * - Security anti-patterns (hardcoded secrets)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ProjectAudit, RevenueOpportunity } from "./types.js";

// ---------------------------------------------------------------------------
// File system helpers
// ---------------------------------------------------------------------------

function exists(p: string): boolean {
	return fs.existsSync(p);
}

function readSafe(p: string): string {
	try {
		return fs.readFileSync(p, "utf8");
	} catch {
		return "";
	}
}

function readJsonSafe(p: string): Record<string, unknown> {
	try {
		return JSON.parse(readSafe(p)) as Record<string, unknown>;
	} catch {
		return {};
	}
}

/**
 * Walk all files in a directory, skipping node_modules, .git, .next, dist, build.
 * Returns an array of absolute paths.
 */
function walkAll(dir: string, maxDepth = 8, _depth = 0): string[] {
	if (_depth > maxDepth) return [];
	if (!exists(dir)) return [];

	const SKIP = new Set([
		"node_modules",
		".git",
		".next",
		"dist",
		"build",
		".turbo",
		"coverage",
		".nyc_output",
		"__pycache__",
		".venv",
		"target", // Rust/Java
		"vendor",
	]);

	const results: string[] = [];
	let entries: fs.Dirent[] = [];
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return [];
	}

	for (const e of entries) {
		if (e.name.startsWith(".") && e.name !== ".env.example" && e.name !== ".env.local" && e.name !== ".github" && e.name !== ".gitlab-ci.yml") {
			continue;
		}
		const full = path.join(dir, e.name);
		if (e.isDirectory()) {
			if (!SKIP.has(e.name)) {
				results.push(...walkAll(full, maxDepth, _depth + 1));
			}
		} else {
			results.push(full);
		}
	}
	return results;
}

// ---------------------------------------------------------------------------
// Tech stack detection
// ---------------------------------------------------------------------------

function detectTechStack(repoPath: string): string[] {
	const stack: string[] = [];

	// Node / JS ecosystem
	const pkgPath = path.join(repoPath, "package.json");
	if (exists(pkgPath)) {
		stack.push("Node.js");
		const pkg = readJsonSafe(pkgPath);
		const deps = {
			...((pkg.dependencies ?? {}) as Record<string, unknown>),
			...((pkg.devDependencies ?? {}) as Record<string, unknown>),
		};
		const depKeys = Object.keys(deps);

		if (depKeys.includes("next")) stack.push("Next.js");
		if (depKeys.includes("react")) stack.push("React");
		if (depKeys.includes("vue")) stack.push("Vue.js");
		if (depKeys.includes("@sveltejs/kit") || depKeys.includes("svelte")) stack.push("Svelte");
		if (depKeys.includes("astro")) stack.push("Astro");
		if (depKeys.includes("remix")) stack.push("Remix");
		if (depKeys.includes("nuxt")) stack.push("Nuxt");
		if (depKeys.includes("express")) stack.push("Express");
		if (depKeys.includes("fastify")) stack.push("Fastify");
		if (depKeys.includes("hono")) stack.push("Hono");
		if (depKeys.includes("typescript")) stack.push("TypeScript");
		if (depKeys.includes("tailwindcss")) stack.push("Tailwind CSS");
		if (depKeys.includes("prisma")) stack.push("Prisma");
		if (depKeys.includes("drizzle-orm")) stack.push("Drizzle ORM");
		if (depKeys.includes("@supabase/supabase-js")) stack.push("Supabase");
		if (depKeys.includes("stripe")) stack.push("Stripe");
		if (depKeys.includes("@clerk/nextjs") || depKeys.includes("@clerk/clerk-react")) stack.push("Clerk Auth");
		if (depKeys.includes("next-auth") || depKeys.includes("@auth/core")) stack.push("NextAuth");
		if (depKeys.includes("zod")) stack.push("Zod");
		if (depKeys.includes("trpc") || depKeys.includes("@trpc/server")) stack.push("tRPC");
		if (depKeys.includes("graphql")) stack.push("GraphQL");
		if (depKeys.includes("jest") || depKeys.includes("vitest")) stack.push("Testing (Jest/Vitest)");
		if (depKeys.includes("playwright") || depKeys.includes("@playwright/test")) stack.push("Playwright E2E");
		if (depKeys.includes("cypress")) stack.push("Cypress E2E");
	}

	// Python
	if (exists(path.join(repoPath, "requirements.txt"))) {
		stack.push("Python");
		const reqs = readSafe(path.join(repoPath, "requirements.txt"));
		if (/flask/i.test(reqs)) stack.push("Flask");
		if (/django/i.test(reqs)) stack.push("Django");
		if (/fastapi/i.test(reqs)) stack.push("FastAPI");
		if (/sqlalchemy/i.test(reqs)) stack.push("SQLAlchemy");
	}
	if (exists(path.join(repoPath, "pyproject.toml"))) {
		stack.push("Python");
		const pyproj = readSafe(path.join(repoPath, "pyproject.toml"));
		if (/poetry/i.test(pyproj)) stack.push("Poetry");
	}

	// Rust
	if (exists(path.join(repoPath, "Cargo.toml"))) {
		stack.push("Rust");
		const cargo = readSafe(path.join(repoPath, "Cargo.toml"));
		if (/axum|actix|rocket|warp/i.test(cargo)) stack.push("Rust Web Framework");
	}

	// Go
	if (exists(path.join(repoPath, "go.mod"))) {
		stack.push("Go");
	}

	// Java / Kotlin
	if (exists(path.join(repoPath, "pom.xml")) || exists(path.join(repoPath, "build.gradle"))) {
		stack.push("Java/Kotlin");
		const gradle = readSafe(path.join(repoPath, "build.gradle"));
		if (/spring/i.test(gradle)) stack.push("Spring Boot");
	}

	// Infrastructure
	if (exists(path.join(repoPath, "Dockerfile"))) stack.push("Docker");
	if (exists(path.join(repoPath, "docker-compose.yml")) || exists(path.join(repoPath, "docker-compose.yaml"))) stack.push("Docker Compose");
	if (exists(path.join(repoPath, "terraform")) || exists(path.join(repoPath, "main.tf"))) stack.push("Terraform");
	if (exists(path.join(repoPath, "kubernetes")) || exists(path.join(repoPath, "k8s"))) stack.push("Kubernetes");

	return [...new Set(stack)];
}

// ---------------------------------------------------------------------------
// Test detection
// ---------------------------------------------------------------------------

function hasTests(repoPath: string, allFiles: string[]): boolean {
	const testDirs = ["test", "tests", "spec", "__tests__", "e2e"];
	for (const dir of testDirs) {
		if (exists(path.join(repoPath, dir))) return true;
	}
	return allFiles.some((f) => /\.(test|spec)\.(ts|tsx|js|jsx|py|go|rs)$/.test(f));
}

// ---------------------------------------------------------------------------
// CI detection
// ---------------------------------------------------------------------------

function hasCI(repoPath: string): boolean {
	return (
		exists(path.join(repoPath, ".github", "workflows")) ||
		exists(path.join(repoPath, ".gitlab-ci.yml")) ||
		exists(path.join(repoPath, ".circleci", "config.yml")) ||
		exists(path.join(repoPath, "Jenkinsfile")) ||
		exists(path.join(repoPath, ".travis.yml")) ||
		exists(path.join(repoPath, "azure-pipelines.yml"))
	);
}

// ---------------------------------------------------------------------------
// Deployment config detection
// ---------------------------------------------------------------------------

function hasDeploymentConfig(repoPath: string): boolean {
	return (
		exists(path.join(repoPath, "vercel.json")) ||
		exists(path.join(repoPath, "netlify.toml")) ||
		exists(path.join(repoPath, "Dockerfile")) ||
		exists(path.join(repoPath, "fly.toml")) ||
		exists(path.join(repoPath, "render.yaml")) ||
		exists(path.join(repoPath, "railway.json")) ||
		exists(path.join(repoPath, "app.yaml")) || // Google App Engine
		exists(path.join(repoPath, "Procfile")) // Heroku
	);
}

// ---------------------------------------------------------------------------
// Env config detection
// ---------------------------------------------------------------------------

function hasEnvConfig(repoPath: string): boolean {
	return (
		exists(path.join(repoPath, ".env.example")) ||
		exists(path.join(repoPath, ".env.local")) ||
		exists(path.join(repoPath, ".env.sample")) ||
		exists(path.join(repoPath, ".env.template"))
	);
}

// ---------------------------------------------------------------------------
// README detection
// ---------------------------------------------------------------------------

function hasReadme(repoPath: string): boolean {
	const candidates = ["README.md", "README.txt", "README.rst", "readme.md", "Readme.md"];
	return candidates.some((f) => exists(path.join(repoPath, f)));
}

// ---------------------------------------------------------------------------
// Technical debt: TODO/FIXME/HACK scanning
// ---------------------------------------------------------------------------

const DEBT_PATTERN = /\/\/\s*(TODO|FIXME|HACK|XXX|TEMP|WORKAROUND|BUG)[\s:]+(.*)/gi;
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".rb", ".java", ".kt", ".swift", ".cs"]);

function findTechnicalDebt(allFiles: string[]): string[] {
	const debt: string[] = [];
	const sourceFiles = allFiles.filter((f) => SOURCE_EXTENSIONS.has(path.extname(f)));

	for (const file of sourceFiles.slice(0, 200)) { // cap at 200 files for performance
		const content = readSafe(file);
		let match: RegExpExecArray | null;
		DEBT_PATTERN.lastIndex = 0;
		while ((match = DEBT_PATTERN.exec(content)) !== null) {
			const relPath = path.relative(process.cwd(), file);
			debt.push(`[${match[1]}] ${match[2].trim()} — ${relPath}`);
			if (debt.length >= 50) return debt; // cap output
		}
	}
	return debt;
}

// ---------------------------------------------------------------------------
// Security issues
// ---------------------------------------------------------------------------

const SECRET_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
	{ pattern: /(?:api[_-]?key|apikey)\s*=\s*['"][^'"]{10,}['"]/i, label: "Hardcoded API key" },
	{ pattern: /(?:secret|password|passwd|pwd)\s*=\s*['"][^'"]{8,}['"]/i, label: "Hardcoded secret/password" },
	{ pattern: /(?:sk-|pk-|rk-)[A-Za-z0-9]{20,}/i, label: "Exposed Stripe key" },
	{ pattern: /ghp_[A-Za-z0-9]{36}/i, label: "Exposed GitHub token" },
	{ pattern: /AKIA[A-Z0-9]{16}/i, label: "Exposed AWS access key" },
	{ pattern: /-----BEGIN (?:RSA |EC |)PRIVATE KEY-----/i, label: "Exposed private key in source" },
];

function findSecurityIssues(allFiles: string[]): string[] {
	const issues: string[] = [];
	const sourceFiles = allFiles.filter((f) => {
		const ext = path.extname(f);
		return SOURCE_EXTENSIONS.has(ext) || ext === ".env" || ext === ".json" || ext === ".yaml" || ext === ".yml";
	});

	for (const file of sourceFiles.slice(0, 300)) {
		// Never scan .env.example — by convention those use placeholders
		if (file.endsWith(".env.example") || file.endsWith(".env.sample")) continue;
		const content = readSafe(file);
		const relPath = path.relative(process.cwd(), file);

		for (const { pattern, label } of SECRET_PATTERNS) {
			if (pattern.test(content)) {
				issues.push(`${label} found in ${relPath}`);
			}
		}
	}
	return [...new Set(issues)];
}

// ---------------------------------------------------------------------------
// Dependencies currency
// ---------------------------------------------------------------------------

function areDependenciesCurrent(repoPath: string): boolean {
	const pkgPath = path.join(repoPath, "package.json");
	if (!exists(pkgPath)) return true; // can't tell, assume ok

	const pkg = readJsonSafe(pkgPath);
	const deps = {
		...((pkg.dependencies ?? {}) as Record<string, string>),
		...((pkg.devDependencies ?? {}) as Record<string, string>),
	};

	// Heuristic: if any dep uses a pinned version from > 2 years ago, flag it.
	// We can't query npm without network; instead flag if any version is very old-style (no ^ or ~)
	const pinnedOld = Object.values(deps).filter(
		(v) => typeof v === "string" && /^\d+\.\d+\.\d+$/.test(v),
	);
	// If > 20% are hard-pinned, assume potentially stale
	return pinnedOld.length / Math.max(Object.keys(deps).length, 1) < 0.2;
}

// ---------------------------------------------------------------------------
// Project state estimation
// ---------------------------------------------------------------------------

function estimateProjectState(
	allFiles: string[],
	completeness: number,
): ProjectAudit["current_state"] {
	const hasReadme = allFiles.some((f) => /README/i.test(path.basename(f)));
	const hasTests = allFiles.some((f) => /\.(test|spec)\.(ts|tsx|js|jsx|py)$/.test(f));
	const hasDeployConfig = allFiles.some((f) =>
		/(vercel\.json|netlify\.toml|Dockerfile|fly\.toml)$/.test(path.basename(f)),
	);

	if (completeness >= 85 && hasTests && hasDeployConfig) return "production";
	if (completeness >= 70 && hasReadme) return "beta";
	if (completeness >= 45) return "mvp";
	if (completeness >= 15) return "early-prototype";
	return "abandoned";
}

// ---------------------------------------------------------------------------
// Completeness scoring
// ---------------------------------------------------------------------------

function estimateCompleteness(
	repoPath: string,
	allFiles: string[],
	hasTestsFlag: boolean,
	hasCIFlag: boolean,
	hasEnv: boolean,
	hasReadmeFlag: boolean,
	hasDeployFlag: boolean,
): number {
	let score = 0;

	// Files exist
	if (allFiles.length > 0) score += 10;
	if (allFiles.length > 20) score += 10;
	if (allFiles.length > 100) score += 10;

	// Core config files
	if (hasReadmeFlag) score += 10;
	if (hasEnv) score += 10;
	if (hasDeployFlag) score += 10;
	if (hasCIFlag) score += 10;
	if (hasTestsFlag) score += 10;

	// Source code depth
	const sourceFiles = allFiles.filter((f) => SOURCE_EXTENSIONS.has(path.extname(f)));
	if (sourceFiles.length > 5) score += 5;
	if (sourceFiles.length > 30) score += 5;

	// Lock file (shows npm install has been run)
	if (exists(path.join(repoPath, "package-lock.json")) || exists(path.join(repoPath, "yarn.lock")) || exists(path.join(repoPath, "pnpm-lock.yaml"))) {
		score += 5;
	}

	return Math.min(100, score);
}

// ---------------------------------------------------------------------------
// What was being built (heuristic from README + package.json)
// ---------------------------------------------------------------------------

function inferProjectPurpose(repoPath: string): string {
	const readme = readSafe(path.join(repoPath, "README.md")) || readSafe(path.join(repoPath, "readme.md"));
	const pkg = readJsonSafe(path.join(repoPath, "package.json"));

	// Try to extract from first non-empty README line after the title
	if (readme) {
		const lines = readme.split("\n").filter((l) => l.trim().length > 0 && !l.startsWith("#")).slice(0, 3);
		if (lines.length > 0) return lines[0].trim().slice(0, 200);
	}

	// Fall back to package.json description
	if (typeof pkg.description === "string" && pkg.description.length > 0) {
		return pkg.description;
	}

	// Fall back to package name
	if (typeof pkg.name === "string") {
		return `Project: ${pkg.name}`;
	}

	return "Unknown — no README or package description found.";
}

// ---------------------------------------------------------------------------
// Revenue opportunities (heuristic)
// ---------------------------------------------------------------------------

function inferRevenueOpportunities(tech_stack: string[], allFiles: string[]): RevenueOpportunity[] {
	const opps: RevenueOpportunity[] = [];
	const hasStripe = tech_stack.includes("Stripe") || allFiles.some((f) => readSafe(f).includes("stripe"));
	const hasSaaS = tech_stack.some((t) => ["Next.js", "React", "Remix", "Nuxt", "SvelteKit"].includes(t));
	const hasAPI = tech_stack.some((t) => ["Express", "Fastify", "FastAPI", "Django", "Hono"].includes(t));
	const hasAuth = tech_stack.includes("Clerk Auth") || tech_stack.includes("NextAuth");

	if (!hasStripe && hasSaaS) {
		opps.push({
			type: "subscription",
			description: "Add Stripe subscriptions for a SaaS monetization model",
			estimated_mrr: "$500–$5,000",
			effort: "medium",
			priority: 1,
		});
	}

	if (hasAPI) {
		opps.push({
			type: "one-time",
			description: "Sell API access as a one-time purchase or metered API plan",
			estimated_mrr: "$200–$2,000",
			effort: "low",
			priority: 2,
		});
	}

	if (hasSaaS && !hasAuth) {
		opps.push({
			type: "lead-gen",
			description: "Add email capture / waitlist to collect leads before launch",
			estimated_mrr: "Indirect — pipeline value",
			effort: "low",
			priority: 1,
		});
	}

	opps.push({
		type: "affiliate",
		description: "Integrate relevant affiliate programs (hosting, tools, SaaS) for passive income",
		estimated_mrr: "$50–$500",
		effort: "low",
		priority: 3,
	});

	return opps;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function auditProject(repoPath: string): Promise<ProjectAudit> {
	const absPath = path.resolve(repoPath);
	const allFiles = walkAll(absPath);

	const tech_stack = detectTechStack(absPath);
	const hasTestsFlag = hasTests(absPath, allFiles);
	const hasCIFlag = hasCI(absPath);
	const hasEnvFlag = hasEnvConfig(absPath);
	const hasReadmeFlag = hasReadme(absPath);
	const hasDeployFlag = hasDeploymentConfig(absPath);
	const dependenciesCurrent = areDependenciesCurrent(absPath);
	const technical_debt = findTechnicalDebt(allFiles);
	const security_issues = findSecurityIssues(allFiles);
	const revenue_opportunities = inferRevenueOpportunities(tech_stack, allFiles);
	const what_was_being_built = inferProjectPurpose(absPath);

	const completeness_score = estimateCompleteness(absPath, allFiles, hasTestsFlag, hasCIFlag, hasEnvFlag, hasReadmeFlag, hasDeployFlag);
	const current_state = estimateProjectState(allFiles, completeness_score);

	// Deployment readiness: a subset of completeness focused on deploy requirements
	let deployment_readiness = 0;
	if (hasDeployFlag) deployment_readiness += 40;
	if (hasEnvFlag) deployment_readiness += 20;
	if (hasCIFlag) deployment_readiness += 20;
	if (security_issues.length === 0) deployment_readiness += 20;

	const production_readiness = Math.round(
		completeness_score * 0.4 + deployment_readiness * 0.3 + (hasTestsFlag ? 30 : 0),
	);

	const missing_functionality: string[] = [];
	const broken_functionality: string[] = [];
	const design_issues: string[] = [];
	const human_blockers: string[] = [];

	if (!hasTestsFlag) missing_functionality.push("Test suite (unit tests, integration tests)");
	if (!hasCIFlag) missing_functionality.push("CI/CD pipeline");
	if (!hasEnvFlag) missing_functionality.push("Environment variable configuration (.env.example)");
	if (!hasReadmeFlag) missing_functionality.push("README documentation");
	if (!hasDeployFlag) missing_functionality.push("Deployment configuration");
	if (security_issues.length > 0) broken_functionality.push("Secrets exposed in source code");

	if (!tech_stack.includes("Tailwind CSS") && !tech_stack.includes("Styled Components")) {
		design_issues.push("No CSS framework detected — visual consistency may be inconsistent");
	}

	if (!tech_stack.includes("Stripe") && !tech_stack.includes("Paddle") && !tech_stack.includes("LemonSqueezy")) {
		human_blockers.push("No payment processor integrated — revenue collection blocked");
	}

	if (!dependenciesCurrent) {
		human_blockers.push("Dependencies may be stale — run npm outdated and update");
	}

	const project_id = path.basename(absPath);

	return {
		project_id,
		repo_path: absPath,
		timestamp: new Date().toISOString(),
		what_was_being_built,
		current_state,
		completeness_score,
		missing_functionality,
		broken_functionality,
		revenue_opportunities,
		design_issues,
		technical_debt,
		deployment_readiness,
		production_readiness,
		human_blockers,
		tech_stack,
		has_tests: hasTestsFlag,
		has_ci: hasCIFlag,
		has_env_config: hasEnvFlag,
		has_readme: hasReadmeFlag,
		has_deployment_config: hasDeployFlag,
		dependencies_current: dependenciesCurrent,
		security_issues,
	};
}
