import { describe, expect, it } from "vitest";
import {
	assertDiffusionEnabled,
	assertVoiceEnabled,
	PermissionDeniedError,
} from "../../src/tenants/tenant-permissions.js";
import type { TenantConfig } from "../../src/tenants/tenant-schema.js";
import { PLAN_FEATURES } from "../../src/tenants/tenant-schema.js";

function tenant(plan: TenantConfig["plan"]): TenantConfig {
	return {
		tenantId: `tenant_${plan}`,
		clientName: plan,
		plan,
		branding: { botName: "Bot" },
		routing: {
			defaultModel: "mercury-2",
			reasoningEffort: "low",
			diffusionEnabled: plan === "mercury_diffusion",
			voiceEnabled: plan !== "clean",
		},
		billing: { mode: "client_byok", usagePaidByClient: true },
		permissions: {
			canUseBrowser: false,
			canGenerateImages: false,
			canGenerateVideo: false,
			canSendEmail: false,
			canBookAppointments: false,
			requiresApprovalForMoneyMovement: true,
		},
	};
}

describe("PLAN_FEATURES matrix", () => {
	it("clean plan has no voice, diffusion, or toolDock", () => {
		expect(PLAN_FEATURES.clean).toEqual({ voice: false, diffusion: false, toolDock: false });
	});

	it("voice plan has voice but no diffusion or toolDock", () => {
		expect(PLAN_FEATURES.voice).toEqual({ voice: true, diffusion: false, toolDock: false });
	});

	it("mercury_diffusion plan has all features", () => {
		expect(PLAN_FEATURES.mercury_diffusion).toEqual({ voice: true, diffusion: true, toolDock: true });
	});
});

describe("plan enforcement — voice", () => {
	it("clean tenant cannot use voice", () => {
		expect(() => assertVoiceEnabled(tenant("clean"))).toThrowError(PermissionDeniedError);
	});

	it("voice tenant can use voice", () => {
		expect(() => assertVoiceEnabled(tenant("voice"))).not.toThrow();
	});

	it("mercury_diffusion tenant can use voice", () => {
		expect(() => assertVoiceEnabled(tenant("mercury_diffusion"))).not.toThrow();
	});
});

describe("plan enforcement — diffusion", () => {
	it("clean tenant cannot use diffusion", () => {
		expect(() => assertDiffusionEnabled(tenant("clean"))).toThrowError(PermissionDeniedError);
	});

	it("voice tenant cannot use diffusion", () => {
		expect(() => assertDiffusionEnabled(tenant("voice"))).toThrowError(PermissionDeniedError);
	});

	it("mercury_diffusion tenant can use diffusion", () => {
		expect(() => assertDiffusionEnabled(tenant("mercury_diffusion"))).not.toThrow();
	});
});

describe("PermissionDeniedError", () => {
	it("carries feature, tenantId, and plan", () => {
		const t = tenant("clean");
		let err: PermissionDeniedError | undefined;
		try {
			assertVoiceEnabled(t);
		} catch (e) {
			err = e as PermissionDeniedError;
		}
		expect(err).toBeInstanceOf(PermissionDeniedError);
		expect(err?.feature).toBe("voice");
		expect(err?.tenantId).toBe("tenant_clean");
		expect(err?.plan).toBe("clean");
	});
});
