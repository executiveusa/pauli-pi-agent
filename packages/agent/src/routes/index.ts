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

/**
 * POST /v1/agent/chat
 * Stream chat completions with Mercury routing
 */
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
			return {
				statusCode: 400,
				body: { error: "Missing required fields: tenantId, messages" },
			};
		}

		const tenant = getTenantConfig(tenantId);

		// Validate tenant can use the requested feature
		const route = routeTag || "mercury-fast";
		if (route.includes("diffusion") && !canUseFeature(tenant, "diffusion")) {
			return {
				statusCode: 403,
				body: { error: "Diffusion feature not available for this tenant plan" },
			};
		}

		// Normalize messages: convert string content to content blocks for assistant messages
		const normalizedMessages = messages.map((m) => {
			const msg: any = { ...m, timestamp: Date.now() };
			// Assistant messages need content as an array of content blocks
			if (m.role === "assistant" && typeof m.content === "string") {
				msg.content = [{ type: "text", text: m.content }];
			}
			return msg;
		});

		const context: Context = {
			systemPrompt: systemPrompt || "You are a helpful assistant.",
			messages: normalizedMessages,
		};

		// Return streaming response
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
		const message = error instanceof Error ? error.message : String(error);
		return {
			statusCode: 500,
			body: { error: message },
		};
	}
}

/**
 * POST /v1/agent/voice/transcribe
 * Convert speech audio to text using OpenAI Whisper
 */
export async function handleTranscribe(req: ApiRequest): Promise<ApiResponse> {
	try {
		const { tenantId, audio, language } = req.body as {
			tenantId: string;
			audio: string; // base64 encoded
			language?: string;
		};

		if (!tenantId || !audio) {
			return {
				statusCode: 400,
				body: { error: "Missing required fields: tenantId, audio" },
			};
		}

		const tenant = getTenantConfig(tenantId);

		if (!canUseFeature(tenant, "voice")) {
			return {
				statusCode: 403,
				body: { error: "Voice feature not available for this tenant plan" },
			};
		}

		const result = await handleVoiceTranscribe({
			audio,
			language,
			apiKey: process.env.OPENAI_API_KEY,
		});

		return {
			statusCode: 200,
			body: result,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			statusCode: 500,
			body: { error: message },
		};
	}
}

/**
 * POST /v1/agent/voice/speak
 * Generate speech audio from text using OpenAI TTS
 */
export async function handleSpeak(req: ApiRequest): Promise<ApiResponse> {
	try {
		const { tenantId, text, voiceName } = req.body as {
			tenantId: string;
			text: string;
			voiceName?: string;
		};

		if (!tenantId || !text) {
			return {
				statusCode: 400,
				body: { error: "Missing required fields: tenantId, text" },
			};
		}

		const tenant = getTenantConfig(tenantId);

		if (!canUseFeature(tenant, "voice")) {
			return {
				statusCode: 403,
				body: { error: "Voice feature not available for this tenant plan" },
			};
		}

		const result = await handleVoiceSpeak({
			text,
			voiceName: voiceName || tenant.branding?.voiceName || "shimmer",
			apiKey: process.env.OPENAI_API_KEY,
		});

		return {
			statusCode: 200,
			body: result,
			headers: { "Content-Type": "audio/mpeg" },
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			statusCode: 500,
			body: { error: message },
		};
	}
}

/**
 * POST /v1/agent/tool-call
 * Execute a tool with permission checks and optional approval workflow
 */
export async function handleToolCall(req: ApiRequest): Promise<ApiResponse> {
	try {
		const { tenantId, toolName, approvalToken } = req.body as {
			tenantId: string;
			toolName: string;
			approvalToken?: string;
		};

		if (!tenantId || !toolName) {
			return {
				statusCode: 400,
				body: { error: "Missing required fields: tenantId, toolName" },
			};
		}

		const tenant = getTenantConfig(tenantId);

		// Money movement requires explicit approval before execution
		if (toolName === "money-movement") {
			if (moneyMovementRequiresApproval(tenant)) {
				if (!approvalToken) {
					// Return pending status requiring approval
					return {
						statusCode: 202,
						body: { result: null, toolName, status: "pending", message: "Approval required for money movement" },
					};
				}
				// TODO: Verify approval token is valid and not expired
			}
		}

		// Check if tenant can execute this tool
		if (!canExecuteTool(tenant, toolName)) {
			return {
				statusCode: 403,
				body: { error: `Tool '${toolName}' not permitted for this tenant` },
			};
		}

		// TODO: Execute tool and log action
		// TODO: Track usage

		return {
			statusCode: 200,
			body: { result: null, toolName, status: "executed" },
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			statusCode: 500,
			body: { error: message },
		};
	}
}

/**
 * GET /v1/tenant/config
 * Return public parts of tenant configuration (no secrets)
 */
export async function getTenantConfigRoute(req: ApiRequest): Promise<ApiResponse> {
	try {
		const tenantId = req.query?.tenantId as string;

		if (!tenantId) {
			return {
				statusCode: 400,
				body: { error: "Missing required query parameter: tenantId" },
			};
		}

		const publicConfig = getTenantPublicConfig(tenantId);

		return {
			statusCode: 200,
			body: publicConfig,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			statusCode: 500,
			body: { error: message },
		};
	}
}

/**
 * GET /v1/tenant/usage
 * Return usage metrics and billing information
 */
export async function getTenantUsageRoute(req: ApiRequest): Promise<ApiResponse> {
	try {
		const tenantId = req.query?.tenantId as string;

		if (!tenantId) {
			return {
				statusCode: 400,
				body: { error: "Missing required query parameter: tenantId" },
			};
		}

		const usage = getTenantUsage(tenantId);

		return {
			statusCode: 200,
			body: usage,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			statusCode: 500,
			body: { error: message },
		};
	}
}

/**
 * Route dispatcher
 * Maps incoming requests to appropriate handlers
 */
export async function routeRequest(req: ApiRequest): Promise<ApiResponse> {
	const { method, path } = req;

	// Chat routes
	if (method === "POST" && path === "/v1/agent/chat") {
		return handleChat(req);
	}

	// Voice routes
	if (method === "POST" && path === "/v1/agent/voice/transcribe") {
		return handleTranscribe(req);
	}

	if (method === "POST" && path === "/v1/agent/voice/speak") {
		return handleSpeak(req);
	}

	// Tool routes
	if (method === "POST" && path === "/v1/agent/tool-call") {
		return handleToolCall(req);
	}

	// Tenant routes
	if (method === "GET" && path === "/v1/tenant/config") {
		return getTenantConfigRoute(req);
	}

	if (method === "GET" && path === "/v1/tenant/usage") {
		return getTenantUsageRoute(req);
	}

	return {
		statusCode: 404,
		body: { error: `Route not found: ${method} ${path}` },
	};
}

export { streamMercury } from "./mercury-routes.js";
export { handleVoiceSpeak, handleVoiceTranscribe } from "./voice-routes.js";
