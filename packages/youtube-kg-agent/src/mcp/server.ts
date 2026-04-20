import { TOOLS } from "./tools.js";
import { SupabaseService } from "../services/supabase.js";
import { SearchService } from "../services/search.js";
import { ReasoningEngine } from "../services/reasoning.js";

function buildServices() {
  const supabase = new SupabaseService(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_KEY ?? ""
  );
  const search = new SearchService(process.env.VOYAGE_API_KEY, supabase);
  const reasoning = new ReasoningEngine(process.env.ANTHROPIC_API_KEY);
  return { search, reasoning };
}

export async function handleToolCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const { search, reasoning } = buildServices();

  switch (toolName) {
    case "youtube_search": {
      const query = args.query as string;
      const topK = typeof args.topK === "number" ? args.topK : 10;
      const results = await search.search(query, undefined, topK);
      if (!results.length) return "No videos found for that query.";
      return results
        .map(
          (r, i) =>
            `${i + 1}. **${r.video.title}** — ${r.video.channelName}\n   https://youtube.com/watch?v=${r.video.id} (score: ${r.similarity.toFixed(3)})`
        )
        .join("\n\n");
    }

    case "youtube_query": {
      const question = args.question as string;
      const results = await search.search(question, undefined, 8);
      const videos = results.map((r) => r.video);
      const result = await reasoning.query(question, videos);
      const sources = result.videoSources
        .map((s) => `- [${s.title}](https://youtube.com/watch?v=${s.videoId})`)
        .join("\n");
      return (
        `${result.answer}\n\n**Sources:**\n${sources}\n\n` +
        `*Citation accuracy: ${(result.citationAccuracy * 100).toFixed(0)}%*`
      );
    }

    case "youtube_concept": {
      const concept = args.concept as string;
      const results = await search.search(concept, undefined, 6);
      if (!results.length) return `No videos found related to "${concept}".`;
      const lines = results
        .map(
          (r) =>
            `- **${r.video.title}** (${r.video.channelName}) — ${r.video.description.substring(0, 80)}...`
        )
        .join("\n");
      return `Videos covering **${concept}**:\n\n${lines}`;
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

export { TOOLS };
