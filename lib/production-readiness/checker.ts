/**
 * Production Readiness Checker
 *
 * Runs 30+ checks across six categories:
 * security, performance, reliability, maintainability, observability, deployment
 *
 * Each check returns a ProductionChecklistItem. Results are aggregated into
 * a ProductionReadinessReport with per-category scores.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ProjectAudit } from "../project-audit/types.js";
import type { ProductionChecklistItem, ProductionReadinessReport } from "./types.js";

// ---------------------------------------------------------------------------
// Helpers
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

function walkDir(dir: string, ext: string[]): string[] {
	if (!exists(dir)) return [];
	const results: string[] = [];
	let entries: fs.Dirent[] = [];
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return [];
	}
	const SKIP = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage"]);
	for (const e of entries) {
		const full = path.join(dir, e.name);
		if (e.isDirectory() && !SKIP.has(e.name)) {
			results.push(...walkDir(full, ext));
		} else if (e.isFile() && ext.some((x) => e.name.endsWith(x))) {
			results.push(full);
		}
	}
	return results;
}

function item(
	id: string,
	category: string,
	check: string,
	passed: boolean,
	severity: ProductionChecklistItem["severity"],
	notes?: string,
): ProductionChecklistItem {
	return { id, category, check, passed, severity, notes };
}

// ---------------------------------------------------------------------------
// Security checks (10 checks)
// ---------------------------------------------------------------------------

function runSecurityChecks(repoPath: string): ProductionChecklistItem[] {
	const checks: ProductionChecklistItem[] = [];

	// SEC-01: .env files not committed
	const gitignore = readSafe(path.join(repoPath, ".gitignore"));
	const envInGitignore = /^\.env$/m.test(gitignore) || /^\.env\.\*/m.test(gitignore);
	checks.push(item("SEC-01", "security", ".env files excluded from git", envInGitignore, "critical", envInGitignore ? undefined : "Add .env to .gitignore immediately."));

	// SEC-02: .env.example present
	const hasEnvExample = exists(path.join(repoPath, ".env.example")) || exists(path.join(repoPath, ".env.sample"));
	checks.push(item("SEC-02", "security", ".env.example documents required env vars", hasEnvExample, "warning", hasEnvExample ? undefined : "Create .env.example so contributors know what variables are needed."));

	// SEC-03: No hardcoded AWS keys
	const allSrc = walkDir(repoPath, [".ts", ".js", ".tsx", ".jsx", ".py"]);
	const hasAWSKey = allSrc.some((f) => /AKIA[A-Z0-9]{16}/.test(readSafe(f)));
	checks.push(item("SEC-03", "security", "No hardcoded AWS keys in source", !hasAWSKey, "critical", hasAWSKey ? "Rotate the key immediately and remove from source." : undefined));

	// SEC-04: No hardcoded GitHub tokens
	const hasGHToken = allSrc.some((f) => /ghp_[A-Za-z0-9]{36}/.test(readSafe(f)));
	checks.push(item("SEC-04", "security", "No hardcoded GitHub tokens in source", !hasGHToken, "critical", hasGHToken ? "Revoke token, use environment variables." : undefined));

	// SEC-05: No hardcoded Stripe keys
	const hasStripeKey = allSrc.some((f) => /(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{24,}/.test(readSafe(f)));
	checks.push(item("SEC-05", "security", "No hardcoded Stripe keys in source", !hasStripeKey, "critical", hasStripeKey ? "Remove Stripe keys from source; use env vars." : undefined));

	// SEC-06: HTTPS enforced in production config
	const vercelJson = readJsonSafe(path.join(repoPath, "vercel.json"));
	const hasHttpsRedirect =
		JSON.stringify(vercelJson).includes("https") ||
		exists(path.join(repoPath, "netlify.toml")) ||
		readSafe(path.join(repoPath, "netlify.toml")).includes("force = true");
	checks.push(item("SEC-06", "security", "HTTPS enforced in deployment config", hasHttpsRedirect, "warning", hasHttpsRedirect ? undefined : "Configure HTTPS redirect in your hosting provider."));

	// SEC-07: Security headers configured
	const nextConfig = readSafe(path.join(repoPath, "next.config.js")) + readSafe(path.join(repoPath, "next.config.ts")) + readSafe(path.join(repoPath, "next.config.mjs"));
	const hasSecurityHeaders =
		/Content-Security-Policy|X-Frame-Options|X-Content-Type-Options|headers/.test(nextConfig) ||
		JSON.stringify(vercelJson).includes("headers");
	checks.push(item("SEC-07", "security", "Security headers configured (CSP, X-Frame-Options)", hasSecurityHeaders, "warning", hasSecurityHeaders ? undefined : "Add Content-Security-Policy, X-Frame-Options, and X-Content-Type-Options headers."));

	// SEC-08: Dependencies not known-vulnerable (basic check: lockfile present)
	const hasLockFile = exists(path.join(repoPath, "package-lock.json")) || exists(path.join(repoPath, "yarn.lock")) || exists(path.join(repoPath, "pnpm-lock.yaml"));
	checks.push(item("SEC-08", "security", "Lock file present for reproducible installs", hasLockFile, "warning", hasLockFile ? undefined : "Commit a lock file (package-lock.json / yarn.lock / pnpm-lock.yaml)."));

	// SEC-09: No private keys in source
	const hasPrivKey = allSrc.some((f) => /-----BEGIN (?:RSA |EC |)PRIVATE KEY-----/.test(readSafe(f)));
	checks.push(item("SEC-09", "security", "No private keys in source files", !hasPrivKey, "critical", hasPrivKey ? "Remove private keys from source immediately." : undefined));

	// SEC-10: Input validation library present
	const pkg = readJsonSafe(path.join(repoPath, "package.json"));
	const deps = { ...((pkg.dependencies ?? {}) as Record<string, unknown>) };
	const hasValidation = "zod" in deps || "joi" in deps || "yup" in deps || "@vinejs/vine" in deps;
	checks.push(item("SEC-10", "security", "Input validation library (Zod/Joi/Yup) present", hasValidation, "warning", hasValidation ? undefined : "Add a schema validation library (Zod is recommended) for all user inputs."));

	return checks;
}

