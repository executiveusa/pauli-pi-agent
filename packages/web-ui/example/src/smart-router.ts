/**
 * Smart Model Router — cost-aware model selection for the Pi Web UI.
 *
 * Goal: use FREE models for mechanical tool calls, expensive models only for
 * hard reasoning. This is the "cheap tool-calling tier" from the factory plan.
 *
 * Providers with free tiers (keys in Cosmos_Vault.env):
 *   - Google Gemini Flash  (GOOGLE_API_KEY)        — free, fast, vision
 *   - Groq Llama           (GROQ_API_KEY)          — free, very fast
 *   - OpenRouter :free     (OPEN_ROUTER_API)       — free tier models
 *   - HuggingFace          (HUGGINGFACE_API_KEY)   — free inference
 *
 * Routing logic:
 *   - "fast"      → Gemini Flash or Groq Llama (free)
 *   - "code"      → Gemini Flash or Groq Llama (free)
 *   - "balanced"  → OpenRouter auto (cheap)
 *   - "reasoning" → Claude Sonnet / GPT-5 (paid, reserved for hard tasks)
 *   - "vision"    → Gemini Flash (free vision)
 *   - "long-context" → Gemini 2.5 Flash (1M context, free)
 *
 * Usage:
 *   import { pickModel } from "./smart-router.js";
 *   const model = pickModel("fast"); // → free model
 *
 * The user can still override manually via the model selector in the UI.
 * This router only sets the DEFAULT; the UI selector wins once changed.
 */

import { getModel, getModels, type Model } from "@mariozechner/pi-ai";

export type TaskLane = "fast" | "code" | "balanced" | "reasoning" | "vision" | "long-context";

export interface RouteResult {
	model: Model<any>;
	provider: string;
	reason: string;
	free: boolean;
}

/**
 * Pick the best model for a task lane, preferring free tiers.
 * Falls back to a paid model if no free key is configured.
 */
export function pickModel(lane: TaskLane): RouteResult {
	const has = (env: string) => {
		try {
			return Boolean((import.meta.env as Record<string, string | undefined>)[env] ?? process?.env?.[env]);
		} catch {
			return false;
		}
	};

	const hasGoogle = has("VITE_GOOGLE_API_KEY") || has("GOOGLE_API_KEY");
	const hasGroq = has("VITE_GROQ_API_KEY") || has("GROQ_API_KEY");
	const hasOpenRouter = has("VITE_OPEN_ROUTER_API") || has("OPEN_ROUTER_API");

	// 1. Free lanes — prefer Groq for speed, Gemini for capability
	if (lane === "fast" || lane === "code") {
		if (hasGroq) {
			return {
				model: getModel("groq", "llama-3.3-70b-versatile"),
				provider: "groq",
				reason: "free + fast",
				free: true,
			};
		}
		if (hasGoogle) {
			return {
				model: getModel("google", "gemini-2.5-flash"),
				provider: "google",
				reason: "free + capable",
				free: true,
			};
		}
		if (hasOpenRouter) {
			return {
				model: getModel("openrouter", "meta-llama/llama-3.3-70b-instruct:free"),
				provider: "openrouter",
				reason: "free via OpenRouter",
				free: true,
			};
		}
	}

	if (lane === "vision") {
		if (hasGoogle) {
			return {
				model: getModel("google", "gemini-2.5-flash"),
				provider: "google",
				reason: "free vision",
				free: true,
			};
		}
		// Fall through to paid vision models
	}

	if (lane === "long-context") {
		if (hasGoogle) {
			return {
				model: getModel("google", "gemini-2.5-flash"),
				provider: "google",
				reason: "free 1M context",
				free: true,
			};
		}
	}

	if (lane === "balanced") {
		if (hasOpenRouter) {
			return {
				model: getModel("openrouter", "anthropic/claude-3.5-sonnet"),
				provider: "openrouter",
				reason: "cheap via OpenRouter",
				free: false,
			};
		}
	}

	// 2. Reasoning lane — paid, reserved for hard tasks
	if (lane === "reasoning") {
		return {
			model: getModel("anthropic", "claude-sonnet-4-6"),
			provider: "anthropic",
			reason: "hard reasoning",
			free: false,
		};
	}

	// 3. Fallback — whatever the user has configured
	return {
		model: getModel("anthropic", "claude-sonnet-4-6"),
		provider: "anthropic",
		reason: "default fallback",
		free: false,
	};
}

/**
 * List all available free models (for display in the UI).
 */
export function listFreeModels(): Array<{ provider: string; id: string; name: string }> {
	const free: Array<{ provider: string; id: string; name: string }> = [];
	try {
		const googleModels = getModels("google");
		for (const m of googleModels) {
			if (m.id.includes("flash")) {
				free.push({ provider: "google", id: m.id, name: m.name });
			}
		}
	} catch {
		/* ignore */
	}
	try {
		const groqModels = getModels("groq");
		for (const m of groqModels) {
			free.push({ provider: "groq", id: m.id, name: m.name });
		}
	} catch {
		/* ignore */
	}
	return free;
}
