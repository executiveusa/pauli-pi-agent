export type WorkflowType = "import_chatgpt" | "import_claude" | "sync_notion" | "index_files";

export type WorkflowStepStatus = "pending" | "in_progress" | "completed" | "failed" | "paused";

export type WorkflowStatus = "pending" | "in_progress" | "completed" | "failed" | "paused" | "awaiting_approval";

export interface WorkflowStep {
	name: string;
	status: WorkflowStepStatus;
	startedAt?: Date;
	completedAt?: Date;
	input?: unknown;
	output?: unknown;
	error?: string;
}

export interface WorkflowResult {
	taskId: string;
	type: WorkflowType;
	status: WorkflowStatus;
	steps: WorkflowStep[];
	startedAt: Date;
	completedAt?: Date;
	result?: {
		entitiesCreated: number;
		claimsCreated: number;
		embeddingsCreated: number;
		evidenceSpansLinked: number;
		costEstimate: number;
	};
	error?: string;
	approvalToken?: string;
}

export interface WorkflowInput {
	userId: string;
	metadata?: Record<string, unknown>;
	approvalRequired?: boolean;
}

export interface ChatGPTImportInput extends WorkflowInput {
	file: Buffer;
	parseThreads?: boolean;
	createPersonas?: boolean;
}

export interface ClaudeImportInput extends WorkflowInput {
	file: Buffer;
	extractPatterns?: boolean;
	buildReasoning?: boolean;
}

export interface NotionSyncInput extends WorkflowInput {
	apiKey: string;
	databaseIds?: string[];
	incremental?: boolean;
	trackChanges?: boolean;
}

export interface FileIndexerInput extends WorkflowInput {
	paths: string[];
	recursive?: boolean;
	fileTypes?: string[];
}
