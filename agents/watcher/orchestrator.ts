/**
 * Watcher Agent Orchestrator
 *
 * Monitors all other agents and workflows in the Pauli Pi Software Factory.
 * Detects stuck loops, failures, cost spikes, and hallucinated outputs.
 * Intervenes with PAUSE, REROUTE, RETRY, or ESCALATE actions.
 * Logs all interventions to /logs/watcher.jsonl.
 */

import fs from "node:fs/promises";
import path from "node:path";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentId =
	| "builder"
	| "design"
	| "monetization"
	| "browser-qa"
	| "deployment";

export type EventType =
	| "STUCK_LOOP"
	| "FAILURE_DETECTED"
	| "COST_ALERT"
	| "HALLUCINATION"
	| "INTERVENTION"
	| "ESCALATION"
	| "DEPLOYMENT_BLOCKED";

export type Severity = "INFO" | "WARN" | "CRITICAL";

export type InterventionAction = "PAUSE" | "REROUTE" | "RETRY" | "ESCALATE" | "LOG" | "BLOCK";

export type AgentStatus = "RUNNING" | "PAUSED" | "IDLE" | "FAILED" | "STUCK" | "UNKNOWN";

export interface AgentState {
	agentId: AgentId;
	status: AgentStatus;
	lastStateChangeAt: Date;
	lastToolCallAt: Date | null;
	consecutiveFailures: number;
	currentTask: string | null;
	sessionCostUsd: number;
	toolCallHistory: ToolCallRecord[];
}

export interface ToolCallRecord {
	tool: string;
	calledAt: Date;
	success: boolean;
	durationMs: number;
	outputHash: string | null; // For hallucination detection
}

export interface AgentMonitor {
	agentId: AgentId;
	state: AgentState;
	lastCheckAt: Date;
	alertsActive: string[];
}

export interface AgentHealth {
	agentId: AgentId;
	status: AgentStatus;
	isStuck: boolean;
	consecutiveFailures: number;
	idleMs: number;
	sessionCostUsd: number;
	alerts: string[];
	lastStateChangeAt: Date;
}

export interface StuckAgent {
	agentId: AgentId;
	idleMs: number;
	lastStateChangeAt: Date;
	currentTask: string | null;
	consecutiveFailures: number;
}

export interface CostAlert {
	type: "SESSION" | "DAILY";
	agentId: AgentId | "all";
	currentCostUsd: number;
	thresholdUsd: number;
	percentageOfThreshold: number;
	recommendation: "WARN" | "PAUSE_NON_CRITICAL" | "PAUSE_ALL";
}

export interface AgentIssue {
	type: EventType;
	agentId: AgentId;
	severity: Severity;
	description: string;
	details: Record<string, unknown>;
	detectedAt: Date;
}

export interface Intervention {
	id: string;
	issueType: EventType;
	agentId: AgentId;
	action: InterventionAction;
	severity: Severity;
	reason: string;
	details: Record<string, unknown>;
	timestamp: Date;
	resolved: boolean;
	resolvedAt: Date | null;
}

export interface InterventionResult {
	success: boolean;
	action: InterventionAction;
	agentId: AgentId;
	message: string;
	nextAction: InterventionAction | null;
}

export interface WatcherConfig {
	checkIntervalMs: number;
	costThresholdPerSessionUsd: number;
	costThresholdPerDayUsd: number;
	maxAgentIdleMs: number;
	maxConsecutiveFailures: number;
	retryBackoffMs: number[];
	logFile: string;
}

