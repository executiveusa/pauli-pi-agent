/**
 * Scoring — Public API
 *
 * Calculates UDEC, MOT, and ACC scores for a project or URL.
 * Also exposes a composite `calculateOverallScore` that weights all three.
 */

export * from "./types.js";
export { calculateUDECScore } from "./udec.js";
export { calculateMOTScore } from "./mot.js";
export { calculateACCScore } from "./acc.js";

import { calculateUDECScore } from "./udec.js";
import { calculateMOTScore } from "./mot.js";
import { calculateACCScore } from "./acc.js";
import type { OverallScore } from "./types.js";

function toGrade(score: number): "A" | "B" | "C" | "D" | "F" {
	if (score >= 9.0) return "A";
	if (score >= 8.0) return "B";
	if (score >= 7.0) return "C";
	if (score >= 6.0) return "D";
	return "F";
}

/**
 * Run all three scoring passes and return a composite OverallScore.
 *
 * @param projectPath - Filesystem path to the project root
 * @param url         - Deployed URL (used for MOT load-time heuristics)
 * @param htmlContent - Optional pre-fetched HTML (avoids disk I/O for HTML in some scorers)
 * @param cssContent  - Optional pre-fetched CSS content
 */
export async function calculateOverallScore(
	projectPath: string,
	url: string,
	htmlContent?: string,
	cssContent?: string,
): Promise<OverallScore> {
	const [udec, mot, acc] = await Promise.all([
		calculateUDECScore(projectPath, htmlContent),
		calculateMOTScore(url, htmlContent),
		calculateACCScore(htmlContent, cssContent),
	]);

	// Weighted composite: UDEC 40%, MOT 30%, ACC 30%
	const overall = udec.overall * 0.4 + mot.overall * 0.3 + acc.overall * 0.3;

	const pass = udec.pass && mot.pass && acc.pass;

	return {
		udec,
		mot,
		acc,
		overall,
		grade: toGrade(overall),
		pass,
		auto_rebuild_required: !pass || overall < 7.0,
	};
}
