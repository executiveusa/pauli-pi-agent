/**
 * ArchonX Tenant Configuration Schema.
 *
 * Every client is a tenant. The tenant config controls:
 *  - Branding (bot name, colors, voice)
 *  - Plan (clean | voice | mercury_diffusion)
 *  - Model routing (model, reasoning effort, diffusion)
 *  - Billing mode (client_byok | managed_pass_through)
 *  - Tool permissions (per-tool allow/deny + approval requirements)
 */

/** Available client plans. Controls which features are accessible. */
export type TenantPlan = "clean" | "voice" | "mercury_diffusion";

/** Billing mode. client_byok means the client owns their own API token usage. */
export type BillingMode = "client_byok" | "managed_pass_through";

export interface TenantBranding {
	/** Display name for the bot (e.g. "Mercury Agent"). */
	botName: string;
	/** URL to the client's logo. */
	logoUrl?: string;
	/** Primary background color (hex). */
	primaryColor?: string;
	/** Accent / CTA color (hex). */
	accentColor?: string;
	/** OpenAI TTS voice name (shimmer, alloy, echo, fable, onyx, nova). */
	voiceName?: string;
}

export interface TenantRouting {
	/** Default model ID (e.g. "mercury-2"). */
	defaultModel: string;
	/** Default reasoning effort level for this tenant. */
	reasoningEffort: "instant" | "low" | "medium" | "high";
	/** Whether Mercury diffusion mode is enabled for this tenant. */
	diffusionEnabled: boolean;
	/** Whether voice input/output is enabled for this tenant. */
	voiceEnabled: boolean;
}

export interface TenantBilling {
	mode: BillingMode;
	/** Whether the client is responsible for their own token usage costs. */
	usagePaidByClient: boolean;
	/** One-time setup fee in USD (ArchonX charges). */
	setupFee?: number;
	/** Monthly maintenance fee in USD (ArchonX charges). */
	monthlyMaintenanceFee?: number;
}

export interface TenantPermissions {
	/** Allow browser/web search tool. */
	canUseBrowser: boolean;
	/** Allow image generation tools. */
	canGenerateImages: boolean;
	/** Allow video generation tools. */
	canGenerateVideo: boolean;
	/** Allow email sending tools. */
	canSendEmail: boolean;
	/** Allow appointment booking tools. */
	canBookAppointments: boolean;
	/** Any tool that moves money requires explicit human approval. */
	requiresApprovalForMoneyMovement: boolean;
}

/** Full tenant configuration record. */
export interface TenantConfig {
	/** Globally unique tenant identifier (slug format, e.g. "client_demo"). */
	tenantId: string;
	/** Human-readable client name. */
	clientName: string;
	/** Feature plan for this tenant. */
	plan: TenantPlan;
	branding: TenantBranding;
	routing: TenantRouting;
	billing: TenantBilling;
	permissions: TenantPermissions;
}

/** Plan feature gates — what each plan can and cannot do. */
export const PLAN_FEATURES: Record<TenantPlan, { voice: boolean; diffusion: boolean; toolDock: boolean }> = {
	clean: { voice: false, diffusion: false, toolDock: false },
	voice: { voice: true, diffusion: false, toolDock: false },
	mercury_diffusion: { voice: true, diffusion: true, toolDock: true },
};
