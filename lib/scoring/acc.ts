/**
 * ACC Score Calculator — Accessibility
 *
 * WCAG 2.1 AA compliance checks across six dimensions:
 * wcag_aa_compliance, color_contrast, keyboard_nav,
 * screen_reader, focus_indicators, alt_text
 */

import type { ACCScore } from "./types.js";

function clamp(v: number, min = 0, max = 10): number {
	return Math.max(min, Math.min(max, v));
}

// ---------------------------------------------------------------------------
// Dimension scorers
// ---------------------------------------------------------------------------

function scoreWCAGAACompliance(html: string): { score: number; issues: string[] } {
	const issues: string[] = [];
	let score = 4;

	// 1.3.1 Info and Relationships — semantic HTML
	const hasMain = /<main/i.test(html);
	const hasNav = /<nav/i.test(html);
	const hasArticle = /<article/i.test(html);
	if (hasMain && hasNav) score += 2;
	else {
		if (!hasMain) issues.push("WCAG 1.3.1: Missing <main> landmark.");
		if (!hasNav) issues.push("WCAG 1.3.1: Missing <nav> landmark.");
	}
	if (hasArticle) score += 0.5;

	// 2.4.2 Page Titled
	const hasTitle = /<title>[^<]{3,}<\/title>/i.test(html);
	if (hasTitle) score += 1;
	else issues.push("WCAG 2.4.2: Missing or empty <title> element.");

	// 3.1.1 Language of Page
	const hasLang = /<html[^>]+lang=['"][a-z]{2}/i.test(html);
	if (hasLang) score += 1;
	else issues.push("WCAG 3.1.1: Missing lang attribute on <html>.");

	// 1.1.1 Non-text Content — img alt
	const imgTotal = (html.match(/<img/gi) ?? []).length;
	const imgWithAlt = (html.match(/<img[^>]+alt=/gi) ?? []).length;
	if (imgTotal > 0) {
		const altRatio = imgWithAlt / imgTotal;
		if (altRatio >= 0.9) score += 1.5;
		else issues.push(`WCAG 1.1.1: ${imgTotal - imgWithAlt} image(s) missing alt attribute.`);
	} else {
		score += 1.5; // no images, no issue
	}

	return { score: clamp(score), issues };
}

function scoreColorContrast(html: string, css: string): { score: number; issues: string[] } {
	const issues: string[] = [];
	let score = 5;

	// Can't run real contrast calculations without rendering, but we can
	// look for anti-patterns and positive signals

	// Positive: explicit color + background-color pairs
	const hasColorPairs = /color\s*:[^;]+;[\s\S]{0,200}background(?:-color)?\s*:/i.test(css);
	if (hasColorPairs) score += 1.5;

	// Positive: CSS custom properties for color (suggests a design system)
	const colorVarCount = (css.match(/--(?:color|text|bg|foreground|background)[^:]*:/gi) ?? []).length;
	if (colorVarCount >= 4) score += 2;
	else if (colorVarCount >= 2) score += 1;
	else issues.push("Define a color system via CSS variables to manage contrast intentionally.");

	// Warning: light-on-light or dark-on-dark patterns (simplified heuristic)
	const hasWhiteOnWhite = /#fff.*color.*#fff|white.*color.*white/i.test(css);
	if (hasWhiteOnWhite) score -= 2;

	// Positive: dark mode support (usually means color has been thought about)
	const hasDarkMode = /prefers-color-scheme\s*:\s*dark/i.test(css);
	if (hasDarkMode) score += 1.5;
	else issues.push("Consider adding dark mode support with prefers-color-scheme.");

	// Check for placeholder-only contrast (common issue)
	const hasPlaceholderColor = /::placeholder\s*\{[^}]*color/i.test(css);
	if (!hasPlaceholderColor) issues.push("WCAG 1.4.3: Ensure placeholder text meets 4.5:1 contrast ratio.");

	// Silence unused variable reference warning
	void html;

	return { score: clamp(score), issues };
}

function scoreKeyboardNav(html: string, css: string): { score: number; issues: string[] } {
	const issues: string[] = [];
	let score = 4;

	// tabindex usage
	const hasTabindex = /tabindex=/i.test(html);
	if (hasTabindex) {
		// Check for tabindex > 0 anti-pattern
		const hasPositiveTabindex = /tabindex=['"]?[1-9]/i.test(html);
		if (hasPositiveTabindex) {
			issues.push("WCAG 2.4.3: Avoid tabindex > 0; it disrupts natural focus order.");
			score += 0.5;
		} else {
			score += 1.5;
		}
	}

	// Semantic interactive elements (inherently keyboard accessible)
	const hasSemanticButtons = /<button/i.test(html);
	const hasSemanticLinks = /<a\s/i.test(html);
	const hasSemanticInputs = /<input|<select|<textarea/i.test(html);
	if (hasSemanticButtons) score += 1;
	if (hasSemanticLinks) score += 1;
	if (hasSemanticInputs) score += 1;

	// Skip link
	const hasSkipLink = /skip.*(?:to\s+)?(?:main|content)|#main-content|#content/i.test(html);
	if (hasSkipLink) score += 2;
	else issues.push("WCAG 2.4.1: Add a 'Skip to main content' link for keyboard users.");

	// No pointer-events: none on interactive elements (rough check)
	const hasPointerNoneOnButton = /button[^{]*\{[^}]*pointer-events\s*:\s*none/i.test(css);
	if (hasPointerNoneOnButton) {
		issues.push("Do not set pointer-events: none on <button> elements.");
		score -= 1;
	}

	return { score: clamp(score), issues };
}

function scoreScreenReader(html: string): { score: number; issues: string[] } {
	const issues: string[] = [];
	let score = 4;

	// ARIA labels
	const hasAriaLabel = /aria-label=/i.test(html);
	const hasAriaLabelledby = /aria-labelledby=/i.test(html);
	const hasAriaDescribedby = /aria-describedby=/i.test(html);
	if (hasAriaLabel) score += 1.5;
	else issues.push("WCAG 4.1.2: Use aria-label on icon-only buttons and ambiguous interactive elements.");
	if (hasAriaLabelledby) score += 1;
	if (hasAriaDescribedby) score += 0.5;

	// aria-live for dynamic content
	const hasAriaLive = /aria-live=/i.test(html);
	if (hasAriaLive) score += 1.5;
	else issues.push("WCAG 4.1.3: Use aria-live regions for dynamic content updates.");

	// Visually hidden (sr-only) utility class
	const hasSrOnly = /sr-only|visually-hidden|screen-reader-only/i.test(html);
	if (hasSrOnly) score += 1.5;
	else issues.push("Add a .sr-only / visually-hidden utility class for screen reader-only text.");

	// Role attributes
	const hasRoles = /\brole=/i.test(html);
	if (hasRoles) score += 1;

	return { score: clamp(score), issues };
}

function scoreFocusIndicators(css: string): { score: number; issues: string[] } {
	const issues: string[] = [];
	let score = 3;

	// :focus-visible
	const hasFocusVisible = /:focus-visible/i.test(css);
	if (hasFocusVisible) score += 3;
	else issues.push("WCAG 2.4.11: Style :focus-visible for visible keyboard focus indicators.");

	// :focus (legacy)
	const hasFocus = /\s:focus\s*\{/i.test(css);
	if (hasFocus) score += 1.5;

	// outline: none without replacement (anti-pattern)
	const hasOutlineNone = /outline\s*:\s*(?:none|0)/i.test(css);
	const hasFocusOutline = /:focus[^{]*\{[^}]*outline/i.test(css);
	if (hasOutlineNone && !hasFocusOutline) {
		score -= 2;
		issues.push("WCAG 2.4.7: Do not remove focus outlines without providing a custom visible replacement.");
	}

	// box-shadow as focus indicator
	const hasFocusBoxShadow = /:focus[^{]*\{[^}]*box-shadow/i.test(css);
	if (hasFocusBoxShadow) score += 1.5;

	// focus ring color
	const hasFocusColor = /:focus[^{]*\{[^}]*(?:outline-color|ring)/i.test(css);
	if (hasFocusColor) score += 1;

	return { score: clamp(score), issues };
}

function scoreAltText(html: string): { score: number; issues: string[] } {
	const issues: string[] = [];

	const imgTags = html.match(/<img[^>]*>/gi) ?? [];
	if (imgTags.length === 0) {
		return { score: 10, issues: [] }; // No images — perfect score
	}

	const withAlt = imgTags.filter((tag) => /\balt=/i.test(tag));
	const withEmptyAlt = imgTags.filter((tag) => /\balt=['"]{2}/i.test(tag)); // decorative images
	const withMeaningfulAlt = withAlt.filter((tag) => !/\balt=['"]{2}/i.test(tag));

	const missingAlt = imgTags.length - withAlt.length;
	if (missingAlt > 0) {
		issues.push(`WCAG 1.1.1: ${missingAlt} image(s) are missing an alt attribute.`);
	}

	const score = clamp(
		Math.round(
			((withMeaningfulAlt.length + withEmptyAlt.length * 0.7) / imgTags.length) * 10,
		),
	);

	return { score, issues };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function calculateACCScore(htmlContent?: string, cssContent?: string): Promise<ACCScore> {
	const html = htmlContent ?? "";
	const css = cssContent ?? "";

	const wcag = scoreWCAGAACompliance(html);
	const contrast = scoreColorContrast(html, css);
	const keyboard = scoreKeyboardNav(html, css);
	const screenReader = scoreScreenReader(html);
	const focus = scoreFocusIndicators(css);
	const altText = scoreAltText(html);

	// Weighted average — all dimensions matter for ACC
	const weights = [0.25, 0.2, 0.15, 0.15, 0.15, 0.1];
	const scores = [wcag.score, contrast.score, keyboard.score, screenReader.score, focus.score, altText.score];
	const overall = clamp(scores.reduce((sum, s, i) => sum + s * weights[i], 0));

	return {
		wcag_aa_compliance: wcag.score,
		color_contrast: contrast.score,
		keyboard_nav: keyboard.score,
		screen_reader: screenReader.score,
		focus_indicators: focus.score,
		alt_text: altText.score,
		overall,
		pass: overall >= 8.0,
	};
}
