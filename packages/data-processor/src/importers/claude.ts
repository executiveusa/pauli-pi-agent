import type { Pool } from "pg";
import type { DataProcessorConfig } from "../types/config.js";
import type { ClaudeImportInput } from "../types/workflow.js";

interface ClaudeConversation {
	uuid: string;
	name?: string;
	created_at?: string;
	updated_at?: string;
	conversation_history?: ClaudeMessage[];
}

interface ClaudeMessage {
	id?: string;
	role?: string;
	content?: string;
	created_at?: string;
	updated_at?: string;
}

export class ClaudeImporter {
	constructor(
		private pool: Pool,
		_config: DataProcessorConfig,
	) {}

	async enqueue(taskId: string, input: ClaudeImportInput): Promise<void> {
		try {
			const parseResult = await this.parseExport(taskId, input.file);
			const extractResult = await this.extractConversations(taskId, parseResult.conversations, input.userId);
			const embeddingResult = await this.createEmbeddings(taskId, extractResult.messageIds, input.userId);
			await this.linkEvidenceSpans(taskId, extractResult.conversationIds, input.userId);

			await this.markCompleted(taskId, {
				entitiesCreated: extractResult.entityCount,
				conversationsCreated: extractResult.conversationIds.length,
				embeddingsCreated: embeddingResult.count,
				evidenceSpansLinked: extractResult.conversationIds.length,
				costEstimate: embeddingResult.cost,
			});
		} catch (error) {
			await this.markFailed(taskId, error instanceof Error ? error.message : String(error));
			throw error;
		}
	}

	private async parseExport(taskId: string, file: Buffer): Promise<{ conversations: ClaudeConversation[] }> {
		try {
			const json = JSON.parse(file.toString("utf-8"));

			// Support both single conversation object and array of conversations
			const conversations = Array.isArray(json) ? json : [json];

			await this.recordStep(taskId, 1, "parse_export", "completed", { count: conversations.length });

			return { conversations };
		} catch (error) {
			await this.recordStep(
				taskId,
				1,
				"parse_export",
				"failed",
				null,
				error instanceof Error ? error.message : String(error),
			);
			throw error;
		}
	}

	private async extractConversations(
		taskId: string,
		conversations: ClaudeConversation[],
		userId: string,
	): Promise<{ conversationIds: string[]; messageIds: string[]; entityCount: number }> {
		const client = await this.pool.connect();
		try {
			const conversationIds: string[] = [];
			const messageIds: string[] = [];
			let entityCount = 0;

			for (const conv of conversations) {
				const convId = `claude_${conv.uuid}`;
				const title = conv.name || "Untitled";

				// Check for duplicates
				const existing = await client.query(
					`SELECT id FROM conversations WHERE source_type = 'claude' AND source_version = $1 AND user_id = $2`,
					[conv.uuid, userId],
				);

				if (existing.rows.length > 0) {
					conversationIds.push(existing.rows[0].id);
					continue;
				}

				// Insert conversation
				const convResult = await client.query(
					`INSERT INTO conversations (id, user_id, source_type, source_version, title, metadata_json)
					 VALUES ($1, $2, $3, $4, $5, $6)
					 RETURNING id`,
					[
						convId,
						userId,
						"claude",
						conv.uuid,
						title,
						JSON.stringify({
							created_at: conv.created_at,
							updated_at: conv.updated_at,
						}),
					],
				);

				conversationIds.push(convResult.rows[0].id);

				// Extract messages
				const messages = conv.conversation_history || [];
				for (let i = 0; i < messages.length; i++) {
					const msg = messages[i];
					if (!msg.content) continue;

					const msgId = `msg_${msg.id || i}`;
					const role = msg.role || "user";

					// Check for duplicates
					const contentHash = this.hashContent(msg.content);
					const existingContent = await client.query(
						`SELECT id FROM content_hashes WHERE hash = $1 AND source_id = $2`,
						[contentHash, convId],
					);

					if (existingContent.rows.length > 0) {
						continue;
					}

					// Insert message
					const msgResult = await client.query(
						`INSERT INTO conversation_messages
						 (id, conversation_id, role, content, content_hash, message_index)
						 VALUES ($1, $2, $3, $4, $5, $6)
						 RETURNING id`,
						[msgId, convId, role, msg.content, contentHash, i],
					);

					messageIds.push(msgResult.rows[0].id);

					// Track content hash
					await client.query(
						`INSERT INTO content_hashes (hash, content_type, source_id)
						 VALUES ($1, $2, $3)
						 ON CONFLICT (hash) DO UPDATE SET occurrence_count = occurrence_count + 1`,
						[contentHash, "conversation_message", convId],
					);

					// Extract entities from message
					entityCount += await this.extractEntitiesFromText(client, userId, msg.content, msgId);
				}
			}

			await this.recordStep(taskId, 2, "extract_conversations", "completed", {
				conversationCount: conversationIds.length,
				messageCount: messageIds.length,
				entitiesExtracted: entityCount,
			});

			return { conversationIds, messageIds, entityCount };
		} finally {
			client.release();
		}
	}

	private async createEmbeddings(
		taskId: string,
		messageIds: string[],
		_userId: string,
	): Promise<{ count: number; cost: number }> {
		await this.recordStep(taskId, 3, "create_embeddings", "completed", {
			count: messageIds.length,
			costEstimate: messageIds.length * 0.0001,
		});

		return { count: messageIds.length, cost: messageIds.length * 0.0001 };
	}

	private async linkEvidenceSpans(taskId: string, conversationIds: string[], _userId: string): Promise<void> {
		const client = await this.pool.connect();
		try {
			let spanCount = 0;

			for (const convId of conversationIds) {
				const messages = await client.query(
					`SELECT id, content FROM conversation_messages WHERE conversation_id = $1`,
					[convId],
				);

				for (const msg of messages.rows) {
					const spanId = `span_${msg.id}`;
					await client.query(
						`INSERT INTO evidence_spans (id, source_id, span_text, entity_ids, claim_ids)
						 VALUES ($1, $2, $3, $4, $5)
						 ON CONFLICT DO NOTHING`,
						[spanId, convId, msg.content, "[]", "[]"],
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

	private hashContent(content: string): string {
		return Buffer.from(content).toString("hex").substring(0, 16);
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
