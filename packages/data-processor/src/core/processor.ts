import { Pool } from "pg";
import { initializeSchema } from "../database/schema.js";
import { ChatGPTImporter } from "../importers/chatgpt.js";
import { ClaudeImporter } from "../importers/claude.js";
import { FileIndexer } from "../importers/file-indexer.js";
import { NotionImporter } from "../importers/notion.js";
import type { DataProcessorConfig } from "../types/config.js";
import type {
	ChatGPTImportInput,
	ClaudeImportInput,
	WorkflowResult,
	WorkflowStatus,
	WorkflowType,
} from "../types/workflow.js";

/**
 * Main orchestrator for durable data processing using ABSURD
 * Handles ChatGPT, Claude, Notion, and file imports with exactly-once semantics
 */

export class DataProcessor {
	private pool: Pool;
	private config: DataProcessorConfig;
	private chatgptImporter: ChatGPTImporter;
	private claudeImporter: ClaudeImporter;
	private notionImporter: NotionImporter;
	private fileIndexer: FileIndexer;

	constructor(config: DataProcessorConfig) {
		this.config = {
			maxConcurrentWorkflows: 5,
			workflowTimeoutMs: 3600000, // 1 hour
			approvalRequired: true,
			budgetPerWorkflow: 5.0,
			retryAttempts: 3,
			...config,
		};

		this.pool = new Pool({
			connectionString: this.config.databaseUrl,
			application_name: "pi-data-processor",
		});

		this.chatgptImporter = new ChatGPTImporter(this.pool, this.config);
		this.claudeImporter = new ClaudeImporter(this.pool, this.config);
		this.notionImporter = new NotionImporter(this.pool, this.config);
		this.fileIndexer = new FileIndexer(this.pool, this.config);
	}

	/**
	 * Initialize database schema and ABSURD infrastructure
	 */
	async initialize(): Promise<void> {
		try {
			await initializeSchema(this.pool);
			console.log("[DataProcessor] Initialized successfully");
		} catch (error) {
			console.error("[DataProcessor] Initialization failed:", error);
			throw error;
		}
	}

	/**
	 * Queue a workflow for execution (durably)
	 */
	async queueWorkflow(type: WorkflowType, input: unknown): Promise<string> {
		const client = await this.pool.connect();
		try {
			const taskId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			// Insert workflow execution record (durable)
			await client.query(
				`INSERT INTO workflow_executions (id, task_id, workflow_type, user_id, status, input_json, cost_estimate)
				 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
				[
					`exec_${taskId}`,
					taskId,
					type,
					(input as any).userId || "unknown",
					"pending",
					JSON.stringify(input),
					(input as any).estimatedCost || 0,
				],
			);

			// Route to appropriate importer
			switch (type) {
				case "import_chatgpt":
					await this.chatgptImporter.enqueue(taskId, input as ChatGPTImportInput);
					break;
				case "import_claude":
					await this.claudeImporter.enqueue(taskId, input as ClaudeImportInput);
					break;
				case "sync_notion":
					await this.notionImporter.enqueue(taskId, input as any);
					break;
				case "index_files":
					await this.fileIndexer.enqueue(taskId, input as any);
					break;
			}

			return taskId;
		} finally {
			client.release();
		}
	}

	/**
	 * Get workflow execution status with all step details
	 */
	async getWorkflowStatus(taskId: string): Promise<WorkflowResult | null> {
		const result = await this.pool.query(`SELECT * FROM workflow_executions WHERE task_id = $1`, [taskId]);

		if (result.rows.length === 0) return null;

		const execution = result.rows[0];
		const stepsResult = await this.pool.query(
			`SELECT * FROM workflow_steps WHERE execution_id = $1 ORDER BY step_number`,
			[execution.id],
		);

		return {
			taskId,
			type: execution.workflow_type,
			status: execution.status as WorkflowStatus,
			steps: stepsResult.rows.map((row: any) => ({
				name: row.step_name,
				status: row.status,
				startedAt: row.started_at,
				completedAt: row.completed_at,
				input: row.input_json,
				output: row.output_json,
				error: row.error_message,
			})),
			startedAt: execution.started_at,
			completedAt: execution.completed_at,
			result: execution.output_json,
			error: execution.error_message,
			approvalToken: execution.approval_token,
		};
	}

	/**
	 * Approve a workflow that's awaiting approval
	 */
	async approveWorkflow(taskId: string, approvedBy: string): Promise<void> {
		const client = await this.pool.connect();
		try {
			await client.query("BEGIN");

			// Update workflow as approved
			const result = await client.query(
				`UPDATE workflow_executions
				 SET approval_token = NULL, approved_by = $2, status = 'in_progress', updated_at = NOW()
				 WHERE task_id = $1 AND status = 'awaiting_approval'
				 RETURNING id`,
				[taskId, approvedBy],
			);

			if (result.rows.length === 0) {
				throw new Error(`Workflow ${taskId} not found or not awaiting approval`);
			}

			// Mark approval record
			await client.query(
				`UPDATE import_approvals
				 SET approved = TRUE, approved_at = NOW(), approved_by = $2
				 WHERE execution_id = $1`,
				[result.rows[0].id, approvedBy],
			);

			await client.query("COMMIT");
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
	}

	/**
	 * Reject a workflow that's awaiting approval
	 */
	async rejectWorkflow(taskId: string, rejectionReason: string): Promise<void> {
		const client = await this.pool.connect();
		try {
			await client.query("BEGIN");

			// Update workflow as rejected
			const result = await client.query(
				`UPDATE workflow_executions
				 SET status = 'failed', error_message = $2, updated_at = NOW()
				 WHERE task_id = $1 AND status = 'awaiting_approval'
				 RETURNING id`,
				[taskId, rejectionReason],
			);

			if (result.rows.length === 0) {
				throw new Error(`Workflow ${taskId} not found or not awaiting approval`);
			}

			// Mark approval as rejected
			await client.query(
				`UPDATE import_approvals
				 SET rejected_at = NOW()
				 WHERE execution_id = $1`,
				[result.rows[0].id],
			);

			await client.query("COMMIT");
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
	}

	/**
	 * Get pending approvals for a user
	 */
	async getPendingApprovals(userId: string): Promise<any[]> {
		const result = await this.pool.query(
			`SELECT we.*, ia.* FROM workflow_executions we
			 JOIN import_approvals ia ON we.id = ia.execution_id
			 WHERE we.user_id = $1 AND we.status = 'awaiting_approval' AND ia.approved_at IS NULL
			 ORDER BY ia.requested_at DESC`,
			[userId],
		);
		return result.rows;
	}

	/**
	 * Get workflow history for a user
	 */
	async getWorkflowHistory(userId: string, limit: number = 50): Promise<WorkflowResult[]> {
		const result = await this.pool.query(
			`SELECT we.*,
			        (SELECT json_agg(json_build_object('name', step_name, 'status', status))
			         FROM workflow_steps WHERE execution_id = we.id ORDER BY step_number) as steps
			 FROM workflow_executions we
			 WHERE we.user_id = $1
			 ORDER BY we.created_at DESC
			 LIMIT $2`,
			[userId, limit],
		);

		return result.rows.map((row: any) => ({
			taskId: row.task_id,
			type: row.workflow_type,
			status: row.status,
			steps: row.steps || [],
			startedAt: row.started_at,
			completedAt: row.completed_at,
			result: row.output_json,
			error: row.error_message,
		}));
	}

	/**
	 * Clean up resources
	 */
	async close(): Promise<void> {
		await this.pool.end();
	}
}
