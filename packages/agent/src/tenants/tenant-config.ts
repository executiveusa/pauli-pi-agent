/**
 * Tenant config management.
 * Provides type-safe access to the active tenant configuration.
 */

import { DEMO_TENANT } from "./demo-tenant.js";
import type { TenantConfig } from "./tenant-schema.js";
import { getTenantUsageLedger } from "./usage-ledger.js";

let _activeTenant: TenantConfig | null = null;
const _tenantCache: Map<string, TenantConfig> = new Map();

/**
 * Set the active tenant configuration for this process/request.
 * In a multi-tenant deployment, call this per-request using the
 * resolved tenant from the request context.
 */
export function setActiveTenant(config: TenantConfig): void {
	_activeTenant = config;
	_tenantCache.set(config.tenantId, config);
}

/**
 * Get the active tenant configuration.
 * Falls back to the demo tenant when ARCHONX_TENANT_CONFIG_MODE=local.
 * Throws if no tenant is set and fallback is disabled.
 */
export function getActiveTenant(): TenantConfig {
	if (_activeTenant) return _activeTenant;

	const mode = process.env.ARCHONX_TENANT_CONFIG_MODE ?? "local";
	if (mode === "local") {
		return DEMO_TENANT;
	}

	throw new Error(
		"No active tenant configured. Set ARCHONX_TENANT_CONFIG_MODE=local for development, " +
			"or call setActiveTenant() before handling requests.",
	);
}

/**
 * Get tenant configuration by ID
 */
export function getTenantConfig(tenantId: string): TenantConfig {
	// Check cache first
	if (_tenantCache.has(tenantId)) {
		return _tenantCache.get(tenantId)!;
	}

	// Check if it's the demo tenant
	if (tenantId === DEMO_TENANT.tenantId) {
		_tenantCache.set(tenantId, DEMO_TENANT);
		return DEMO_TENANT;
	}

	// Tenant not found - reject unknown tenants to preserve isolation
	// In production, load from database; in development, use explicit DEMO_TENANT ID
	throw new Error(`Tenant not found: ${tenantId}`);
}

/**
 * Get public (non-secret) parts of tenant configuration
 */
export function getTenantPublicConfig(tenantId: string): Record<string, unknown> {
	const tenant = getTenantConfig(tenantId);
	return {
		tenantId: tenant.tenantId,
		plan: tenant.plan,
		branding: tenant.branding,
		routing: tenant.routing,
		permissions: tenant.permissions,
	};
}

/**
 * Get usage metrics and billing information for a tenant
 */
export function getTenantUsage(tenantId: string): Record<string, unknown> {
	const ledger = getTenantUsageLedger(tenantId);
	const tenant = getTenantConfig(tenantId);

	return {
		tenantId,
		inputTokens: ledger.inputTokens,
		outputTokens: ledger.outputTokens,
		estimatedCost: ledger.estimatedCost,
		model: tenant.routing.defaultModel,
		paidByClient: tenant.billing.usagePaidByClient,
		timestamp: Date.now(),
	};
}

/**
 * Check if a tenant can use a specific feature
 */
export function canUseFeature(tenant: TenantConfig, feature: "voice" | "diffusion" | "tools"): boolean {
	switch (feature) {
		case "voice":
			return tenant.routing.voiceEnabled && ["voice", "mercury_diffusion"].includes(tenant.plan);
		case "diffusion":
			return tenant.routing.diffusionEnabled && tenant.plan === "mercury_diffusion";
		case "tools":
			return tenant.plan === "mercury_diffusion";
		default:
			return false;
	}
}

/**
 * Check if a tenant can execute a specific tool.
 * Does not check approval status for high-risk operations like money movement.
 */
export function canExecuteTool(tenant: TenantConfig, toolName: string): boolean {
	// Check if feature is available
	if (!canUseFeature(tenant, "tools")) {
		return false;
	}

	// Check permissions based on tool type
	const toolPermissionMap: Record<string, keyof TenantConfig["permissions"]> = {
		"browser-access": "canUseBrowser",
		"generate-image": "canGenerateImages",
		"generate-video": "canGenerateVideo",
		"send-email": "canSendEmail",
		"book-appointment": "canBookAppointments",
		// Money movement is NEVER directly executable - must go through approval gate
	};

	const requiredPermission = toolPermissionMap[toolName];
	if (requiredPermission) {
		return tenant.permissions[requiredPermission] as boolean;
	}

	// Deny by default (includes unknown tools and money-movement)
	return false;
}

/**
 * Check if money movement requires approval for a tenant.
 * When true, handleToolCall must block execution until approval is obtained.
 */
export function moneyMovementRequiresApproval(tenant: TenantConfig): boolean {
	return tenant.permissions.requiresApprovalForMoneyMovement;
}

/**
 * Get the effective model ID for the active tenant.
 * Respects MERCURY_MODEL env override.
 */
export function getEffectiveModel(): string {
	const tenant = getActiveTenant();
	return process.env.MERCURY_MODEL ?? tenant.routing.defaultModel;
}
