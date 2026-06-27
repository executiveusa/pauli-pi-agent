/**
 * Smart Model Router — cost-aware model selection for the Pi Web UI.
 *
 * GOAL: Use FREE models for mechanical tool calls, GLM-5.2 for big tasks,
 * and AVOID expensive models (Opus, GPT-5.5) unless explicitly requested.
 *
 * Provider priority (cheapest first):
 *   1. Groq Llama (free, fast)        — fast/code lanes
 *   2. Gemini Flash (free, capable)   — vision/long-context lanes
 *   3. GLM-5.2 via Z.AI (cheap, 1M ctx) — reasoning/big-task lane
 *   4. OpenRouter :free models        — fallback free tier
 *   5. DeepSeek (free coding)         — code lane alternative
 *
 * AVOID by default (expensive):
 *   - Claude Opus (use GLM-5.2 instead)
 *   - GPT-5.5 (use GLM-5.2 or Claude Sonnet)
 */

import { getModel, getModels, type Model } from "@mariozechner/pi-ai";

export type TaskLane = "fast" | "code" | "balanced" | "reasoning" | "vision" | "long-context" | "big-task";

export interface RouteResult {
	model: Model<any>;
	provider: string;
	reason: string;
	free: boolean;
	estimatedCostPer1k: number;
}

export function pickModel(lane: TaskLane): RouteResult {
	const has = (env: string) => {
		try {
			return Boolean((import.meta.env as Record<string, string | undefined>)[env] ?? process?.env?.[env]);
		} catch {
			return false;
		}
	};

	const hasGroq = has("VITE_GROQ_API_KEY") || has("GROQ_API_KEY");
	const hasGoogle = has("VITE_GOOGLE_API_KEY") || has("GOOGLE_API_KEY") || has("GEMINI_API_KEY");
	const hasOpenRouter = has("VITE_OPEN_ROUTER_API") || has("OPEN_ROUTER_API") || has("OPENROUTER_API_KEY");
	const hasGLM = has("VITE_GLM_API_KEY") || has("GLM_API_KEY") || has("ZAI_API_KEY");
	const hasDeepSeek = has("VITE_DEEPSEEK_API_KEY") || has("DEEPSEEK_API_KEY");

	// 1. Fast lane — Groq Llama (free, very fast)
	if (lane === "fast") {
		if (hasGroq) {
			return {
				model: getModel("groq", "llama-3.3-70b-versatile"),
				provider: "groq",
				reason: "free + fast",
				free: true,
				estimatedCostPer1k: 0,
			};
		}
		if (hasGoogle) {
			return {
				model: getModel("google", "gemini-2.5-flash"),
				provider: "google",
				reason: "free + capable",
				free: true,
				estimatedCostPer1k: 0,
			};
		}
		if (hasOpenRouter) {
			return {
				model: getModel("openrouter", "meta-llama/llama-3.3-70b-instruct:free"),
				provider: "openrouter",
				reason: "free via OpenRouter",
				free: true,
				estimatedCostPer1k: 0,
			};
		}
	}

	// 2. Code lane — DeepSeek (free coding) or Groq Llama
	if (lane === "code") {
		if (hasDeepSeek) {
			return {
				model: getModel("openrouter", "deepseek/deepseek-coder:free"),
				provider: "openrouter",
				reason: "free coding model",
				free: true,
				estimatedCostPer1k: 0,
			};
		}
		if (hasGroq) {
			return {
				model: getModel("groq", "llama-3.3-70b-versatile"),
				provider: "groq",
				reason: "free + fast code",
				free: true,
				estimatedCostPer1k: 0,
			};
		}
		if (hasGoogle) {
			return {
				model: getModel("google", "gemini-2.5-flash"),
				provider: "google",
				reason: "free + capable",
				free: true,
				estimatedCostPer1k: 0,
			};
		}
	}

	// 3. Vision lane — Gemini Flash (free vision)
	if (lane === "vision") {
		if (hasGoogle) {
			return {
				model: getModel("google", "gemini-2.5-flash"),
				provider: "google",
				reason: "free vision",
				free: true,
				estimatedCostPer1k: 0,
			};
		}
	}

	// 4. Long-context lane — Gemini Flash (1M context, free) or GLM-5.2
	if (lane === "long-context") {
		if (hasGoogle) {
			return {
				model: getModel("google", "gemini-2.5-flash"),
				provider: "google",
				reason: "free 1M context",
				free: true,
				estimatedCostPer1k: 0,
			};
		}
		if (hasGLM) {
			return {
				model: getModel("zai", "glm-5.2"),
				provider: "zai",
				reason: "1M context, cheap",
				free: false,
				estimatedCostPer1k: 0.0014,
			};
		}
	}

	// 5. Balanced lane — GLM-5.2 (cheap, long-horizon coding)
	if (lane === "balanced") {
		if (hasGLM) {
			return {
				model: getModel("zai", "glm-5.2"),
				provider: "zai",
				reason: "cheap long-horizon coding",
				free: false,
				estimatedCostPer1k: 0.0014,
			};
		}
		if (hasOpenRouter) {
			return {
				model: getModel("openrouter", "mistralai/mistral-small"),
				provider: "openrouter",
				reason: "cheap via OpenRouter",
				free: false,
				estimatedCostPer1k: 0.002,
			};
		}
	}

	// 6. Reasoning / big-task lane — GLM-5.2 (AVOID Opus, GPT-5.5)
	if (lane === "reasoning" || lane === "big-task") {
		if (hasGLM) {
			return {
				model: getModel("zai", "glm-5.2"),
				provider: "zai",
				reason: "big-task: GLM-5.2 (avoids Opus/GPT-5.5)",
				free: false,
				estimatedCostPer1k: 0.0014,
			};
		}
		return {
			model: getModel("anthropic", "claude-sonnet-4-6"),
			provider: "anthropic",
			reason: "fallback (Sonnet, not Opus)",
			free: false,
			estimatedCostPer1k: 0.012,
		};
	}

	// 7. Fallback — Claude Sonnet (NOT Opus, NOT GPT-5.5)
	return {
		model: getModel("anthropic", "claude-sonnet-4-6"),
		provider: "anthropic",
		reason: "default fallback (Sonnet)",
		free: false,
		estimatedCostPer1k: 0.012,
	};
}

