/**
 * MCP CLI — Main entry point and tool registry
 *
 * Re-exports all wrappers and types. Import from this module:
 *   import { github_search, supabase_query, vercel_deploy } from '@/lib/mcp-cli'
 */

export * from "./types.js";
export * from "./logger.js";
export * from "./wrappers.js";

import type { MCPToolConfig } from "./types.js";

/**
 * Registry of all available MCP tool wrappers with metadata.
 * Used by orchestrators to discover capabilities at runtime.
 */
export const TOOL_REGISTRY: MCPToolConfig[] = [
	// GitHub
	{ name: "github_search", description: "Search GitHub code or repositories", category: "github", retries: 3, timeout_ms: 15000 },
	{ name: "github_create_pr", description: "Create a GitHub pull request", category: "github", retries: 2, timeout_ms: 20000 },
	{ name: "github_get_file", description: "Retrieve file contents from GitHub", category: "github", retries: 3, timeout_ms: 10000 },
	{ name: "github_push_files", description: "Push files to a GitHub repository", category: "github", retries: 2, timeout_ms: 30000 },
	// Supabase
	{ name: "supabase_query", description: "Execute SQL on Supabase", category: "supabase", retries: 3, timeout_ms: 30000 },
	{ name: "supabase_list_tables", description: "List tables in Supabase project", category: "supabase", retries: 2, timeout_ms: 10000 },
	{
		name: "supabase_apply_migration",
		description: "Apply a SQL migration to Supabase",
		category: "supabase",
		retries: 1,
		timeout_ms: 60000,
	},
	// Vercel
	{ name: "vercel_deploy", description: "Deploy a project to Vercel", category: "vercel", retries: 2, timeout_ms: 120000 },
	{ name: "vercel_list_deployments", description: "List Vercel deployments", category: "vercel", retries: 3, timeout_ms: 15000 },
	{ name: "vercel_get_logs", description: "Get Vercel runtime logs", category: "vercel", retries: 2, timeout_ms: 20000 },
	{ name: "deploy_vercel", description: "Deploy to Vercel (alias with retry)", category: "vercel", retries: 3, timeout_ms: 120000 },
	// Cloudflare
	{
		name: "cloudflare_d1_query",
		description: "Query a Cloudflare D1 database",
		category: "cloudflare",
		retries: 3,
		timeout_ms: 20000,
	},
	{
		name: "cloudflare_kv_get",
		description: "Get a value from Cloudflare KV",
		category: "cloudflare",
		retries: 3,
		timeout_ms: 10000,
	},
	// Browser
	{ name: "browser_navigate", description: "Navigate browser to a URL", category: "browser", retries: 2, timeout_ms: 30000 },
	{ name: "browser_screenshot", description: "Take a browser screenshot", category: "browser", retries: 2, timeout_ms: 15000 },
	{
		name: "browser_check_console_errors",
		description: "Get browser console errors",
		category: "browser",
		retries: 1,
		timeout_ms: 10000,
	},
	{ name: "crawl_site", description: "Crawl a site and check for broken links", category: "browser", retries: 1, timeout_ms: 300000 },
	// Search
	{ name: "search_web", description: "Search the web or academic papers", category: "search", retries: 2, timeout_ms: 20000 },
];

/** Look up tool config by name */
export function getToolConfig(name: string): MCPToolConfig | undefined {
	return TOOL_REGISTRY.find((t) => t.name === name);
}

/** Get all tools in a category */
export function getToolsByCategory(category: MCPToolConfig["category"]): MCPToolConfig[] {
	return TOOL_REGISTRY.filter((t) => t.category === category);
}
