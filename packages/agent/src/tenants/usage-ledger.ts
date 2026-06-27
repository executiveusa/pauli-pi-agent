/**
 * Usage ledger.
 * Records per-session usage data for billing, monitoring, and client reporting.
 *
 * SECURITY: The ledger logs must never include provider API keys, raw secrets,
 * or unstable diffusion fragments unless explicitly marked as visual telemetry.
 * Internal logs stay server-side. Client-facing usage is a safe subset.
 */

export interface UsageRecord {
	tenantId: string;
	sessionId: string;
	mode: string;
	model: string;
	provider: string;
	reasoningEffort: string;
	diffusionEnabled: boolean;
	voiceEnabled: boolean;
	estimatedInputTokens: number;
	estimatedOutputTokens: number;
	latencyMs: number;
	toolCalls: string[];
	errors: string[];
	timestamp: number;
}

/** Client-safe subset of UsageRecord (no internal details). */
export interface ClientUsageSummary {
	sessionId: string;
	mode: string;
	model: string;
	estimatedInputTokens: number;
	estimatedOutputTokens: number;
	sessionCount: number;
}

const ledgerEntries: UsageRecord[] = [];

/** Append a usage record to the in-process ledger. */
export function recordUsage(entry: UsageRecord): void {
	if (process.env.ARCHONX_USAGE_LOGGING !== "true") return;
	// Never log secrets — sanity strip any key-shaped values
	ledgerEntries.push(sanitizeEntry(entry));
}

/** Returns a client-safe summary for the current session. */
export function getClientSummary(sessionId: string): ClientUsageSummary | null {
	const entries = ledgerEntries.filter((e) => e.sessionId === sessionId);
	if (!entries.length) return null;

	const last = entries[entries.length - 1];
	const totalInput = entries.reduce((s, e) => s + e.estimatedInputTokens, 0);
	const totalOutput = entries.reduce((s, e) => s + e.estimatedOutputTokens, 0);

	return {
		sessionId,
		mode: last.mode,
		model: last.model,
		estimatedInputTokens: totalInput,
		estimatedOutputTokens: totalOutput,
		sessionCount: entries.length,
	};
}

/** Returns all records for internal monitoring (server-side only). */
export function getAllRecords(): Readonly<UsageRecord[]> {
	return ledgerEntries;
}

/** Returns aggregated usage for a tenant. */
export function getTenantUsageLedger(tenantId: string): {
	inputTokens: number;
	outputTokens: number;
	estimatedCost: number;
} {
	const entries = ledgerEntries.filter((e) => e.tenantId === tenantId);
	const inputTokens = entries.reduce((sum, e) => sum + e.estimatedInputTokens, 0);
	const outputTokens = entries.reduce((sum, e) => sum + e.estimatedOutputTokens, 0);

	// Rough cost estimate: $0.01 per 1k input tokens, $0.03 per 1k output tokens
	const estimatedCost = (inputTokens / 1000) * 0.01 + (outputTokens / 1000) * 0.03;

	return { inputTokens, outputTokens, estimatedCost };
}

function sanitizeEntry(entry: UsageRecord): UsageRecord {
	// Strip any field that looks like an API key
	const safe = { ...entry };
	for (const [key, val] of Object.entries(safe)) {
		if (typeof val === "string" && /^(sk-|Bearer |pk-)/i.test(val)) {
			(safe as Record<string, unknown>)[key] = "[REDACTED]";
		}
	}
	return safe;
}
