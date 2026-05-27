import { TOOLS } from "./tools.js";
import { ReasoningEngine } from "../services/reasoning.js";

export async function handleToolCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const reasoning = new ReasoningEngine();

  switch (toolName) {
    case "youtube_search":
      return `Search results for: ${args.query}`;
    case "youtube_query": {
      const result = await reasoning.query(args.question as string, []);
      return result.answer;
    }
    case "youtube_concept":
      return `Concept information for: ${args.concept}`;
    default:
      return "Unknown tool";
  }
}

export { TOOLS };
