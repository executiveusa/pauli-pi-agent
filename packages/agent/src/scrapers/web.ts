/**
 * Web Scraper
 * Fetches and extracts content from web pages
 */

export interface LinkInfo {
	href: string;
	text: string;
	title?: string;
}

export interface ScrapedPage {
	url: string;
	title: string;
	description?: string;
	content: string;
	htmlContent: string;
	links: LinkInfo[];
	language?: string;
	charset?: string;
	fetchedAt: Date;
}

export interface WebScrapingResult {
	success: boolean;
	page?: ScrapedPage;
	error?: string;
	retryable: boolean;
}

export class WebScraper {
	private readonly timeout: number = 30000;
	private readonly maxRetries: number = 3;
	private readonly userAgent: string = "PI-Agent/1.0 (+http://example.com/bot)";

	async scrape(url: string): Promise<WebScrapingResult> {
		// Validate URL
		if (!this.isValidUrl(url)) {
			return {
				success: false,
				error: "Invalid URL",
				retryable: false,
			};
		}

		// Attempt fetch with retries
		for (let attempt = 0; attempt < this.maxRetries; attempt++) {
			try {
				const response = await this.fetchPage(url);
				const page = await this.extractContent(response, url);

				return {
					success: true,
					page,
					retryable: false,
				};
			} catch (error) {
				const isRetryable = this.isRetryableError(error);

				if (attempt === this.maxRetries - 1) {
					return {
						success: false,
						error: `Failed after ${this.maxRetries} attempts: ${String(error)}`,
						retryable: isRetryable,
					};
				}

				// Wait before retrying
				await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
			}
		}

		return {
			success: false,
			error: "Unknown error",
			retryable: true,
		};
	}

	async scrapeMultiple(urls: string[]): Promise<WebScrapingResult[]> {
		// Scrape with concurrency limit (5 at a time)
		const results: WebScrapingResult[] = [];
		const concurrency = 5;

		for (let i = 0; i < urls.length; i += concurrency) {
			const batch = urls.slice(i, i + concurrency);
			const batchResults = await Promise.all(batch.map((url) => this.scrape(url)));
			results.push(...batchResults);
		}

		return results;
	}

	private async fetchPage(url: string): Promise<string> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			// Note: In Node.js, fetch needs to be imported from 'node-fetch' or use built-in fetch (Node 18+)
			// This is a placeholder that would work in a browser or Node 18+
			const response = await fetch(url, {
				headers: {
					"User-Agent": this.userAgent,
					Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				},
				signal: controller.signal,
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const contentType = response.headers.get("content-type") || "";
			if (!contentType.includes("text/html")) {
				throw new Error(`Unexpected content type: ${contentType}`);
			}

			return await response.text();
		} finally {
			clearTimeout(timeoutId);
		}
	}

	private async extractContent(htmlContent: string, url: string): Promise<ScrapedPage> {
		// Parse HTML - in Node.js would use jsdom or similar
		// For now, use regex-based extraction as a simple approach
		const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
		const descMatch = htmlContent.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
		const langMatch = htmlContent.match(/<html[^>]*lang=["']?([a-z]{2})/i);
		const charsetMatch = htmlContent.match(/<meta[^>]*charset=["']?([^"'\s>]+)/i);

		// Extract text content (simple approach)
		const textContent = this.extractTextContent(htmlContent);

		// Extract links
		const links = this.extractLinks(htmlContent, url);

		return {
			url,
			title: titleMatch ? titleMatch[1].trim() : url,
			description: descMatch ? descMatch[1].trim() : undefined,
			content: textContent,
			htmlContent,
			links,
			language: langMatch ? langMatch[1] : undefined,
			charset: charsetMatch ? charsetMatch[1] : "utf-8",
			fetchedAt: new Date(),
		};
	}

	private extractTextContent(html: string): string {
		// Remove script and style tags
		let text = html.replace(/<script[^>]*>.*?<\/script>/gis, "");
		text = text.replace(/<style[^>]*>.*?<\/style>/gis, "");
		// Remove HTML tags
		text = text.replace(/<[^>]+>/g, "");
		// Decode HTML entities
		text = text
			.replace(/&nbsp;/g, " ")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&quot;/g, '"')
			.replace(/&amp;/g, "&");
		// Clean up whitespace
		text = text.replace(/\s+/g, " ").trim();
		return text;
	}

	private extractLinks(html: string, baseUrl: string): LinkInfo[] {
		const links: LinkInfo[] = [];
		const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'](?:[^>]*?>)?([^<]*)<\/a>/gi;

		let match;
		while ((match = linkRegex.exec(html)) !== null) {
			const href = match[1];
			const text = match[2].replace(/<[^>]+>/g, "").trim();

			if (href && text) {
				try {
					const absoluteUrl = new URL(href, baseUrl).href;
					links.push({
						href: absoluteUrl,
						text,
					});
				} catch {
					// Invalid URL, skip
				}
			}
		}

		return links;
	}

	private isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	private isRetryableError(error: unknown): boolean {
		const errorStr = String(error).toLowerCase();
		// Network errors, timeouts, and server errors are retryable
		return (
			errorStr.includes("econnrefused") ||
			errorStr.includes("enotfound") ||
			errorStr.includes("timeout") ||
			errorStr.includes("503") ||
			errorStr.includes("502") ||
			errorStr.includes("504")
		);
	}
}

export function createWebScraper(): WebScraper {
	return new WebScraper();
}
