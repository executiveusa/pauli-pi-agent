import { describe, expect, it, vi } from "vitest";
import {
	PiTerabithiaAdapter,
	businessHandoffFromPi,
	validateTerabithiaMission,
	type TerabithiaMissionEnvelope,
} from "../src/orchestration/terabithia.js";

function mission(overrides: Partial<TerabithiaMissionEnvelope> = {}): TerabithiaMissionEnvelope {
	return {
		missionId: "mis_123",
		requestId: "req_123",
		conversationId: "conv_123",
		traceId: "trace_123",
		route: "personal",
		userIntent: "Organize my appointment notes",
		desiredOutcome: "A concise appointment brief",
		contextRefs: ["ctx://personal/appointment-notes"],
		approval: { granted: false, scope: [] },
		idempotencyKey: "idem_123",
		createdAt: "2026-08-16T00:00:00.000Z",
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
				userIntent: "Prepare the company migration plan",
				desiredOutcome: "A business migration plan",
				contextRefs: ["ctx://business/migration"],
			}),
		);

		expect(result.agentId).toBe("pi");
		expect(result.status).toBe("done");
		expect(result.handoff?.target).toBe("hermes");
		expect(result.handoff?.contextRefs).toEqual(["ctx://business/migration"]);
	});

	it("preserves mission and trace identity around personal execution", async () => {
		const executePersonal = vi.fn(async () => ({
			status: "done" as const,
			summary: "Appointment brief prepared.",
			evidence: [{ type: "artifact" as const, ref: "artifact://brief/1" }],
			humanBlocker: null,
			handoff: null,
			nextAction: null,
			memoryCandidate: {
				type: "state_change" as const,
				summary: "Appointment brief prepared",
				contextRefs: ["artifact://brief/1"],
			},
		}));
		const adapter = new PiTerabithiaAdapter(executePersonal);
		const result = await adapter.invoke(mission());

		expect(executePersonal).toHaveBeenCalledTimes(1);
		expect(result.missionId).toBe("mis_123");
		expect(result.requestId).toBe("req_123");
		expect(result.traceId).toBe("trace_123");
		expect(result.agentId).toBe("pi");
		expect(result.evidence[0]?.ref).toBe("artifact://brief/1");
	});

	it("never invokes personal execution for a business route", async () => {
		const executePersonal = vi.fn();
		const adapter = new PiTerabithiaAdapter(executePersonal);
		const result = await adapter.invoke(mission({ route: "business" }));

		expect(executePersonal).not.toHaveBeenCalled();
		expect(result.handoff?.target).toBe("hermes");
	});
});