// ---------------------------------------------------------------------------
// Performance checks (5 checks)
// ---------------------------------------------------------------------------

function runPerformanceChecks(repoPath: string): ProductionChecklistItem[] {
	const checks: ProductionChecklistItem[] = [];

	// PERF-01: Image optimization
	const pkg = readJsonSafe(path.join(repoPath, "package.json"));
	const deps = { ...((pkg.dependencies ?? {}) as Record<string, unknown>) };
	const isNext = "next" in deps;
	const hasImageOptim = isNext || "sharp" in deps || "@astrojs/image" in deps;
	checks.push(item("PERF-01", "performance", "Image optimization configured", hasImageOptim, "warning", hasImageOptim ? undefined : "Use next/image, sharp, or an image CDN for automatic optimization."));

	// PERF-02: Bundle analysis available
	const hasBundleAnalyzer = "@next/bundle-analyzer" in deps || "webpack-bundle-analyzer" in deps || "vite-plugin-visualizer" in deps;
	checks.push(item("PERF-02", "performance", "Bundle analyzer available for size monitoring", hasBundleAnalyzer, "info", hasBundleAnalyzer ? undefined : "Add @next/bundle-analyzer or similar to monitor bundle size."));

	// PERF-03: CDN/edge deployment
	const hasVercel = exists(path.join(repoPath, "vercel.json"));
	const hasCloudflare = exists(path.join(repoPath, "wrangler.toml")) || exists(path.join(repoPath, "wrangler.json"));
	const hasCDN = hasVercel || hasCloudflare || exists(path.join(repoPath, "netlify.toml"));
	checks.push(item("PERF-03", "performance", "CDN/edge deployment configured", hasCDN, "warning", hasCDN ? undefined : "Deploy to a CDN or edge network (Vercel, Cloudflare, Netlify) for global performance."));

	// PERF-04: Caching strategy documented
	const hasCache = /cache|Cache-Control|stale-while-revalidate/i.test(
		readSafe(path.join(repoPath, "next.config.js")) +
			readSafe(path.join(repoPath, "next.config.mjs")) +
			readSafe(path.join(repoPath, "vercel.json")),
	);
	checks.push(item("PERF-04", "performance", "Caching strategy configured", hasCache, "info", hasCache ? undefined : "Configure Cache-Control headers and revalidation strategies."));

	// PERF-05: Database connection pooling
	const hasPrisma = "prisma" in deps || "@prisma/client" in deps;
	const hasDrizzle = "drizzle-orm" in deps;
	const hasPooling = hasPrisma || hasDrizzle || "@neondatabase/serverless" in deps || "pg" in deps;
	checks.push(item("PERF-05", "performance", "Database ORM or connection pooling in use", hasPooling, "warning", hasPooling ? undefined : "Use an ORM (Prisma, Drizzle) or connection pool for efficient DB access."));

	return checks;
}

