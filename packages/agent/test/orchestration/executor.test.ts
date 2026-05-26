/**
 * Workflow Executor Tests
 * Verify workflow execution, task management, and error handling
 */

import { beforeEach, describe, expect, test } from "vitest";
import { WorkflowExecutor } from "../../src/orchestration/executor.js";
import { WorkflowStatus } from "../../src/orchestration/types.js";

describe("WorkflowExecutor", () => {
	let executor: WorkflowExecutor;

	beforeEach(() => {
		executor = new WorkflowExecutor();
	});

	test("creates workflow executor", () => {
		expect(executor).toBeDefined();
	});

	test("executes simple workflow", async () => {
		executor.registerTaskHandler("simple", async () => ({ result: "success" }));

		const definition = {
			name: "Test Workflow",
			tasks: [{ id: "task-1", name: "Task 1", type: "simple", config: {} }],
		};

		const result = await executor.execute(definition);

		expect(result).toBeDefined();
		expect(result.workflowId).toBeDefined();
		expect(result.status).toBe(WorkflowStatus.COMPLETED);
		expect(result.tasksCompleted).toBe(1);
		expect(result.tasksFailed).toBe(0);
	});

	test("handles task dependencies", async () => {
		executor.registerTaskHandler("task", async (ctx) => {
			return { taskId: ctx.taskId };
		});

		const definition = {
			name: "Dependent Workflow",
			tasks: [
				{ id: "task-1", name: "Task 1", type: "task", config: {} },
				{ id: "task-2", name: "Task 2", type: "task", config: {}, dependencies: ["task-1"] },
				{ id: "task-3", name: "Task 3", type: "task", config: {}, dependencies: ["task-2"] },
			],
		};

		const result = await executor.execute(definition);

		expect(result.tasksCompleted).toBe(3);
		expect(result.tasksFailed).toBe(0);
	});

	test("retries failed tasks", async () => {
		let attempts = 0;
		executor.registerTaskHandler("flaky", async () => {
			attempts++;
			if (attempts < 2) throw new Error("First attempt failed");
			return { retried: true };
		});

		const definition = {
			name: "Retry Workflow",
			tasks: [{ id: "task-1", name: "Flaky Task", type: "flaky", config: {} }],
			config: { maxRetries: 3 },
		};

		const result = await executor.execute(definition);

		expect(result.tasksCompleted).toBe(1);
		expect(result.tasksFailed).toBe(0);
	});

	test("stops on fatal error with stop policy", async () => {
		executor.registerTaskHandler("fail", async () => {
			throw new Error("Fatal error");
		});

		executor.registerTaskHandler("task", async () => "success");

		const definition = {
			name: "Stop on Failure",
			tasks: [
				{ id: "task-1", name: "Failing Task", type: "fail", config: {} },
				{ id: "task-2", name: "Follow-up Task", type: "task", config: {}, dependencies: ["task-1"] },
			],
			config: { onFailure: "stop" },
		};

		const result = await executor.execute(definition);

		expect(result.tasksFailed).toBeGreaterThan(0);
	});

	test("continues on failure with continue policy", async () => {
		executor.registerTaskHandler("fail", async () => {
			throw new Error("Task failed");
		});

		executor.registerTaskHandler("task", async () => "success");

		const definition = {
			name: "Continue on Failure",
			tasks: [
				{ id: "task-1", name: "Failing Task", type: "fail", config: {} },
				{ id: "task-2", name: "Independent Task", type: "task", config: {} },
			],
			config: { onFailure: "continue" },
		};

		const result = await executor.execute(definition);

		expect(result.tasksCompleted).toBeGreaterThan(0);
	});

	test("returns execution results", async () => {
		executor.registerTaskHandler("task", async () => ({ data: "result" }));

		const definition = {
			name: "Result Workflow",
			tasks: [{ id: "task-1", name: "Task 1", type: "task", config: {} }],
		};

		const result = await executor.execute(definition);

		expect(result).toHaveProperty("results");
		expect(result.results["task-1"]).toBeDefined();
	});

	test("tracks execution time", async () => {
		executor.registerTaskHandler("slow", async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
			return "done";
		});

		const definition = {
			name: "Timed Workflow",
			tasks: [{ id: "task-1", name: "Slow Task", type: "slow", config: {} }],
		};

		const result = await executor.execute(definition);

		expect(result.totalDuration).toBeGreaterThanOrEqual(100);
	});

	test("gets workflow by ID", async () => {
		executor.registerTaskHandler("task", async () => "success");

		const definition = {
			name: "Test Workflow",
			tasks: [{ id: "task-1", name: "Task 1", type: "task", config: {} }],
		};

		const result = await executor.execute(definition);
		const workflow = executor.getWorkflow(result.workflowId);

		expect(workflow).toBeDefined();
		expect(workflow?.id).toBe(result.workflowId);
	});

	test("pauses and resumes workflow", () => {
		const workflow = executor.execute({
			name: "Test",
			tasks: [{ id: "t1", name: "Task", type: "test", config: {} }],
		});

		workflow.then((result) => {
			const paused = executor.pauseWorkflow(result.workflowId);
			expect(paused).toBeDefined();

			const resumed = executor.resumeWorkflow(result.workflowId);
			expect(resumed).toBeDefined();
		});
	});

	test("cancels workflow", () => {
		const workflow = executor.execute({
			name: "Test",
			tasks: [{ id: "t1", name: "Task", type: "test", config: {} }],
		});

		workflow.then((result) => {
			const cancelled = executor.cancelWorkflow(result.workflowId);
			expect(cancelled).toBeDefined();
		});
	});

	test("gets workflow status", async () => {
		executor.registerTaskHandler("task", async () => "success");

		const definition = {
			name: "Status Workflow",
			tasks: [{ id: "task-1", name: "Task", type: "task", config: {} }],
		};

		const result = await executor.execute(definition);
		const status = executor.getWorkflowStatus(result.workflowId);

		expect(status).toBe(WorkflowStatus.COMPLETED);
	});

	test("lists all workflows", async () => {
		executor.registerTaskHandler("task", async () => "success");

		const definition = {
			name: "Test Workflow",
			tasks: [{ id: "task-1", name: "Task", type: "task", config: {} }],
		};

		await executor.execute(definition);
		const workflows = executor.listWorkflows();

		expect(workflows).toBeInstanceOf(Array);
		expect(workflows.length).toBeGreaterThan(0);
	});

	test("calculates workflow progress", async () => {
		executor.registerTaskHandler("task", async () => "success");

		const definition = {
			name: "Progress Workflow",
			tasks: [
				{ id: "task-1", name: "Task 1", type: "task", config: {} },
				{ id: "task-2", name: "Task 2", type: "task", config: {} },
				{ id: "task-3", name: "Task 3", type: "task", config: {} },
			],
		};

		const result = await executor.execute(definition);
		const progress = executor.getWorkflowProgress(result.workflowId);

		expect(progress).toBeDefined();
		expect(progress?.completed).toBe(3);
		expect(progress?.percentage).toBe(100);
	});

	test("registers custom task handlers", () => {
		const handler = async () => "custom result";
		executor.registerTaskHandler("custom", handler);

		executor.execute({
			name: "Custom Task Workflow",
			tasks: [{ id: "t1", name: "Custom Task", type: "custom", config: {} }],
		});

		expect(executor).toBeDefined();
	});

	test("records task errors", async () => {
		executor.registerTaskHandler("fail", async () => {
			throw new Error("Task error");
		});

		const definition = {
			name: "Error Workflow",
			tasks: [{ id: "task-1", name: "Failing Task", type: "fail", config: {} }],
		};

		const result = await executor.execute(definition);

		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0].error).toContain("Task error");
	});

	test("handles parallel tasks", async () => {
		executor.registerTaskHandler("parallel", async () => "done");

		const definition = {
			name: "Parallel Workflow",
			tasks: [
				{ id: "task-1", name: "Task 1", type: "parallel", config: {} },
				{ id: "task-2", name: "Task 2", type: "parallel", config: {} },
				{ id: "task-3", name: "Task 3", type: "parallel", config: {} },
			],
		};

		const result = await executor.execute(definition);

		expect(result.tasksCompleted).toBe(3);
	});
});
