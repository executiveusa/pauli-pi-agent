/**
 * Mercury routing and streaming
 */

import type { Context } from "@mariozechner/pi-ai";
import { streamMercury as streamMercuryCore } from "../mercury/mercury-stream.js";
import type { MercuryRouteTag } from "../mercury/mercury-types.js";

export interface MercuryStreamOptions {
	tenantId: string;
	routeTag?: MercuryRouteTag;
	maxTokens?: number;
	apiKey?: string;
	diffusing?: boolean;
	reasoningEffort?: "instant" | "low" | "medium" | "high";
}

/**
 * Stream Mercury response with proper routing and tenant configuration
 */
export async function streamMercury(context: Context, options: MercuryStreamOptions): Promise<AsyncIterable<unknown>> {
	const routeTag = options.routeTag ?? "mercury-fast";
	const apiKey = options.apiKey || process.env.INCEPTION_API_KEY;

	if (!apiKey) {
		throw new Error("INCEPTION_API_KEY not configured");
	}

	return streamMercuryCore(context, {
		apiKey,
		maxTokens: options.maxTokens,
		reasoningEffort: options.reasoningEffort,
		routeTag: routeTag as MercuryRouteTag,
		diffusing: options.diffusing,
		signal: undefined,
	});
}

/**
 * Map tenant plan to default Mercury route tag
 */
export function getPlanDefaultRoute(plan: "clean" | "voice" | "mercury_diffusion"): MercuryRouteTag {
	switch (plan) {
		case "clean":
			return "mercury-fast";
		case "voice":
			return "mercury-voice";
		case "mercury_diffusion":
			return "mercury-diffusion";
		default:
			return "mercury-fast";
	}
}
