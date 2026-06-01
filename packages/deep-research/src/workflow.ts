// Durable deep research workflow using Absurd SDK.
// Each step is checkpointed in PostgreSQL so the workflow survives crashes.
//
// Steps:
//   1. plan-queries   — derive 4-6 search angles from the topic
//   2. geo-search     — BrightData multi-region SERP (6 countries)
//   3. deep-crawl     — Firecrawl full-page scrape of top URLs
//   4. synthesize     — LLM synthesis into a cited Markdown document
//
// Usage:
//   const workflow = new ResearchWorkflow(absurd, firecrawl, brightdata);
//   workflow.register();
//   const { taskId } = await workflow.spawn(query);

import type { Absurd } from "absurd-sdk";
import { GEO_REGIONS, type BrightDataTool, type GeoRegion } from "./tools/brightdata.js";
import type { FirecrawlTool } from "./tools/firecrawl.js";

export const RESEARCH_TASK = "deep-research";

export interface ResearchParams {
	query: string;
	regions?: GeoRegion[];
	maxSources?: number;
}

export interface ResearchResult {
	taskId: string;
	query: string;
	document: string; // Full Markdown report with citations
	sources: Array<{ url: string; title: string; region?: string }>;
	completedAt: string;
}

export class ResearchWorkflow {
	constructor(
		private absurd: Absurd,
		private firecrawl: FirecrawlTool,
		private brightdata: BrightDataTool,
		private synthesize: (context: string, query: string) => Promise<string>,
	) {}

	register() {
		this.absurd.registerTask<ResearchParams, ResearchResult>({ name: RESEARCH_TASK }, async (params, ctx) => {
			const { query, regions = [...GEO_REGIONS], maxSources = 12 } = params;
			const safeMaxSources = Math.min(Math.max(maxSources, 1), 25);

			// Step 1: Plan search queries from multiple angles
			const queries = await ctx.step("plan-queries", async () => {
				return deriveSearchAngles(query);
			});

			// Step 2: Multi-region geo search via BrightData
			const geoResults = await ctx.step("geo-search", async () => {
				const all = await Promise.all(
					queries.slice(0, 3).map((q) => this.brightdata.multiRegionSearch(q, regions, 3)),
				);
				return all.flat();
			});

			// Step 3: Deep-crawl top URLs via Firecrawl
			const topUrls = deduplicateUrls(geoResults.map((r) => r.url)).slice(0, safeMaxSources);
			const crawledPages = await ctx.step("deep-crawl", async () => {
				const results = await Promise.allSettled(topUrls.map((url) => this.firecrawl.scrape(url)));
				return results
					.filter(
						(r): r is PromiseFulfilledResult<Awaited<ReturnType<FirecrawlTool["scrape"]>>> =>
							r.status === "fulfilled",
					)
					.map((r) => r.value);
			});

			// Step 4: Also run direct Firecrawl search for any gaps
			const searchResults = await ctx.step("firecrawl-search", async () => {
				return this.firecrawl.search(query, 5);
			});

			// Step 5: Synthesize into a cited Markdown document
			const document = await ctx.step("synthesize", async () => {
				const context = buildSynthesisContext(query, geoResults, crawledPages, searchResults);
				return this.synthesize(context, query);
			});

			const sources = [
				...crawledPages.map((p) => ({ url: p.url, title: p.title })),
				...geoResults.slice(0, 5).map((r) => ({
					url: r.url,
					title: r.title,
					region: r.regionName,
				})),
			];

			return {
				taskId: ctx.taskID,
				query,
				document,
				sources,
				completedAt: new Date().toISOString(),
			};
		});
	}

	async spawn(params: ResearchParams): Promise<{ taskId: string }> {
		const result = await this.absurd.spawn(RESEARCH_TASK, params);
		return { taskId: result.taskID };
	}
}

// Derive 4-6 distinct search angles from a query
function deriveSearchAngles(query: string): string[] {
	return [
		query,
		`${query} global perspectives`,
		`${query} research analysis`,
		`${query} history context`,
		`${query} criticism controversy`,
		`${query} future outlook`,
	];
}

function deduplicateUrls(urls: string[]): string[] {
	const seen = new Set<string>();
	return urls.filter((u) => {
		if (seen.has(u)) return false;
		seen.add(u);
		return true;
	});
}

function buildSynthesisContext(
	query: string,
	geoResults: Awaited<ReturnType<BrightDataTool["multiRegionSearch"]>>,
	crawledPages: Array<{ url: string; title: string; markdown: string }>,
	searchResults: Array<{ url: string; title: string; description: string }>,
): string {
	const sections: string[] = [`# Research context for: "${query}"\n`];

	if (geoResults.length > 0) {
		sections.push("## Geo-diverse search snippets");
		for (const r of geoResults.slice(0, 20)) {
			sections.push(`[${r.regionName}] ${r.title}\n${r.snippet}\nURL: ${r.url}\n`);
		}
	}

	if (crawledPages.length > 0) {
		sections.push("## Full-page content");
		for (const p of crawledPages) {
			const excerpt = p.markdown.slice(0, 2000);
			sections.push(`### ${p.title}\nURL: ${p.url}\n${excerpt}\n`);
		}
	}

	if (searchResults.length > 0) {
		sections.push("## Additional search results");
		for (const r of searchResults) {
			sections.push(`${r.title}\n${r.description}\nURL: ${r.url}\n`);
		}
	}

	return sections.join("\n");
}
