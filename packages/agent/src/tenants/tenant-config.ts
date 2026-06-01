/**
 * Tenant config management.
 * Provides type-safe access to the active tenant configuration.
 */

import { DEMO_TENANT } from "./demo-tenant.js";
import type { TenantConfig } from "./tenant-schema.js";

let _activeTenant: TenantConfig | null = null;

/**
 * Set the active tenant configuration for this process/request.
 * In a multi-tenant deployment, call this per-request using the
 * resolved tenant from the request context.
 */
export function setActiveTenant(config: TenantConfig): void {
	_activeTenant = config;
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
 * Get the effective model ID for the active tenant.
 * Respects MERCURY_MODEL env override.
 */
export function getEffectiveModel(): string {
	const tenant = getActiveTenant();
	return process.env.MERCURY_MODEL ?? tenant.routing.defaultModel;
}
