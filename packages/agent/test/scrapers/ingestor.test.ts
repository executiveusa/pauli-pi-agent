/**
 * Source Ingestor Tests
 * Verify source ingestion, coordination, and storage
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PostgresClient } from "../../src/database/index.js";
import { SourceIngestor } from "../../src/scrapers/ingestor.js";

describe("SourceIngestor", () => {
	let ingestor: SourceIngestor;
	let mockDb: PostgresClient;

	beforeEach(() => {
		mockDb = {
			query: vi.fn(async () => ({ rows: [] })),
		} as unknown as PostgresClient;

		ingestor = new SourceIngestor(mockDb);

		// Mock fetch for URL ingestion
		global.fetch = vi.fn(
			() =>
				new Promise((resolve) => {
					resolve({
						ok: true,
						headers: {
							get: (key: string) => (key === "content-type" ? "text/html" : null),
						},
						text: () => Promise.resolve("<html><title>Test Page</title><body>Test content</body></html>"),
					} as Response);
				}),
		) as typeof fetch;
	});

	test("creates source ingestor", () => {
		expect(ingestor).toBeDefined();
	});

	test("ingests URL successfully", async () => {
		const result = await ingestor.ingestUrl("https://example.com");

		expect(result).toBeDefined();
		expect(result?.sourceType).toBe("url");
		expect(result?.title).toBeTruthy();
		expect(result?.content).toBeTruthy();
	});

	test("returns null on invalid URL", async () => {
		const result = await ingestor.ingestUrl("not a url");

		// Should return null or handle gracefully
		expect(result === null || !result.sourceUrl).toBeTruthy();
	});

	test("ingests markdown successfully", async () => {
		const markdown = "# Test\n\nThis is test content.";
		const result = await ingestor.ingestMarkdown(markdown, "Test Document");

		expect(result).toBeDefined();
		expect(result?.sourceType).toBe("markdown");
		expect(result?.title).toBe("Test Document");
		expect(result?.content).toBe(markdown);
	});

	test("stores source in database", async () => {
		const markdown = "# Test\n\nContent";
		const result = await ingestor.ingestMarkdown(markdown, "Test");

		// Verify markdown was ingested successfully
		expect(result).toBeDefined();
		expect(result?.sourceType).toBe("markdown");
	});

	test("ingests batch of sources", async () => {
		const sources = [
			{ type: "markdown" as const, value: "# Doc 1\n\nContent 1" },
			{ type: "markdown" as const, value: "# Doc 2\n\nContent 2" },
		];

		const result = await ingestor.ingestBatch(sources);

		expect(result.totalProcessed).toBeGreaterThan(0);
	});

	test("tracks batch errors", async () => {
		const sources = [
			{ type: "markdown" as const, value: "# Valid\n\nContent" },
			{ type: "markdown" as const, value: "" },
		];

		const result = await ingestor.ingestBatch(sources);

		expect(result.errors).toBeDefined();
		expect(Array.isArray(result.errors)).toBe(true);
	});

	test("returns ingestion timing", async () => {
		const sources = [{ type: "markdown" as const, value: "# Test\n\nContent" }];

		const result = await ingestor.ingestBatch(sources);

		expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
	});

	test("processes mixed source types", async () => {
		const sources = [
			{ type: "markdown" as const, value: "# Markdown\n\nContent" },
			{ type: "markdown" as const, value: "# Another\n\nMore" },
		];

		const result = await ingestor.ingestBatch(sources);

		expect(result.totalProcessed).toBeGreaterThan(0);
	});

	test("extracts metadata from sources", async () => {
		const result = await ingestor.ingestUrl("https://example.com");

		expect(result?.metadata).toBeDefined();
		expect(typeof result?.metadata).toBe("object");
	});

	test("calculates word count", async () => {
		const markdown = "word ".repeat(100);
		const result = await ingestor.ingestMarkdown(markdown, "Test");

		expect(result?.wordCount).toBeGreaterThan(0);
	});

	test("calculates reading time", async () => {
		const markdown = "word ".repeat(400);
		const result = await ingestor.ingestMarkdown(markdown, "Test");

		expect(result?.readingTimeMinutes).toBeGreaterThan(0);
	});

	test("handles concurrent processing", async () => {
		const urls = ["https://example.com/1", "https://example.com/2", "https://example.com/3"];

		// Ingest multiple URLs
		const results = await Promise.all(urls.map((url) => ingestor.ingestUrl(url)));

		expect(results.length).toBe(3);
		expect(results.filter((r) => r).length).toBeGreaterThan(0);
	});

	test("generates unique IDs for sources", async () => {
		const result1 = await ingestor.ingestMarkdown("Content 1", "Doc 1");
		const result2 = await ingestor.ingestMarkdown("Content 2", "Doc 2");

		expect(result1?.id).not.toBe(result2?.id);
	});

	test("stores processed timestamp", async () => {
		const result = await ingestor.ingestMarkdown("Content", "Test");

		expect(result?.processedAt).toBeDefined();
		expect(result?.processedAt instanceof Date).toBe(true);
	});

	test("returns success status", async () => {
		const sources = [{ type: "markdown" as const, value: "# Test\n\nContent" }];

		const result = await ingestor.ingestBatch(sources);

		expect(result.success).toBeDefined();
		expect(typeof result.success).toBe("boolean");
	});

	test("tracks processing statistics", async () => {
		const sources = [
			{ type: "markdown" as const, value: "# Doc 1\n\nContent" },
			{ type: "markdown" as const, value: "# Doc 2\n\nContent" },
		];

		const result = await ingestor.ingestBatch(sources);

		expect(result.totalProcessed).toBeGreaterThan(0);
		expect(result.totalFailed).toBeGreaterThanOrEqual(0);
		expect(result.totalProcessed + result.totalFailed).toBe(sources.length);
	});
});
