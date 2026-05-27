export const TOOLS = [
  {
    name: "youtube_search",
    description: "Search your YouTube videos by topic or keyword",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term" },
        topK: { type: "number", description: "Number of results (default 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "youtube_query",
    description: "Ask a complex question that synthesizes across multiple videos",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "Your question" },
      },
      required: ["question"],
    },
  },
  {
    name: "youtube_concept",
    description: "Get concept hierarchy and how it relates to your videos",
    inputSchema: {
      type: "object",
      properties: {
        concept: { type: "string", description: "Concept name" },
      },
      required: ["concept"],
    },
  },
];
