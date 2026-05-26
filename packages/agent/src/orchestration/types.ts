/**
 * Orchestration Types
 * Workflow, task, and execution definitions
 */

export enum TaskStatus {
	PENDING = "pending",
	RUNNING = "running",
	COMPLETED = "completed",
	FAILED = "failed",
	SKIPPED = "skipped",
	RETRYING = "retrying",
}

export enum WorkflowStatus {
	IDLE = "idle",
	RUNNING = "running",
	PAUSED = "paused",
	COMPLETED = "completed",
	FAILED = "failed",
	CANCELLED = "cancelled",
}

export interface Task {
	id: string;
	name: string;
	type: string;
	status: TaskStatus;
	startedAt?: Date;
	completedAt?: Date;
	duration?: number;
	result?: unknown;
	error?: string;
	retries: number;
	maxRetries: number;
	metadata?: Record<string, unknown>;
}

export interface WorkflowStep {
	taskId: string;
	dependencies: string[];
	condition?: string;
	timeout?: number;
	retryPolicy?: {
		maxRetries: number;
		initialDelayMs: number;
		backoffMultiplier: number;
	};
}

export interface Workflow {
	id: string;
	name: string;
	status: WorkflowStatus;
	tasks: Task[];
	steps: WorkflowStep[];
	startedAt: Date;
	completedAt?: Date;
	duration?: number;
	metadata?: Record<string, unknown>;
}

export interface ExecutionContext {
	workflowId: string;
	taskId: string;
	inputs: Record<string, unknown>;
	outputs: Record<string, unknown>;
	metadata: Record<string, unknown>;
}

export interface WorkflowDefinition {
	name: string;
	description?: string;
	tasks: Array<{
		id: string;
		name: string;
		type: string;
		config: Record<string, unknown>;
		dependencies?: string[];
	}>;
	config?: {
		timeout?: number;
		maxRetries?: number;
		onFailure?: "stop" | "continue";
	};
}

export interface ExecutionResult {
	workflowId: string;
	status: WorkflowStatus;
	tasksCompleted: number;
	tasksFailed: number;
	totalDuration: number;
	results: Record<string, unknown>;
	errors: Array<{ taskId: string; error: string }>;
	startedAt: Date;
	completedAt: Date;
}

export interface RoutingDecision {
	taskId: string;
	queue: string;
	priority: number;
	estimatedDurationMs: number;
	resources: Record<string, number>;
}

export interface QueueMetrics {
	queueName: string;
	taskCount: number;
	averageWaitTimeMs: number;
	averageDurationMs: number;
	successRate: number;
	load: number;
}
