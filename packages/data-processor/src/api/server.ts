import { DataProcessor } from "../core/processor.js";
import type { DataProcessorConfig } from "../types/config.js";

export class DataProcessorServer {
	private processor: DataProcessor;

	constructor(config: DataProcessorConfig) {
		this.processor = new DataProcessor(config);
	}

	async initialize(): Promise<void> {
		await this.processor.initialize();
	}

	async queueImport(
		type: "import_chatgpt" | "import_claude" | "sync_notion" | "index_files",
		input: any,
	): Promise<string> {
		return this.processor.queueWorkflow(type, input);
	}

	async getStatus(taskId: string): Promise<any> {
		return this.processor.getWorkflowStatus(taskId);
	}

	async approveWorkflow(taskId: string, approvedBy: string): Promise<void> {
		return this.processor.approveWorkflow(taskId, approvedBy);
	}

	async getPendingApprovals(userId: string): Promise<any[]> {
		return this.processor.getPendingApprovals(userId);
	}

	async getHistory(userId: string, limit?: number): Promise<any[]> {
		return this.processor.getWorkflowHistory(userId, limit);
	}

	async close(): Promise<void> {
		return this.processor.close();
	}
}

export async function createServer(config: DataProcessorConfig): Promise<DataProcessorServer> {
	const server = new DataProcessorServer(config);
	await server.initialize();
	return server;
}
