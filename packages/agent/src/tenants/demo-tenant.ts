/**
 * Demo tenant configuration.
 * This is the local development tenant for ArchonX Mercury Agent.
 * Plan: mercury_diffusion (all features enabled).
 * Billing: client_byok (client owns API usage costs).
 */

import type { TenantConfig } from "./tenant-schema.js";

export const DEMO_TENANT: TenantConfig = {
	tenantId: "client_demo",
	clientName: "Demo Client",
	plan: "mercury_diffusion",
	branding: {
		botName: "Mercury Agent",
		logoUrl: "",
		primaryColor: "#0B0F14",
		accentColor: "#67F7C8",
		voiceName: "shimmer",
	},
	routing: {
		defaultModel: "mercury-2",
		reasoningEffort: "low",
		diffusionEnabled: true,
		voiceEnabled: true,
	},
	billing: {
		mode: "client_byok",
		usagePaidByClient: true,
		setupFee: 1500,
		monthlyMaintenanceFee: 299,
	},
	permissions: {
		canUseBrowser: false,
		canGenerateImages: false,
		canGenerateVideo: false,
		canSendEmail: false,
		canBookAppointments: true,
		requiresApprovalForMoneyMovement: true,
	},
};
