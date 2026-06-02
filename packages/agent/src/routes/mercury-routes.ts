import { createMercuryClient, streamMercuryChat, streamMercuryDiffusion } from "../mercury/mercury-client.js";
import type { MercuryMessage } from "../mercury/mercury-types.js";
import { canUseFeature, getTenantConfig } from "../tenants/tenant-config.js";

export interface ChatRequest {
	tenantId: string;
	messages: MercuryMessage[];
	diffusionEnabled?: boolean;
	reasoningEffort?: "instant" | "low" | "medium" | "high";
}

export async function* handleMercuryChat(req: ChatRequest): AsyncGenerator<string, void, unknown> {
	const config = getTenantConfig();

	if (!canUseFeature("mercury")) {
		throw new Error("Mercury model not available for this tenant");
	}

	const apiKey = process.env.INCEPTION_API_KEY;
	if (!apiKey) {
		throw new Error("INCEPTION_API_KEY not configured");
	}

	const client = createMercuryClient(apiKey);

	const diffusionEnabled = req.diffusionEnabled && canUseFeature("diffusion");
	const reasoningEffort = req.reasoningEffort || config.routing.reasoningEffort;

	const stream = await (diffusionEnabled ? streamMercuryDiffusion : streamMercuryChat)(client, req.messages, {
		diffusing: diffusionEnabled,
		reasoning_effort: reasoningEffort,
	});

	for await (const chunk of stream) {
		yield chunk;
	}
}

export interface ToolCallRequest {
	tenantId: string;
	toolName: string;
	parameters: Record<string, any>;
	requiresApproval?: boolean;
}

export interface ToolCallResponse {
	toolName: string;
	result: any;
	error?: string;
	requiresApprovalForExecution?: boolean;
}

export async function handleToolCall(req: ToolCallRequest): Promise<ToolCallResponse> {
	const config = getTenantConfig();

	if (req.toolName === "payment" || req.toolName === "email") {
		if (config.permissions.requiresApprovalForMoneyMovement && req.toolName === "payment") {
			return {
				toolName: req.toolName,
				result: null,
				requiresApprovalForExecution: true,
				error: "Payment execution requires approval",
			};
		}
	}

	return {
		toolName: req.toolName,
		result: {
			executed: false,
			message: `Tool ${req.toolName} execution not yet implemented`,
		},
	};
}

export interface TenantConfigResponse {
	tenantId: string;
	plan: string;
	voiceEnabled: boolean;
	diffusionEnabled: boolean;
	branding: {
		botName: string;
		primaryColor: string;
		accentColor: string;
	};
}

export function handleGetTenantConfig(): TenantConfigResponse {
	const config = getTenantConfig();

	return {
		tenantId: config.tenantId,
		plan: config.plan,
		voiceEnabled: config.routing.voiceEnabled,
		diffusionEnabled: config.routing.diffusionEnabled,
		branding: {
			botName: config.branding.botName,
			primaryColor: config.branding.primaryColor,
			accentColor: config.branding.accentColor,
		},
	};
}

export interface UsageResponse {
	tenantId: string;
	period: "today" | "month" | "lifetime";
	tokensUsed: number;
	estimatedCost: number;
	requestCount: number;
}

const usageTracking = new Map<string, { tokens: number; cost: number; requests: number }>();

export function trackUsage(tenantId: string, tokens: number, cost: number): void {
	const current = usageTracking.get(tenantId) || { tokens: 0, cost: 0, requests: 0 };
	usageTracking.set(tenantId, {
		tokens: current.tokens + tokens,
		cost: current.cost + cost,
		requests: current.requests + 1,
	});
}

export function handleGetUsage(tenantId: string): UsageResponse {
	const usage = usageTracking.get(tenantId) || { tokens: 0, cost: 0, requests: 0 };

	return {
		tenantId,
		period: "month",
		tokensUsed: usage.tokens,
		estimatedCost: usage.cost,
		requestCount: usage.requests,
	};
}
