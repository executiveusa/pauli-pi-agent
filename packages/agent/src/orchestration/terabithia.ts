export type TerabithiaRoute = "personal" | "business" | "operator" | "presence" | "evaluation";

export type TerabithiaMissionStatus =
	| "queued"
	| "working"
	| "needs_human"
	| "blocked"
	| "done"
	| "failed"
	| "cancelled";

export interface TerabithiaApproval {
	granted: boolean;
	scope: string[];
	approval_id?: string;
}

export interface TerabithiaMissionEnvelope {
	mission_id: string;
	request_id: string;
	conversation_id: string;
	trace_id: string;
	source: "chatgpt" | "hermes" | "pi" | "bars" | "jarvis" | "lightning" | "system" | "terabithia";
	target: "pi";
	route: TerabithiaRoute;
	user_intent: string;
	desired_outcome: string;
	constraints: string[];
	permissions: string[];
	context_refs: string[];
	approval: TerabithiaApproval;
	idempotency_key: string;
	created_at: string;
}

export interface TerabithiaEvidenceRef {
	type: "artifact" | "tool_call" | "external_state" | "log" | "document" | "trace";
	ref: string;
	summary?: string;
}

export interface TerabithiaHumanBlocker {
	type: "authorization" | "judgment" | "credential" | "physical_action" | "sensitive_approval";
	title: string;
	why: string;
	action: string;
	resume_token: string;
}

export interface TerabithiaHandoff {
	target: "hermes" | "pi" | "bars" | "jarvis" | "lightning";
	route: TerabithiaRoute;
	reason: string;
	user_intent: string;
	desired_outcome: string;
	context_refs: string[];
}

export interface TerabithiaResultEnvelope {
	mission_id: string;
	request_id: string;
	trace_id: string;
	agent_id: "pi";
	status: TerabithiaMissionStatus;
	summary: string;
	artifacts: TerabithiaEvidenceRef[];
	evidence: TerabithiaEvidenceRef[];
	failures: string[];
	human_blocker: TerabithiaHumanBlocker | null;
	handoff: TerabithiaHandoff | null;
	next_action: string | null;
	memory_candidate: null | {
		type: "decision" | "fact" | "lesson" | "preference" | "state_change";
		summary: string;
		context_refs: string[];
		sensitivity: "shared" | "restricted" | "private";
	};
	completed_at?: string;
}

export interface PiTerabithiaHandler {
	invoke(mission: TerabithiaMissionEnvelope): Promise<TerabithiaResultEnvelope>;
}

function assertNonEmpty(value: string, name: string): void {
	if (!value || !value.trim()) throw new Error(`${name} is required`);
}

export function validateTerabithiaMission(mission: TerabithiaMissionEnvelope): void {
	assertNonEmpty(mission.mission_id, "mission_id");
	assertNonEmpty(mission.request_id, "request_id");
	assertNonEmpty(mission.conversation_id, "conversation_id");
	assertNonEmpty(mission.trace_id, "trace_id");
	assertNonEmpty(mission.user_intent, "user_intent");
	assertNonEmpty(mission.desired_outcome, "desired_outcome");
	assertNonEmpty(mission.idempotency_key, "idempotency_key");
	if (mission.target !== "pi") throw new Error(`Pi cannot accept target '${mission.target}'`);

	if (mission.route === "business") return;
	if (mission.route !== "personal") throw new Error(`Pi cannot execute route '${mission.route}'`);
}

export function businessHandoffFromPi(mission: TerabithiaMissionEnvelope): TerabithiaResultEnvelope {
	return {
		mission_id: mission.mission_id,
		request_id: mission.request_id,
		trace_id: mission.trace_id,
		agent_id: "pi",
		status: "done",
		summary: "Business-domain work was not executed by Pi and was handed back to Terabithia for Hermes routing.",
		artifacts: [],
		evidence: [],
		failures: [],
		human_blocker: null,
		handoff: {
			target: "hermes",
			route: "business",
			reason: "business-domain request",
			user_intent: mission.user_intent,
			desired_outcome: mission.desired_outcome,
			context_refs: mission.context_refs,
		},
		next_action: null,
		memory_candidate: null,
		completed_at: new Date().toISOString(),
	};
}

export class PiTerabithiaAdapter implements PiTerabithiaHandler {
	constructor(
		private readonly executePersonal: (
			mission: TerabithiaMissionEnvelope,
		) => Promise<Omit<TerabithiaResultEnvelope, "mission_id" | "request_id" | "trace_id" | "agent_id">>,
	) {}

	async invoke(mission: TerabithiaMissionEnvelope): Promise<TerabithiaResultEnvelope> {
		validateTerabithiaMission(mission);
		if (mission.route === "business") return businessHandoffFromPi(mission);

		const result = await this.executePersonal(mission);
		return {
			mission_id: mission.mission_id,
			request_id: mission.request_id,
			trace_id: mission.trace_id,
			agent_id: "pi",
			...result,
		};
	}
}
