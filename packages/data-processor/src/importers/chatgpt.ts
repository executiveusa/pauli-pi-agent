import type { Pool } from "pg";
import type { DataProcessorConfig } from "../types/config.js";
import type { ChatGPTImportInput } from "../types/workflow.js";

/**
 * ChatGPT conversation export importer
 * Handles OpenAI's JSON export format with durable checkpoints
 */

interface ChatGPTConversation {
	id: string;
	title?: string;
	create_time?: number;
	update_time?: number;
	mapping: Record<string, any>;
	current_node?: string;
}

interface ChatGPTMessage {
	id: string;
	message?: {
		id: string;
		author: { role: string };
		create_time?: number;
		update_time?: number;
		content: { content_type: string; parts: string[] };
	};
	children?: string[];
	parent?: string;
}

export class ChatGPTImporter {
	constructor(
		private pool: Pool,
		_config: DataProcessorConfig,
	) {}

	async enqueue(taskId: string, input: ChatGPTImportInput): Promise<void> {
		try {
			// Step 1: Parse and validate JSON
			const parseResult = await this.parseExport(taskId, input.file);

			// Step 2: Extract conversations and messages
			const extractResult = await this.extractConversations(taskId, parseResult.conversations, input.userId);

			// Step 3: Create semantic embeddings
			const embeddingResult = await this.createEmbeddings(taskId, extractResult.messageIds, input.userId);

			// Step 4: Link evidence spans
			await this.linkEvidenceSpans(taskId, extractResult.conversationIds, input.userId);

			// Mark workflow as completed
			await this.markCompleted(taskId, {
				entitiesCreated: extractResult.entityCount,
				claimsCreated: extractResult.claimCount,
				embeddingsCreated: embeddingResult.count,
				evidenceSpansLinked: extractResult.conversationIds.length,
				costEstimate: embeddingResult.cost,
			});
		} catch (error) {
			await this.markFailed(taskId, error instanceof Error ? error.message : String(error));
			throw error;
		}
	}

	private async parseExport(taskId: string, file: Buffer): Promise<{ conversations: ChatGPTConversation[] }> {
		try {
			const json = JSON.parse(file.toString("utf-8"));

			// Validate structure
			if (!Array.isArray(json)) {
				throw new Error("ChatGPT export must be an array of conversations");
			}

			await this.recordStep(taskId, 1, "parse_export", "completed", { count: json.length });

			return { conversations: json };
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
		conversations: ChatGPTConversation[],
		userId: string,
	): Promise<{ conversationIds: string[]; messageIds: string[]; entityCount: number; claimCount: number }> {
		const client = await this.pool.connect();
		try {
			const conversationIds: string[] = [];
			const messageIds: string[] = [];
			let entityCount = 0;
			const claimCount = 0;

			for (const conv of conversations) {
				const convId = `chatgpt_${conv.id}`;
				const title = conv.title || "Untitled";

				// Check for duplicates
				const existing = await client.query(
					`SELECT id FROM conversations WHERE source_type = 'chatgpt' AND source_version = $1 AND user_id = $2`,
					[conv.id, userId],
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
						"chatgpt",
						conv.id,
						title,
						JSON.stringify({
							create_time: conv.create_time,
							update_time: conv.update_time,
						}),
					],
				);

				conversationIds.push(convResult.rows[0].id);

				// Extract messages
				for (const [nodeId, node] of Object.entries(conv.mapping || {})) {
					const msg = node as ChatGPTMessage;
					if (!msg.message) continue;

					const msgContent = msg.message.content?.parts?.join("\n") || "";
					const msgId = `msg_${msg.message.id}`;
					const role = msg.message.author?.role || "unknown";

					// Check for duplicates
					const contentHash = this.hashContent(msgContent);
					const existing = await client.query(`SELECT id FROM content_hashes WHERE hash = $1 AND source_id = $2`, [
						contentHash,
						convId,
					]);

					if (existing.rows.length > 0) {
						continue;
					}

					// Insert message
					const msgResult = await client.query(
						`INSERT INTO conversation_messages
						 (id, conversation_id, role, content, content_hash, message_index)
						 VALUES ($1, $2, $3, $4, $5, $6)
						 RETURNING id`,
						[msgId, convId, role, msgContent, contentHash, nodeId],
					);

					messageIds.push(msgResult.rows[0].id);

					// Track content hash
					await client.query(
						`INSERT INTO content_hashes (hash, content_type, source_id)
						 VALUES ($1, $2, $3)
						 ON CONFLICT (hash) DO UPDATE SET occurrence_count = occurrence_count + 1`,
						[contentHash, "conversation_message", convId],
					);

					// Extract entities from message (basic NLP)
					entityCount += await this.extractEntitiesFromText(client, userId, msgContent, msgId);
				}
			}

			await this.recordStep(taskId, 2, "extract_conversations", "completed", {
				conversationCount: conversationIds.length,
				messageCount: messageIds.length,
				entitiesExtracted: entityCount,
			});

			return { conversationIds, messageIds, entityCount, claimCount };
		} finally {
			client.release();
		}
	}

	private async createEmbeddings(
		taskId: string,
		messageIds: string[],
		_userId: string,
	): Promise<{ count: number; cost: number }> {
		const client = await this.pool.connect();
		try {
			const anthropic = await this.getAnthropicClient();
			let successCount = 0;
			let totalCost = 0;

			for (const messageId of messageIds) {
				try {
					const msg = await client.query(`SELECT content FROM conversation_messages WHERE id = $1`, [messageId]);

					if (msg.rows.length === 0) continue;

					const content = msg.rows[0].content;

					// Create embedding using Anthropic's embeddings API
					const embedding = await (anthropic as any).messages.embeddings.create({
						model: "claude-3-5-sonnet-20241022",
						input: content.substring(0, 2000),
					});

					// Store embedding vector
					await client.query(
						`INSERT INTO message_embeddings (id, message_id, embedding_vector, model, created_at)
						 VALUES ($1, $2, $3, $4, NOW())
						 ON CONFLICT (message_id) DO NOTHING`,
						[
							`emb_${messageId}`,
							messageId,
							JSON.stringify(embedding),
							"claude-3-5-sonnet-20241022",
						],
					);

					successCount++;
					totalCost += 0.0001;
				} catch (error) {
					console.error(`Failed to embed message ${messageId}:`, error);
				}
			}

			await this.recordStep(taskId, 3, "create_embeddings", "completed", {
				count: successCount,
				costEstimate: totalCost,
			});

			return { count: successCount, cost: totalCost };
		} finally {
			client.release();
		}
	}

	private async getAnthropicClient(): Promise<any> {
		const Anthropic = (await import("@anthropic-ai/sdk")).default;
		return new Anthropic({
			apiKey: process.env.ANTHROPIC_API_KEY,
		});
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
					// Create evidence spans for messages
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
		// Basic entity extraction (name, email patterns)
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
		// Simple hash for content deduplication
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
