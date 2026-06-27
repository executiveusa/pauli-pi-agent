/**
 * MCP CLI Wrappers
 *
 * Snake_case wrappers around all MCP tool calls with consistent error handling,
 * retry logic (exponential backoff: 1s, 2s, 4s), timing, and structured output.
 *
 * NOTE: MCP tools are injected at runtime by the Claude Code harness.
 * The `mcp` namespace below represents those globally-available tool calls.
 * In tests or non-MCP environments the stubs at the bottom can be swapped in.
 */

import { buildResult, logToolStart } from "./logger.js";
import type { BrokenCrawlLink, CrawlResult, GithubPushFile, GithubSearchOptions, MCPToolResult, RetryOptions, VercelDeployOptions } from "./types.js";

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

const DEFAULT_RETRY: RetryOptions = {
	maxRetries: 3,
	baseDelayMs: 1000,
	maxDelayMs: 8000,
};

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = DEFAULT_RETRY,
): Promise<{ result: T; retries: number }> {
	let lastError: unknown;
	for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
		try {
			const result = await fn();
			return { result, retries: attempt };
		} catch (err) {
			lastError = err;
			if (attempt < options.maxRetries) {
				const delay = Math.min(options.baseDelayMs * 2 ** attempt, options.maxDelayMs);
				await sleep(delay);
			}
		}
	}
	throw lastError;
}

// ---------------------------------------------------------------------------
// MCP shim — these are the actual MCP tool call signatures.
// The Claude Code harness provides them globally; we cast through `unknown`
// to avoid TypeScript errors in environments without the runtime shim.
// ---------------------------------------------------------------------------

type MCPFn = (...args: unknown[]) => Promise<unknown>;

function getMCPTool(qualifiedName: string): MCPFn {
	// biome-ignore lint/suspicious/noExplicitAny: MCP tools are runtime-injected globals
	const g = globalThis as any;
	// The harness may expose MCP tools on a special namespace or directly.
	const tool: MCPFn | undefined = g[qualifiedName] ?? g.__mcp__?.[qualifiedName];
	if (!tool) {
		throw new Error(
			`MCP tool '${qualifiedName}' is not available in this environment. ` +
				`Ensure the appropriate MCP server is connected in .claude/settings.json.`,
		);
	}
	return tool;
}

// ---------------------------------------------------------------------------
// GitHub wrappers
// ---------------------------------------------------------------------------

