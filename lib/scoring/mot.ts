/**
 * MOT Score Calculator — Moment of Truth
 *
 * Evaluates the critical first-impression metrics that determine
 * whether a visitor converts or bounces within the first 3 seconds.
 */

import type { MOTScore } from "./types.js";

function clamp(v: number, min = 0, max = 10): number {
	return Math.max(min, Math.min(max, v));
}

// ---------------------------------------------------------------------------
// Dimension scorers
// ---------------------------------------------------------------------------

function scorePrimaryValueClear(html: string): { score: number } {
	// Check for above-the-fold value proposition signals
	const hasH1 = /<h1[^>]*>[^<]{10,}/i.test(html);
	const hasHero = /hero|headline|tagline|value-prop|value_prop|pitch/i.test(html);
	const hasCtaAboveFold = /<(?:button|a)[^>]*(?:cta|get-started|sign-up|try|start|join|buy|order)[^>]*>/i.test(html);
	const hasBenefits = /benefit|feature|why\s+us|how\s+it\s+works|what\s+you\s+get/i.test(html);

	let score = 3;
	if (hasH1) score += 2;
	if (hasHero) score += 1.5;
	if (hasCtaAboveFold) score += 1.5;
	if (hasBenefits) score += 2;

	return { score: clamp(score) };
}

function scoreLoadTime(url: string): { score: number } {
	// Without running the browser, we estimate based on URL signals
	// Real implementation would use performance.timing from browser validation
	// Scoring heuristic: assume reasonable load time unless URL signals heavy frameworks
	const isVercel = url.includes("vercel.app") || url.includes(".vercel.com");
	const isNetlify = url.includes("netlify.app");
	const isCDN = isVercel || isNetlify || url.includes("cloudflare") || url.includes("fastly");

	let score = 6; // baseline: moderate
	if (isCDN) score = 8; // CDN-hosted sites tend to be fast
	if (url.startsWith("https://")) score += 0.5;

	return { score: clamp(score) };
}

function scoreFirstActionClarity(html: string): { score: number } {
	// Is there a clear, prominent CTA?
	const ctaCount = (html.match(/<(?:button|a)[^>]*(?:cta|primary|btn-primary|btn-main|get-started|sign-up|try|start|join|buy|order|demo|free)[^>]*>/gi) ?? []).length;
	const hasForm = /<form/i.test(html);
	const hasEmailInput = /<input[^>]*type=['"]?email['"]?/i.test(html);
	const hasSubmit = /<(?:button|input)[^>]*(?:type=['"]?submit['"]?|class=['"][^'"]*submit)/i.test(html);

	let score = 4;
	if (ctaCount >= 1) score += 2;
	if (ctaCount >= 2) score += 1;
	if (hasForm && hasEmailInput && hasSubmit) score += 2;
	else if (hasForm) score += 1;

	return { score: clamp(score) };
}

function scoreTrustSignals(html: string): { score: number } {
	const hasLogo = /logo|brand/i.test(html);
	const hasHttpsLinks = /https:\/\//i.test(html);
	const hasSecure = /secure|ssl|encrypt|protected|safe/i.test(html);
	const hasPrivacy = /privacy\s*policy|terms\s*(?:of\s*(?:service|use))/i.test(html);
	const hasAbout = /about\s*us|our\s*team|who\s*we\s*are/i.test(html);
	const hasContact = /contact|support|help@|info@/i.test(html);
	const hasMoney = /money.back|guarantee|refund|risk.free|no.credit.card/i.test(html);

	let score = 2;
	if (hasLogo) score += 1;
	if (hasHttpsLinks) score += 0.5;
	if (hasSecure) score += 1;
	if (hasPrivacy) score += 1.5;
	if (hasAbout) score += 1;
	if (hasContact) score += 1;
	if (hasMoney) score += 2;

	return { score: clamp(score) };
}

function scoreSocialProof(html: string): { score: number } {
	const hasTestimonials = /testimonial|review|said|quote|saying/i.test(html);
	const hasRatings = /stars?|rating|\d+\/5|\d+\.\d+\/5|⭐/i.test(html);
	const hasUserCount = /\d[\d,]*\s*(?:user|customer|member|business|team|company|startup|developer)/i.test(html);
	const hasLogos = /trusted\s*by|used\s*by|as\s*seen\s*in|featured\s*in|partner/i.test(html);
	const hasAvatars = /avatar|headshot|profile.*photo|user.*image/i.test(html);

	let score = 2;
	if (hasTestimonials) score += 2;
	if (hasRatings) score += 2;
	if (hasUserCount) score += 2;
	if (hasLogos) score += 1.5;
	if (hasAvatars) score += 0.5;

	return { score: clamp(score) };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function calculateMOTScore(url: string, htmlContent?: string): Promise<MOTScore> {
	const html = htmlContent ?? "";

	const primaryValue = scorePrimaryValueClear(html);
	const loadTime = scoreLoadTime(url);
	const firstAction = scoreFirstActionClarity(html);
	const trust = scoreTrustSignals(html);
	const social = scoreSocialProof(html);

	const scores = [primaryValue.score, loadTime.score, firstAction.score, trust.score, social.score];

	// Weighted average: primary_value and first_action are most critical
	const weights = [0.25, 0.2, 0.25, 0.15, 0.15];
	const overall = clamp(scores.reduce((sum, s, i) => sum + s * weights[i], 0));

	return {
		primary_value_clear: primaryValue.score,
		load_time_score: loadTime.score,
		first_action_clarity: firstAction.score,
		trust_signals: trust.score,
		social_proof: social.score,
		overall,
		pass: overall >= 7.5,
	};
}
