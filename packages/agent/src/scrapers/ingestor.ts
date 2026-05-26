/**
 * Source Ingestor
 * Coordinates scraping, extraction, and ingestion of various sources
 */

import type { PostgresClient } from "../database/index.js";
import { DocumentParser } from "./parser.js";
import { PdfExtractor } from "./pdf.js";
import { WebScraper } from "./web.js";

export interface ProcessedSource {
	id: string;
	sourceUrl?: string;
	sourceType: "url" | "pdf" | "markdown" | "text";
	title: string;
	content: string;
	cleanContent: string;
	wordCount: number;
	readingTimeMinutes: number;
	metadata: Record<string, unknown>;
	processedAt: Date;
	errors: string[];
}

export interface IngestionResult {
	success: boolean;
	sources: ProcessedSource[];
	totalProcessed: number;
	totalFailed: number;
	errors: Array<{
		source: string;
		error: string;
	}>;
	processingTimeMs: number;
}

export class SourceIngestor {
	private webScraper: WebScraper;
	private pdfExtractor: PdfExtractor;
	private documentParser: DocumentParser;
	private db: PostgresClient;

	constructor(db: PostgresClient) {
		this.db = db;
		this.webScraper = new WebScraper();
		this.pdfExtractor = new PdfExtractor();
		this.documentParser = new DocumentParser();
	}

	async ingestUrl(url: string): Promise<ProcessedSource | null> {
		try {
			const result = await this.webScraper.scrape(url);

			if (!result.success || !result.page) {
				return null;
			}

			const parsed = this.documentParser.parse(result.page.content, "text/html", {
				title: result.page.title,
				description: result.page.description,
				sourceUrl: url,
				language: result.page.language,
				fetchedAt: result.page.fetchedAt,
			});

			return {
				id: parsed.id,
				sourceUrl: url,
				sourceType: "url",
				title: parsed.metadata.title || url,
				content: parsed.content,
				cleanContent: parsed.cleanContent,
				wordCount: parsed.metadata.wordCount,
				readingTimeMinutes: parsed.metadata.readingTimeMinutes,
				metadata: {
					description: parsed.metadata.description,
					links: parsed.links,
					sections: parsed.sections.length,
				},
				processedAt: new Date(),
				errors: [],
			};
		} catch (_error) {
			return null;
		}
	}

	async ingestPdf(filePath: string): Promise<ProcessedSource | null> {
		try {
			const result = await this.pdfExtractor.extract(filePath);

			if (!result.success) {
				return null;
			}

			const parsed = this.documentParser.parse(result.totalContent, "application/pdf", {
				title: result.title || filePath,
				author: result.author,
				fetchedAt: result.createdAt || new Date(),
			});

			return {
				id: parsed.id,
				sourceUrl: filePath,
				sourceType: "pdf",
				title: parsed.metadata.title || filePath,
				content: parsed.content,
				cleanContent: parsed.cleanContent,
				wordCount: parsed.metadata.wordCount,
				readingTimeMinutes: parsed.metadata.readingTimeMinutes,
				metadata: {
					pageCount: result.pageCount,
					author: result.author,
					subject: result.subject,
				},
				processedAt: new Date(),
				errors: [],
			};
		} catch (_error) {
			return null;
		}
	}

	async ingestMarkdown(content: string, title: string): Promise<ProcessedSource | null> {
		try {
			const parsed = this.documentParser.parseMarkdown(content);

			return {
				id: parsed.id,
				sourceType: "markdown",
				title: title || parsed.metadata.title,
				content: parsed.content,
				cleanContent: parsed.cleanContent,
				wordCount: parsed.metadata.wordCount,
				readingTimeMinutes: parsed.metadata.readingTimeMinutes,
				metadata: {
					sections: parsed.sections.length,
					links: parsed.links.length,
				},
				processedAt: new Date(),
				errors: [],
			};
		} catch (_error) {
			return null;
		}
	}

	async ingestBatch(
		sources: Array<{ type: "url" | "pdf" | "markdown"; value: string; title?: string }>,
	): Promise<IngestionResult> {
		const startTime = Date.now();
		const results: ProcessedSource[] = [];
		const errors: Array<{ source: string; error: string }> = [];

		for (const source of sources) {
			try {
				let processed: ProcessedSource | null = null;

				if (source.type === "url") {
					processed = await this.ingestUrl(source.value);
				} else if (source.type === "pdf") {
					processed = await this.ingestPdf(source.value);
				} else if (source.type === "markdown") {
					processed = await this.ingestMarkdown(source.value, source.title || "Document");
				}

				if (processed) {
					results.push(processed);
					// Store in database
					await this.storeSource(processed);
				} else {
					errors.push({
						source: source.value,
						error: "Processing failed",
					});
				}
			} catch (_error) {
				errors.push({
					source: source.value,
					error: String(error),
				});
			}
		}

		return {
			success: errors.length === 0,
			sources: results,
			totalProcessed: results.length,
			totalFailed: errors.length,
			errors,
			processingTimeMs: Date.now() - startTime,
		};
	}

	private async storeSource(source: ProcessedSource): Promise<void> {
		await this.db.query(
			`INSERT INTO sources
       (id, source_type, title, content, clean_content, word_count, reading_time_minutes, metadata, processed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			[
				source.id,
				source.sourceType,
				source.title,
				source.content,
				source.cleanContent,
				source.wordCount,
				source.readingTimeMinutes,
				JSON.stringify(source.metadata),
				source.processedAt,
			],
		);
	}
}

export function createSourceIngestor(db: PostgresClient): SourceIngestor {
	return new SourceIngestor(db);
}
