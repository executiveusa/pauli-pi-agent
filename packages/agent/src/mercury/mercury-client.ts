/**
 * Mercury 2 client — model definitions and factory.
 *
 * Mercury 2 is accessed through the OpenAI-compatible chat completions API
 * at https://api.inceptionlabs.ai/v1. No new provider registration is needed;
 * the existing openai-completions provider handles it once the model object
 * carries api: "openai-completions" and provider: "inception".
 *
 * SECURITY: INCEPTION_API_KEY is resolved server-side only via env-api-keys.
 * It must never be passed to browser code.
 */

import type { Model } from "@mariozechner/pi-ai";
import type { MercuryRouteTag } from "./mercury-types.js";

const MERCURY_BASE_URL = process.env.MERCURY_BASE_URL ?? "https://api.inceptionlabs.ai/v1";
const MERCURY_MODEL_ID = process.env.MERCURY_MODEL ?? "mercury-2";

/**
 * Creates a Mercury 2 model definition for the pi-ai unified model system.
 * Uses "openai-completions" api type with the inception provider.
 */
export function createMercuryModel(overrides?: Partial<Model<"openai-completions">>): Model<"openai-completions"> {
	return {
		id: MERCURY_MODEL_ID,
		name: "Mercury 2",
		api: "openai-completions",
		provider: "inception",
		baseUrl: MERCURY_BASE_URL,
		reasoning: true,
		input: ["text"],
		cost: {
			// Pricing TBD by Inception Labs; set to 0 until official rates published
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
		},
		contextWindow: 32768,
		maxTokens: 8192,
		compat: {
			// Mercury is not standard OpenAI — disable OpenAI-specific fields
			supportsStore: false,
			supportsDeveloperRole: false,
			supportsReasoningEffort: true,
			supportsUsageInStreaming: true,
			// Mercury uses max_tokens (not max_completion_tokens)
			maxTokensField: "max_tokens",
			requiresToolResultName: false,
			requiresAssistantAfterToolResult: false,
			requiresThinkingAsText: false,
			supportsStrictMode: false,
		},
		...overrides,
	};
}

/** Pre-built model instances for each Mercury route tag. */
export const MERCURY_MODELS: Record<MercuryRouteTag, Model<"openai-completions">> = {
	"mercury-fast": createMercuryModel(),
	"mercury-voice": createMercuryModel(),
	"mercury-diffusion": createMercuryModel(),
	"mercury-operator": createMercuryModel(),
};

/** Returns the Mercury model for a given route tag. */
export function getMercuryModel(routeTag: MercuryRouteTag): Model<"openai-completions"> {
	return MERCURY_MODELS[routeTag] ?? createMercuryModel();
}
