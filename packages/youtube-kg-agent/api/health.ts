import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SupabaseService } from "../src/services/supabase.js";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
	res.setHeader("Access-Control-Allow-Origin", "*");

	try {
		const supabaseService = new SupabaseService(
			process.env.SUPABASE_URL ?? "",
			process.env.SUPABASE_SERVICE_KEY ?? "",
		);

		const [isHealthy, metrics] = await Promise.all([
			supabaseService.health(),
			supabaseService.getMetrics(),
		]);

		return res.status(isHealthy ? 200 : 503).json({
			status: isHealthy ? "healthy" : "degraded",
			timestamp: new Date().toISOString(),
			metrics,
		});
	} catch (error) {
		return res.status(503).json({
			status: "unhealthy",
			error: String(error),
			timestamp: new Date().toISOString(),
		});
	}
}
