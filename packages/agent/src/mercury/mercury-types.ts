/**
 * Mercury 2 type definitions.
 * Mercury 2 is Inception Labs' diffusion-based fast reasoning model,
 * accessed through the OpenAI-compatible chat completions API.
 */

/** Which interaction mode the Mercury agent is operating in. */
export type MercuryMode = "clean" | "voice" | "diffusion" | "operator";

/**
 * Mercury reasoning effort levels.
 * "instant" is a Mercury-specific level mapped to "low" for the API.
 */
export type MercuryReasoningEffort = "instant" | "low" | "medium" | "high";

/** Route tag used for model selection and routing decisions. */
export type MercuryRouteTag = "mercury-fast" | "mercury-voice" | "mercury-diffusion" | "mercury-operator";

/** Options specific to Mercury stream calls. */
export interface MercuryCallOptions {
	/** Whether to enable diffusion mode (visual in-place refinement). */
	diffusing?: boolean;
	/** Reasoning effort level. Maps to API reasoning_effort param. */
	reasoningEffort?: MercuryReasoningEffort;
	/** Tenant ID for usage logging and permission checks. */
	tenantId?: string;
	/** Session ID for continuity. */
	sessionId?: string;
	/** Abort signal for cancellation. */
	signal?: AbortSignal;
	/** API key override (INCEPTION_API_KEY from server env). */
	apiKey?: string;
	/** Max tokens cap. */
	maxTokens?: number;
}

/** Metadata attached to a Mercury response for usage tracking. */
export interface MercuryResponseMeta {
	tenantId?: string;
	sessionId?: string;
	mode: MercuryMode;
	routeTag: MercuryRouteTag;
	diffusionEnabled: boolean;
	reasoningEffort: string;
	latencyMs?: number;
}
