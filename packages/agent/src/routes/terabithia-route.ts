import { createHash, timingSafeEqual } from "node:crypto";
import type { Context } from "@mariozechner/pi-ai";
import { PiTerabithiaAdapter, type TerabithiaMissionEnvelope } from "../orchestration/terabithia.js";
import type { ApiRequest, ApiResponse } from "./index.js";
import { streamMercury } from "./mercury-routes.js";

function textDelta(event: unknown): string {
	if (!event || typeof event !== "object") return "";
	const candidate = event as Record<string, unknown>;
	if (candidate.type === "text_delta" && typeof candidate.delta === "string") return candidate.delta;
	if (typeof candidate.delta === "string") return candidate.delta;
	return "";
}

async function executePersonal(mission: TerabithiaMissionEnvelope) {
	const context: Context = {
		systemPrompt:
			"You are Pi, the user's private Personal Human OS. Complete only the personal-domain request. Do not expose private context outside this result, and never perform business-domain work that belongs to Hermes.",
		messages: [
			{
				role: "user",
				content: mission.user_intent,
				timestamp: Date.now(),
			},
		],
	};

	const stream = await streamMercury(context, {
		tenantId: process.env.PI_TENANT_ID || "pauli-personal",
		routeTag: "mercury-fast",
		apiKey: process.env.INCEPTION_API_KEY,
	});

	let summary = "";
	for await (const event of stream) summary += textDelta(event);
	summary = summary.trim();
	if (!summary) throw new Error("Pi personal runtime returned no text evidence");

	return {
		status: "done" as const,
		summary,
		artifacts: [],
		evidence: [
			{ type: "trace" as const, ref: `trace://${mission.trace_id}`, summary: "Pi personal execution trace" },
		],
		failures: [],
		human_blocker: null,
		handoff: null,
		next_action: null,
		memory_candidate: null,
		completed_at: new Date().toISOString(),
	};
}

const adapter = new PiTerabithiaAdapter(executePersonal);

function headerValue(headers: Record<string, string> | undefined, name: string): string {
	if (!headers) return "";
	const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
	return key ? String(headers[key] ?? "") : "";
}

function secretMatches(provided: string, expected: string): boolean {
	if (!provided || !expected) return false;
	const a = createHash("sha256").update(provided).digest();
	const b = createHash("sha256").update(expected).digest();
	return timingSafeEqual(a, b);
}

/** Only Terabithia, holding PI_TERABITHIA_TOKEN, may hand Pi a mission. Unset token fails closed. */
export function authorizeTerabithia(req: ApiRequest): ApiResponse | null {
	const expected = (process.env.PI_TERABITHIA_TOKEN || "").trim();
	if (expected.length < 16) {
		return {
			statusCode: 503,
			body: { error: "PiIngressNotConfigured", message: "PI_TERABITHIA_TOKEN must be set (16+ chars)." },
		};
	}
	const auth = headerValue(req.headers, "authorization");
	const provided = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
	if (!secretMatches(provided, expected)) {
		return { statusCode: 401, body: { error: "Unauthorized" } };
	}
	return null;
}

export async function handleTerabithiaInvoke(req: ApiRequest): Promise<ApiResponse> {
	const denied = authorizeTerabithia(req);
	if (denied) return denied;
	try {
		const mission = req.body as unknown as TerabithiaMissionEnvelope;
		const result = await adapter.invoke(mission);
		return { statusCode: result.status === "failed" ? 502 : 200, body: result };
	} catch (error) {
		return {
			statusCode: 400,
			body: {
				error: "TerabithiaMissionRejected",
				message: error instanceof Error ? error.message : String(error),
			},
		};
	}
}

export function getTerabithiaHealth(): ApiResponse {
	return {
		statusCode: 200,
		body: {
			ok: true,
			agent: "pi",
			role: "personal",
			model_configured: Boolean(process.env.INCEPTION_API_KEY),
		},
	};
}
