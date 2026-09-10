/**
 * Mercury Voice Chatbot API Routes
 *
 * Provides REST endpoints for:
 * - /v1/agent/chat - Chat completions (supports Mercury routing)
 * - /v1/agent/voice/transcribe - Speech-to-text
 * - /v1/agent/voice/speak - Text-to-speech
 * - /v1/agent/tool-call - Permission-gated tool execution
 * - /v1/tenant/config - Public tenant configuration
 * - /v1/tenant/usage - Usage metrics and billing
 * - /api/terabithia/invoke - canonical Terabithia personal mission entrypoint
 * - /health - Pi fleet health
 *
 * SECURITY: All API keys are resolved server-side. No secrets exposed to browser.
 */

import type { Context } from "@mariozechner/pi-ai";
import {
	canExecuteTool,
	canUseFeature,
	getTenantConfig,
	getTenantPublicConfig,
	getTenantUsage,
	moneyMovementRequiresApproval,
} from "../tenants/tenant-config.js";
import { streamMercury } from "./mercury-routes.js";
import { handleVoiceSpeak, handleVoiceTranscribe } from "./voice-routes.js";

export interface ApiRequest {
	method: "GET" | "POST" | "PUT" | "DELETE";
	path: string;
	body?: Record<string, unknown>;
	headers?: Record<string, string>;
	query?: Record<string, string>;
}

export interface ApiResponse {
	statusCode: number;
	body: unknown;
	headers?: Record<string, string>;
}

/** POST /v1/agent/chat - Stream chat completions with Mercury routing */
export async function handleChat(req: ApiRequest): Promise<ApiResponse> {
	try {
		const { tenantId, messages, systemPrompt, maxTokens, routeTag } = req.body as {
			tenantId: string;
			messages: Array<{ role: "user" | "assistant"; content: string }>;
			systemPrompt?: string;
			maxTokens?: number;
			routeTag?: string;
		};
		if (!tenantId || !messages || messages.length === 0) {
			return { statusCode: 400, body: { error: "Missing required fields: tenantId, messages" } };
		}
		const tenant = getTenantConfig(tenantId);
		const route = routeTag || "mercury-fast";
		if (route.includes("diffusion") && !canUseFeature(tenant, "diffusion")) {
			return { statusCode: 403, body: { error: "Diffusion feature not available for this tenant plan" } };
		}
		if (route.includes("voice") && !canUseFeature(tenant, "voice")) {
			return { statusCode: 403, body: { error: "Voice feature not available for this tenant plan" } };
		}
		const normalizedMessages = messages.map((m) => {
			const msg: any = { ...m, timestamp: Date.now() };
			if (m.role === "assistant" && typeof m.content === "string") msg.content = [{ type: "text", text: m.content }];
			return msg;
		});
		const context: Context = { systemPrompt: systemPrompt || "You are a helpful assistant.", messages: normalizedMessages };
		return {
			statusCode: 200,
			body: {
				stream: true,
				data: await streamMercury(context, {
					tenantId,
					routeTag: route as any,
					maxTokens,
					apiKey: process.env.INCEPTION_API_KEY,
				}),
			},
		};
	} catch (error) {
		return { statusCode: 500, body: { error: error instanceof Error ? error.message : String(error) } };
	}
}

/** POST /v1/agent/voice/transcribe */
export async function handleTranscribe(req: ApiRequest): Promise<ApiResponse> {
	try {
		const { tenantId, audio, language } = req.body as { tenantId: string; audio: string; language?: string };
		if (!tenantId || !audio) return { statusCode: 400, body: { error: "Missing required fields: tenantId, audio" } };
		const tenant = getTenantConfig(tenantId);
		if (!canUseFeature(tenant, "voice")) return { statusCode: 403, body: { error: "Voice feature not available for this tenant plan" } };
		return {
			statusCode: 200,
			body: await handleVoiceTranscribe({ audio, language, apiKey: process.env.OPENAI_API_KEY }),
		};
	} catch (error) {
		return { statusCode: 500, body: { error: error instanceof Error ? error.message : String(error) } };
	}
}

