import { describe, expect, it, vi } from "vitest";
import {
	PiTerabithiaAdapter,
	businessHandoffFromPi,
	validateTerabithiaMission,
	type TerabithiaMissionEnvelope,
} from "../src/orchestration/terabithia.js";

function mission(overrides: Partial<TerabithiaMissionEnvelope> = {}): TerabithiaMissionEnvelope {
	return {
		mission_id: "mis_123",
		request_id: "req_123",
		conversation_id: "conv_123",
		trace_id: "trace_123",
		source: "chatgpt",
		target: "pi",
		route: "personal",
		user_intent: "Organize my appointment notes",
		desired_outcome: "A concise appointment brief",
		constraints: [],
		permissions: [],
		context_refs: ["ctx://personal/appointment-notes"],
		approval: { granted: false, scope: [] },
		idempotency_key: "idem_123",
		created_at: "2026-08-16T00:00:00.000Z",
		...overrides,
	};
}

describe("Terabithia Pi adapter", () => {
	it("rejects non-Pi routes before execution", () => {
		expect(() => validateTerabithiaMission(mission({ route: "operator" }))).toThrow(
			"Pi cannot execute route 'operator'",
		);
	});

	it("returns a bounded Hermes handoff for business work", () => {
		const result = businessHandoffFromPi(
			mission({
				route: "business",
				user_intent: "Prepare the company migration plan",
				desired_outcome: "A business migration plan",
				context_refs: ["ctx://business/migration"],
			}),
		);

		expect(result.agent_id).toBe("pi");
		expect(result.status).toBe("done");
		expect(result.handoff?.target).toBe("hermes");
		expect(result.handoff?.context_refs).toEqual(["ctx://business/migration"]);
	});

	it("preserves mission and trace identity around personal execution", async () => {
		const executePersonal = vi.fn(async () => ({
			status: "done" as const,
			summary: "Appointment brief prepared.",
			artifacts: [],
			evidence: [{ type: "artifact" as const, ref: "artifact://brief/1" }],
			failures: [],
			human_blocker: null,
			handoff: null,
			next_action: null,
			memory_candidate: {
				type: "state_change" as const,
				summary: "Appointment brief prepared",
				context_refs: ["artifact://brief/1"],
				sensitivity: "private" as const,
			},
			completed_at: "2026-08-16T00:01:00.000Z",
		}));
		const adapter = new PiTerabithiaAdapter(executePersonal);
		const result = await adapter.invoke(mission());

		expect(executePersonal).toHaveBeenCalledTimes(1);
		expect(result.mission_id).toBe("mis_123");
		expect(result.request_id).toBe("req_123");
		expect(result.trace_id).toBe("trace_123");
		expect(result.agent_id).toBe("pi");
		expect(result.evidence[0]?.ref).toBe("artifact://brief/1");
		expect(result.memory_candidate?.sensitivity).toBe("private");
	});

	it("never invokes personal execution for a business route", async () => {
		const executePersonal = vi.fn();
		const adapter = new PiTerabithiaAdapter(executePersonal);
		const result = await adapter.invoke(mission({ route: "business" }));

		expect(executePersonal).not.toHaveBeenCalled();
		expect(result.handoff?.target).toBe("hermes");
	});
});
