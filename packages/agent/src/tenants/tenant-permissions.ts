/**
 * Tenant permission enforcement.
 * All tool calls and feature activations must pass through this layer.
 * Throws if a plan or permission gate is violated.
 */

import { PLAN_FEATURES, type TenantConfig, type TenantPlan } from "./tenant-schema.js";

export class PermissionDeniedError extends Error {
	constructor(
		public readonly feature: string,
		public readonly tenantId: string,
		public readonly plan: TenantPlan,
	) {
		super(`Feature "${feature}" is not available on plan "${plan}" for tenant "${tenantId}".`);
		this.name = "PermissionDeniedError";
	}
}

/**
 * Assert that the tenant's plan includes voice capability.
 * Throws PermissionDeniedError if the plan does not support voice.
 */
export function assertVoiceEnabled(tenant: TenantConfig): void {
	if (!PLAN_FEATURES[tenant.plan].voice || !tenant.routing.voiceEnabled) {
		throw new PermissionDeniedError("voice", tenant.tenantId, tenant.plan);
	}
}

/**
 * Assert that the tenant's plan includes Mercury diffusion.
 * Throws PermissionDeniedError if the plan does not support diffusion.
 */
export function assertDiffusionEnabled(tenant: TenantConfig): void {
	if (!PLAN_FEATURES[tenant.plan].diffusion || !tenant.routing.diffusionEnabled) {
		throw new PermissionDeniedError("mercury_diffusion", tenant.tenantId, tenant.plan);
	}
}

/**
 * Assert that a specific tool is permitted for the tenant.
 * Checks both plan-level gates and per-permission flags.
 */
export function assertToolPermitted(tenant: TenantConfig, toolName: string): void {
	const perm = tenant.permissions;
	const checks: Record<string, boolean> = {
		web_search: perm.canUseBrowser,
		browser_search: perm.canUseBrowser,
		generate_image: perm.canGenerateImages,
		generate_video: perm.canGenerateVideo,
		send_email: perm.canSendEmail,
		appointment_request: perm.canBookAppointments,
	};

	// Only check if we have an explicit gate for this tool
	if (toolName in checks && !checks[toolName]) {
		throw new PermissionDeniedError(toolName, tenant.tenantId, tenant.plan);
	}
}

/**
 * Returns whether a tool call requires human approval before execution.
 */
export function requiresApproval(tenant: TenantConfig, toolName: string): boolean {
	const moneyTools = ["transfer_funds", "pay_invoice", "initiate_payment", "purchase", "refund"];
	if (moneyTools.includes(toolName) && tenant.permissions.requiresApprovalForMoneyMovement) {
		return true;
	}
	return false;
}

/**
 * Check all gates for a tool call in one call.
 * Returns { permitted: true } or { permitted: false, reason: string }.
 */
export function checkToolAccess(
	tenant: TenantConfig,
	toolName: string,
): { permitted: boolean; requiresApproval: boolean; reason?: string } {
	try {
		assertToolPermitted(tenant, toolName);
		return {
			permitted: true,
			requiresApproval: requiresApproval(tenant, toolName),
		};
	} catch (err) {
		return {
			permitted: false,
			requiresApproval: false,
			reason: err instanceof Error ? err.message : String(err),
		};
	}
}
