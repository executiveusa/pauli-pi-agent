// BrightData MCP integration for geo-diverse web searches.
// Requires BRIGHTDATA_API_KEY environment variable.
// Targets multiple regions to surface non-Western perspectives.

export const GEO_REGIONS = ["us", "gb", "br", "in", "jp", "ng", "de", "za", "mx", "id"] as const;
export type GeoRegion = (typeof GEO_REGIONS)[number];

export const REGION_NAMES: Record<GeoRegion, string> = {
	us: "United States",
	gb: "United Kingdom",
	br: "Brazil",
	in: "India",
	jp: "Japan",
	ng: "Nigeria",
	de: "Germany",
	za: "South Africa",
	mx: "Mexico",
	id: "Indonesia",
};

export interface BrightDataSearchResult {
	region: GeoRegion;
	regionName: string;
	url: string;
	title: string;
	snippet: string;
}

export interface BrightDataConfig {
	apiKey: string;
	zone?: string;
}

export class BrightDataTool {
	private apiKey: string;
	private zone: string;

	constructor(config: BrightDataConfig) {
		this.apiKey = config.apiKey;
		this.zone = config.zone ?? "serp";
	}

	// Search via BrightData SERP API with geo-targeting
	async searchFromRegion(query: string, region: GeoRegion, limit = 5): Promise<BrightDataSearchResult[]> {
		const params = new URLSearchParams({
			engine: "google",
			q: query,
			gl: region,
			num: String(limit),
		});

		const response = await fetch(`https://api.brightdata.com/request?${params}`, {
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			// Degrade gracefully — geo searches are best-effort
			console.warn(`BrightData search from ${region} failed: ${response.status}`);
			return [];
		}

		const data = (await response.json()) as { organic?: Array<{ link: string; title: string; snippet: string }> };
		return (data.organic ?? []).map((r) => ({
			region,
			regionName: REGION_NAMES[region],
			url: r.link,
			title: r.title,
			snippet: r.snippet,
		}));
	}

	// Run the same query across a set of regions in parallel
	async multiRegionSearch(
		query: string,
		regions: GeoRegion[] = ["us", "br", "in", "jp", "ng", "de"],
		limitPerRegion = 3,
	): Promise<BrightDataSearchResult[]> {
		const results = await Promise.allSettled(regions.map((r) => this.searchFromRegion(query, r, limitPerRegion)));

		return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
	}
}