// ---------------------------------------------------------------------------
// Reliability checks (5 checks)
// ---------------------------------------------------------------------------

function runReliabilityChecks(repoPath: string, audit?: ProjectAudit): ProductionChecklistItem[] {
	const checks: ProductionChecklistItem[] = [];

	// REL-01: Tests present
	const hasTests = audit?.has_tests ?? false;
	checks.push(item("REL-01", "reliability", "Test suite present", hasTests, "critical", hasTests ? undefined : "Add unit and integration tests before shipping."));

	// REL-02: CI pipeline
	const hasCI = audit?.has_ci ?? false;
	checks.push(item("REL-02", "reliability", "CI pipeline configured", hasCI, "critical", hasCI ? undefined : "Add a CI pipeline (.github/workflows) to run tests on every push."));

	// REL-03: Error boundaries / global error handling
	const srcFiles = walkDir(repoPath, [".tsx", ".jsx", ".ts", ".js"]);
	const hasErrorBoundary = srcFiles.some((f) => {
		const c = readSafe(f);
		return /ErrorBoundary|error\.tsx|error\.jsx|handleError|onError/i.test(c);
	});
	checks.push(item("REL-03", "reliability", "Error boundaries / global error handling implemented", hasErrorBoundary, "warning", hasErrorBoundary ? undefined : "Add React ErrorBoundary components and global error handlers."));

	// REL-04: Health check endpoint
	const hasHealthCheck = srcFiles.some((f) => /health|ping|status/i.test(path.basename(f)));
	checks.push(item("REL-04", "reliability", "Health check endpoint exists", hasHealthCheck, "info", hasHealthCheck ? undefined : "Add a /health or /api/status endpoint for uptime monitoring."));

	// REL-05: Rate limiting
	const hasPkg = readJsonSafe(path.join(repoPath, "package.json"));
	const deps = { ...((hasPkg.dependencies ?? {}) as Record<string, unknown>) };
	const hasRateLimiting = "rate-limiter-flexible" in deps || "@upstash/ratelimit" in deps || "express-rate-limit" in deps;
	checks.push(item("REL-05", "reliability", "Rate limiting implemented on API routes", hasRateLimiting, "warning", hasRateLimiting ? undefined : "Add rate limiting to protect API endpoints from abuse."));

	return checks;
}

// ---------------------------------------------------------------------------
// Maintainability checks (5 checks)
// ---------------------------------------------------------------------------

function runMaintainabilityChecks(repoPath: string, audit?: ProjectAudit): ProductionChecklistItem[] {
	const checks: ProductionChecklistItem[] = [];

	// MAINT-01: README present
	const hasReadme = audit?.has_readme ?? false;
	checks.push(item("MAINT-01", "maintainability", "README.md present with setup instructions", hasReadme, "warning", hasReadme ? undefined : "Add a README with project overview, setup, and deployment instructions."));

	// MAINT-02: TypeScript in use
	const pkg = readJsonSafe(path.join(repoPath, "package.json"));
	const devDeps = { ...((pkg.devDependencies ?? {}) as Record<string, unknown>) };
	const hasTSConfig = exists(path.join(repoPath, "tsconfig.json"));
	const hasTypeScript = "typescript" in devDeps || hasTSConfig;
	checks.push(item("MAINT-02", "maintainability", "TypeScript enabled for type safety", hasTypeScript, "warning", hasTypeScript ? undefined : "Migrate to TypeScript for better maintainability and IDE support."));

	// MAINT-03: Linter configured
	const hasESLint = exists(path.join(repoPath, ".eslintrc.js")) || exists(path.join(repoPath, ".eslintrc.json")) || exists(path.join(repoPath, "eslint.config.js"));
	const hasBiome = exists(path.join(repoPath, "biome.json")) || exists(path.join(repoPath, "biome.jsonc"));
	const hasLinter = hasESLint || hasBiome;
	checks.push(item("MAINT-03", "maintainability", "Linter configured (ESLint/Biome)", hasLinter, "warning", hasLinter ? undefined : "Add ESLint or Biome for code quality enforcement."));

	// MAINT-04: Formatter configured
	const hasPrettier = exists(path.join(repoPath, ".prettierrc")) || exists(path.join(repoPath, ".prettierrc.json")) || exists(path.join(repoPath, "prettier.config.js"));
	const hasFormatter = hasPrettier || hasBiome;
	checks.push(item("MAINT-04", "maintainability", "Code formatter configured (Prettier/Biome)", hasFormatter, "info", hasFormatter ? undefined : "Add Prettier or Biome for consistent code formatting."));

	// MAINT-05: Low technical debt
	const debtCount = audit?.technical_debt.length ?? 0;
	const lowDebt = debtCount < 10;
	checks.push(item("MAINT-05", "maintainability", "Technical debt under control (<10 TODOs/FIXMEs)", lowDebt, "info", lowDebt ? undefined : `${debtCount} TODO/FIXME comments found — schedule a debt cleanup sprint.`));

	return checks;
}

