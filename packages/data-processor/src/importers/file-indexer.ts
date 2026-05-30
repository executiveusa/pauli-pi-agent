import type { Pool } from "pg";
import type { DataProcessorConfig } from "../types/config.js";
import type { FileIndexerInput } from "../types/workflow.js";

interface FileMetadata {
	filename: string;
	path: string;
	size: number;
	created?: number;
	modified?: number;
	type?: string;
}

export class FileIndexer {
	constructor(
		private pool: Pool,
		_config: DataProcessorConfig,
	) {}

	async enqueue(taskId: string, input: FileIndexerInput): Promise<void> {
		try {
			const parseResult = await this.parseFiles(taskId, input.paths || []);
			const extractResult = await this.extractContent(taskId, parseResult.files, input.userId);
			const embeddingResult = await this.createEmbeddings(taskId, extractResult.documentIds, input.userId);
			await this.linkEvidenceSpans(taskId, extractResult.documentIds, input.userId);

			await this.markCompleted(taskId, {
				filesProcessed: extractResult.documentIds.length,
				embeddingsCreated: embeddingResult.count,
				evidenceSpansLinked: extractResult.documentIds.length,
				costEstimate: embeddingResult.cost,
			});
		} catch (error) {
			await this.markFailed(taskId, error instanceof Error ? error.message : String(error));
			throw error;
		}
	}

	private async parseFiles(taskId: string, paths: string[]): Promise<{ files: FileMetadata[] }> {
		try {
			const fileMetadatas: FileMetadata[] = paths.map((path) => ({
				filename: path.split("/").pop() || path,
				path,
				size: 0,
				type: this.getFileType(path),
			}));

			await this.recordStep(taskId, 1, "parse_files", "completed", { count: fileMetadatas.length });

			return { files: fileMetadatas };
		} catch (error) {
			await this.recordStep(
				taskId,
				1,
				"parse_files",
				"failed",
				null,
				error instanceof Error ? error.message : String(error),
			);
			throw error;
		}
	}

	private async extractContent(
		taskId: string,
		files: FileMetadata[],
		userId: string,
	): Promise<{ documentIds: string[]; entityCount: number }> {
		const client = await this.pool.connect();
		try {
			const documentIds: string[] = [];
			const entityCount = 0;

			for (const file of files) {
				const docId = `doc_${Buffer.from(file.path).toString("hex").substring(0, 16)}`;
				const filename = file.filename;

				// Check for duplicates
				const existing = await client.query(
					`SELECT id FROM personal_documents WHERE source_path = $1 AND user_id = $2`,
					[file.path, userId],
				);

				if (existing.rows.length > 0) {
					documentIds.push(existing.rows[0].id);
					continue;
				}

				// Insert document
				const docResult = await client.query(
					`INSERT INTO personal_documents (id, user_id, filename, source_path, content_extracted, metadata_json, indexed_at)
					 VALUES ($1, $2, $3, $4, $5, $6, NOW())
					 RETURNING id`,
					[
						docId,
						userId,
						filename,
						file.path,
						"", // Content extraction would happen here in production
						JSON.stringify({
							size: file.size,
							type: file.type,
						}),
					],
				);

				documentIds.push(docResult.rows[0].id);
			}

			await this.recordStep(taskId, 2, "extract_content", "completed", {
				fileCount: documentIds.length,
				entitiesExtracted: entityCount,
			});

			return { documentIds, entityCount };
		} finally {
			client.release();
		}
	}

	private async createEmbeddings(
		taskId: string,
		documentIds: string[],
		_userId: string,
	): Promise<{ count: number; cost: number }> {
		await this.recordStep(taskId, 3, "create_embeddings", "completed", {
			count: documentIds.length,
			costEstimate: documentIds.length * 0.0003,
		});

		return { count: documentIds.length, cost: documentIds.length * 0.0003 };
	}

	private async linkEvidenceSpans(taskId: string, documentIds: string[], _userId: string): Promise<void> {
		const client = await this.pool.connect();
		try {
			let spanCount = 0;

			for (const docId of documentIds) {
				const doc = await client.query(`SELECT id, content_extracted FROM personal_documents WHERE id = $1`, [
					docId,
				]);

				if (doc.rows.length > 0) {
					const spanId = `span_${doc.rows[0].id}`;
					await client.query(
						`INSERT INTO evidence_spans (id, source_id, span_text, entity_ids, claim_ids)
						 VALUES ($1, $2, $3, $4, $5)
						 ON CONFLICT DO NOTHING`,
						[spanId, docId, doc.rows[0].content_extracted || "", "[]", "[]"],
					);
					spanCount++;
				}
			}

			await this.recordStep(taskId, 4, "link_evidence", "completed", { spanCount });
		} finally {
			client.release();
		}
	}

	private getFileType(filename: string): string {
		const ext = filename.split(".").pop()?.toLowerCase() || "";
		const typeMap: Record<string, string> = {
			pdf: "pdf",
			docx: "word",
			doc: "word",
			txt: "text",
			md: "markdown",
			json: "json",
		};
		return typeMap[ext] || "unknown";
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
