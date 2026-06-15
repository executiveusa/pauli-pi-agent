import * as fs from "node:fs";
import * as path from "node:path";
import type { MCPToolResult } from "./types.js";

const LOG_DIR = path.resolve(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "mcp-activity.jsonl");

export interface LogEntry {
	timestamp: string;
	tool: string;
	args: Record<string, unknown>;
	duration_ms: number;
	success: boolean;
	error?: string;
	retries?: number;
}

function ensureLogDir(): void {
	if (!fs.existsSync(LOG_DIR)) {
		fs.mkdirSync(LOG_DIR, { recursive: true });
	}
}

function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
	const SENSITIVE_KEYS = new Set(["password", "token", "secret", "key", "auth", "credential", "api_key", "access_token"]);
	const sanitized: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(args)) {
		if (SENSITIVE_KEYS.has(k.toLowerCase())) {
			sanitized[k] = "[REDACTED]";
		} else if (typeof v === "string" && v.length > 500) {
			sanitized[k] = `${v.slice(0, 200)}...[truncated ${v.length - 200} chars]`;
		} else {
			sanitized[k] = v;
		}
	}
	return sanitized;
}

export function logToolCall(result: MCPToolResult): void {
	const entry: LogEntry = {
		timestamp: new Date().toISOString(),
		tool: result.tool,
		args: sanitizeArgs(result.args),
		duration_ms: result.duration_ms,
		success: result.success,
		...(result.error !== undefined && { error: result.error }),
		...(result.retries !== undefined && result.retries > 0 && { retries: result.retries }),
	};

	// Console output (JSON format for structured logging pipelines)
	const level = result.success ? "INFO" : "ERROR";
	process.stdout.write(
		`[${entry.timestamp}] [${level}] [mcp-cli] tool=${entry.tool} duration=${entry.duration_ms}ms success=${entry.success}${entry.error ? ` error=${JSON.stringify(entry.error)}` : ""}\n`,
	);

	// Append to JSONL file (non-blocking, best-effort)
	try {
		ensureLogDir();
		fs.appendFileSync(LOG_FILE, `${JSON.stringify(entry)}\n`, "utf8");
	} catch (err) {
		// Non-fatal — we never want logging to break the caller
		process.stderr.write(`[mcp-cli/logger] Failed to write log: ${String(err)}\n`);
	}
}

export function logToolStart(tool: string, args: Record<string, unknown>): number {
	const start = Date.now();
	process.stdout.write(
		`[${new Date().toISOString()}] [DEBUG] [mcp-cli] START tool=${tool} args=${JSON.stringify(sanitizeArgs(args))}\n`,
	);
	return start;
}

export function buildResult(
	tool: string,
	args: Record<string, unknown>,
	startMs: number,
	data: unknown,
	error?: string,
	retries?: number,
): MCPToolResult {
	const result: MCPToolResult = {
		success: error === undefined,
		data,
		...(error !== undefined && { error }),
		...(retries !== undefined && { retries }),
		duration_ms: Date.now() - startMs,
		tool,
		args,
	};
	logToolCall(result);
	return result;
}
