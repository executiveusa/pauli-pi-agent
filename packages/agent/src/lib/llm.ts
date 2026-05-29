import OpenAI from "openai";

export const PROXY_URL = process.env.LLM_PROXY_URL ?? "http://localhost:8082";
export const PROXY_TOKEN = process.env.LLM_PROXY_TOKEN ?? "freecc";
export const PROXY_ENABLED = process.env.LLM_PROXY_ENABLED !== "false";

export type TaskType =
	| "reasoning"
	| "code"
	| "fast"
	| "balanced"
	| "long-context"
	| "vision"
	| "github-free"
	| "default";

export interface LLMMessage {
	role: "user" | "assistant" | "system";
	content: string;
}

interface RouteConfig {
	model: string;
	direct?: boolean;
	provider?: string;
	apiKeyEnv?: string;
	maxTokens: number;
}

const TASK_ROUTES: Record<TaskType, RouteConfig> = {
	reasoning: { model: "claude-opus-4-5", maxTokens: 8192 },
	code: { model: "claude-haiku-4-5", maxTokens: 4096 },
	fast: { model: "claude-haiku-4-5", maxTokens: 2048 },
	balanced: { model: "claude-sonnet-4-5", maxTokens: 4096 },
	"long-context": {
		model: "gemini-2.5-flash",
		direct: true,
		provider: "https://generativelanguage.googleapis.com/v1beta/openai",
		apiKeyEnv: "GEMINI_API_KEY",
		maxTokens: 32768,
	},
	vision: {
		model: "gemini-2.5-flash",
		direct: true,
		provider: "https://generativelanguage.googleapis.com/v1beta/openai",
		apiKeyEnv: "GEMINI_API_KEY",
		maxTokens: 8192,
	},
	"github-free": {
		model: "gpt-4.1-mini",
		direct: true,
		provider: "https://models.github.ai/inference",
		apiKeyEnv: "GITHUB_TOKEN",
		maxTokens: 4096,
	},
	default: { model: "claude-sonnet-4-5", maxTokens: 4096 },
};

function env(name: string): string | undefined {
	const value = process.env[name];
	return value?.trim() ? value : undefined;
}

function makeClient(route: RouteConfig, proxyEnabled: boolean): OpenAI {
	if (route.direct || !proxyEnabled) {
		const apiKey = route.apiKeyEnv ? env(route.apiKeyEnv) : env("OPENAI_API_KEY");
		if (!apiKey) {
			throw new Error(`Missing API key env: ${route.apiKeyEnv ?? "OPENAI_API_KEY"}`);
		}
		return new OpenAI({
			baseURL: route.provider,
			apiKey,
		});
	}

	return new OpenAI({
		baseURL: `${PROXY_URL}/v1`,
		apiKey: PROXY_TOKEN,
		defaultHeaders: { "anthropic-version": "2023-06-01" },
	});
}

export interface LLMOptions {
	task?: TaskType;
	systemPrompt?: string;
	maxTokens?: number;
	temperature?: number;
	stream?: boolean;
	proxyOverride?: boolean;
}

export async function llmChat(messages: LLMMessage[], opts: LLMOptions = {}): Promise<string> {
	const task = opts.task ?? "default";
	const route = TASK_ROUTES[task];
	const useProxy = opts.proxyOverride ?? PROXY_ENABLED;
	const client = makeClient(route, useProxy);
	const allMessages = opts.systemPrompt
		? [{ role: "system" as const, content: opts.systemPrompt }, ...messages]
		: messages;

	const resp = await client.chat.completions.create({
		model: route.model,
		messages: allMessages as any,
		max_tokens: opts.maxTokens ?? route.maxTokens,
		temperature: opts.temperature ?? 0.7,
		stream: false,
	});

	return resp.choices?.[0]?.message?.content ?? "";
}

export async function* llmStream(messages: LLMMessage[], opts: LLMOptions = {}): AsyncGenerator<string> {
	const task = opts.task ?? "default";
	const route = TASK_ROUTES[task];
	const useProxy = opts.proxyOverride ?? PROXY_ENABLED;
	const client = makeClient(route, useProxy);
	const allMessages = opts.systemPrompt
		? [{ role: "system" as const, content: opts.systemPrompt }, ...messages]
		: messages;

	const stream = await client.chat.completions.create({
		model: route.model,
		messages: allMessages as any,
		max_tokens: opts.maxTokens ?? route.maxTokens,
		temperature: opts.temperature ?? 0.7,
		stream: true,
	});

	for await (const chunk of stream) {
		const delta = chunk.choices?.[0]?.delta?.content;
		if (delta) yield delta;
	}
}

export const ask = (q: string, task: TaskType = "default") => llmChat([{ role: "user", content: q }], { task });

export const codeReview = (code: string) =>
	llmChat([{ role: "user", content: `Review this code:\n\`\`\`\n${code}\n\`\`\` \n` }], { task: "code" });

export const summarize = (text: string) =>
	llmChat([{ role: "user", content: `Summarize concisely:\n${text}` }], {
		task: "fast",
	});

export const analyze = (text: string) => llmChat([{ role: "user", content: text }], { task: "reasoning" });
