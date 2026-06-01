import OpenAI from "openai";
import type { Pool } from "pg";

interface ConversationMessage {
	role: "user" | "assistant";
	content: string;
}

export class KnowledgeChatbot {
	private client: OpenAI;
	private pool: Pool;
	private conversationHistory: ConversationMessage[] = [];
	private userId: string;

	constructor(pool: Pool, userId: string, openaiApiKey?: string) {
		this.pool = pool;
		this.userId = userId;
		this.client = new OpenAI({
			apiKey: openaiApiKey || process.env.OPENAI_API_KEY,
		});
	}

	async chat(userMessage: string): Promise<string> {
		this.conversationHistory.push({
			role: "user",
			content: userMessage,
		});

		// Retrieve relevant context from knowledge base
		const context = await this.retrieveRelevantKnowledge(userMessage);

		// Build system prompt with context
		const systemPrompt = this.buildSystemPrompt(context);

		// Call OpenAI API with full conversation history
		const response = await this.client.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content: systemPrompt,
				},
				...this.conversationHistory,
			],
			temperature: 0.7,
			max_tokens: 2048,
		});

		const assistantMessage = response.choices[0].message.content || "I encountered an issue processing your request.";

		this.conversationHistory.push({
			role: "assistant",
			content: assistantMessage,
		});

		return assistantMessage;
	}

	private async retrieveRelevantKnowledge(query: string): Promise<string> {
		try {
			// Search conversation messages for relevant content
			const conversations = await this.pool.query(
				`SELECT c.title, cm.content, cm.role
				 FROM conversation_messages cm
				 JOIN conversations c ON cm.conversation_id = c.id
				 WHERE c.user_id = $1
				 AND (cm.content ILIKE $2 OR c.title ILIKE $2)
				 LIMIT 5`,
				[this.userId, `%${query}%`],
			);

			// Search personal documents
			const documents = await this.pool.query(
				`SELECT filename, content_extracted
				 FROM personal_documents
				 WHERE user_id = $1
				 AND (filename ILIKE $2 OR content_extracted ILIKE $2)
				 LIMIT 3`,
				[this.userId, `%${query}%`],
			);

			// Search Notion pages
			const notionPages = await this.pool.query(
				`SELECT title, content
				 FROM notion_pages
				 WHERE user_id = $1
				 AND (title ILIKE $2 OR content ILIKE $2)
				 LIMIT 3`,
				[this.userId, `%${query}%`],
			);

			// Combine results into context
			const contextParts: string[] = [];

			if (conversations.rows.length > 0) {
				contextParts.push(
					"## Recent Conversations:\n" +
						conversations.rows
							.map((row) => `**${row.title || "Untitled"}** (${row.role}): ${row.content.substring(0, 200)}...`)
							.join("\n"),
				);
			}

			if (documents.rows.length > 0) {
				contextParts.push(
					"## Relevant Documents:\n" +
						documents.rows
							.map((row) => `**${row.filename}**: ${row.content_extracted.substring(0, 150)}...`)
							.join("\n"),
				);
			}

			if (notionPages.rows.length > 0) {
				contextParts.push(
					"## Notion Pages:\n" +
						notionPages.rows.map((row) => `**${row.title}**: ${row.content.substring(0, 150)}...`).join("\n"),
				);
			}

			return contextParts.join("\n\n");
		} catch (error) {
			console.error("Error retrieving knowledge:", error);
			return "";
		}
	}

	private buildSystemPrompt(context: string): string {
		return `You are a helpful assistant that has access to the user's personal knowledge base, including:
- Conversations from ChatGPT and Claude
- Personal documents and notes
- Notion pages and databases
- File imports

Use this context to answer questions accurately and provide personalized responses based on the user's own information and conversations.

${context ? `\nRelevant context from the user's knowledge base:\n${context}` : ""}

Guidelines:
- Be precise and reference the source of your information when possible
- If you find relevant information in the knowledge base, prioritize using that
- Be conversational and engaging, just like ChatGPT
- Ask clarifying questions if needed
- Maintain context across the conversation`;
	}

	clearHistory(): void {
		this.conversationHistory = [];
	}

	getHistory(): ConversationMessage[] {
		return [...this.conversationHistory];
	}
}