export interface WatcherStatus {
	isRunning: boolean;
	monitoredAgents: AgentId[];
	activeInterventions: number;
	totalInterventions: number;
	sessionCostUsd: number;
	dailyCostUsd: number;
	startedAt: Date | null;
	lastCycleAt: Date | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: WatcherConfig = {
	checkIntervalMs: 30_000, // 30 seconds
	costThresholdPerSessionUsd: 10,
	costThresholdPerDayUsd: 50,
	maxAgentIdleMs: 1_800_000, // 30 minutes
	maxConsecutiveFailures: 3,
	retryBackoffMs: [5_000, 15_000, 45_000, 120_000],
	logFile: "logs/watcher.jsonl",
};

const MONITORED_AGENTS: AgentId[] = [
	"builder",
	"design",
	"monetization",
	"browser-qa",
	"deployment",
];

// ─── WatcherAgent ─────────────────────────────────────────────────────────────

export class WatcherAgent {
	private monitors: Map<AgentId, AgentMonitor> = new Map();
	private interventions: Intervention[] = [];
	private config: WatcherConfig;
	private isRunning = false;
	private cycleTimer: ReturnType<typeof setInterval> | null = null;
	private startedAt: Date | null = null;
	private lastCycleAt: Date | null = null;
	private selfFailureCount = 0;
	private sessionStartedAt: Date = new Date();
	private dailyCostUsd = 0;
	private logFilePath: string;

	constructor(config: Partial<WatcherConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.logFilePath = path.resolve(process.cwd(), this.config.logFile);
	}

	/**
	 * Initialize monitors for all agents and begin the watch loop.
	 */
	async start(): Promise<void> {
		if (this.isRunning) {
			return;
		}

		this.isRunning = true;
		this.startedAt = new Date();
		this.sessionStartedAt = new Date();
		this.selfFailureCount = 0;

		// Initialize a monitor for each agent
		for (const agentId of MONITORED_AGENTS) {
			this.monitors.set(agentId, this.createInitialMonitor(agentId));
		}

		await this.ensureLogDir();

		// Run first cycle immediately
		await this.runCycle();

		// Schedule recurring cycles
		this.cycleTimer = setInterval(async () => {
			await this.runCycle();
		}, this.config.checkIntervalMs);
	}

	/**
	 * Stop the watcher loop gracefully.
	 */
	async stop(): Promise<void> {
		if (this.cycleTimer) {
			clearInterval(this.cycleTimer);
			this.cycleTimer = null;
		}
		this.isRunning = false;
	}

	/**
	 * Return current watcher status for external monitoring.
	 */
	getStatus(): WatcherStatus {
		const sessionCost = this.getSessionCost();
		return {
			isRunning: this.isRunning,
			monitoredAgents: MONITORED_AGENTS,
			activeInterventions: this.interventions.filter((i) => !i.resolved).length,
			totalInterventions: this.interventions.length,
			sessionCostUsd: sessionCost,
			dailyCostUsd: this.dailyCostUsd,
			startedAt: this.startedAt,
			lastCycleAt: this.lastCycleAt,
		};
	}

	/**
	 * Update state for a monitored agent. Called externally when agents emit state.
	 */
	updateAgentState(agentId: AgentId, update: Partial<AgentState>): void {
		const monitor = this.monitors.get(agentId);
		if (!monitor) return;

		const prev = monitor.state;
		monitor.state = { ...prev, ...update };

		// Any meaningful update resets the stuck-detection clock
		if (update.currentTask !== undefined || update.status !== undefined) {
			monitor.state.lastStateChangeAt = new Date();
		}

		monitor.lastCheckAt = new Date();
	}

	/**
	 * Record a tool call result for an agent.
	 */
	recordToolCall(
		agentId: AgentId,
		tool: string,
		success: boolean,
		durationMs: number,
		outputHash: string | null = null,
	): void {
		const monitor = this.monitors.get(agentId);
		if (!monitor) return;

		const record: ToolCallRecord = {
			tool,
			calledAt: new Date(),
			success,
			durationMs,
			outputHash,
		};

		monitor.state.toolCallHistory.push(record);

		// Keep only last 20 records
		if (monitor.state.toolCallHistory.length > 20) {
			monitor.state.toolCallHistory.shift();
		}

		if (success) {
			monitor.state.consecutiveFailures = 0;
			monitor.state.lastStateChangeAt = new Date();
		} else {
			monitor.state.consecutiveFailures += 1;
		}

		monitor.state.lastToolCallAt = new Date();
	}

