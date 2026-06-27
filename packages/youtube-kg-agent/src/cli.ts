import { YouTubeClient } from "./services/youtube.js";
import { EmbeddingsService } from "./services/embeddings.js";
import { SupabaseService } from "./services/supabase.js";
import { SearchService } from "./services/search.js";
import { ReasoningEngine } from "./services/reasoning.js";
import readline from "readline";

const youtubeClient = new YouTubeClient(
  process.env.YOUTUBE_CLIENT_ID ?? "",
  process.env.YOUTUBE_CLIENT_SECRET ?? "",
  process.env.YOUTUBE_REDIRECT_URI ?? "http://localhost:3000"
);

const supabase = new SupabaseService(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? ""
);

async function ingestCommand() {
  console.log("Starting YouTube history ingest...");
  const token = await youtubeClient.loadToken();
  if (!token) {
    console.log("Visit:", youtubeClient.getAuthUrl());
    console.log("Run again after authorizing.");
    return;
  }
  const embeddings = new EmbeddingsService(process.env.VOYAGE_API_KEY);
  const { videos, totalProcessed } = await youtubeClient.fetchWatchHistory(100);
  console.log(`Fetched ${totalProcessed} videos`);
  for (const video of videos) {
    video.embedding = await embeddings.embedText(`${video.title} ${video.description}`);
  }
  await supabase.insertVideos(videos);
  console.log(`✓ Ingested ${videos.length} videos`);
}

async function chatCommand() {
  const search = new SearchService(process.env.VOYAGE_API_KEY, supabase);
  const reasoning = new ReasoningEngine(process.env.ANTHROPIC_API_KEY);

  const metrics = await supabase.getMetrics().catch(() => null);
  const videoCount = metrics?.totalVideos ?? "?";
  console.log(`YouTube Knowledge Graph — ${videoCount} videos indexed`);
  console.log("Type 'exit' to quit\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const ask = () => {
    rl.question("> ", async (question) => {
      if (question.trim() === "exit") {
        rl.close();
        return;
      }
      if (!question.trim()) {
        ask();
        return;
      }
      try {
        const results = await search.search(question, undefined, 8);
        if (!results.length) {
          console.log("No relevant videos found. Try ingesting more history.\n");
        } else {
          const result = await reasoning.query(question, results.map((r) => r.video));
          console.log(`\n${result.answer}\n`);
          if (result.videoSources.length) {
            console.log("Sources:");
            for (const s of result.videoSources) {
              console.log(`  - ${s.title}  https://youtube.com/watch?v=${s.videoId}`);
            }
          }
          console.log(`Citation accuracy: ${(result.citationAccuracy * 100).toFixed(0)}%\n`);
        }
      } catch (error) {
        console.error("Error:", error);
      }
      ask();
    });
  };

  ask();
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === "ingest") await ingestCommand();
  else if (cmd === "chat") await chatCommand();
  else console.log("Usage: youtube-kg ingest | chat");
}

main().catch(console.error);
