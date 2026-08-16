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
	approvalId?: string;
}

export interface TerabithiaMissionEnvelope {
	missionId: string;
	requestId: string;
	conversationId: string;
	traceId: string;
	route: TerabithiaRoute;
	userIntent: string;
	desiredOutcome: string;
	contextRefs: string[];
	approval: TerabithiaApproval;
	idempotencyKey: string;
	createdAt: string;
}

export interface TerabithiaEvidenceRef {
	type: "artifact" | "tool_call" | "external_state" | "log" | "document";
	ref: string;
	summary?: string;
}

export interface TerabithiaHumanBlocker {
	type: "authorization" | "judgment" | "credential" | "physical_action" | "sensitive_approval";
	title: string;
	why: string;
	action: string;
	resumeToken: string;
}

export interface TerabithiaHandoff {
	target: "hermes" | "pi" | "bars" | "jarvis" | "lightning";
	route: TerabithiaRoute;
	reason: string;
	userIntent: string;
	desiredOutcome: string;
	contextRefs: string[];
}

export interface TerabithiaResultEnvelope {
	missionId: string;
	requestId: string;
	traceId: string;
	agentId: "pi";
	status: TerabithiaMissionStatus;
	summary: string;
	evidence: TerabithiaEvidenceRef[];
	humanBlocker: TerabithiaHumanBlocker | null;
	handoff: TerabithiaHandoff | null;
	nextAction: string | null;
	memoryCandidate: null | {
		type: "decision" | "fact" | "lesson" | "preference" | "state_change";
		summary: string;
		contextRefs: string[];
	};
}

export interface PiTerabithiaHandler {
	invoke(mission: TerabithiaMissionEnvelope): Promise<TerabithiaResultEnvelope>;
}

function assertNonEmpty(value: string, name: string): void {
	if (!value || !value.trim()) throw new Error(`${name} is required`);
}

export function validateTerabithiaMission(mission: TerabithiaMissionEnvelope): void {
	assertNonEmpty(mission.missionId, "missionId");
	assertNonEmpty(mission.requestId, "requestId");
	assertNonEmpty(mission.conversationId, "conversationId");
	assertNonEmpty(mission.traceId, "traceId");
	assertNonEmpty(mission.userIntent, "userIntent");
	assertNonEmpty(mission.desiredOutcome, "desiredOutcome");
	assertNonEmpty(mission.idempotencyKey, "idempotencyKey");

	if (mission.route === "business") {
		return;
	}

	if (mission.route !== "personal") {
		throw new Error(`Pi cannot execute route '${mission.route}'`);
	}
}

export function businessHandoffFromPi(mission: TerabithiaMissionEnvelope): TerabithiaResultEnvelope {
	return {
		missionId: mission.missionId,
		requestId: mission.requestId,
		traceId: mission.traceId,
		agentId: "pi",
		status: "done",
		summary: "Business-domain work was not executed by Pi and was handed back to Terabithia for Hermes routing.",
		evidence: [],
		humanBlocker: null,
		handoff: {
			target: "hermes",
			route: "business",
			reason: "business-domain request",
			userIntent: mission.userIntent,
			desiredOutcome: mission.desiredOutcome,
			contextRefs: mission.contextRefs,
		},
		nextAction: null,
		memoryCandidate: null,
	};
}

export class PiTerabithiaAdapter implements PiTerabithiaHandler {
	constructor(
		private readonly executePersonal: (
			mission: TerabithiaMissionEnvelope,
		) => Promise<Omit<TerabithiaResultEnvelope, "missionId" | "requestId" | "traceId" | "agentId">>,
	) {}

	async invoke(mission: TerabithiaMissionEnvelope): Promise<TerabithiaResultEnvelope> {
		validateTerabithiaMission(mission);

		if (mission.route === "business") {
			return businessHandoffFromPi(mission);
		}

		const result = await this.executePersonal(mission);
		return {
			missionId: mission.missionId,
			requestId: mission.requestId,
			traceId: mission.traceId,
			agentId: "pi",
			...result,
		};
	}
}