// ---------------------------------------------------------------------------
// Observability checks (5 checks)
// ---------------------------------------------------------------------------

function runObservabilityChecks(repoPath: string): ProductionChecklistItem[] {
	const checks: ProductionChecklistItem[] = [];

	const pkg = readJsonSafe(path.join(repoPath, "package.json"));
	const deps = {
		...((pkg.dependencies ?? {}) as Record<string, unknown>),
		...((pkg.devDependencies ?? {}) as Record<string, unknown>),
	};
	const srcFiles = walkDir(repoPath, [".ts", ".tsx", ".js", ".jsx"]);

	// OBS-01: Error monitoring (Sentry etc.)
	const hasErrorMonitoring = "@sentry/nextjs" in deps || "@sentry/node" in deps || "sentry" in deps || "@sentry/react" in deps || "bugsnag" in deps || "rollbar" in deps;
	checks.push(item("OBS-01", "observability", "Error monitoring (Sentry/Bugsnag) configured", hasErrorMonitoring, "critical", hasErrorMonitoring ? undefined : "Add Sentry (@sentry/nextjs) for production error monitoring."));

	// OBS-02: Analytics
	const hasAnalytics =
		"@vercel/analytics" in deps ||
		"@vercel/speed-insights" in deps ||
		"posthog-js" in deps ||
		"mixpanel-browser" in deps ||
		"@segment/analytics-next" in deps ||
		"react-ga4" in deps;
	checks.push(item("OBS-02", "observability", "Analytics integrated (PostHog/Vercel/Mixpanel)", hasAnalytics, "warning", hasAnalytics ? undefined : "Add analytics (PostHog or Vercel Analytics) for user behavior tracking."));

	// OBS-03: Structured logging
	const hasLogger = srcFiles.some((f) => {
		const c = readSafe(f);
		return /winston|pino|bunyan|logger\.(?:info|error|warn|debug)/i.test(c);
	});
	checks.push(item("OBS-03", "observability", "Structured logging implemented", hasLogger, "warning", hasLogger ? undefined : "Add structured logging (Pino or Winston) for production log analysis."));

	// OBS-04: Performance monitoring
	const hasPerfMonitoring = "@vercel/speed-insights" in deps || "web-vitals" in deps || "newrelic" in deps || "datadog" in deps;
	checks.push(item("OBS-04", "observability", "Performance monitoring (Web Vitals/Datadog)", hasPerfMonitoring, "info", hasPerfMonitoring ? undefined : "Add Web Vitals monitoring (@vercel/speed-insights or web-vitals)."));

	// OBS-05: Uptime monitoring documented
	const hasUptimeCheck = srcFiles.some((f) => /health|ping|status/i.test(path.basename(f)));
	checks.push(item("OBS-05", "observability", "Health endpoint available for uptime monitoring", hasUptimeCheck, "info", hasUptimeCheck ? undefined : "Add /api/health for uptime checkers (BetterUptime, Checkly, etc.)."));

	return checks;
}

// ---------------------------------------------------------------------------
// Deployment checks (5 checks)
// ---------------------------------------------------------------------------

