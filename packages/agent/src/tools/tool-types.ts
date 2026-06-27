/**
 * ArchonX tool type definitions.
 * All tools must declare their name, schema, permission scope,
 * approval requirement, and handler. Frontend never calls tools directly —
 * all tool calls route through the agent with tenant permission checks.
 */

/** Permission scope required to execute this tool. */
export type ToolPermissionScope =
	| "lead_capture"
	| "appointment"
	| "quote"
	| "upload"
	| "asset_generation"
	| "browser"
	| "email"
	| "payment";

/** A typed tool definition with permission metadata. */
export interface ToolDefinition<TInput = Record<string, unknown>, TOutput = Record<string, unknown>> {
	name: string;
	description: string;
	/** JSON Schema for the input parameters. */
	inputSchema: Record<string, unknown>;
	/** Which tenant permission scope this tool requires. */
	permissionScope: ToolPermissionScope;
	/** Whether this tool requires human approval before execution. */
	requiresApproval: boolean;
	/** Execute the tool. Throw on failure — do not encode errors in output. */
	handler(input: TInput): Promise<TOutput>;
}

/** Generic tool result returned to the agent. */
export interface ToolResult<T = Record<string, unknown>> {
	success: boolean;
	data?: T;
	errorMessage?: string;
}
