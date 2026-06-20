import { createServer } from "node:http";
import readline from "readline";
import { EmbeddingsService } from "./services/embeddings.js";
import { SupabaseService } from "./services/supabase.js";
import { YouTubeClient } from "./services/youtube.js";

const youtubeClient = new YouTubeClient(
	process.env.YOUTUBE_CLIENT_ID ?? "",
	process.env.YOUTUBE_CLIENT_SECRET ?? "",
	process.env.YOUTUBE_REDIRECT_URI ?? "http://localhost:3000",
);

const embeddings = new EmbeddingsService(process.env.ANTHROPIC_API_KEY);
const supabase = new SupabaseService(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_SERVICE_KEY ?? "");

async function ingestCommand() {
	console.log("📥 Starting YouTube history ingest...");
	const token = await youtubeClient.loadToken();
	if (!token) {
		console.log("🔗 Visit:", youtubeClient.getAuthUrl());
		console.log("📋 Paste the authorization code and run again.");
		return;
	}

	const startTime = Date.now();

	console.log("🎥 Fetching watch history...");
	const { videos } = await youtubeClient.fetchWatchHistory(1000);
	console.log(`✅ Fetched ${videos.length} videos`);

	console.log("🔄 Generating embeddings in batches of 100...");
	const texts = videos.map((v) => `${v.title} ${v.description}`);
	const embeddingVectors = await embeddings.embedBatch(texts);
	videos.forEach((video, idx) => {
		video.embedding = embeddingVectors[idx];
	});

	console.log("💾 Storing in Supabase...");
	await supabase.insertVideos(videos);

	const elapsed = Math.round((Date.now() - startTime) / 1000);
	const vps = videos.length > 0 ? Math.round(videos.length / elapsed) : 0;
	console.log(`✅ Ingestion complete in ${elapsed}s`);
	console.log(`   Videos: ${videos.length}  |  Speed: ${vps} videos/s`);
}

async function chatCommand() {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	console.log("YouTube Knowledge Graph Chat — type 'exit' to quit\n");
	const ask = () => {
		rl.question("> ", async (question) => {
			if (question === "exit") {
				rl.close();
				return;
			}
			try {
				const metrics = await supabase.getMetrics();
				console.log(`DB has ${metrics.totalVideos} videos, ${metrics.totalConcepts} concepts`);
			} catch (error) {
				console.error("Error:", error);
			}
			ask();
		});
	};
	ask();
}

function startHealthServer(port = 3000) {
	const server = createServer(async (req, res) => {
		if (req.url === "/health") {
			try {
				const [isHealthy, metrics] = await Promise.all([supabase.health(), supabase.getMetrics()]);
				res.writeHead(isHealthy ? 200 : 503, { "Content-Type": "application/json" });
				res.end(
					JSON.stringify({
						status: isHealthy ? "healthy" : "degraded",
						timestamp: new Date().toISOString(),
						metrics,
					}),
				);
			} catch (e) {
				res.writeHead(503, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ status: "unhealthy", error: String(e), timestamp: new Date().toISOString() }));
			}
		} else {
			res.writeHead(404);
			res.end();
		}
	});
	server.listen(port);
	console.log(`🏥 Health check server listening on :${port}/health`);
	return server;
}

async function main() {
	const cmd = process.argv[2];
	if (cmd === "ingest") {
		await ingestCommand();
	} else if (cmd === "chat") {
		await chatCommand();
	} else if (cmd === "serve") {
		startHealthServer();
		console.log("🚀 YouTube KG Agent running — Ctrl+C to stop");
		await new Promise(() => {});
	} else {
		console.log("Usage: youtube-kg ingest | chat | serve");
	}
}

main().catch(console.error);
