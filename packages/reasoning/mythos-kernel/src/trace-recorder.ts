import type { TraceRecord, GoalPacket } from "./types.js";
import { MythosLoopPhase, type MythosDepth } from "./types.js";

export class TraceRecorder {
	private secretPatterns = [
		/sk-[a-zA-Z0-9]{48,}/g, // OpenAI keys
		/sk-ant-[a-zA-Z0-9]{90,}/g, // Anthropic keys
		/AKIA[0-9A-Z]{16}/g, // AWS access keys
		/Bearer\s+[a-zA-Z0-9._\-]+/g, // Bearer tokens
		/api[_-]?key[:\s]+[a-zA-Z0-9._\-]+/gi, // API keys
		/password[:\s]+\S+/gi, // Passwords
	];

	recordTrace(
		goalPacket: GoalPacket,
		loopNumber: number,
		phase: MythosLoopPhase,
		depth: MythosDepth,
		content: string,
		duration: number,
		tokensUsed: number
	): TraceRecord {
		const detectedSecrets = this.detectSecrets(content);
		const redacted = detectedSecrets.length > 0;

		return {
			traceId: this.generateTraceId(),
			goalPacketId: goalPacket.id,
			loopNumber,
			phase,
			depth,
			content: redacted ? this.redactContent(content) : content,
			redacted,
			detectedSecrets: detectedSecrets.map((s) => `${s.substring(0, 4)}...`), // Partial redaction for logging
			timestamp: new Date(),
			duration,
			tokensUsed,
		};
	}

	private detectSecrets(content: string): string[] {
		const found: string[] = [];

		for (const pattern of this.secretPatterns) {
			const matches = content.match(pattern);
			if (matches) {
				found.push(...matches);
			}
		}

		return found;
	}

	private redactContent(content: string): string {
		let redacted = content;

		for (const pattern of this.secretPatterns) {
			redacted = redacted.replace(pattern, "[REDACTED_SECRET]");
		}

		return redacted;
	}

	private generateTraceId(): string {
		return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	}

	formatTrace(trace: TraceRecord): string {
		const lines: string[] = [];

		lines.push(`=== TRACE: ${trace.traceId} ===`);
		lines.push(`Goal: ${trace.goalPacketId}`);
		lines.push(`Loop ${trace.loopNumber} - Phase: ${trace.phase} (Depth: ${trace.depth})`);
		lines.push(`Time: ${trace.timestamp.toISOString()}`);
		lines.push(`Duration: ${trace.duration}ms | Tokens: ${trace.tokensUsed}`);

		if (trace.redacted) {
			lines.push(`⚠️  CONTENT REDACTED: ${trace.detectedSecrets.length} secret(s) detected`);
		}

		lines.push("");
		lines.push(trace.content);
		lines.push("");

		return lines.join("\n");
	}

	formatTraces(traces: TraceRecord[]): string {
		return traces.map((t) => this.formatTrace(t)).join("\n---\n");
	}

	getTraceStats(traces: TraceRecord[]): {
		totalTraces: number;
		redactedCount: number;
		totalDuration: number;
		totalTokens: number;
		secretsDetected: number;
	} {
		let redactedCount = 0;
		let totalDuration = 0;
		let totalTokens = 0;
		let secretsDetected = 0;

		for (const trace of traces) {
			if (trace.redacted) redactedCount++;
			totalDuration += trace.duration;
			totalTokens += trace.tokensUsed;
			secretsDetected += trace.detectedSecrets.length;
		}

		return {
			totalTraces: traces.length,
			redactedCount,
			totalDuration,
			totalTokens,
			secretsDetected,
		};
	}

	validateTrace(trace: TraceRecord): { valid: boolean; issues: string[] } {
		const issues: string[] = [];

		// Check required fields
		if (!trace.traceId) issues.push("Missing traceId");
		if (!trace.goalPacketId) issues.push("Missing goalPacketId");
		if (!trace.content) issues.push("Missing content");

		// Check for unredacted secrets
		const remainingSecrets = this.detectSecrets(trace.content);
		if (remainingSecrets.length > 0) {
			issues.push(`Unredacted secrets in content: ${remainingSecrets.length}`);
		}

		return {
			valid: issues.length === 0,
			issues,
		};
	}
}
