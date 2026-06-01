export interface FirecrawlSearchResult {
	url: string;
	title: string;
	description: string;
	content?: string;
}

export interface FirecrawlScrapeResult {
	url: string;
	title: string;
	markdown: string;
	links: string[];
}

export interface FirecrawlConfig {
	apiKey: string;
	baseUrl?: string;
}

export class FirecrawlTool {
	private apiKey: string;
	private baseUrl: string;

	constructor(config: FirecrawlConfig) {
		this.apiKey = config.apiKey;
		this.baseUrl = config.baseUrl ?? "https://api.firecrawl.dev";
	}

	async search(query: string, limit = 10): Promise<FirecrawlSearchResult[]> {
		const response = await fetch(`${this.baseUrl}/v1/search`, {
			method: "POST",
			signal: AbortSignal.timeout(15_000),
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query, limit }),
		});

		if (!response.ok) {
			throw new Error(`Firecrawl search failed: ${response.status} ${await response.text()}`);
		}

		const data = (await response.json()) as { data?: FirecrawlSearchResult[] };
		return data.data ?? [];
	}

	async scrape(url: string): Promise<FirecrawlScrapeResult> {
		const response = await fetch(`${this.baseUrl}/v1/scrape`, {
			method: "POST",
			signal: AbortSignal.timeout(15_000),
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ url, formats: ["markdown", "links"] }),
		});

		if (!response.ok) {
			throw new Error(`Firecrawl scrape failed: ${response.status} ${await response.text()}`);
		}

		const data = (await response.json()) as {
			data?: { metadata?: { title?: string }; markdown?: string; links?: string[] };
		};
		return {
			url,
			title: data.data?.metadata?.title ?? url,
			markdown: data.data?.markdown ?? "",
			links: data.data?.links ?? [],
		};
	}
}