export async function github_search(query: string, options: GithubSearchOptions = {}): Promise<MCPToolResult> {
	if (!query || query.trim().length === 0) throw new Error("github_search: query is required");
	const args = { query, ...options };
	const start = logToolStart("github_search", args);
	try {
		const { result, retries } = await withRetry(async () => {
			if ((options.type ?? "code") === "repositories") {
				return getMCPTool("mcp__github__search_repositories")({ query });
			}
			return getMCPTool("mcp__github__search_code")({ q: query, ...options });
		});
		return buildResult("github_search", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("github_search", args, start, null, String(err));
	}
}

export async function github_create_pr(
	title: string,
	body: string,
	head: string,
	base: string,
	owner?: string,
	repo?: string,
): Promise<MCPToolResult> {
	if (!title) throw new Error("github_create_pr: title is required");
	if (!head) throw new Error("github_create_pr: head branch is required");
	if (!base) throw new Error("github_create_pr: base branch is required");
	const args = { title, body, head, base, owner, repo };
	const start = logToolStart("github_create_pr", args);
	try {
		const { result, retries } = await withRetry(async () =>
			getMCPTool("mcp__github__create_pull_request")({ title, body, head, base, owner, repo }),
		);
		return buildResult("github_create_pr", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("github_create_pr", args, start, null, String(err));
	}
}

export async function github_get_file(owner: string, repo: string, filePath: string, ref?: string): Promise<MCPToolResult> {
	if (!owner) throw new Error("github_get_file: owner is required");
	if (!repo) throw new Error("github_get_file: repo is required");
	if (!filePath) throw new Error("github_get_file: path is required");
	const args = { owner, repo, path: filePath, ...(ref !== undefined && { ref }) };
	const start = logToolStart("github_get_file", args);
	try {
		const { result, retries } = await withRetry(async () =>
			getMCPTool("mcp__github__get_file_contents")({ owner, repo, path: filePath, ...(ref !== undefined && { ref }) }),
		);
		return buildResult("github_get_file", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("github_get_file", args, start, null, String(err));
	}
}

export async function github_push_files(
	files: GithubPushFile[],
	message: string,
	owner?: string,
	repo?: string,
	branch?: string,
): Promise<MCPToolResult> {
	if (!files || files.length === 0) throw new Error("github_push_files: files array is required and must not be empty");
	if (!message) throw new Error("github_push_files: commit message is required");
	const args = { files, message, owner, repo, branch };
	const start = logToolStart("github_push_files", args);
	try {
		const { result, retries } = await withRetry(async () =>
			getMCPTool("mcp__github__push_files")({ files, message, owner, repo, branch }),
		);
		return buildResult("github_push_files", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("github_push_files", args, start, null, String(err));
	}
}

// ---------------------------------------------------------------------------
// Supabase wrappers
// ---------------------------------------------------------------------------

export async function supabase_query(sql: string, project_id?: string): Promise<MCPToolResult> {
	if (!sql || sql.trim().length === 0) throw new Error("supabase_query: sql is required");
	const args: Record<string, unknown> = { sql, ...(project_id !== undefined && { project_id }) };
	const start = logToolStart("supabase_query", args);
	try {
		const { result, retries } = await withRetry(async () =>
			getMCPTool("mcp__91731981-3a11-4171-8d18-535745552ed9__execute_sql")({ query: sql, project_id }),
		);
		return buildResult("supabase_query", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("supabase_query", args, start, null, String(err));
	}
}

export async function supabase_list_tables(project_id?: string): Promise<MCPToolResult> {
	const args: Record<string, unknown> = { ...(project_id !== undefined && { project_id }) };
	const start = logToolStart("supabase_list_tables", args);
	try {
		const { result, retries } = await withRetry(async () =>
			getMCPTool("mcp__91731981-3a11-4171-8d18-535745552ed9__list_tables")({ project_id }),
		);
		return buildResult("supabase_list_tables", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("supabase_list_tables", args, start, null, String(err));
	}
}

export async function supabase_apply_migration(sql: string, name: string, project_id?: string): Promise<MCPToolResult> {
	if (!sql || sql.trim().length === 0) throw new Error("supabase_apply_migration: sql is required");
	if (!name) throw new Error("supabase_apply_migration: migration name is required");
	const args: Record<string, unknown> = { sql, name, ...(project_id !== undefined && { project_id }) };
	const start = logToolStart("supabase_apply_migration", args);
	try {
		const { result, retries } = await withRetry(async () =>
			getMCPTool("mcp__91731981-3a11-4171-8d18-535745552ed9__apply_migration")({ query: sql, name, project_id }),
		);
		return buildResult("supabase_apply_migration", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("supabase_apply_migration", args, start, null, String(err));
	}
}

// ---------------------------------------------------------------------------
// Vercel wrappers
// ---------------------------------------------------------------------------

export async function vercel_deploy(project: string, options?: VercelDeployOptions): Promise<MCPToolResult> {
	if (!project) throw new Error("vercel_deploy: project name is required");
	const args: Record<string, unknown> = { project, ...options };
	const start = logToolStart("vercel_deploy", args);
	try {
		const { result, retries } = await withRetry(async () =>
			getMCPTool("mcp__d3e00683-97b0-4af0-9087-45789d61b846__deploy_to_vercel")({ project, ...options }),
		);
		return buildResult("vercel_deploy", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("vercel_deploy", args, start, null, String(err));
	}
}

export async function vercel_list_deployments(project?: string): Promise<MCPToolResult> {
	const args: Record<string, unknown> = { ...(project !== undefined && { project }) };
	const start = logToolStart("vercel_list_deployments", args);
	try {
		const { result, retries } = await withRetry(async () =>
			getMCPTool("mcp__d3e00683-97b0-4af0-9087-45789d61b846__list_deployments")({ project }),
		);
		return buildResult("vercel_list_deployments", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("vercel_list_deployments", args, start, null, String(err));
	}
}

export async function vercel_get_logs(deployment_id: string): Promise<MCPToolResult> {
	if (!deployment_id) throw new Error("vercel_get_logs: deployment_id is required");
	const args = { deployment_id };
	const start = logToolStart("vercel_get_logs", args);
	try {
		const { result, retries } = await withRetry(async () =>
			getMCPTool("mcp__d3e00683-97b0-4af0-9087-45789d61b846__get_runtime_logs")({ deploymentId: deployment_id }),
		);
		return buildResult("vercel_get_logs", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("vercel_get_logs", args, start, null, String(err));
	}
}

/** Alias for vercel_deploy with built-in retry and optional config */
export async function deploy_vercel(project: string, config?: VercelDeployOptions): Promise<MCPToolResult> {
	return vercel_deploy(project, config);
}

// ---------------------------------------------------------------------------
// Cloudflare wrappers
// ---------------------------------------------------------------------------

export async function cloudflare_d1_query(database_id: string, sql: string, params?: unknown[]): Promise<MCPToolResult> {
	if (!database_id) throw new Error("cloudflare_d1_query: database_id is required");
	if (!sql || sql.trim().length === 0) throw new Error("cloudflare_d1_query: sql is required");
	const args: Record<string, unknown> = { database_id, sql, ...(params !== undefined && { params }) };
	const start = logToolStart("cloudflare_d1_query", args);
	try {
		const { result, retries } = await withRetry(async () =>
			getMCPTool("mcp__6f08e438-09e7-412d-801d-f7f51fb14014__d1_database_query")({
				database_id,
				sql,
				...(params !== undefined && { params }),
			}),
		);
		return buildResult("cloudflare_d1_query", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("cloudflare_d1_query", args, start, null, String(err));
	}
}

export async function cloudflare_kv_get(namespace_id: string, key: string): Promise<MCPToolResult> {
	if (!namespace_id) throw new Error("cloudflare_kv_get: namespace_id is required");
	if (!key) throw new Error("cloudflare_kv_get: key is required");
	const args = { namespace_id, key };
	const start = logToolStart("cloudflare_kv_get", args);
	try {
		const { result, retries } = await withRetry(async () =>
			getMCPTool("mcp__6f08e438-09e7-412d-801d-f7f51fb14014__kv_namespace_get")({ namespace_id, key }),
		);
		return buildResult("cloudflare_kv_get", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("cloudflare_kv_get", args, start, null, String(err));
	}
}

// ---------------------------------------------------------------------------
// Browser / Chrome DevTools wrappers
// ---------------------------------------------------------------------------

export async function browser_navigate(url: string): Promise<MCPToolResult> {
	if (!url) throw new Error("browser_navigate: url is required");
	try { new URL(url); } catch { throw new Error(`browser_navigate: invalid URL '${url}'`); }
	const args = { url };
	const start = logToolStart("browser_navigate", args);
	try {
		// Chrome DevTools MCP — navigate action
		const { result, retries } = await withRetry(async () => {
			const tool = getMCPTool("mcp__chrome__navigate") ?? getMCPTool("mcp__browser__navigate");
			return tool({ url });
		});
		return buildResult("browser_navigate", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("browser_navigate", args, start, null, String(err));
	}
}

export async function browser_screenshot(selector?: string): Promise<MCPToolResult> {
	const args: Record<string, unknown> = { ...(selector !== undefined && { selector }) };
	const start = logToolStart("browser_screenshot", args);
	try {
		const { result, retries } = await withRetry(async () => {
			const tool = getMCPTool("mcp__chrome__screenshot") ?? getMCPTool("mcp__browser__screenshot");
			return tool({ ...(selector !== undefined && { selector }) });
		});
		return buildResult("browser_screenshot", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("browser_screenshot", args, start, null, String(err));
	}
}

export async function browser_check_console_errors(): Promise<MCPToolResult> {
	const args = {};
	const start = logToolStart("browser_check_console_errors", args);
	try {
		const { result, retries } = await withRetry(async () => {
			const tool = getMCPTool("mcp__chrome__get_console_logs") ?? getMCPTool("mcp__browser__console_errors");
			return tool({});
		});
		return buildResult("browser_check_console_errors", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("browser_check_console_errors", args, start, null, String(err));
	}
}

// ---------------------------------------------------------------------------
// Composite: crawl_site
// ---------------------------------------------------------------------------

export async function crawl_site(baseUrl: string, depth = 1): Promise<MCPToolResult> {
	if (!baseUrl) throw new Error("crawl_site: url is required");
	const args = { url: baseUrl, depth };
	const start = logToolStart("crawl_site", args);

	try {
		const visited = new Set<string>();
		const broken: BrokenCrawlLink[] = [];
		const queue: Array<{ url: string; foundOn: string; currentDepth: number }> = [
			{ url: baseUrl, foundOn: baseUrl, currentDepth: 0 },
		];
		const results: CrawlResult[] = [];

		// Normalise to same origin only
		const baseOrigin = new URL(baseUrl).origin;

		while (queue.length > 0) {
			const item = queue.shift();
			if (!item) break;
			const { url, foundOn, currentDepth } = item;
			if (visited.has(url)) continue;
			visited.add(url);

			// Navigate and capture
			const navResult = await browser_navigate(url);
			if (!navResult.success) {
				broken.push({ url, status: 0, found_on: foundOn });
				continue;
			}

			// Grab links via evaluate (best-effort via DevTools)
			let links: string[] = [];
			try {
				const evalTool = getMCPTool("mcp__chrome__evaluate") ?? getMCPTool("mcp__browser__evaluate");
				const evalResult = (await evalTool({
					expression: `Array.from(document.querySelectorAll('a[href]')).map(a => a.href)`,
				})) as { value?: string[] };
				links = Array.isArray(evalResult?.value) ? evalResult.value : [];
			} catch {
				// DevTools evaluate not available — skip link extraction
			}

			// Filter to same-origin links
			const internalLinks = links.filter((l) => {
				try {
					return new URL(l).origin === baseOrigin;
				} catch {
					return false;
				}
			});

			results.push({ url, status: 200, links: internalLinks, broken: [] });

			if (currentDepth < depth) {
				for (const link of internalLinks) {
					if (!visited.has(link)) {
						queue.push({ url: link, foundOn: url, currentDepth: currentDepth + 1 });
					}
				}
			}
		}

		return buildResult("crawl_site", args, start, { results, broken, pages_visited: visited.size });
	} catch (err) {
		return buildResult("crawl_site", args, start, null, String(err));
	}
}

// ---------------------------------------------------------------------------
// Search wrapper
// ---------------------------------------------------------------------------

export async function search_web(query: string): Promise<MCPToolResult> {
	if (!query || query.trim().length === 0) throw new Error("search_web: query is required");
	const args = { query };
	const start = logToolStart("search_web", args);
	try {
		// Try HuggingFace paper search first (academic queries), fall back to hub search
		const { result, retries } = await withRetry(async () => {
			try {
				return getMCPTool("mcp__07f4dfe7-a2f2-4021-b258-d0f54687fbc9__paper_search")({ query });
			} catch {
				return getMCPTool("mcp__07f4dfe7-a2f2-4021-b258-d0f54687fbc9__hub_repo_search")({ query });
			}
		});
		return buildResult("search_web", args, start, result, undefined, retries);
	} catch (err) {
		return buildResult("search_web", args, start, null, String(err));
	}
}
