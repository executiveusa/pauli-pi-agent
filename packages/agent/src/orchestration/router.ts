/**
 * Workflow Router
 * Routes tasks based on priority, load, and resource availability
 */

import type { ExecutionContext, Task } from "./types.js";

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

export class WorkflowRouter {
	private queues: Map<string, Task[]> = new Map();
	private queueMetrics: Map<string, QueueMetrics> = new Map();
	private taskEstimates: Map<string, number> = new Map();
	private resourceCapacity: Map<string, number> = new Map();

	constructor() {
		this.initializeQueues();
	}

	private initializeQueues(): void {
		const defaultQueues = ["high-priority", "normal-priority", "low-priority", "background"];
		for (const queue of defaultQueues) {
			this.queues.set(queue, []);
			this.queueMetrics.set(queue, {
				queueName: queue,
				taskCount: 0,
				averageWaitTimeMs: 0,
				averageDurationMs: 0,
				successRate: 0,
				load: 0,
			});
		}

		// Set resource capacity
		this.resourceCapacity.set("memory", 1024); // MB
		this.resourceCapacity.set("cpu", 100); // percentage
		this.resourceCapacity.set("disk", 10000); // MB
	}

	route(task: Task, context: ExecutionContext): RoutingDecision {
		const priority = this.calculatePriority(task, context);
		const queue = this.selectQueue(priority);
		const estimatedDuration = this.estimateTaskDuration(task);
		const resources = this.estimateResources(task);

		// Add task to queue
		const tasks = this.queues.get(queue);
		if (tasks) {
			tasks.push(task);
			const metrics = this.queueMetrics.get(queue);
			if (metrics) {
				metrics.taskCount++;
				metrics.load = this.calculateQueueLoad(queue);
			}
		}

		return {
			taskId: task.id,
			queue,
			priority,
			estimatedDurationMs: estimatedDuration,
			resources,
		};
	}

	private calculatePriority(task: Task, _context: ExecutionContext): number {
		// Priority calculation based on task properties
		let priority = 50; // Default

		if (task.type === "critical") priority = 100;
		if (task.type === "interactive") priority = 75;
		if (task.type === "background") priority = 25;

		// Adjust by retry count
		priority -= Math.min(task.retries * 5, 20);

		return Math.max(0, Math.min(100, priority));
	}

	private selectQueue(priority: number): string {
		if (priority >= 75) return "high-priority";
		if (priority >= 50) return "normal-priority";
		if (priority >= 25) return "low-priority";
		return "background";
	}

	private estimateTaskDuration(task: Task): number {
		if (this.taskEstimates.has(task.type)) {
			return this.taskEstimates.get(task.type)!;
		}
		return 5000; // Default 5 seconds
	}

	private estimateResources(_task: Task): Record<string, number> {
		return {
			memory: 256, // MB
			cpu: 20, // percentage
			disk: 100, // MB
		};
	}

	private calculateQueueLoad(queueName: string): number {
		const tasks = this.queues.get(queueName) || [];
		const metrics = this.queueMetrics.get(queueName);

		if (!metrics) return 0;

		const avgDuration = metrics.averageDurationMs || 5000;
		const taskCount = tasks.length;

		return Math.min(100, (taskCount * avgDuration) / 60000); // Load as % of 1 minute
	}

	getQueueMetrics(queueName: string): QueueMetrics | undefined {
		return this.queueMetrics.get(queueName);
	}

	getAllQueueMetrics(): QueueMetrics[] {
		return Array.from(this.queueMetrics.values());
	}

	getNextTask(queueName: string): Task | undefined {
		const tasks = this.queues.get(queueName);
		return tasks ? tasks.shift() : undefined;
	}

	getQueueLength(queueName: string): number {
		return this.queues.get(queueName)?.length || 0;
	}

	registerTaskDurationEstimate(taskType: string, durationMs: number): void {
		this.taskEstimates.set(taskType, durationMs);
	}

	setResourceCapacity(resource: string, capacity: number): void {
		this.resourceCapacity.set(resource, capacity);
	}

	getResourceCapacity(resource: string): number | undefined {
		return this.resourceCapacity.get(resource);
	}

	rebalanceQueues(): void {
		// Redistribute tasks if queues are imbalanced
		const queues = Array.from(this.queues.entries());
		const avgQueueSize = queues.reduce((sum, [_, tasks]) => sum + tasks.length, 0) / queues.length;

		// Simple rebalancing logic
		for (let i = 0; i < queues.length - 1; i++) {
			const [queueName, tasks] = queues[i];
			if (tasks.length > avgQueueSize * 1.5 && i < queues.length - 1) {
				const nextQueueName = queues[i + 1][0];
				const nextQueueTasks = this.queues.get(nextQueueName);
				if (nextQueueTasks && tasks.length > 0) {
					const task = tasks.pop();
					if (task) nextQueueTasks.push(task);
				}
			}
		}
	}

	clearQueue(queueName: string): number {
		const tasks = this.queues.get(queueName);
		const count = tasks?.length || 0;
		if (tasks) {
			tasks.length = 0;
		}
		return count;
	}
}

export function createWorkflowRouter(): WorkflowRouter {
	return new WorkflowRouter();
}
