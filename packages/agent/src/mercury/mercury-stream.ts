/**
 * Mercury stream functions.
 *
 * Wraps the existing openai-completions provider with Mercury-specific
 * payload extensions (diffusing, reasoning_effort) using the onPayload hook.
 *
 * Two output lanes:
 *   - Visual lane: full streaming output (including unstable diffusion text)
 *   - Voice lane: stability-gated output (speak only stable sentence chunks)
 *
 * SECURITY: This module runs server-side only. Never import from browser code.
 */

import type { AssistantMessageEventStream, Context } from "@mariozechner/pi-ai";
import { streamOpenAICompletions } from "@mariozechner/pi-ai";
import { getMercuryModel } from "./mercury-client.js";
import { isMercuryDiffusionEnabled, resolveReasoningEffort } from "./mercury-reasoning.js";
import type { MercuryCallOptions, MercuryRouteTag } from "./mercury-types.js";

/**
 * Build the Mercury-specific extra fields to inject into the API payload.
 * Uses the onPayload hook to avoid touching the core provider code.
 */
function buildMercuryPayloadExtension(options: {
	diffusing: boolean;
	reasoningEffort: string;
}): (payload: unknown) => unknown {
	return (payload: unknown): unknown => {
		const base = payload as Record<string, unknown>;
		const ext: Record<string, unknown> = {};

		if (options.diffusing) {
			ext.diffusing = true;
		}

		if (options.reasoningEffort) {
			// reasoning_effort is already set by buildParams when supportsReasoningEffort is true,
			// but we set it here as a fallback / explicit override for clarity.
			ext.reasoning_effort = options.reasoningEffort;
		}

		return { ...base, ...ext };
	};
}

/**
 * Stream a standard (non-diffusion) Mercury chat completion.
 * Suitable for clean text chat and voice (non-diffusion) responses.
 */
export function streamMercuryChat(
	context: Context,
	options: MercuryCallOptions & { routeTag?: MercuryRouteTag },
): AssistantMessageEventStream {
	const routeTag = options.routeTag ?? "mercury-fast";
	const model = getMercuryModel(routeTag);
	const reasoningEffort = resolveReasoningEffort({
		explicit: options.reasoningEffort,
		routeTag,
	});

	return streamOpenAICompletions(model, context, {
		apiKey: options.apiKey,
		signal: options.signal,
		maxTokens: options.maxTokens,
		reasoningEffort: reasoningEffort as "low" | "medium" | "high" | "minimal" | "xhigh",
		onPayload: buildMercuryPayloadExtension({ diffusing: false, reasoningEffort }),
	});
}

/**
 * Stream a diffusion Mercury chat completion.
 * Sends diffusing: true to the API. The visual lane receives the raw stream
 * (with potentially unstable in-progress text). The voice lane must use
 * the stability gate — never pipe raw diffusion output to TTS.
 */
export function streamMercuryDiffusion(context: Context, options: MercuryCallOptions): AssistantMessageEventStream {
	const model = getMercuryModel("mercury-diffusion");
	const reasoningEffort = resolveReasoningEffort({
		explicit: options.reasoningEffort,
		routeTag: "mercury-diffusion",
	});

	return streamOpenAICompletions(model, context, {
		apiKey: options.apiKey,
		signal: options.signal,
		maxTokens: options.maxTokens,
		reasoningEffort: reasoningEffort as "low" | "medium" | "high" | "minimal" | "xhigh",
		onPayload: buildMercuryPayloadExtension({ diffusing: true, reasoningEffort }),
	});
}

/**
 * Select the appropriate Mercury stream function based on route tag.
 * Returns streamMercuryDiffusion for mercury-diffusion route,
 * streamMercuryChat for all other routes.
 */
export function streamMercury(
	context: Context,
	options: MercuryCallOptions & { routeTag?: MercuryRouteTag },
): AssistantMessageEventStream {
	const routeTag = options.routeTag ?? "mercury-fast";
	const diffusion = isMercuryDiffusionEnabled(routeTag) || options.diffusing === true;

	if (diffusion) {
		return streamMercuryDiffusion(context, options);
	}
	return streamMercuryChat(context, { ...options, routeTag });
}

/**
 * Build a full Mercury API payload object for inspection or logging.
 * Does NOT make any network calls.
 */
export function buildMercuryPayload(options: {
	messages: Context["messages"];
	systemPrompt?: string;
	diffusing?: boolean;
	reasoningEffort?: string;
	maxTokens?: number;
	model?: string;
}): Record<string, unknown> {
	return {
		model: options.model ?? process.env.MERCURY_MODEL ?? "mercury-2",
		messages: options.messages,
		stream: true,
		...(options.diffusing ? { diffusing: true } : {}),
		...(options.reasoningEffort ? { reasoning_effort: options.reasoningEffort } : {}),
		...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
		stream_options: { include_usage: true },
	};
}
