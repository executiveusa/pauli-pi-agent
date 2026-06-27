import { describe, expect, it } from "vitest";
import {
	assertDiffusionEnabled,
	assertToolPermitted,
	assertVoiceEnabled,
	checkToolAccess,
	PermissionDeniedError,
	requiresApproval,
} from "../../src/tenants/tenant-permissions.js";
import type { TenantConfig } from "../../src/tenants/tenant-schema.js";

function makeTenant(overrides: Partial<TenantConfig> = {}): TenantConfig {
	return {
		tenantId: "test_tenant",
		clientName: "Test",
		plan: "mercury_diffusion",
		branding: { botName: "Bot" },
		routing: {
			defaultModel: "mercury-2",
			reasoningEffort: "low",
			diffusionEnabled: true,
			voiceEnabled: true,
		},
		billing: { mode: "client_byok", usagePaidByClient: true },
		permissions: {
			canUseBrowser: true,
			canGenerateImages: true,
			canGenerateVideo: false,
			canSendEmail: false,
			canBookAppointments: true,
			requiresApprovalForMoneyMovement: true,
		},
		...overrides,
	};
}

describe("assertVoiceEnabled", () => {
	it("passes for mercury_diffusion plan with voiceEnabled=true", () => {
		expect(() => assertVoiceEnabled(makeTenant())).not.toThrow();
	});

	it("throws for clean plan", () => {
		const t = makeTenant({ plan: "clean", routing: { ...makeTenant().routing, voiceEnabled: false } });
		expect(() => assertVoiceEnabled(t)).toThrowError(PermissionDeniedError);
	});

	it("throws when voiceEnabled=false even on voice plan", () => {
		const t = makeTenant({ plan: "voice", routing: { ...makeTenant().routing, voiceEnabled: false } });
		expect(() => assertVoiceEnabled(t)).toThrowError(PermissionDeniedError);
	});
});

describe("assertDiffusionEnabled", () => {
	it("passes for mercury_diffusion plan with diffusionEnabled=true", () => {
		expect(() => assertDiffusionEnabled(makeTenant())).not.toThrow();
	});

	it("throws for voice plan", () => {
		const t = makeTenant({ plan: "voice", routing: { ...makeTenant().routing, diffusionEnabled: false } });
		expect(() => assertDiffusionEnabled(t)).toThrowError(PermissionDeniedError);
	});

	it("throws when diffusionEnabled=false even on mercury_diffusion plan", () => {
		const t = makeTenant({ routing: { ...makeTenant().routing, diffusionEnabled: false } });
		expect(() => assertDiffusionEnabled(t)).toThrowError(PermissionDeniedError);
	});
});

describe("assertToolPermitted", () => {
	it("allows web_search when canUseBrowser=true", () => {
		expect(() => assertToolPermitted(makeTenant(), "web_search")).not.toThrow();
	});

	it("denies web_search when canUseBrowser=false", () => {
		const t = makeTenant({ permissions: { ...makeTenant().permissions, canUseBrowser: false } });
		expect(() => assertToolPermitted(t, "web_search")).toThrowError(PermissionDeniedError);
	});

	it("denies send_email when canSendEmail=false", () => {
		expect(() => assertToolPermitted(makeTenant(), "send_email")).toThrowError(PermissionDeniedError);
	});

	it("allows unknown tools (not in the gate map)", () => {
		expect(() => assertToolPermitted(makeTenant(), "lead_capture")).not.toThrow();
	});
});

describe("requiresApproval", () => {
	it("returns true for money tools when requiresApprovalForMoneyMovement=true", () => {
		expect(requiresApproval(makeTenant(), "transfer_funds")).toBe(true);
		expect(requiresApproval(makeTenant(), "pay_invoice")).toBe(true);
		expect(requiresApproval(makeTenant(), "refund")).toBe(true);
	});

	it("returns false for non-money tools", () => {
		expect(requiresApproval(makeTenant(), "web_search")).toBe(false);
		expect(requiresApproval(makeTenant(), "lead_capture")).toBe(false);
	});

	it("returns false for money tools when requiresApprovalForMoneyMovement=false", () => {
		const t = makeTenant({
			permissions: { ...makeTenant().permissions, requiresApprovalForMoneyMovement: false },
		});
		expect(requiresApproval(t, "transfer_funds")).toBe(false);
	});
});

describe("checkToolAccess", () => {
	it("returns permitted=true and requiresApproval=false for allowed non-money tool", () => {
		const result = checkToolAccess(makeTenant(), "web_search");
		expect(result.permitted).toBe(true);
		expect(result.requiresApproval).toBe(false);
	});

	it("returns permitted=true and requiresApproval=true for money tool", () => {
		const result = checkToolAccess(makeTenant(), "transfer_funds");
		expect(result.permitted).toBe(true);
		expect(result.requiresApproval).toBe(true);
	});

	it("returns permitted=false for denied tool", () => {
		const result = checkToolAccess(makeTenant(), "send_email");
		expect(result.permitted).toBe(false);
		expect(result.reason).toBeDefined();
	});
});