	/**
	 * Check health of a specific agent.
	 */
	async checkAgentHealth(agentId: AgentId): Promise<AgentHealth> {
		const monitor = this.monitors.get(agentId);

		if (!monitor) {
			return {
				agentId,
				status: "UNKNOWN",
				isStuck: false,
				consecutiveFailures: 0,
				idleMs: 0,
				sessionCostUsd: 0,
				alerts: ["Agent not registered in watcher"],
				lastStateChangeAt: new Date(0),
			};
		}

		const now = Date.now();
		const idleMs = now - monitor.state.lastStateChangeAt.getTime();
		const isStuck =
			monitor.state.status === "RUNNING" &&
			idleMs > this.config.maxAgentIdleMs;

		const alerts: string[] = [];

		if (isStuck) {
			alerts.push(`Agent stuck: idle for ${Math.round(idleMs / 60000)} minutes`);
		}

		if (monitor.state.consecutiveFailures >= this.config.maxConsecutiveFailures) {
			alerts.push(`${monitor.state.consecutiveFailures} consecutive failures`);
		}

		if (monitor.state.sessionCostUsd >= this.config.costThresholdPerSessionUsd) {
			alerts.push(`Session cost $${monitor.state.sessionCostUsd.toFixed(2)} exceeds threshold`);
		}

		return {
			agentId,
			status: isStuck ? "STUCK" : monitor.state.status,
			isStuck,
			consecutiveFailures: monitor.state.consecutiveFailures,
			idleMs,
			sessionCostUsd: monitor.state.sessionCostUsd,
			alerts,
			lastStateChangeAt: monitor.state.lastStateChangeAt,
		};
	}

	/**
	 * Scan all monitored agents for stuck loops.
	 */
	async detectStuckLoops(): Promise<StuckAgent[]> {
		const stuck: StuckAgent[] = [];

		for (const [agentId, monitor] of this.monitors) {
			if (monitor.state.status !== "RUNNING") continue;

			const idleMs = Date.now() - monitor.state.lastStateChangeAt.getTime();

			if (idleMs > this.config.maxAgentIdleMs) {
				stuck.push({
					agentId,
					idleMs,
					lastStateChangeAt: monitor.state.lastStateChangeAt,
					currentTask: monitor.state.currentTask,
					consecutiveFailures: monitor.state.consecutiveFailures,
				});
			}
		}

		return stuck;
	}

	/**
	 * Check session and daily cost across all agents.
	 */
	async monitorCosts(): Promise<CostAlert[]> {
		const alerts: CostAlert[] = [];
		const sessionCost = this.getSessionCost();

		// Session-level cost check
		if (sessionCost >= this.config.costThresholdPerSessionUsd) {
			const pct = (sessionCost / this.config.costThresholdPerSessionUsd) * 100;
			alerts.push({
				type: "SESSION",
				agentId: "all",
				currentCostUsd: sessionCost,
				thresholdUsd: this.config.costThresholdPerSessionUsd,
				percentageOfThreshold: pct,
				recommendation: pct >= 150 ? "PAUSE_ALL" : "PAUSE_NON_CRITICAL",
			});
		}

		// Daily cost check
		if (this.dailyCostUsd >= this.config.costThresholdPerDayUsd) {
			const pct = (this.dailyCostUsd / this.config.costThresholdPerDayUsd) * 100;
			alerts.push({
				type: "DAILY",
				agentId: "all",
				currentCostUsd: this.dailyCostUsd,
				thresholdUsd: this.config.costThresholdPerDayUsd,
				percentageOfThreshold: pct,
				recommendation: "PAUSE_ALL",
			});
		}

		// Per-agent cost checks
		for (const [agentId, monitor] of this.monitors) {
			const agentCost = monitor.state.sessionCostUsd;
			const agentPct = (agentCost / this.config.costThresholdPerSessionUsd) * 100;
			if (agentPct >= 80 && agentPct < 100) {
				alerts.push({
					type: "SESSION",
					agentId,
					currentCostUsd: agentCost,
					thresholdUsd: this.config.costThresholdPerSessionUsd,
					percentageOfThreshold: agentPct,
					recommendation: "WARN",
				});
			}
		}

		return alerts;
	}

