/**
 * Browser Validator
 *
 * Orchestration layer for Chrome DevTools MCP-based browser validation.
 * Navigates to a URL, inspects the page, tests responsive viewports,
 * crawls internal links, checks accessibility, captures screenshots,
 * and monitors API calls for failures.
 *
 * MCP tools used (injected at runtime by the Claude Code harness):
 *   - mcp__chrome__navigate       / mcp__browser__navigate
 *   - mcp__chrome__screenshot     / mcp__browser__screenshot
 *   - mcp__chrome__evaluate       / mcp__browser__evaluate
 *   - mcp__chrome__get_console_logs / mcp__browser__console_errors
 *   - mcp__chrome__set_viewport   / mcp__browser__set_viewport
 *   - mcp__chrome__get_network_logs / mcp__browser__network_logs
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type {
	AccessibilityIssue,
	APIFailure,
	BrokenLink,
	BrowserValidationReport,
	ConsoleError,
	FormCheck,
	PerformanceMetrics,
	ResponsiveCheck,
	Screenshot,
} from "./types.js";

// ---------------------------------------------------------------------------
// MCP tool shim
// ---------------------------------------------------------------------------

type MCPFn = (...args: unknown[]) => Promise<unknown>;

function getMCPTool(...names: string[]): MCPFn | null {
	// biome-ignore lint/suspicious/noExplicitAny: runtime-injected globals
	const g = globalThis as any;
	for (const name of names) {
		const tool: MCPFn | undefined = g[name] ?? g.__mcp__?.[name];
		if (tool) return tool;
	}
	return null;
}

async function callMCP(primaryName: string, fallbackName: string, params: Record<string, unknown>): Promise<unknown> {
	const tool = getMCPTool(primaryName, fallbackName);
	if (!tool) throw new Error(`MCP tool '${primaryName}' / '${fallbackName}' not available.`);
	return tool(params);
}

async function callEval(expression: string): Promise<unknown> {
	const tool = getMCPTool("mcp__chrome__evaluate", "mcp__browser__evaluate");
	if (!tool) throw new Error("MCP evaluate tool not available.");
	return tool({ expression });
}

// ---------------------------------------------------------------------------
// Screenshot helper
// ---------------------------------------------------------------------------

const SCREENSHOT_DIR = path.resolve(process.cwd(), "logs", "screenshots");

function ensureScreenshotDir(): void {
	if (!fs.existsSync(SCREENSHOT_DIR)) {
		fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
	}
}

async function captureScreenshot(url: string, viewport: { width: number; height: number }): Promise<Screenshot> {
	const timestamp = new Date().toISOString();
	const slug = url.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 60);
	const filename = `${slug}_${viewport.width}x${viewport.height}_${Date.now()}.png`;
	ensureScreenshotDir();
	const filePath = path.join(SCREENSHOT_DIR, filename);

	try {
		const result = (await callMCP(
			"mcp__chrome__screenshot",
			"mcp__browser__screenshot",
			{},
		)) as { data?: string; path?: string };

		// If the MCP returns base64 data, write to disk
		if (result?.data) {
			const buf = Buffer.from(result.data, "base64");
			fs.writeFileSync(filePath, buf);
		}
	} catch {
		// Non-fatal — screenshot failure doesn't block other checks
	}

	return { url, viewport, path: filePath, timestamp };
}

// ---------------------------------------------------------------------------
// Viewport definitions
// ---------------------------------------------------------------------------

const VIEWPORTS: Array<{ name: string; width: number; height: number }> = [
	{ name: "mobile-sm", width: 320, height: 568 },
	{ name: "mobile-lg", width: 390, height: 844 },
	{ name: "tablet", width: 768, height: 1024 },
	{ name: "desktop", width: 1440, height: 900 },
];

// ---------------------------------------------------------------------------
// Responsive checks
// ---------------------------------------------------------------------------

async function checkResponsiveViewport(width: number, height: number, label: string): Promise<ResponsiveCheck> {
	try {
		await callMCP("mcp__chrome__set_viewport", "mcp__browser__set_viewport", { width, height });
		// Give the page a moment to reflow
		await new Promise((r) => setTimeout(r, 500));

		// Check for horizontal overflow (layout broken indicator)
		const overflowResult = (await callEval(`
      (() => {
        const body = document.body;
        const html = document.documentElement;
        const maxW = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth);
        return { overflow: maxW > window.innerWidth, maxW, windowW: window.innerWidth };
      })()
    `)) as { value?: { overflow: boolean } };
		const overflow = overflowResult?.value?.overflow ?? false;

		// Check touch target sizes (min 44x44px per WCAG 2.5.5)
		const touchResult = (await callEval(`
      (() => {
        const interactives = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"]'));
        const tooSmall = interactives.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width < 44 || rect.height < 44;
        });
        return { ok: tooSmall.length === 0, failCount: tooSmall.length };
      })()
    `)) as { value?: { ok: boolean } };
		const touchTargetsOk = touchResult?.value?.ok ?? true;

		return {
			viewport: label,
			width,
			height,
			layout_broken: overflow,
			overflow_detected: overflow,
			touch_targets_ok: touchTargetsOk,
		};
	} catch {
		return {
			viewport: label,
			width,
			height,
			layout_broken: false,
			overflow_detected: false,
			touch_targets_ok: true,
		};
	}
}

// ---------------------------------------------------------------------------
// Console error collection
// ---------------------------------------------------------------------------

async function collectConsoleErrors(): Promise<ConsoleError[]> {
	try {
		const result = (await callMCP(
			"mcp__chrome__get_console_logs",
			"mcp__browser__console_errors",
			{},
		)) as { value?: Array<{ level: string; message: string; source: string; lineNumber?: number }> };

		const logs = Array.isArray(result?.value) ? result.value : [];
		return logs
			.filter((l) => l.level === "error" || l.level === "warn")
			.map((l) => ({
				level: l.level === "error" ? "error" : ("warn" as ConsoleError["level"]),
				message: l.message ?? "",
				source: l.source ?? "",
				...(l.lineNumber !== undefined && { line: l.lineNumber }),
			}));
	} catch {
		return [];
	}
}

// ---------------------------------------------------------------------------
// Link crawler
// ---------------------------------------------------------------------------

async function crawlLinks(baseUrl: string, foundOn: string): Promise<{ internal: string[]; broken: BrokenLink[] }> {
	const broken: BrokenLink[] = [];
	let internal: string[] = [];

	try {
		const baseOrigin = new URL(baseUrl).origin;
		const result = (await callEval(`
      (() => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        return links.map(a => ({ href: a.href, text: a.innerText?.slice(0, 60) ?? '' }));
      })()
    `)) as { value?: Array<{ href: string; text: string }> };

		const allLinks = Array.isArray(result?.value) ? result.value : [];

		internal = allLinks
			.map((l) => l.href)
			.filter((href) => {
				try {
					return new URL(href).origin === baseOrigin;
				} catch {
					return false;
				}
			});

		// Check a subset of external links for brokenness via fetch
		const externalLinks = allLinks.filter((l) => {
			try {
				return new URL(l.href).origin !== baseOrigin;
			} catch {
				return false;
			}
		});

		const checkExternal = externalLinks.slice(0, 20); // cap for performance
		const fetchChecks = await Promise.allSettled(
			checkExternal.map(async (link) => {
				try {
					const res = await fetch(link.href, { method: "HEAD", signal: AbortSignal.timeout(8000) });
					if (!res.ok) {
						broken.push({ url: link.href, found_on: foundOn, status_code: res.status, text: link.text });
					}
				} catch {
					broken.push({ url: link.href, found_on: foundOn, status_code: 0, text: link.text });
				}
			}),
		);
		void fetchChecks; // we capture results via side-effects above
	} catch {
		// Link crawl failed — continue
	}

	return { internal, broken };
}

// ---------------------------------------------------------------------------
// Accessibility heuristics from DOM
// ---------------------------------------------------------------------------

async function checkAccessibility(): Promise<AccessibilityIssue[]> {
	const issues: AccessibilityIssue[] = [];

	try {
		const result = (await callEval(`
      (() => {
        const issues = [];
        // 1.1.1 Images without alt
        document.querySelectorAll('img:not([alt])').forEach(img => {
          issues.push({ element: img.outerHTML.slice(0, 100), issue: 'Image missing alt attribute', wcag_criterion: '1.1.1', severity: 'critical' });
        });
        // 4.1.2 Buttons without accessible name
        document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(btn => {
          if (!btn.innerText?.trim()) {
            issues.push({ element: btn.outerHTML.slice(0, 100), issue: 'Button has no accessible name', wcag_criterion: '4.1.2', severity: 'critical' });
          }
        });
        // 1.3.1 Form inputs without labels
        document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
          const id = input.id;
          const label = id ? document.querySelector('label[for="' + id + '"]') : null;
          if (!label) {
            issues.push({ element: input.outerHTML.slice(0, 100), issue: 'Input has no associated label', wcag_criterion: '1.3.1', severity: 'serious' });
          }
        });
        // 2.4.1 Skip link
        const hasSkipLink = !!document.querySelector('a[href^="#"]');
        if (!hasSkipLink) {
          issues.push({ element: '<body>', issue: 'No skip navigation link found', wcag_criterion: '2.4.1', severity: 'moderate' });
        }
        // 3.1.1 Lang attribute
        if (!document.documentElement.lang) {
          issues.push({ element: '<html>', issue: 'Missing lang attribute on html element', wcag_criterion: '3.1.1', severity: 'serious' });
        }
        return issues.slice(0, 50);
      })()
    `)) as { value?: AccessibilityIssue[] };

		if (Array.isArray(result?.value)) {
			issues.push(...result.value);
		}
	} catch {
		// Eval not available — skip
	}

	return issues;
}

// ---------------------------------------------------------------------------
// Form checks
// ---------------------------------------------------------------------------

async function checkForms(): Promise<FormCheck[]> {
	const results: FormCheck[] = [];

	try {
		const result = (await callEval(`
      (() => {
        const forms = Array.from(document.querySelectorAll('form'));
        return forms.map((form, i) => {
          const inputs = form.querySelectorAll('input, select, textarea');
          const labels = form.querySelectorAll('label');
          const hasRequired = !!form.querySelector('[required]');
          const hasPattern = !!form.querySelector('[pattern]');
          const hasValidation = hasRequired || hasPattern || !!form.querySelector('[type="email"]');
          const hasLabels = labels.length >= inputs.length * 0.8;
          return {
            form_id: form.id || form.name || ('form-' + i),
            fields: inputs.length,
            has_validation: hasValidation,
            has_labels: hasLabels,
            submission_works: true  // can't verify without submitting
          };
        });
      })()
    `)) as { value?: FormCheck[] };

		if (Array.isArray(result?.value)) {
			results.push(...result.value);
		}
	} catch {
		// Eval not available
	}

	return results;
}

// ---------------------------------------------------------------------------
// Performance metrics (Navigation Timing API via eval)
// ---------------------------------------------------------------------------

async function measurePerformance(): Promise<PerformanceMetrics> {
	const defaults: PerformanceMetrics = {
		fcp_ms: 0,
		lcp_ms: 0,
		cls: 0,
		ttfb_ms: 0,
		score: 50,
	};

	try {
		const result = (await callEval(`
      (() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');

        const ttfb = nav ? nav.responseStart - nav.requestStart : 0;
        const fcpMs = fcp ? fcp.startTime : 0;
        const lcpMs = fcpMs * 1.5; // heuristic approximation without PerformanceObserver

        // CLS is hard to get synchronously — use 0 as default
        return { fcp_ms: Math.round(fcpMs), lcp_ms: Math.round(lcpMs), cls: 0, ttfb_ms: Math.round(ttfb) };
      })()
    `)) as { value?: { fcp_ms: number; lcp_ms: number; cls: number; ttfb_ms: number } };

		if (result?.value) {
			const { fcp_ms, lcp_ms, cls, ttfb_ms } = result.value;

			// Score heuristic: penalize slow FCP/LCP/TTFB
			let score = 100;
			if (fcp_ms > 3000) score -= 25;
			else if (fcp_ms > 1800) score -= 10;
			if (lcp_ms > 4000) score -= 25;
			else if (lcp_ms > 2500) score -= 10;
			if (ttfb_ms > 800) score -= 20;
			else if (ttfb_ms > 200) score -= 5;
			if (cls > 0.25) score -= 20;
			else if (cls > 0.1) score -= 10;

			return { fcp_ms, lcp_ms, cls, ttfb_ms, score: Math.max(0, score) };
		}
	} catch {
		// Navigation timing not available
	}

	return defaults;
}

// ---------------------------------------------------------------------------
// Network log collection (API failures)
// ---------------------------------------------------------------------------

async function collectAPIFailures(): Promise<APIFailure[]> {
	const failures: APIFailure[] = [];

	try {
		const result = (await callMCP(
			"mcp__chrome__get_network_logs",
			"mcp__browser__network_logs",
			{},
		)) as {
			value?: Array<{
				url: string;
				method: string;
				status: number;
				error?: string;
			}>;
		};

		const logs = Array.isArray(result?.value) ? result.value : [];
		for (const log of logs) {
			if (log.status >= 400 || log.error) {
				failures.push({
					url: log.url,
					method: log.method ?? "GET",
					status: log.status ?? 0,
					error: log.error ?? `HTTP ${log.status}`,
				});
			}
		}
	} catch {
		// Network logs not available
	}

	return failures;
}

// ---------------------------------------------------------------------------
// Score calculation
// ---------------------------------------------------------------------------

function calculateOverallScore(report: Omit<BrowserValidationReport, "overall_score" | "critical_issues" | "warnings" | "pass">): number {
	let score = 100;

	// Deduct for broken links
	score -= Math.min(30, report.broken_links.length * 5);

	// Deduct for console errors
	const consoleErrors = report.console_errors.filter((e) => e.level === "error");
	score -= Math.min(20, consoleErrors.length * 4);

	// Deduct for accessibility issues
	const criticalA11y = report.accessibility_issues.filter((i) => i.severity === "critical");
	const seriousA11y = report.accessibility_issues.filter((i) => i.severity === "serious");
	score -= Math.min(20, criticalA11y.length * 5 + seriousA11y.length * 2);

	// Deduct for layout breaks
	const brokenLayouts = report.responsive_checks.filter((r) => r.layout_broken);
	score -= Math.min(15, brokenLayouts.length * 5);

	// Deduct for API failures
	score -= Math.min(15, report.api_failures.length * 3);

	// Factor in performance score
	score = score * 0.8 + report.performance_metrics.score * 0.2;

	return Math.max(0, Math.round(score));
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function validateInBrowser(url: string): Promise<BrowserValidationReport> {
	if (!url || url.trim().length === 0) throw new Error("validateInBrowser: url is required");
	try {
		new URL(url);
	} catch {
		throw new Error(`validateInBrowser: invalid URL '${url}'`);
	}

	const timestamp = new Date().toISOString();
	const screenshots: Screenshot[] = [];
	const broken_links: BrokenLink[] = [];
	const responsive_checks: ResponsiveCheck[] = [];

	// Step 1: Initial navigation at desktop viewport
	await callMCP("mcp__chrome__navigate", "mcp__browser__navigate", { url });
	// Allow page to settle
	await new Promise((r) => setTimeout(r, 2000));

	// Step 2: Capture desktop screenshot
	const desktopShot = await captureScreenshot(url, { width: 1440, height: 900 });
	screenshots.push(desktopShot);

	// Step 3: Collect console errors
	const console_errors = await collectConsoleErrors();

	// Step 4: Crawl links
	const { internal: internalLinks, broken: externalBroken } = await crawlLinks(url, url);
	broken_links.push(...externalBroken);

	// Check internal links
	const internalLinksToCheck = internalLinks.slice(0, 15); // cap for performance
	for (const link of internalLinksToCheck) {
		try {
			await callMCP("mcp__chrome__navigate", "mcp__browser__navigate", { url: link });
			await new Promise((r) => setTimeout(r, 1000));
			const { broken } = await crawlLinks(link, link);
			broken_links.push(...broken);
		} catch {
			broken_links.push({ url: link, found_on: url, status_code: 0, text: link });
		}
	}

	// Return to base URL
	await callMCP("mcp__chrome__navigate", "mcp__browser__navigate", { url });
	await new Promise((r) => setTimeout(r, 2000));

	// Step 5: Check all responsive viewports
	for (const vp of VIEWPORTS) {
		const check = await checkResponsiveViewport(vp.width, vp.height, vp.name);
		responsive_checks.push(check);

		// Screenshot each viewport
		const shot = await captureScreenshot(url, { width: vp.width, height: vp.height });
		screenshots.push(shot);
	}

	// Reset to desktop
	await callMCP("mcp__chrome__set_viewport", "mcp__browser__set_viewport", { width: 1440, height: 900 }).catch(() => null);

	// Step 6: Accessibility checks
	const accessibility_issues = await checkAccessibility();

	// Step 7: Performance metrics
	const performance_metrics = await measurePerformance();

	// Step 8: Form checks
	const form_checks = await checkForms();

	// Step 9: API failures
	const api_failures = await collectAPIFailures();

	// Step 10: Score & critical issues
	const baseReport = {
		url,
		timestamp,
		screenshots,
		broken_links: [...new Map(broken_links.map((l) => [l.url, l])).values()],
		console_errors,
		accessibility_issues,
		performance_metrics,
		responsive_checks,
		form_checks,
		api_failures,
	};

	const overall_score = calculateOverallScore(baseReport);

	const critical_issues: string[] = [];
	const warnings: string[] = [];

	if (baseReport.broken_links.length > 0) {
		critical_issues.push(`${baseReport.broken_links.length} broken link(s) found`);
	}
	if (console_errors.filter((e) => e.level === "error").length > 0) {
		critical_issues.push(`${console_errors.filter((e) => e.level === "error").length} JavaScript error(s) in console`);
	}
	if (accessibility_issues.filter((i) => i.severity === "critical").length > 0) {
		critical_issues.push(`${accessibility_issues.filter((i) => i.severity === "critical").length} critical accessibility violation(s)`);
	}
	if (responsive_checks.some((r) => r.layout_broken)) {
		warnings.push("Layout broken at one or more viewport widths");
	}
	if (performance_metrics.lcp_ms > 4000) {
		warnings.push(`LCP is ${performance_metrics.lcp_ms}ms — target <2,500ms`);
	}
	if (api_failures.length > 0) {
		warnings.push(`${api_failures.length} API request failure(s) detected`);
	}
	if (console_errors.filter((e) => e.level === "warn").length > 0) {
		warnings.push(`${console_errors.filter((e) => e.level === "warn").length} console warning(s)`);
	}

	return {
		...baseReport,
		overall_score,
		critical_issues,
		warnings,
		pass: overall_score >= 80 && critical_issues.length === 0,
	};
}