function runDeploymentChecks(repoPath: string, audit?: ProjectAudit): ProductionChecklistItem[] {
	const checks: ProductionChecklistItem[] = [];

	// DEP-01: Deployment config present
	const hasDeployConfig = audit?.has_deployment_config ?? false;
	checks.push(item("DEP-01", "deployment", "Deployment config present (vercel.json/Dockerfile/etc.)", hasDeployConfig, "critical", hasDeployConfig ? undefined : "Add a deployment config file (vercel.json, netlify.toml, Dockerfile)."));

	// DEP-02: Environment variables documented
	const hasEnvDoc = audit?.has_env_config ?? false;
	checks.push(item("DEP-02", "deployment", "Environment variables documented in .env.example", hasEnvDoc, "critical", hasEnvDoc ? undefined : "Create .env.example listing all required environment variables."));

	// DEP-03: Build script defined
	const pkg = readJsonSafe(path.join(repoPath, "package.json"));
	const scripts = (pkg.scripts ?? {}) as Record<string, string>;
	const hasBuildScript = "build" in scripts;
	checks.push(item("DEP-03", "deployment", "Build script defined in package.json", hasBuildScript, "critical", hasBuildScript ? undefined : "Add a 'build' script to package.json."));

	// DEP-04: Preview/staging environment strategy
	const vercelJson = readJsonSafe(path.join(repoPath, "vercel.json"));
	const hasPreview = JSON.stringify(vercelJson).includes("preview") || exists(path.join(repoPath, ".github", "workflows"));
	checks.push(item("DEP-04", "deployment", "Preview/staging deployment strategy in place", hasPreview, "warning", hasPreview ? undefined : "Set up preview deployments for PRs (Vercel preview URLs or staging environment)."));

	// DEP-05: Start script defined
	const hasStartScript = "start" in scripts;
	checks.push(item("DEP-05", "deployment", "Start script defined for production server", hasStartScript, "warning", hasStartScript ? undefined : "Add a 'start' script to package.json for production server startup."));

	return checks;
}

// ---------------------------------------------------------------------------
// Score aggregation
// ---------------------------------------------------------------------------

function scoreCategory(checks: ProductionChecklistItem[]): number {
	if (checks.length === 0) return 100;
	const weights = { critical: 3, warning: 2, info: 1 };
	let total = 0;
	let earned = 0;
	for (const c of checks) {
		const w = weights[c.severity];
		total += w;
		if (c.passed) earned += w;
	}
	return Math.round((earned / total) * 100);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function checkProductionReadiness(repoPath: string, audit?: ProjectAudit): Promise<ProductionReadinessReport> {
	const absPath = path.resolve(repoPath);

	const securityChecks = runSecurityChecks(absPath);
	const perfChecks = runPerformanceChecks(absPath);
	const reliabilityChecks = runReliabilityChecks(absPath, audit);
	const maintChecks = runMaintainabilityChecks(absPath, audit);
	const obsChecks = runObservabilityChecks(absPath);
	const deployChecks = runDeploymentChecks(absPath, audit);

	const allChecks = [...securityChecks, ...perfChecks, ...reliabilityChecks, ...maintChecks, ...obsChecks, ...deployChecks];

	const scores = {
		security: scoreCategory(securityChecks),
		performance: scoreCategory(perfChecks),
		reliability: scoreCategory(reliabilityChecks),
		maintainability: scoreCategory(maintChecks),
		observability: scoreCategory(obsChecks),
		deployment: scoreCategory(deployChecks),
	};

	// Weighted overall: security + reliability are most critical
	const overall = Math.round(
		scores.security * 0.25 +
			scores.reliability * 0.2 +
			scores.deployment * 0.2 +
			scores.maintainability * 0.15 +
			scores.performance * 0.1 +
			scores.observability * 0.1,
	);

	const critical_blockers = allChecks.filter((c) => !c.passed && c.severity === "critical").map((c) => c.check);
	const warnings = allChecks.filter((c) => !c.passed && c.severity === "warning").map((c) => c.check);
	const recommendations = allChecks
		.filter((c) => !c.passed && c.notes)
		.map((c) => c.notes as string)
		.slice(0, 20);

	const project_id = path.basename(absPath);

	return {
		project_id,
		timestamp: new Date().toISOString(),
		scores,
		overall,
		critical_blockers,
		warnings,
		recommendations,
		ready_for_production: overall >= 80 && critical_blockers.length === 0,
		checklist: allChecks,
	};
}
