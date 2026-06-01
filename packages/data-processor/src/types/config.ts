export interface DataProcessorConfig {
	databaseUrl: string;
	anthropicApiKey: string;
	notionApiKey?: string;
	openaiApiKey?: string;
	userAgent?: string;
	maxConcurrentWorkflows?: number;
	workflowTimeoutMs?: number;
	approvalRequired?: boolean;
	budgetPerWorkflow?: number;
	retryAttempts?: number;
}
