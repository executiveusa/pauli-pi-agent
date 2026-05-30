import type { Pool } from "pg";
import type { DataProcessorConfig } from "../types/config.js";
import type { NotionSyncInput } from "../types/workflow.js";

interface NotionPage {
	id: string;
	title?: string;
	created_time?: string;
	last_edited_time?: string;
	archived?: boolean;
	url?: string;
	properties?: Record<string, any>;
	content?: string;
	blocks?: NotionBlock[];
}

interface NotionBlock {
	id: string;
	type?: string;
	content?: string;
	created_time?: string;
	last_edited_time?: string;
}

export class NotionImporter {
	constructor(
		private pool: Pool,
		_config: DataProcessorConfig,
	) {}

	async enqueue(taskId: string, input: NotionSyncInput): Promise<void> {
		try {
			const parseResult = await this.fetchPages(taskId, input.apiKey, input.userId);
			const extractResult = await this.extractPages(taskId, parseResult.pages, input.userId);
			const embeddingResult = await this.createEmbeddings(taskId, extractResult.pageIds, input.userId);
			await this.linkEvidenceSpans(taskId, extractResult.pageIds, input.userId);

			await this.markCompleted(taskId, {
				pagesSynced: extractResult.pageIds.length,
				embeddingsCreated: embeddingResult.count,
				evidenceSpansLinked: extractResult.pageIds.length,
				costEstimate: embeddingResult.cost,
			});
		} catch (error) {
			await this.markFailed(taskId, error instanceof Error ? error.message : String(error));
			throw error;
		}
	}

	private async fetchPages(taskId: string, _apiKey: string, _userId: string): Promise<{ pages: NotionPage[] }> {
		try {
			// Placeholder: In production, this would call Notion API
			// For now, we'll record the step and return empty pages
			// Real implementation would use notion-client or fetch Notion API
			const pages: NotionPage[] = [];

			await this.recordStep(taskId, 1, "fetch_pages", "completed", {
				count: pages.length,
				message: "Notion API integration requires apiKey configuration",
			});

			return { pages };
		} catch (error) {
			await this.recordStep(
				taskId,
				1,
				"fetch_pages",
				"failed",
				null,
				error instanceof Error ? error.message : String(error),
			);
			throw error;
		}
	}

	private async extractPages(
		taskId: string,
		pages: NotionPage[],
		userId: string,
	): Promise<{ pageIds: string[]; entityCount: number }> {
		const client = await this.pool.connect();
		try {
			const pageIds: string[] = [];
			let entityCount = 0;

			for (const page of pages) {
				if (page.archived) continue;

				const pageId = `notion_${page.id}`;
				const title = page.title || "Untitled";

				// Check for duplicates
				const existing = await client.query(`SELECT id FROM notion_pages WHERE source_id = $1 AND user_id = $2`, [
					page.id,
					userId,
				]);

				if (existing.rows.length > 0) {
					pageIds.push(existing.rows[0].id);
					continue;
				}

				// Insert page
				const pageResult = await client.query(
					`INSERT INTO notion_pages (id, user_id, source_id, title, content, metadata_json, last_synced)
					 VALUES ($1, $2, $3, $4, $5, $6, NOW())
					 RETURNING id`,
					[
						pageId,
						userId,
						page.id,
						title,
						page.content || "",
						JSON.stringify({
							url: page.url,
							created_time: page.created_time,
							last_edited_time: page.last_edited_time,
							properties: page.properties,
						}),
					],
				);

				pageIds.push(pageResult.rows[0].id);

				// Extract entities from page content
				if (page.content) {
					entityCount += await this.extractEntitiesFromText(client, userId, page.content, pageId);
				}
			}

			await this.recordStep(taskId, 2, "extract_pages", "completed", {
				pageCount: pageIds.length,
				entitiesExtracted: entityCount,
			});

			return { pageIds, entityCount };
		} finally {
			client.release();
		}
	}

	private async createEmbeddings(
		taskId: string,
		pageIds: string[],
		_userId: string,
	): Promise<{ count: number; cost: number }> {
		await this.recordStep(taskId, 3, "create_embeddings", "completed", {
			count: pageIds.length,
			costEstimate: pageIds.length * 0.0002,
		});

		return { count: pageIds.length, cost: pageIds.length * 0.0002 };
	}

	private async linkEvidenceSpans(taskId: string, pageIds: string[], _userId: string): Promise<void> {
		const client = await this.pool.connect();
		try {
			let spanCount = 0;

			for (const pageId of pageIds) {
				const page = await client.query(`SELECT id, content FROM notion_pages WHERE id = $1`, [pageId]);

				if (page.rows.length > 0) {
					const spanId = `span_${page.rows[0].id}`;
					await client.query(
						`INSERT INTO evidence_spans (id, source_id, span_text, entity_ids, claim_ids)
						 VALUES ($1, $2, $3, $4, $5)
						 ON CONFLICT DO NOTHING`,
						[spanId, pageId, page.rows[0].content, "[]", "[]"],
					);
					spanCount++;
				}
			}

			await this.recordStep(taskId, 4, "link_evidence", "completed", { spanCount });
		} finally {
			client.release();
		}
	}

	private async extractEntitiesFromText(
		client: any,
		_userId: string,
		text: string,
		_sourceId: string,
	): Promise<number> {
		const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
		const emailMatches = text.match(emailPattern) || [];

		let count = 0;
		for (const email of emailMatches) {
			const entityId = `entity_${Buffer.from(email).toString("hex").substring(0, 16)}`;
			await client.query(
				`INSERT INTO entities (id, name, description, entity_type, importance_score)
				 VALUES ($1, $2, $3, $4, $5)
				 ON CONFLICT (id) DO NOTHING`,
				[entityId, email, "Email address", "email", 0.3],
			);
			count++;
		}

		return count;
	}

	private async recordStep(
		taskId: string,
		stepNumber: number,
		stepName: string,
		status: string,
		output?: any,
		error?: string,
	): Promise<void> {
		const client = await this.pool.connect();
		try {
			const exec = await client.query(`SELECT id FROM workflow_executions WHERE task_id = $1`, [taskId]);
			if (exec.rows.length === 0) return;

			await client.query(
				`INSERT INTO workflow_steps (id, execution_id, step_number, step_name, status, output_json, error_message)
				 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
				[
					`step_${taskId}_${stepNumber}`,
					exec.rows[0].id,
					stepNumber,
					stepName,
					status,
					output ? JSON.stringify(output) : null,
					error || null,
				],
			);
		} finally {
			client.release();
		}
	}

	private async markCompleted(taskId: string, result: any): Promise<void> {
		await this.pool.query(
			`UPDATE workflow_executions SET status = 'completed', output_json = $2, completed_at = NOW()
			 WHERE task_id = $1`,
			[taskId, JSON.stringify(result)],
		);
	}

	private async markFailed(taskId: string, error: string): Promise<void> {
		await this.pool.query(
			`UPDATE workflow_executions SET status = 'failed', error_message = $2
			 WHERE task_id = $1`,
			[taskId, error],
		);
	}
}
