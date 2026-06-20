/**
 * UDEC Score Calculator
 *
 * Analyzes a project's UI/UX across 10 dimensions:
 * typography, spacing, accessibility, animation, responsiveness,
 * visual hierarchy, interaction quality, information architecture,
 * mobile quality, and user trust.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { UDECScore } from "./types.js";

// ---------------------------------------------------------------------------
// Grade helpers
// ---------------------------------------------------------------------------

function toGrade(score: number): "A" | "B" | "C" | "D" | "F" {
	if (score >= 9.0) return "A";
	if (score >= 8.0) return "B";
	if (score >= 7.0) return "C";
	if (score >= 6.0) return "D";
	return "F";
}

function clamp(v: number, min = 0, max = 10): number {
	return Math.max(min, Math.min(max, v));
}

// ---------------------------------------------------------------------------
// File walkers
// ---------------------------------------------------------------------------

function walkFiles(dir: string, extensions: string[]): string[] {
	const results: string[] = [];
	if (!fs.existsSync(dir)) return results;
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== ".next") {
			results.push(...walkFiles(full, extensions));
		} else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
			results.push(full);
		}
	}
	return results;
}

function readSafe(filePath: string): string {
	try {
		return fs.readFileSync(filePath, "utf8");
	} catch {
		return "";
	}
}

function countPattern(text: string, pattern: RegExp): number {
	return (text.match(pattern) ?? []).length;
}

// ---------------------------------------------------------------------------
// Dimension scorers
// ---------------------------------------------------------------------------

function scoreTypography(cssContent: string, htmlContent: string): { score: number; recs: string[] } {
	const recs: string[] = [];
	let score = 5; // baseline

	// Font stacks
	const hasFontFamily = /font-family\s*:/i.test(cssContent);
	if (hasFontFamily) score += 1;
	else recs.push("Define a consistent font-family stack in CSS.");

	// Line heights
	const hasLineHeight = /line-height\s*:/i.test(cssContent);
	if (hasLineHeight) score += 1;
	else recs.push("Add explicit line-height declarations for readability.");

	// Type scale — rem/em usage
	const remUsage = countPattern(cssContent, /\d+\.?\d*rem/g);
	if (remUsage >= 5) score += 1;
	else recs.push("Use rem/em units for a scalable type system.");

	// Heading tags in HTML
	const headings = countPattern(htmlContent, /<h[1-6]/gi);
	if (headings >= 3) score += 1;
	else recs.push("Use a proper heading hierarchy (h1–h6) for typography structure.");

	// Font weights
	const hasFontWeights = /font-weight\s*:\s*\d{3}/i.test(cssContent);
	if (hasFontWeights) score += 1;
	else recs.push("Define varied font-weights to create typographic contrast.");

	return { score: clamp(score), recs };
}

function scoreSpacing(cssContent: string): { score: number; recs: string[] } {
	const recs: string[] = [];
	let score = 5;

	// 4/8px grid hints: multiples of 4 in margin/padding
	const gridPattern = /(?:margin|padding)\s*:\s*(?:\d*\.?\d+(?:px|rem)\s*)+/gi;
	const spacingDecls = cssContent.match(gridPattern) ?? [];
	const on4Grid = spacingDecls.filter((d) => {
		const values = d.match(/\d+(?:\.\d+)?(?:px)/g) ?? [];
		return values.every((v) => Number(v.replace("px", "")) % 4 === 0);
	});
	const gridRatio = spacingDecls.length > 0 ? on4Grid.length / spacingDecls.length : 0;
	if (gridRatio >= 0.8) score += 2;
	else if (gridRatio >= 0.5) score += 1;
	else recs.push("Align spacing values to a 4/8px grid for visual consistency.");

	// CSS custom properties for spacing
	const hasSpacingVars = /--(?:space|gap|margin|padding)-/i.test(cssContent);
	if (hasSpacingVars) score += 2;
	else recs.push("Use CSS custom properties for a consistent spacing scale (--space-1, --space-2, etc.).");

	// Gap usage (flex/grid)
	const hasGap = /\bgap\s*:/i.test(cssContent);
	if (hasGap) score += 1;
	else recs.push("Use the `gap` property for flex/grid layouts instead of manual margins.");

	return { score: clamp(score), recs };
}

function scoreAccessibility(htmlContent: string, cssContent: string): { score: number; recs: string[] } {
	const recs: string[] = [];
	let score = 4;

	const hasAria = /aria-/i.test(htmlContent);
	if (hasAria) score += 1.5;
	else recs.push("Add ARIA attributes to interactive elements.");

	const hasAlt = /<img[^>]+alt=/i.test(htmlContent);
	if (hasAlt) score += 1.5;
	else recs.push("Add alt text to all images.");

	const hasRole = /\brole=/i.test(htmlContent);
	if (hasRole) score += 1;
	else recs.push("Use semantic role attributes for custom interactive components.");

	const hasLang = /<html[^>]+lang=/i.test(htmlContent);
	if (hasLang) score += 1;
	else recs.push("Set a lang attribute on the <html> element.");

	const hasFocusVisible = /:focus-visible/i.test(cssContent);
	if (hasFocusVisible) score += 1;
	else recs.push("Style :focus-visible for keyboard navigation.");

	return { score: clamp(score), recs };
}

function scoreAnimation(cssContent: string): { score: number; recs: string[] } {
	const recs: string[] = [];
	let score = 5;

	const hasTransition = /transition\s*:/i.test(cssContent);
	if (hasTransition) score += 2;
	else recs.push("Add CSS transitions for smoother state changes.");

	const hasAnimation = /@keyframes|animation\s*:/i.test(cssContent);
	if (hasAnimation) score += 1.5;
	else recs.push("Consider subtle CSS animations for delight and feedback.");

	const hasReducedMotion = /prefers-reduced-motion/i.test(cssContent);
	if (hasReducedMotion) score += 1.5;
	else recs.push("Add @media (prefers-reduced-motion) to respect user accessibility preferences.");

	const hasDuration = /(?:transition|animation)-duration\s*:\s*0?\.\d+s|(?:300|200|150|400)ms/i.test(cssContent);
	if (!hasDuration) recs.push("Use animation durations between 150–400ms for natural feel.");

	return { score: clamp(score), recs };
}

function scoreResponsiveness(cssContent: string, htmlContent: string): { score: number; recs: string[] } {
	const recs: string[] = [];
	let score = 4;

	const mediaQueryCount = countPattern(cssContent, /@media\s+/g);
	if (mediaQueryCount >= 3) score += 2;
	else if (mediaQueryCount >= 1) score += 1;
	else recs.push("Add media queries for mobile, tablet, and desktop breakpoints.");

	const hasViewportMeta = /meta[^>]+viewport/i.test(htmlContent);
	if (hasViewportMeta) score += 1.5;
	else recs.push("Add <meta name='viewport' content='width=device-width, initial-scale=1'>.");

	const hasFlexOrGrid = /(?:display\s*:\s*(?:flex|grid))/i.test(cssContent);
	if (hasFlexOrGrid) score += 1.5;
	else recs.push("Use flexbox or CSS grid for responsive layouts.");

	const hasMaxWidth = /max-width\s*:/i.test(cssContent);
	if (hasMaxWidth) score += 1;
	else recs.push("Constrain max-width on content containers for large screens.");

	return { score: clamp(score), recs };
}

function scoreVisualHierarchy(htmlContent: string, cssContent: string): { score: number; recs: string[] } {
	const recs: string[] = [];
	let score = 4;

	const hasH1 = /<h1/i.test(htmlContent);
	const hasH2 = /<h2/i.test(htmlContent);
	if (hasH1 && hasH2) score += 2;
	else if (hasH1) score += 1;
	else recs.push("Use h1 + h2 to establish a clear content hierarchy.");

	// Color contrast hints (CSS custom properties for color)
	const hasColorVars = /--(?:color|text|bg|background|foreground)/i.test(cssContent);
	if (hasColorVars) score += 1.5;
	else recs.push("Define a color system via CSS variables for consistent hierarchy.");

	// Font size scale
	const fontSizeVars = countPattern(cssContent, /font-size\s*:/gi);
	if (fontSizeVars >= 4) score += 1.5;
	else recs.push("Use a minimum of 4 distinct font sizes to create visual layers.");

	const hasZ = /z-index\s*:/i.test(cssContent);
	if (hasZ) score += 1;
	else recs.push("Use z-index deliberately to communicate layering and depth.");

	return { score: clamp(score), recs };
}

function scoreInteractionQuality(htmlContent: string, cssContent: string): { score: number; recs: string[] } {
	const recs: string[] = [];
	let score = 4;

	const hasHoverState = /:hover/i.test(cssContent);
	if (hasHoverState) score += 2;
	else recs.push("Add :hover states to interactive elements for visual feedback.");

	const hasActiveState = /:active/i.test(cssContent);
	if (hasActiveState) score += 1;
	else recs.push("Add :active states to buttons and links for press feedback.");

	const hasButton = /<button/i.test(htmlContent);
	const hasOnClick = /onClick|addEventListener/i.test(htmlContent);
	if (hasButton && hasOnClick) score += 1.5;
	else if (hasButton) score += 0.5;

	const hasCursor = /cursor\s*:\s*pointer/i.test(cssContent);
	if (hasCursor) score += 1.5;
	else recs.push("Set cursor: pointer on all clickable elements.");

	return { score: clamp(score), recs };
}

function scoreInformationArchitecture(htmlContent: string): { score: number; recs: string[] } {
	const recs: string[] = [];
	let score = 4;

	const hasNav = /<nav/i.test(htmlContent);
	if (hasNav) score += 2;
	else recs.push("Use a <nav> element to define the primary navigation.");

	const hasMain = /<main/i.test(htmlContent);
	if (hasMain) score += 1.5;
	else recs.push("Wrap page content in a <main> element.");

	const hasFooter = /<footer/i.test(htmlContent);
	if (hasFooter) score += 1;
	else recs.push("Add a <footer> with links to key pages.");

	const hasHeader = /<header/i.test(htmlContent);
	if (hasHeader) score += 1.5;
	else recs.push("Use a <header> landmark for the site header.");

	return { score: clamp(score), recs };
}

function scoreMobileQuality(cssContent: string, htmlContent: string): { score: number; recs: string[] } {
	const recs: string[] = [];
	let score = 4;

	const hasTouchTarget = /min-height\s*:\s*(?:4[4-9]|[5-9]\d|\d{3})px|min-width\s*:\s*(?:4[4-9]|[5-9]\d|\d{3})px/i.test(cssContent);
	if (hasTouchTarget) score += 2;
	else recs.push("Ensure touch targets are at least 44×44px (WCAG 2.5.5).");

	const hasMobileBreakpoint = /@media.*(?:max-width|min-width).*(?:320|375|390|414|768)/i.test(cssContent);
	if (hasMobileBreakpoint) score += 2;
	else recs.push("Add breakpoints targeting common mobile widths (375px, 390px, 768px).");

	const hasViewportMeta = /meta[^>]+viewport/i.test(htmlContent);
	if (hasViewportMeta) score += 1;

	const hasMobileMenu = /hamburger|menu-toggle|mobile-nav|drawer/i.test(htmlContent + cssContent);
	if (hasMobileMenu) score += 1;
	else recs.push("Implement a mobile navigation pattern (hamburger menu, drawer, etc.).");

	return { score: clamp(score), recs };
}

function scoreUserTrust(htmlContent: string): { score: number; recs: string[] } {
	const recs: string[] = [];
	let score = 4;

	const hasHttps = /https:\/\//i.test(htmlContent);
	if (hasHttps) score += 1;

	const hasSocialProof = /testimonial|review|rating|stars|customer|user|trusted|clients/i.test(htmlContent);
	if (hasSocialProof) score += 2;
	else recs.push("Add social proof (testimonials, user counts, reviews) to build trust.");

	const hasTrustBadge = /badge|verified|secure|ssl|certified|award|featured/i.test(htmlContent);
	if (hasTrustBadge) score += 1.5;
	else recs.push("Include trust signals (security badges, certifications, press mentions).");

	const hasPrivacy = /privacy|terms|cookie/i.test(htmlContent);
	if (hasPrivacy) score += 1.5;
	else recs.push("Link to a Privacy Policy and Terms of Service to build user trust.");

	return { score: clamp(score), recs };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function calculateUDECScore(projectPath: string, htmlContent?: string): Promise<UDECScore> {
	// Gather CSS and HTML content from the project
	const cssFiles = walkFiles(projectPath, [".css", ".scss", ".sass", ".less"]);
	const htmlFiles = htmlContent
		? []
		: walkFiles(projectPath, [".html", ".htm", ".jsx", ".tsx", ".svelte", ".vue"]);

	const cssContent = cssFiles.map(readSafe).join("\n");
	const html = htmlContent ?? htmlFiles.map(readSafe).join("\n");

	const typo = scoreTypography(cssContent, html);
	const spacing = scoreSpacing(cssContent);
	const a11y = scoreAccessibility(html, cssContent);
	const anim = scoreAnimation(cssContent);
	const responsive = scoreResponsiveness(cssContent, html);
	const hierarchy = scoreVisualHierarchy(html, cssContent);
	const interaction = scoreInteractionQuality(html, cssContent);
	const ia = scoreInformationArchitecture(html);
	const mobile = scoreMobileQuality(cssContent, html);
	const trust = scoreUserTrust(html);

	// Weighted average (equal weights across 10 dimensions)
	const dimensions = [
		typo.score,
		spacing.score,
		a11y.score,
		anim.score,
		responsive.score,
		hierarchy.score,
		interaction.score,
		ia.score,
		mobile.score,
		trust.score,
	];
	const overall = clamp(dimensions.reduce((s, v) => s + v, 0) / dimensions.length);

	const allRecs = [...typo.recs, ...spacing.recs, ...a11y.recs, ...anim.recs, ...responsive.recs, ...hierarchy.recs, ...interaction.recs, ...ia.recs, ...mobile.recs, ...trust.recs];

	return {
		typography: typo.score,
		spacing: spacing.score,
		accessibility: a11y.score,
		animation: anim.score,
		responsiveness: responsive.score,
		visual_hierarchy: hierarchy.score,
		interaction_quality: interaction.score,
		information_architecture: ia.score,
		mobile_quality: mobile.score,
		user_trust: trust.score,
		overall,
		grade: toGrade(overall),
		pass: overall >= 8.5,
		recommendations: allRecs,
	};
}
