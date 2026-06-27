/**
 * Mercury reasoning effort mapping.
 * Maps ArchonX/Mercury mode tags to API reasoning_effort values.
 */

import type { MercuryMode, MercuryReasoningEffort, MercuryRouteTag } from "./mercury-types.js";

/**
 * Maps a Mercury reasoning effort level to the API string value.
 * "instant" is a Mercury-specific alias for "low" (fastest response).
 */
export function mapReasoningEffort(effort: MercuryReasoningEffort): string {
	if (effort === "instant") return "low";
	return effort;
}

/** Default reasoning effort per route tag. */
export const ROUTE_TAG_DEFAULTS: Record<MercuryRouteTag, MercuryReasoningEffort> = {
	"mercury-fast": "low",
	"mercury-voice": "instant",
	"mercury-diffusion": "low",
	"mercury-operator": "medium",
};

/** Default reasoning effort per interaction mode. */
export const MODE_DEFAULTS: Record<MercuryMode, MercuryReasoningEffort> = {
	clean: "low",
	voice: "instant",
	diffusion: "low",
	operator: "medium",
};

/**
 * Resolve the API-level reasoning_effort string for a given route tag or mode.
 * Explicit override wins over defaults.
 */
export function resolveReasoningEffort(options: {
	explicit?: MercuryReasoningEffort;
	routeTag?: MercuryRouteTag;
	mode?: MercuryMode;
}): string {
	if (options.explicit) return mapReasoningEffort(options.explicit);
	if (options.routeTag) return mapReasoningEffort(ROUTE_TAG_DEFAULTS[options.routeTag]);
	if (options.mode) return mapReasoningEffort(MODE_DEFAULTS[options.mode]);
	return "low";
}

/** Returns whether diffusion mode is enabled for a given route tag. */
export function isMercuryDiffusionEnabled(routeTag: MercuryRouteTag): boolean {
	return (
		routeTag === "mercury-diffusion" ||
		(process.env.MERCURY_DIFFUSION_ENABLED === "true" && routeTag !== "mercury-voice")
	);
}
