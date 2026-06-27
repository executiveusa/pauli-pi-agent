/**
 * Tenant loader.
 * Resolves a tenant config from:
 *   1. Local JSON file (ARCHONX_TENANT_CONFIG_MODE=local)
 *   2. Remote ArchonX control plane API (ARCHONX_TENANT_CONFIG_MODE=remote)
 *   3. In-memory cache keyed by tenantId
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEMO_TENANT } from "./demo-tenant.js";
import type { TenantConfig } from "./tenant-schema.js";

const cache = new Map<string, TenantConfig>();

/**
 * Load tenant config by ID.
 * In local mode, reads from .agents/tenants/<tenantId>.json if it exists,
 * falling back to the built-in demo tenant for "client_demo".
 */
export async function loadTenantConfig(tenantId: string): Promise<TenantConfig> {
	const cached = cache.get(tenantId);
	if (cached) return cached;

	const mode = process.env.ARCHONX_TENANT_CONFIG_MODE ?? "local";

	if (mode === "remote") {
		return loadRemoteTenant(tenantId);
	}

	return loadLocalTenant(tenantId);
}

function loadLocalTenant(tenantId: string): TenantConfig {
	// 1. Built-in demo tenant
	if (tenantId === "client_demo") {
		cache.set(tenantId, DEMO_TENANT);
		return DEMO_TENANT;
	}

	// 2. File-based config
	const configPath = join(process.cwd(), ".agents", "tenants", `${tenantId}.json`);
	if (existsSync(configPath)) {
		try {
			const raw = readFileSync(configPath, "utf-8");
			const config = JSON.parse(raw) as TenantConfig;
			cache.set(tenantId, config);
			return config;
		} catch (err) {
			throw new Error(`Failed to parse tenant config at ${configPath}: ${String(err)}`);
		}
	}

	throw new Error(`Tenant "${tenantId}" not found. Create .agents/tenants/${tenantId}.json or use "client_demo".`);
}

async function loadRemoteTenant(tenantId: string): Promise<TenantConfig> {
	const controlPlaneUrl = process.env.ARCHONX_CONTROL_PLANE_URL ?? "http://localhost:3000";
	const url = `${controlPlaneUrl}/v1/tenant/config?tenantId=${encodeURIComponent(tenantId)}`;

	const resp = await fetch(url, {
		headers: { "Content-Type": "application/json" },
		signal: AbortSignal.timeout(5000),
	});

	if (!resp.ok) {
		throw new Error(`Control plane returned ${resp.status} for tenant "${tenantId}"`);
	}

	const config = (await resp.json()) as TenantConfig;
	cache.set(tenantId, config);
	return config;
}

/** Invalidate the tenant cache (e.g., after config update). */
export function invalidateTenantCache(tenantId?: string): void {
	if (tenantId) {
		cache.delete(tenantId);
	} else {
		cache.clear();
	}
}
