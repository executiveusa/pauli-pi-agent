import { YouTubeClient } from "./services/youtube.js";
import { EmbeddingsService } from "./services/embeddings.js";
import { SupabaseService } from "./services/supabase.js";
import readline from "readline";

const youtubeClient = new YouTubeClient(
  process.env.YOUTUBE_CLIENT_ID ?? "",
  process.env.YOUTUBE_CLIENT_SECRET ?? "",
  process.env.YOUTUBE_REDIRECT_URI ?? "http://localhost:3000"
);

const embeddings = new EmbeddingsService(process.env.ANTHROPIC_API_KEY);
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
  const { videos } = await youtubeClient.fetchWatchHistory(100);
  console.log(`Fetched ${videos.length} videos`);
  for (const video of videos) {
    const text = `${video.title} ${video.description}`;
    video.embedding = await embeddings.embedText(text);
  }
  await supabase.insertVideos(videos);
  console.log("✓ Videos ingested");
}

async function chatCommand() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("YouTube Knowledge Graph Chat — type 'exit' to quit\n");
  const ask = () => {
    rl.question("> ", async (question) => {
      if (question === "exit") { rl.close(); return; }
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

async function main() {
  const cmd = process.argv[2];
  if (cmd === "ingest") await ingestCommand();
  else if (cmd === "chat") await chatCommand();
  else console.log("Usage: youtube-kg ingest | chat");
}

main().catch(console.error);
