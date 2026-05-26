/**
 * Web Scraper Tests
 * Verify web scraping, content extraction, and link parsing
 */

import { describe, expect, test, beforeEach, vi } from "vitest";
import { WebScraper } from "../../src/scrapers/web.js";

describe("WebScraper", () => {
	let scraper: WebScraper;

	beforeEach(() => {
		scraper = new WebScraper();
		// Mock global fetch
		global.fetch = vi.fn();
	});

	test("creates web scraper", () => {
		expect(scraper).toBeDefined();
	});

	test("validates valid URL", async () => {
		const validUrls = ["https://example.com", "http://example.com", "https://example.com/path?query=value"];

		for (const url of validUrls) {
			// Just verify it doesn't throw
			expect(() => {
				scraper["isValidUrl"](url);
			}).not.toThrow();
		}
	});

	test("rejects invalid URLs", async () => {
		const invalidUrls = ["not a url", "example", "ht!tp://example.com"];

		for (const url of invalidUrls) {
			const isValid = scraper["isValidUrl"](url);
			expect(isValid).toBe(false);
		}
	});

	test("handles fetch timeout", async () => {
		const mockFetch = vi.fn(
			() =>
				new Promise((_resolve, reject) => {
					setTimeout(() => reject(new Error("timeout")), 100);
				}),
		);
		global.fetch = mockFetch;

		const result = await scraper.scrape("https://example.com");

		expect(result.success).toBe(false);
		expect(result.error).toContain("Failed");
	});

	test("handles HTTP errors", async () => {
		const mockFetch = vi.fn(
			() =>
				new Promise((resolve) => {
					resolve({
						ok: false,
						status: 404,
						statusText: "Not Found",
					});
				}) as Promise<Response>,
		);
		global.fetch = mockFetch;

		const result = await scraper.scrape("https://example.com/notfound");

		expect(result.success).toBe(false);
		expect(result.error).toContain("404");
	});

	test("extracts page title", async () => {
		const mockFetch = vi.fn(
			() =>
				new Promise((resolve) => {
					resolve({
						ok: true,
						headers: {
							get: (key: string) => (key === "content-type" ? "text/html" : null),
						},
						text: () => Promise.resolve("<html><title>Test Page</title></html>"),
					});
				}) as Promise<Response>,
		);
		global.fetch = mockFetch;

		const result = await scraper.scrape("https://example.com");

		expect(result.success).toBe(true);
		expect(result.page?.title).toBe("Test Page");
	});

	test("extracts description", async () => {
		const mockFetch = vi.fn(
			() =>
				new Promise((resolve) => {
					resolve({
						ok: true,
						headers: {
							get: (key: string) => (key === "content-type" ? "text/html" : null),
						},
						text: () =>
							Promise.resolve('<html><meta name="description" content="Test Description"></html>'),
					});
				}) as Promise<Response>,
		);
		global.fetch = mockFetch;

		const result = await scraper.scrape("https://example.com");

		expect(result.success).toBe(true);
		expect(result.page?.description).toBe("Test Description");
	});

	test("extracts text content", async () => {
		const mockFetch = vi.fn(
			() =>
				new Promise((resolve) => {
					resolve({
						ok: true,
						headers: {
							get: (key: string) => (key === "content-type" ? "text/html" : null),
						},
						text: () =>
							Promise.resolve(
								"<html><body><p>Hello World</p><script>alert('test')</script></body></html>",
							),
					});
				}) as Promise<Response>,
		);
		global.fetch = mockFetch;

		const result = await scraper.scrape("https://example.com");

		expect(result.success).toBe(true);
		expect(result.page?.content).toContain("Hello World");
		expect(result.page?.content).not.toContain("alert");
	});

	test("extracts links", async () => {
		const mockFetch = vi.fn(
			() =>
				new Promise((resolve) => {
					resolve({
						ok: true,
						headers: {
							get: (key: string) => (key === "content-type" ? "text/html" : null),
						},
						text: () =>
							Promise.resolve(
								'<html><body><a href="https://example.com/page1">Page 1</a><a href="/page2">Page 2</a></body></html>',
							),
					});
				}) as Promise<Response>,
		);
		global.fetch = mockFetch;

		const result = await scraper.scrape("https://example.com");

		expect(result.success).toBe(true);
		expect(result.page?.links.length).toBeGreaterThan(0);
		expect(result.page?.links.some((l) => l.text === "Page 1")).toBe(true);
	});

	test("detects language", async () => {
		const mockFetch = vi.fn(
			() =>
				new Promise((resolve) => {
					resolve({
						ok: true,
						headers: {
							get: (key: string) => (key === "content-type" ? "text/html" : null),
						},
						text: () => Promise.resolve('<html lang="en"><title>Test</title></html>'),
					});
				}) as Promise<Response>,
		);
		global.fetch = mockFetch;

		const result = await scraper.scrape("https://example.com");

		expect(result.success).toBe(true);
		expect(result.page?.language).toBe("en");
	});

	test("handles charset", async () => {
		const mockFetch = vi.fn(
			() =>
				new Promise((resolve) => {
					resolve({
						ok: true,
						headers: {
							get: (key: string) => (key === "content-type" ? "text/html" : null),
						},
						text: () =>
							Promise.resolve(
								'<html><meta charset="utf-8"><title>Test</title></html>',
							),
					});
				}) as Promise<Response>,
		);
		global.fetch = mockFetch;

		const result = await scraper.scrape("https://example.com");

		expect(result.success).toBe(true);
		expect(result.page?.charset).toBe("utf-8");
	});

	test("scrapes multiple URLs concurrently", async () => {
		const mockFetch = vi.fn(
			() =>
				new Promise((resolve) => {
					resolve({
						ok: true,
						headers: {
							get: (key: string) => (key === "content-type" ? "text/html" : null),
						},
						text: () => Promise.resolve("<html><title>Test</title></html>"),
					});
				}) as Promise<Response>,
		);
		global.fetch = mockFetch;

		const urls = [
			"https://example.com/1",
			"https://example.com/2",
			"https://example.com/3",
		];
		const results = await scraper.scrapeMultiple(urls);

		expect(results).toHaveLength(3);
		expect(results.every((r) => r.success)).toBe(true);
	});

	test("identifies retryable errors", () => {
		const retryableErrors = [
			new Error("ECONNREFUSED"),
			new Error("ENOTFOUND"),
			new Error("timeout"),
			new Error("503 Service Unavailable"),
		];

		for (const error of retryableErrors) {
			const isRetryable = scraper["isRetryableError"](error);
			expect(isRetryable).toBe(true);
		}
	});

	test("identifies non-retryable errors", () => {
		const nonRetryableErrors = [new Error("Invalid URL"), new Error("Bad request")];

		for (const error of nonRetryableErrors) {
			const isRetryable = scraper["isRetryableError"](error);
			expect(isRetryable).toBe(false);
		}
	});

	test("sets user agent header", async () => {
		const mockFetch = vi.fn(
			() =>
				new Promise((resolve) => {
					resolve({
						ok: true,
						headers: {
							get: (key: string) => (key === "content-type" ? "text/html" : null),
						},
						text: () => Promise.resolve("<html><title>Test</title></html>"),
					});
				}) as Promise<Response>,
		);
		global.fetch = mockFetch;

		await scraper.scrape("https://example.com");

		expect(mockFetch).toHaveBeenCalledWith(
			"https://example.com",
			expect.objectContaining({
				headers: expect.objectContaining({
					"User-Agent": expect.stringContaining("PI-Agent"),
				}),
			}),
		);
	});

	test("stores fetched timestamp", async () => {
		const mockFetch = vi.fn(
			() =>
				new Promise((resolve) => {
					resolve({
						ok: true,
						headers: {
							get: (key: string) => (key === "content-type" ? "text/html" : null),
						},
						text: () => Promise.resolve("<html><title>Test</title></html>"),
					});
				}) as Promise<Response>,
		);
		global.fetch = mockFetch;

		const before = Date.now();
		const result = await scraper.scrape("https://example.com");
		const after = Date.now();

		expect(result.success).toBe(true);
		expect(result.page?.fetchedAt.getTime()).toBeGreaterThanOrEqual(before);
		expect(result.page?.fetchedAt.getTime()).toBeLessThanOrEqual(after);
	});
});
