import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EmbeddingsService } from "../src/services/embeddings.js";
import { SupabaseService } from "../src/services/supabase.js";
import { SearchService } from "../src/services/search.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed. Use POST." });
	}

	const { query, topK = 10 } = req.body ?? {};

	if (!query || typeof query !== "string") {
		return res.status(400).json({ error: "query (string) is required" });
	}

	try {
		const embeddingsService = new EmbeddingsService(process.env.ANTHROPIC_API_KEY);
		const supabaseService = new SupabaseService(
			process.env.SUPABASE_URL ?? "",
			process.env.SUPABASE_SERVICE_KEY ?? "",
		);
		const searchService = new SearchService(process.env.ANTHROPIC_API_KEY);

		const [queryEmbedding, allVideos] = await Promise.all([
			embeddingsService.embedText(query),
			supabaseService.getAllVideos(),
		]);

		const results = await searchService.search(query, allVideos, topK);

		return res.status(200).json({
			query,
			results,
			total: allVideos.length,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("[search API]", error);
		return res.status(500).json({ error: "Internal server error", message: String(error) });
	}
}