/** POST /v1/agent/voice/speak */
export async function handleSpeak(req: ApiRequest): Promise<ApiResponse> {
	try {
		const { tenantId, text, voiceName } = req.body as { tenantId: string; text: string; voiceName?: string };
		if (!tenantId || !text) return { statusCode: 400, body: { error: "Missing required fields: tenantId, text" } };
		const tenant = getTenantConfig(tenantId);
		if (!canUseFeature(tenant, "voice")) return { statusCode: 403, body: { error: "Voice feature not available for this tenant plan" } };
		return {
			statusCode: 200,
			body: await handleVoiceSpeak({ text, voiceName: voiceName || tenant.branding?.voiceName || "shimmer", apiKey: process.env.OPENAI_API_KEY }),
			headers: { "Content-Type": "audio/mpeg" },
		};
	} catch (error) {
		return { statusCode: 500, body: { error: error instanceof Error ? error.message : String(error) } };
	}
}

/** POST /v1/agent/tool-call */
export async function handleToolCall(req: ApiRequest): Promise<ApiResponse> {
	try {
		const { tenantId, toolName, approvalToken } = req.body as { tenantId: string; toolName: string; approvalToken?: string };
		if (!tenantId || !toolName) return { statusCode: 400, body: { error: "Missing required fields: tenantId, toolName" } };
		const tenant = getTenantConfig(tenantId);
		if (toolName === "money-movement" && moneyMovementRequiresApproval(tenant) && !approvalToken) {
			return { statusCode: 202, body: { result: null, toolName, status: "pending", message: "Approval required for money movement" } };
		}
		if (!canExecuteTool(tenant, toolName)) return { statusCode: 403, body: { error: `Tool '${toolName}' not permitted for this tenant` } };
		return { statusCode: 200, body: { result: null, toolName, status: "executed" } };
	} catch (error) {
		return { statusCode: 500, body: { error: error instanceof Error ? error.message : String(error) } };
	}
}

/** GET /v1/tenant/config */
export async function getTenantConfigRoute(req: ApiRequest): Promise<ApiResponse> {
	try {
		const tenantId = req.query?.tenantId as string;
		if (!tenantId) return { statusCode: 400, body: { error: "Missing required query parameter: tenantId" } };
		return { statusCode: 200, body: getTenantPublicConfig(tenantId) };
	} catch (error) {
		return { statusCode: 500, body: { error: error instanceof Error ? error.message : String(error) } };
	}
}

/** GET /v1/tenant/usage */
export async function getTenantUsageRoute(req: ApiRequest): Promise<ApiResponse> {
	try {
		const tenantId = req.query?.tenantId as string;
		if (!tenantId) return { statusCode: 400, body: { error: "Missing required query parameter: tenantId" } };
		return { statusCode: 200, body: getTenantUsage(tenantId) };
	} catch (error) {
		return { statusCode: 500, body: { error: error instanceof Error ? error.message : String(error) } };
	}
}

/** Route dispatcher */
export async function routeRequest(req: ApiRequest): Promise<ApiResponse> {
	const { method, path } = req;

	if (method === "POST" && path === "/v1/agent/chat") return handleChat(req);
	if (method === "POST" && path === "/v1/agent/voice/transcribe") return handleTranscribe(req);
	if (method === "POST" && path === "/v1/agent/voice/speak") return handleSpeak(req);
	if (method === "POST" && path === "/v1/agent/tool-call") return handleToolCall(req);
	if (method === "GET" && path === "/v1/tenant/config") return getTenantConfigRoute(req);
	if (method === "GET" && path === "/v1/tenant/usage") return getTenantUsageRoute(req);

	if (method === "POST" && path === "/api/terabithia/invoke") {
		const { handleTerabithiaInvoke } = await import("./terabithia-route.js");
		return handleTerabithiaInvoke(req);
	}
	if (method === "GET" && path === "/health") {
		const { getTerabithiaHealth } = await import("./terabithia-route.js");
		return getTerabithiaHealth();
	}

	return { statusCode: 404, body: { error: `Route not found: ${method} ${path}` } };
}

export { streamMercury } from "./mercury-routes.js";
export { handleVoiceSpeak, handleVoiceTranscribe } from "./voice-routes.js";
export { getTerabithiaHealth, handleTerabithiaInvoke } from "./terabithia-route.js";
