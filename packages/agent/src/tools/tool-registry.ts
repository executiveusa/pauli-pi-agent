/**
 * ArchonX tool registry.
 * Register tools and look them up by name.
 * All registered tools are available for routing and permission checks.
 */

import type { ToolDefinition } from "./tool-types.js";

const registry = new Map<string, ToolDefinition>();

/** Register a tool. Throws if a tool with the same name is already registered. */
export function registerTool(tool: ToolDefinition): void {
	if (registry.has(tool.name)) {
		throw new Error(`Tool "${tool.name}" is already registered.`);
	}
	registry.set(tool.name, tool);
}

/** Look up a registered tool by name. Returns undefined if not found. */
export function getTool(name: string): ToolDefinition | undefined {
	return registry.get(name);
}

/** Returns all registered tools. */
export function listTools(): ToolDefinition[] {
	return Array.from(registry.values());
}

/** Unregister a tool (e.g., for testing). */
export function unregisterTool(name: string): void {
	registry.delete(name);
}

// ─── Built-in stub tools ────────────────────────────────────────────────────

registerTool({
	name: "lead_capture",
	description: "Capture visitor lead information (name, email, intent). Stores for CRM follow-up.",
	inputSchema: {
		type: "object",
		properties: {
			name: { type: "string" },
			email: { type: "string", format: "email" },
			phone: { type: "string" },
			intent: { type: "string" },
		},
		required: ["name", "email"],
	},
	permissionScope: "lead_capture",
	requiresApproval: false,
	async handler(input) {
		// Stub: In production, write to CRM / Supabase
		return { success: true, message: `Lead captured for ${(input as Record<string, string>).email}` };
	},
});

registerTool({
	name: "appointment_request",
	description: "Request an appointment or consultation booking.",
	inputSchema: {
		type: "object",
		properties: {
			name: { type: "string" },
			email: { type: "string" },
			preferredDate: { type: "string" },
			preferredTime: { type: "string" },
			notes: { type: "string" },
		},
		required: ["name", "email"],
	},
	permissionScope: "appointment",
	requiresApproval: false,
	async handler(input) {
		return { success: true, message: `Appointment requested for ${(input as Record<string, string>).name}` };
	},
});

registerTool({
	name: "quote_request",
	description: "Request a service quote or estimate.",
	inputSchema: {
		type: "object",
		properties: {
			serviceType: { type: "string" },
			description: { type: "string" },
			budget: { type: "string" },
			contactEmail: { type: "string" },
		},
		required: ["serviceType", "contactEmail"],
	},
	permissionScope: "quote",
	requiresApproval: false,
	async handler(input) {
		return { success: true, message: `Quote request submitted for ${(input as Record<string, string>).serviceType}` };
	},
});

registerTool({
	name: "upload_context",
	description: "Upload a document or file to provide context for the conversation.",
	inputSchema: {
		type: "object",
		properties: {
			filename: { type: "string" },
			mimeType: { type: "string" },
			contentBase64: { type: "string" },
		},
		required: ["filename", "contentBase64"],
	},
	permissionScope: "upload",
	requiresApproval: false,
	async handler(_input) {
		return { success: true, message: "Document context uploaded." };
	},
});

registerTool({
	name: "generate_asset_request",
	description: "Request generation of an asset (image, video, document).",
	inputSchema: {
		type: "object",
		properties: {
			assetType: { type: "string", enum: ["image", "video", "document"] },
			prompt: { type: "string" },
			style: { type: "string" },
		},
		required: ["assetType", "prompt"],
	},
	permissionScope: "asset_generation",
	requiresApproval: true,
	async handler(input) {
		return {
			success: true,
			message: `Asset generation request queued: ${(input as Record<string, string>).assetType}`,
		};
	},
});
