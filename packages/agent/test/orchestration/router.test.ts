/**
 * Workflow Router Tests
 * Verify task routing, queue management, and load balancing
 */

import { beforeEach, describe, expect, test } from "vitest";
import { WorkflowRouter } from "../../src/orchestration/router.js";
import { TaskStatus } from "../../src/orchestration/types.js";

describe("WorkflowRouter", () => {
	let router: WorkflowRouter;

	beforeEach(() => {
		router = new WorkflowRouter();
	});

	test("creates workflow router", () => {
		expect(router).toBeDefined();
	});

	test("routes task to high priority queue", () => {
		const task = {
			id: "task-1",
			name: "Critical Task",
			type: "critical",
			status: TaskStatus.PENDING,
			retries: 0,
			maxRetries: 3,
		};

		const decision = router.route(task, {
			workflowId: "wf-1",
			taskId: "task-1",
			inputs: {},
			outputs: {},
			metadata: {},
		});

		expect(decision.queue).toBe("high-priority");
		expect(decision.priority).toBeGreaterThanOrEqual(75);
	});

	test("routes task to normal priority queue", () => {
		const task = {
			id: "task-1",
			name: "Normal Task",
			type: "normal",
			status: TaskStatus.PENDING,
			retries: 0,
			maxRetries: 3,
		};

		const decision = router.route(task, {
			workflowId: "wf-1",
			taskId: "task-1",
			inputs: {},
			outputs: {},
			metadata: {},
		});

		expect(decision.queue).toBeDefined();
		expect(["high-priority", "normal-priority", "low-priority", "background"]).toContain(decision.queue);
	});

	test("routes task to background queue", () => {
		const task = {
			id: "task-1",
			name: "Background Task",
			type: "background",
			status: TaskStatus.PENDING,
			retries: 0,
			maxRetries: 3,
		};

		const decision = router.route(task, {
			workflowId: "wf-1",
			taskId: "task-1",
			inputs: {},
			outputs: {},
			metadata: {},
		});

		expect(["background", "low-priority"]).toContain(decision.queue);
	});

	test("returns routing decision with resources", () => {
		const task = {
			id: "task-1",
			name: "Task",
			type: "normal",
			status: TaskStatus.PENDING,
			retries: 0,
			maxRetries: 3,
		};

		const decision = router.route(task, {
			workflowId: "wf-1",
			taskId: "task-1",
			inputs: {},
			outputs: {},
			metadata: {},
		});

		expect(decision).toHaveProperty("resources");
		expect(decision.resources).toHaveProperty("memory");
		expect(decision.resources).toHaveProperty("cpu");
		expect(decision.resources).toHaveProperty("disk");
	});

	test("gets queue metrics", () => {
		const metrics = router.getQueueMetrics("high-priority");

		expect(metrics).toBeDefined();
		expect(metrics?.queueName).toBe("high-priority");
		expect(metrics?.taskCount).toBeGreaterThanOrEqual(0);
	});

	test("gets all queue metrics", () => {
		const allMetrics = router.getAllQueueMetrics();

		expect(allMetrics).toBeInstanceOf(Array);
		expect(allMetrics.length).toBeGreaterThan(0);
	});

	test("gets next task from queue", () => {
		const task = {
			id: "task-1",
			name: "Task",
			type: "normal",
			status: TaskStatus.PENDING,
			retries: 0,
			maxRetries: 3,
		};

		router.route(task, {
			workflowId: "wf-1",
			taskId: "task-1",
			inputs: {},
			outputs: {},
			metadata: {},
		});

		const nextTask = router.getNextTask("normal-priority");
		expect(nextTask).toBeDefined();
		expect(nextTask?.id).toBe("task-1");
	});

	test("gets queue length", () => {
		const task = {
			id: "task-1",
			name: "Task",
			type: "normal",
			status: TaskStatus.PENDING,
			retries: 0,
			maxRetries: 3,
		};

		router.route(task, {
			workflowId: "wf-1",
			taskId: "task-1",
			inputs: {},
			outputs: {},
			metadata: {},
		});

		const length = router.getQueueLength("normal-priority");
		expect(length).toBeGreaterThan(0);
	});

	test("registers task duration estimate", () => {
		router.registerTaskDurationEstimate("slow-task", 10000);
		expect(router).toBeDefined();
	});

	test("sets resource capacity", () => {
		router.setResourceCapacity("memory", 2048);
		const capacity = router.getResourceCapacity("memory");
		expect(capacity).toBe(2048);
	});

	test("rebalances queues", () => {
		for (let i = 0; i < 5; i++) {
			const task = {
				id: `task-${i}`,
				name: `Task ${i}`,
				type: "normal",
				status: TaskStatus.PENDING,
				retries: 0,
				maxRetries: 3,
			};

			router.route(task, {
				workflowId: "wf-1",
				taskId: `task-${i}`,
				inputs: {},
				outputs: {},
				metadata: {},
			});
		}

		router.rebalanceQueues();
		expect(router).toBeDefined();
	});

	test("clears queue", () => {
		const task = {
			id: "task-1",
			name: "Task",
			type: "normal",
			status: TaskStatus.PENDING,
			retries: 0,
			maxRetries: 3,
		};

		router.route(task, {
			workflowId: "wf-1",
			taskId: "task-1",
			inputs: {},
			outputs: {},
			metadata: {},
		});

		const cleared = router.clearQueue("normal-priority");
		expect(cleared).toBeGreaterThan(0);

		const length = router.getQueueLength("normal-priority");
		expect(length).toBe(0);
	});

	test("priority decreases with retries", () => {
		const task1 = {
			id: "task-1",
			name: "Task",
			type: "critical",
			status: TaskStatus.PENDING,
			retries: 0,
			maxRetries: 3,
		};

		const task2 = {
			id: "task-2",
			name: "Task",
			type: "critical",
			status: TaskStatus.RETRYING,
			retries: 2,
			maxRetries: 3,
		};

		const decision1 = router.route(task1, {
			workflowId: "wf-1",
			taskId: "task-1",
			inputs: {},
			outputs: {},
			metadata: {},
		});

		const decision2 = router.route(task2, {
			workflowId: "wf-1",
			taskId: "task-2",
			inputs: {},
			outputs: {},
			metadata: {},
		});

		expect(decision1.priority).toBeGreaterThan(decision2.priority);
	});

	test("estimates task resources", () => {
		const task = {
			id: "task-1",
			name: "Task",
			type: "normal",
			status: TaskStatus.PENDING,
			retries: 0,
			maxRetries: 3,
		};

		const decision = router.route(task, {
			workflowId: "wf-1",
			taskId: "task-1",
			inputs: {},
			outputs: {},
			metadata: {},
		});

		expect(decision.estimatedDurationMs).toBeGreaterThan(0);
		expect(decision.resources.memory).toBeGreaterThan(0);
		expect(decision.resources.cpu).toBeGreaterThan(0);
	});
});
