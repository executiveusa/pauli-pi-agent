import type { Context } from "@mariozechner/pi-ai";
import { PiTerabithiaAdapter, type TerabithiaMissionEnvelope } from "../orchestration/terabithia.js";
import { streamMercury } from "./mercury-routes.js";
import type { ApiRequest, ApiResponse } from "./index.js";

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

export async function handleTerabithiaInvoke(req: ApiRequest): Promise<ApiResponse> {
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
