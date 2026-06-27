export interface MCPToolResult {
	success: boolean;
	data: unknown;
	error?: string;
	retries?: number;
	duration_ms: number;
	tool: string;
	args: Record<string, unknown>;
}

export interface MCPToolConfig {
	name: string;
	description: string;
	category: "github" | "supabase" | "vercel" | "cloudflare" | "browser" | "notion" | "search";
	retries: number;
	timeout_ms: number;
}

export interface RetryOptions {
	maxRetries: number;
	baseDelayMs: number;
	maxDelayMs: number;
}

export interface GithubSearchOptions {
	type?: "code" | "repositories" | "commits" | "issues";
	language?: string;
	repo?: string;
	owner?: string;
	page?: number;
	per_page?: number;
}

export interface GithubPushFile {
	path: string;
	content: string;
}

export interface VercelDeployOptions {
	env?: Record<string, string>;
	buildCommand?: string;
	outputDirectory?: string;
	framework?: string;
	regions?: string[];
}

export interface CloudflareKVValue {
	key: string;
	value: string;
	expiration_ttl?: number;
}

export interface CrawlResult {
	url: string;
	status: number;
	links: string[];
	broken: BrokenCrawlLink[];
}

export interface BrokenCrawlLink {
	url: string;
	status: number;
	found_on: string;
}