export function listFreeModels(): Array<{ provider: string; id: string; name: string }> {
	const free: Array<{ provider: string; id: string; name: string }> = [];
	try {
		for (const m of getModels("google")) {
			if (m.id.includes("flash")) free.push({ provider: "google", id: m.id, name: m.name });
		}
	} catch {
		/* ignore */
	}
	try {
		for (const m of getModels("groq")) {
			free.push({ provider: "groq", id: m.id, name: m.name });
		}
	} catch {
		/* ignore */
	}
	return free;
}

// ============================================================
// TOKEN BUDGET TRACKER — warns when approaching model context limits
// ============================================================

export interface TokenBudget {
	model: string;
	maxContext: number;
	used: number;
	remaining: number;
	percentUsed: number;
	warningLevel: "safe" | "warn" | "critical";
}

const MODEL_CONTEXT_LIMITS: Record<string, number> = {
	"llama-3.3-70b-versatile": 128000,
	"gemini-2.5-flash": 1000000,
	"gemini-2.0-flash": 1000000,
	"meta-llama/llama-3.3-70b-instruct:free": 128000,
	"deepseek/deepseek-coder:free": 128000,
	"glm-5.2": 1000000,
	"claude-sonnet-4-6": 200000,
	"claude-opus-4-5": 200000,
};

export function getTokenBudget(modelId: string, usedTokens: number): TokenBudget {
	const maxContext = MODEL_CONTEXT_LIMITS[modelId] ?? 128000;
	const remaining = Math.max(0, maxContext - usedTokens);
	const percentUsed = (usedTokens / maxContext) * 100;
	let warningLevel: "safe" | "warn" | "critical" = "safe";
	if (percentUsed >= 90) warningLevel = "critical";
	else if (percentUsed >= 75) warningLevel = "warn";
	return { model: modelId, maxContext, used: usedTokens, remaining, percentUsed, warningLevel };
}
