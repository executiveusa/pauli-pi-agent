/**
 * Workflow Executor
 * Executes tasks and manages workflow state
 */

import type { Task, Workflow, WorkflowStatus, ExecutionResult, ExecutionContext, WorkflowDefinition } from "./types.js";
import { TaskStatus, WorkflowStatus as WFStatus } from "./types.js";

export class WorkflowExecutor {
	private workflows: Map<string, Workflow> = new Map();
	private taskHandlers: Map<string, (context: ExecutionContext) => Promise<unknown>> = new Map();

	async execute(definition: WorkflowDefinition): Promise<ExecutionResult> {
		const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const startedAt = new Date();

		const workflow: Workflow = {
			id: workflowId,
			name: definition.name,
			status: WFStatus.RUNNING,
			tasks: definition.tasks.map((t) => ({
				id: t.id,
				name: t.name,
				type: t.type,
				status: TaskStatus.PENDING,
				retries: 0,
				maxRetries: definition.config?.maxRetries || 3,
			})),
			steps: definition.tasks.map((t) => ({
				taskId: t.id,
				dependencies: t.dependencies || [],
				timeout: definition.config?.timeout || 30000,
				retryPolicy: {
					maxRetries: definition.config?.maxRetries || 3,
					initialDelayMs: 1000,
					backoffMultiplier: 2,
				},
			})),
			startedAt,
		};

		this.workflows.set(workflowId, workflow);

		try {
			const results: Record<string, unknown> = {};
			const errors: Array<{ taskId: string; error: string }> = [];
			const completed = new Set<string>();

			// Execute tasks in dependency order
			while (completed.size < workflow.tasks.length) {
				let progress = false;

				for (const task of workflow.tasks) {
					if (completed.has(task.id) || task.status !== TaskStatus.PENDING) continue;

					const step = workflow.steps.find((s) => s.taskId === task.id);
					if (!step || !step.dependencies.every((d) => completed.has(d))) continue;

					progress = true;
					task.status = TaskStatus.RUNNING;
					task.startedAt = new Date();

					try {
						const context: ExecutionContext = {
							workflowId,
							taskId: task.id,
							inputs: {},
							outputs: results,
							metadata: {},
						};

						const handler = this.taskHandlers.get(task.type) || (() => Promise.resolve(null));
						const result = await handler(context);

						results[task.id] = result;
						task.status = TaskStatus.COMPLETED;
						task.result = result;
						completed.add(task.id);
					} catch (error) {
						task.retries++;

						if (task.retries < task.maxRetries) {
							task.status = TaskStatus.RETRYING;
							const delay = 1000 * Math.pow(2, task.retries - 1);
							await new Promise((resolve) => setTimeout(resolve, delay));
							task.status = TaskStatus.PENDING;
						} else {
							task.status = TaskStatus.FAILED;
							task.error = String(error);
							errors.push({ taskId: task.id, error: String(error) });
							completed.add(task.id);

							if (definition.config?.onFailure === "stop") {
								throw new Error(`Task ${task.id} failed: ${String(error)}`);
							}
						}
					} finally {
						task.completedAt = new Date();
						if (task.startedAt) {
							task.duration = task.completedAt.getTime() - task.startedAt.getTime();
						}
					}
				}

				if (!progress && completed.size < workflow.tasks.length) break;
			}

			const completedAt = new Date();
			const totalDuration = completedAt.getTime() - startedAt.getTime();
			const tasksFailed = workflow.tasks.filter((t) => t.status === TaskStatus.FAILED).length;
			const tasksCompleted = workflow.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;

			workflow.status = tasksFailed > 0 ? WFStatus.FAILED : WFStatus.COMPLETED;
			workflow.completedAt = completedAt;
			workflow.duration = totalDuration;

			return {
				workflowId,
				status: workflow.status as unknown as WorkflowStatus,
				tasksCompleted,
				tasksFailed,
				totalDuration,
				results,
				errors,
				startedAt,
				completedAt,
			};
		} catch (error) {
			const completedAt = new Date();
			workflow.status = WFStatus.FAILED;
			workflow.completedAt = completedAt;
			workflow.duration = completedAt.getTime() - startedAt.getTime();

			return {
				workflowId,
				status: WFStatus.FAILED as unknown as WorkflowStatus,
				tasksCompleted: 0,
				tasksFailed: workflow.tasks.length,
				totalDuration: completedAt.getTime() - startedAt.getTime(),
				results: {},
				errors: workflow.tasks.map((t) => ({ taskId: t.id, error: String(error) })),
				startedAt,
				completedAt,
			};
		}
	}

	registerTaskHandler(taskType: string, handler: (context: ExecutionContext) => Promise<unknown>): void {
		this.taskHandlers.set(taskType, handler);
	}

	getWorkflow(workflowId: string): Workflow | undefined {
		return this.workflows.get(workflowId);
	}

	pauseWorkflow(workflowId: string): boolean {
		const workflow = this.workflows.get(workflowId);
		if (workflow && workflow.status === WFStatus.RUNNING) {
			workflow.status = WFStatus.PAUSED;
			return true;
		}
		return false;
	}

	resumeWorkflow(workflowId: string): boolean {
		const workflow = this.workflows.get(workflowId);
		if (workflow && workflow.status === WFStatus.PAUSED) {
			workflow.status = WFStatus.RUNNING;
			return true;
		}
		return false;
	}

	cancelWorkflow(workflowId: string): boolean {
		const workflow = this.workflows.get(workflowId);
		if (workflow && (workflow.status === WFStatus.RUNNING || workflow.status === WFStatus.PAUSED)) {
			workflow.status = WFStatus.CANCELLED;
			return true;
		}
		return false;
	}

	getWorkflowStatus(workflowId: string): WorkflowStatus | undefined {
		return this.workflows.get(workflowId)?.status;
	}

	listWorkflows(): Workflow[] {
		return Array.from(this.workflows.values());
	}

	getWorkflowProgress(workflowId: string): { completed: number; failed: number; total: number; percentage: number } | null {
		const workflow = this.workflows.get(workflowId);
		if (!workflow) return null;

		const completed = workflow.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
		const failed = workflow.tasks.filter((t) => t.status === TaskStatus.FAILED).length;
		const total = workflow.tasks.length;

		return {
			completed,
			failed,
			total,
			percentage: total > 0 ? Math.round(((completed + failed) / total) * 100) : 0,
		};
	}
}

export function createWorkflowExecutor(): WorkflowExecutor {
	return new WorkflowExecutor();
}
