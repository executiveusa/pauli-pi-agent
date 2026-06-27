// Deep Research HTTP API server.
// Wraps the Absurd workflow engine and exposes REST endpoints
// consumed by the web UI deep research toggle.
//
// Required env vars:
//   DATABASE_URL       — PostgreSQL connection string
//   FIRECRAWL_API_KEY  — Firecrawl API key
//   BRIGHTDATA_API_KEY — BrightData API key
//   ANTHROPIC_API_KEY  — for synthesis LLM calls
//   PORT               — optional, defaults to 3456

import Anthropic from "@anthropic-ai/sdk";
import { Absurd } from "absurd-sdk";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { DEEP_RESEARCH_SYSTEM_PROMPT } from "./prompts.js";
import { BrightDataTool, GEO_REGIONS, type GeoRegion } from "./tools/brightdata.js";
import { FirecrawlTool } from "./tools/firecrawl.js";
import { ResearchWorkflow } from "./workflow.js";

const PORT = Number(process.env.PORT ?? 3456);
const DATABASE_URL = process.env.DATABASE_URL ?? "";
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY ?? "";
const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY ?? "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

if (!DATABASE_URL || !FIRECRAWL_API_KEY) {
	console.warn("[deep-research] Missing DATABASE_URL or FIRECRAWL_API_KEY — some features will be degraded");
}

// Initialize dependencies
const absurd = new Absurd({ db: DATABASE_URL });
const firecrawl = new FirecrawlTool({ apiKey: FIRECRAWL_API_KEY });
const brightdata = new BrightDataTool({ apiKey: BRIGHTDATA_API_KEY });
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// LLM synthesizer — takes gathered context and produces a cited report
async function synthesize(context: string, query: string): Promise<string> {
	const message = await anthropic.messages.create({
		model: "claude-sonnet-4-6",
		max_tokens: 4096,
		system: DEEP_RESEARCH_SYSTEM_PROMPT,
		messages: [
			{
				role: "user",
				content: `Using the research context below, write a comprehensive, globally balanced report on: "${query}"\n\nInclude numbered citations for every factual claim. Explicitly cover regional perspectives from Asia, Africa, Latin America, and the Middle East alongside Western viewpoints.\n\n---\n\n${context}`,
			},
		],
	});

	const textBlock = message.content.find((b) => b.type === "text");
	return textBlock?.type === "text" ? textBlock.text : "Synthesis failed.";
}

// Register the workflow
const workflow = new ResearchWorkflow(absurd, firecrawl, brightdata, synthesize);
workflow.register();

// Start Absurd worker (pulls research tasks from PostgreSQL)
if (DATABASE_URL) {
	absurd.startWorker({ concurrency: 2 });
	console.log("[deep-research] Absurd worker started");
}

// HTTP server
const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
	res.json({ status: "ok", service: "deep-research" });
});

// Spawn a new research task
app.post("/api/research", async (req: Request, res: Response) => {
	const {
		query,
		regions: rawRegions,
		maxSources,
	} = req.body as {
		query?: string;
		regions?: unknown;
		maxSources?: number;
	};

	if (!query?.trim()) {
		res.status(400).json({ error: "query is required" });
		return;
	}

	const validRegions: GeoRegion[] | undefined = Array.isArray(rawRegions)
		? rawRegions.filter((r): r is GeoRegion => GEO_REGIONS.includes(r as GeoRegion))
		: undefined;

	try {
		const { taskId } = await workflow.spawn({ query, regions: validRegions, maxSources });
		res.json({ taskId, status: "queued", query });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		res.status(500).json({ error: msg });
	}
});

// Poll for task result
app.get("/api/research/:taskId", async (req: Request, res: Response) => {
	const { taskId } = req.params;

	try {
		const snapshot = await absurd.fetchTaskResult(taskId);
		if (!snapshot) {
			res.status(404).json({ error: "task not found" });
			return;
		}

		if (snapshot.state === "completed") {
			res.json({ status: "completed", result: snapshot.result });
		} else if (snapshot.state === "failed") {
			res.json({ status: "failed", error: snapshot.failure });
		} else {
			res.json({ status: snapshot.state });
		}
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		res.status(500).json({ error: msg });
	}
});

app.listen(PORT, () => {
	console.log(`[deep-research] Server running on http://localhost:${PORT}`);
});
