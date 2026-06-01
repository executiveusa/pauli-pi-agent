/**
 * ArchonX tool router.
 * Validates tenant permissions and executes tool calls.
 * Frontend never calls tools directly — all calls pass through here.
 */

import { checkToolAccess } from "../tenants/tenant-permissions.js";
import type { TenantConfig } from "../tenants/tenant-schema.js";
import { getTool } from "./tool-registry.js";
import type { ToolResult } from "./tool-types.js";

export interface ToolCallRequest {
	toolName: string;
	input: Record<string, unknown>;
}

export interface ToolCallResponse<T = Record<string, unknown>> {
	toolName: string;
	result: ToolResult<T>;
	/** True if the tool was blocked by permission gate. */
	blocked: boolean;
	/** True if the tool requires human approval before execution. */
	pendingApproval: boolean;
}

/**
 * Route and execute a tool call, enforcing tenant permissions.
 *
 * @param request - The tool call to route
 * @param tenant  - The active tenant (controls which tools are allowed)
 * @param approved - Pass true if a human has already approved this call
 */
export async function routeToolCall(
	request: ToolCallRequest,
	tenant: TenantConfig,
	approved = false,
): Promise<ToolCallResponse> {
	const { toolName, input } = request;

	// 1. Look up tool in registry
	const tool = getTool(toolName);
	if (!tool) {
		return {
			toolName,
			result: { success: false, errorMessage: `Tool "${toolName}" is not registered.` },
			blocked: true,
			pendingApproval: false,
		};
	}

	// 2. Check tenant permission
	const access = checkToolAccess(tenant, toolName);
	if (!access.permitted) {
		return {
			toolName,
			result: { success: false, errorMessage: access.reason },
			blocked: true,
			pendingApproval: false,
		};
	}

	// 3. Check approval requirement
	if (access.requiresApproval && !approved) {
		return {
			toolName,
			result: { success: false, errorMessage: `Tool "${toolName}" requires human approval.` },
			blocked: false,
			pendingApproval: true,
		};
	}

	// 4. Execute
	try {
		const data = await tool.handler(input);
		return {
			toolName,
			result: { success: true, data },
			blocked: false,
			pendingApproval: false,
		};
	} catch (err) {
		return {
			toolName,
			result: {
				success: false,
				errorMessage: err instanceof Error ? err.message : String(err),
			},
			blocked: false,
			pendingApproval: false,
		};
	}
}