	/**
	 * Check for potential hallucinated tool outputs using output hash comparison.
	 */
	async detectHallucinations(agentId: AgentId): Promise<boolean> {
		const monitor = this.monitors.get(agentId);
		if (!monitor) return false;

		const recentCalls = monitor.state.toolCallHistory.slice(-10);

		// Look for identical hashes on calls to the same tool within 60s
		// (same tool, same input → same hash is expected; but different input → same hash is suspicious)
		const toolCallGroups = new Map<string, ToolCallRecord[]>();
		for (const call of recentCalls) {
			const existing = toolCallGroups.get(call.tool) ?? [];
			existing.push(call);
			toolCallGroups.set(call.tool, existing);
		}

		for (const [, calls] of toolCallGroups) {
			if (calls.length < 2) continue;

			const recent = calls.slice(-2);
			const [prev, curr] = recent;

			// If two consecutive calls to same tool within 60s return identical non-null hashes
			// and both succeeded, this may indicate stale/cached/hallucinated output
			const timeDiffMs = curr.calledAt.getTime() - prev.calledAt.getTime();
			if (
				timeDiffMs < 60_000 &&
				prev.outputHash !== null &&
				curr.outputHash !== null &&
				prev.outputHash === curr.outputHash &&
				prev.success &&
				curr.success
			) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Execute an intervention for a detected issue.
	 */
	async intervene(issue: AgentIssue): Promise<InterventionResult> {
		const action = this.determineAction(issue);
		const intervention: Intervention = {
			id: this.generateId(),
			issueType: issue.type,
			agentId: issue.agentId,
			action,
			severity: issue.severity,
			reason: issue.description,
			details: issue.details,
			timestamp: new Date(),
			resolved: false,
			resolvedAt: null,
		};

		this.interventions.push(intervention);
		await this.logIntervention(intervention);

		let result: InterventionResult;

		switch (action) {
			case "PAUSE":
				result = await this.pauseAgent(issue.agentId, issue.description);
				break;
			case "RETRY":
				result = await this.retryAgent(issue.agentId, issue.details);
				break;
			case "REROUTE":
				result = await this.rerouteAgent(issue.agentId, issue.details);
				break;
			case "ESCALATE":
				result = await this.escalateToJudge(issue);
				break;
			case "BLOCK":
				result = {
					success: true,
					action: "BLOCK",
					agentId: issue.agentId,
					message: `Blocked ${issue.agentId} pending resolution`,
					nextAction: "ESCALATE",
				};
				break;
			default:
				result = {
					success: true,
					action: "LOG",
					agentId: issue.agentId,
					message: "Issue logged, no immediate action taken",
					nextAction: null,
				};
		}

		return result;
	}

	/**
	 * Escalate a critical issue to the Judge agent.
	 */
	async escalateToJudge(issue: AgentIssue): Promise<InterventionResult> {
		const escalation: Intervention = {
			id: this.generateId(),
			issueType: "ESCALATION",
			agentId: issue.agentId,
			action: "ESCALATE",
			severity: "CRITICAL",
			reason: `Escalated to Judge: ${issue.description}`,
			details: {
				originalIssue: issue,
				escalatedAt: new Date().toISOString(),
				incidentReport: this.compileIncidentReport(issue.agentId),
			},
			timestamp: new Date(),
			resolved: false,
			resolvedAt: null,
		};

		await this.logIntervention(escalation);

		// In a real implementation, this would emit an event to the Judge agent
		// via the shared state or message bus
		console.error(
			`[WATCHER] ESCALATION: ${issue.agentId} → Judge | ${issue.description}`,
		);

		return {
			success: true,
			action: "ESCALATE",
			agentId: issue.agentId,
			message: `Issue escalated to Judge agent. Incident report compiled.`,
			nextAction: null,
		};
	}

	/**
	 * Write an intervention record to the JSONL log file.
	 */
	async logIntervention(intervention: Intervention): Promise<void> {
		const logEntry = {
			timestamp: intervention.timestamp.toISOString(),
			event_type: intervention.issueType,
			agent_id: intervention.agentId,
			severity: intervention.severity,
			action_taken: intervention.action,
			details: {
				...intervention.details,
				message: intervention.reason,
			},
			resolved: intervention.resolved,
		};

		const line = `${JSON.stringify(logEntry)}\n`;

		try {
			await fs.appendFile(this.logFilePath, line, "utf-8");
		} catch (err) {
			// If log write fails, write to stderr — never throw silently
			process.stderr.write(`[WATCHER] Log write failed: ${String(err)}\n`);
		}
	}

	// ─── Private Methods ─────────────────────────────────────────────────────

	private async runCycle(): Promise<void> {
		const cycleStart = Date.now();
		this.lastCycleAt = new Date();

		try {
			// 1. Check for stuck loops
			const stuckAgents = await this.detectStuckLoops();
			for (const stuck of stuckAgents) {
				await this.intervene({
					type: "STUCK_LOOP",
					agentId: stuck.agentId,
					severity: "CRITICAL",
					description: `Agent ${stuck.agentId} idle for ${Math.round(stuck.idleMs / 60000)} minutes`,
					details: {
						idle_ms: stuck.idleMs,
						last_state_change: stuck.lastStateChangeAt.toISOString(),
						current_task: stuck.currentTask,
						consecutive_failures: stuck.consecutiveFailures,
					},
					detectedAt: new Date(),
				});
			}

			// 2. Check for consecutive failures
			for (const [agentId, monitor] of this.monitors) {
				if (
					monitor.state.consecutiveFailures >= this.config.maxConsecutiveFailures
				) {
					await this.intervene({
						type: "FAILURE_DETECTED",
						agentId,
						severity: "WARN",
						description: `${monitor.state.consecutiveFailures} consecutive tool failures`,
						details: {
							consecutive_failures: monitor.state.consecutiveFailures,
							last_tools: monitor.state.toolCallHistory.slice(-3).map((t) => t.tool),
						},
						detectedAt: new Date(),
					});
				}
			}

			// 3. Monitor costs
			const costAlerts = await this.monitorCosts();
			for (const alert of costAlerts) {
				if (alert.recommendation !== "WARN") {
					await this.intervene({
						type: "COST_ALERT",
						agentId: alert.agentId === "all" ? "builder" : alert.agentId,
						severity: alert.recommendation === "PAUSE_ALL" ? "CRITICAL" : "WARN",
						description: `Cost alert: $${alert.currentCostUsd.toFixed(2)} (${alert.percentageOfThreshold.toFixed(0)}% of threshold)`,
						details: {
							current_cost_usd: alert.currentCostUsd,
							threshold_usd: alert.thresholdUsd,
							alert_type: alert.type,
							recommendation: alert.recommendation,
						},
						detectedAt: new Date(),
					});
				}
			}

			// 4. Hallucination detection
			for (const [agentId] of this.monitors) {
				const hallucinating = await this.detectHallucinations(agentId);
				if (hallucinating) {
					await this.intervene({
						type: "HALLUCINATION",
						agentId,
						severity: "WARN",
						description: "Potential hallucinated output: identical hashes for consecutive tool calls",
						details: {
							tool_history: this.monitors
								.get(agentId)
								?.state.toolCallHistory.slice(-5)
								.map((t) => ({ tool: t.tool, hash: t.outputHash, at: t.calledAt })),
						},
						detectedAt: new Date(),
					});
				}
			}

			this.selfFailureCount = 0;
		} catch (err) {
			this.selfFailureCount += 1;
			process.stderr.write(
				`[WATCHER] Cycle error (self-failure #${this.selfFailureCount}): ${String(err)}\n`,
			);

			if (this.selfFailureCount >= 3) {
				// Self-monitoring: escalate watcher failure to human queue
				const selfIssue: Intervention = {
					id: this.generateId(),
					issueType: "ESCALATION",
					agentId: "builder", // placeholder — watcher itself
					action: "ESCALATE",
					severity: "CRITICAL",
					reason: "Watcher agent has failed 3+ consecutive self-checks. Human review required.",
					details: { self_failure_count: this.selfFailureCount },
					timestamp: new Date(),
					resolved: false,
					resolvedAt: null,
				};
				await this.logIntervention(selfIssue);
			}
		}

		const cycleDurationMs = Date.now() - cycleStart;

		// Warn if cycle took longer than 2x the check interval
		if (cycleDurationMs > this.config.checkIntervalMs * 2) {
			process.stderr.write(
				`[WATCHER] Slow cycle: ${cycleDurationMs}ms (threshold: ${this.config.checkIntervalMs * 2}ms)\n`,
			);
		}
	}

	private determineAction(issue: AgentIssue): InterventionAction {
		switch (issue.type) {
			case "STUCK_LOOP":
				return issue.severity === "CRITICAL" ? "PAUSE" : "LOG";
			case "FAILURE_DETECTED":
				return "RETRY";
			case "COST_ALERT": {
				const cost = issue.details.recommendation as string;
				if (cost === "PAUSE_ALL" || cost === "PAUSE_NON_CRITICAL") return "PAUSE";
				return "LOG";
			}
			case "HALLUCINATION":
				return "RETRY";
			case "ESCALATION":
				return "ESCALATE";
			case "DEPLOYMENT_BLOCKED":
				return "BLOCK";
			default:
				return "LOG";
		}
	}

	private async pauseAgent(
		agentId: AgentId,
		reason: string,
	): Promise<InterventionResult> {
		const monitor = this.monitors.get(agentId);
		if (monitor) {
			monitor.state.status = "PAUSED";
		}

		console.error(`[WATCHER] PAUSED ${agentId}: ${reason}`);

		return {
			success: true,
			action: "PAUSE",
			agentId,
			message: `Agent ${agentId} paused. Reason: ${reason}`,
			nextAction: "ESCALATE",
		};
	}

	private async retryAgent(
		agentId: AgentId,
		details: Record<string, unknown>,
	): Promise<InterventionResult> {
		const retryCount = (details.retryCount as number) ?? 0;

		if (retryCount >= this.config.retryBackoffMs.length) {
			// Exhausted retries — escalate
			return {
				success: false,
				action: "RETRY",
				agentId,
				message: `Max retries (${this.config.retryBackoffMs.length}) exhausted for ${agentId}`,
				nextAction: "ESCALATE",
			};
		}

		const backoffMs = this.config.retryBackoffMs[retryCount];
		await this.sleep(backoffMs);

		console.error(`[WATCHER] RETRY ${agentId} (attempt ${retryCount + 1}, backoff ${backoffMs}ms)`);

		return {
			success: true,
			action: "RETRY",
			agentId,
			message: `Retried ${agentId} after ${backoffMs}ms backoff`,
			nextAction: null,
		};
	}

	private async rerouteAgent(
		agentId: AgentId,
		details: Record<string, unknown>,
	): Promise<InterventionResult> {
		console.error(`[WATCHER] REROUTE ${agentId}: reassigning task`);

		return {
			success: true,
			action: "REROUTE",
			agentId,
			message: `Task from ${agentId} rerouted to backup queue`,
			nextAction: null,
		};
	}

	private compileIncidentReport(agentId: AgentId): Record<string, unknown> {
		const monitor = this.monitors.get(agentId);
		if (!monitor) return {};

		return {
			agentId,
			status: monitor.state.status,
			currentTask: monitor.state.currentTask,
			lastStateChangeAt: monitor.state.lastStateChangeAt.toISOString(),
			consecutiveFailures: monitor.state.consecutiveFailures,
			recentToolCalls: monitor.state.toolCallHistory.slice(-10),
			sessionCostUsd: monitor.state.sessionCostUsd,
			recentInterventions: this.interventions
				.filter((i) => i.agentId === agentId)
				.slice(-5),
		};
	}

	private createInitialMonitor(agentId: AgentId): AgentMonitor {
		return {
			agentId,
			lastCheckAt: new Date(),
			alertsActive: [],
			state: {
				agentId,
				status: "IDLE",
				lastStateChangeAt: new Date(),
				lastToolCallAt: null,
				consecutiveFailures: 0,
				currentTask: null,
				sessionCostUsd: 0,
				toolCallHistory: [],
			},
		};
	}

	private getSessionCost(): number {
		let total = 0;
		for (const [, monitor] of this.monitors) {
			total += monitor.state.sessionCostUsd;
		}
		return total;
	}

	private async ensureLogDir(): Promise<void> {
		const dir = path.dirname(this.logFilePath);
		await fs.mkdir(dir, { recursive: true });
	}

	private generateId(): string {
		return `watcher_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
