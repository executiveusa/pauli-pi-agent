import "@mariozechner/mini-lit/dist/ThemeToggle.js";
import { Agent, type AgentMessage, type AgentTool } from "@mariozechner/pi-agent-core";
import { getModels, getProviders, type Model } from "@mariozechner/pi-ai";
import {
	type AgentState,
	ApiKeyPromptDialog,
	AppStorage,
	ChatPanel,
	CustomProvidersStore,
	createJavaScriptReplTool,
	IndexedDBStorageBackend,
	// PersistentStorageDialog, // TODO: Fix - currently broken
	ProviderKeysStore,
	ProvidersModelsTab,
	ProxyTab,
	SessionListDialog,
	SessionsStore,
	SettingsDialog,
	SettingsStore,
	setAppStorage,
} from "@mariozechner/pi-web-ui";
import { html, render } from "lit";
import { Bell, Globe, History, Plus, Settings } from "lucide";
import { registerMercuryDiffusionRenderer } from "./mercury-diffusion-renderer.js";
import { pickModel } from "./smart-router.js";
import "./token-tracker.js";
import "./cosmos-sidebar.js";
import "./knowledge-graph.js";
import "./library-browser.js";
import "./app.css";
import { icon } from "@mariozechner/mini-lit";
import { Button } from "@mariozechner/mini-lit/dist/Button.js";
import { Input } from "@mariozechner/mini-lit/dist/Input.js";
import { createSystemNotification, customConvertToLlm, registerCustomMessageRenderers } from "./custom-messages.js";

// ============================================================================
// DEEP RESEARCH MODE
// ============================================================================
const DEEP_RESEARCH_API =
	(import.meta.env as Record<string, string | undefined>).VITE_DEEP_RESEARCH_API ?? "http://localhost:3456";

const DEEP_RESEARCH_SYSTEM_PROMPT = `You are a deep research agent specializing in comprehensive, globally balanced analysis.

When given a topic or question, produce a thorough research report that:
1. Draws from sources spanning multiple world regions — not just US or Western European perspectives
2. Actively seeks viewpoints from Asia, Africa, Latin America, Middle East, Eastern Europe, and Oceania
3. Distinguishes between facts, expert opinions, and popular sentiment
4. Presents minority or dissenting views alongside mainstream positions
5. Cites every claim with a numbered reference [1], [2], etc.

Output Format — always return a structured Markdown document:

# [Topic]

## Summary
2-3 sentence overview from a neutral, global perspective.

## Key Findings
...with inline citations [1][2]...

## Regional Perspectives
Explicitly cover how this topic is viewed in different parts of the world.

## Contested Areas
Note where evidence is disputed or where perspectives sharply diverge.

## References
[1] Title — Source, Region, URL, Date
[2] ...

Search strategy:
- Run searches from multiple geographic perspectives (US, Brazil, India, Japan, Nigeria, Germany)
- Seek primary sources: government data, academic papers, NGO reports, local journalism
- Do not weight US/UK sources more heavily than others
- Label speculation vs. established fact clearly

If a deep-research backend is available you can trigger it via: POST ${DEEP_RESEARCH_API}/api/research with {query: string}`;

// Geo hint → BrightData GeoRegion codes
const GEO_HINT_MAP: Record<string, string[]> = {
	global: ["us", "br", "in", "jp", "ng", "de", "za", "mx"],
	asia: ["in", "jp", "id", "mx"],
	africa: ["ng", "za"],
	"latin-america": ["br", "mx"],
	"middle-east": ["in", "ng"],
	eu: ["de", "gb"],
	us: ["us"],
	uk: ["gb"],
};

// Web search tool — conforms to AgentTool<any> for the ChatPanel toolsFactory
function createWebSearchTool(): AgentTool<any> {
	return {
		label: "Web Search",
		name: "web_search",
		description:
			"Search the web for current information. Use geo_hint to indicate desired regional perspective (e.g. 'global', 'asia', 'africa', 'latin-america').",
		parameters: {
			type: "object" as const,
			properties: {
				query: { type: "string", description: "Search query" },
				geo_hint: {
					type: "string",
					description:
						"Desired regional perspective: global, us, uk, eu, asia, africa, latin-america, middle-east",
				},
			},
			required: ["query"],
		},
		async execute(
			_toolCallId: string,
			params: { query: string; geo_hint?: string },
		): Promise<{ content: Array<{ type: "text"; text: string }>; details: string }> {
			const { query, geo_hint } = params;
			const regions = geo_hint ? (GEO_HINT_MAP[geo_hint] ?? ["us", "br", "in", "jp", "ng", "de"]) : undefined;
			try {
				const spawnResp = await fetch(`${DEEP_RESEARCH_API}/api/research`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ query, ...(regions ? { regions } : {}) }),
					signal: AbortSignal.timeout(10_000),
				});
				if (spawnResp.ok) {
					const { taskId } = (await spawnResp.json()) as { taskId: string };
					// Poll for the completed report (up to 3 minutes)
					const deadline = Date.now() + 180_000;
					while (Date.now() < deadline) {
						await new Promise((r) => setTimeout(r, 4_000));
						const pollResp = await fetch(`${DEEP_RESEARCH_API}/api/research/${taskId}`, {
							signal: AbortSignal.timeout(10_000),
						});
						if (!pollResp.ok) break;
						const snapshot = (await pollResp.json()) as {
							status: string;
							result?: { document: string };
							error?: string;
						};
						if (snapshot.status === "completed" && snapshot.result?.document) {
							return {
								content: [{ type: "text", text: snapshot.result.document }],
								details: snapshot.result.document,
							};
						}
						if (snapshot.status === "failed") {
							const msg = `Deep research task failed: ${snapshot.error ?? "unknown error"}`;
							return { content: [{ type: "text", text: msg }], details: msg };
						}
					}
					const timeoutMsg = `Deep research timed out for task ${taskId}. Synthesizing from training knowledge.`;
					return { content: [{ type: "text", text: timeoutMsg }], details: timeoutMsg };
				}
			} catch {
				// Backend not running — fall through to offline message
			}
			const hint = geo_hint ? ` Focus on ${geo_hint} perspectives.` : "";
			const offlineMsg = `[web_search] Query: "${query}"${hint}\n\nThe deep-research backend is not available. Please synthesize from your training knowledge, explicitly representing viewpoints from Asia, Africa, Latin America, and the Middle East alongside Western sources. Mark all facts with [source needed] where you cannot cite a specific URL.`;
			return { content: [{ type: "text", text: offlineMsg }], details: offlineMsg };
		},
	};
}

// Register custom message renderers
registerCustomMessageRenderers();
// Register Mercury diffusion renderer (visual effect for diffusion models)
registerMercuryDiffusionRenderer();

// Create stores
const settings = new SettingsStore();
const providerKeys = new ProviderKeysStore();
const sessions = new SessionsStore();
const customProviders = new CustomProvidersStore();

// Gather configs
const configs = [
	settings.getConfig(),
	SessionsStore.getMetadataConfig(),
	providerKeys.getConfig(),
	customProviders.getConfig(),
	sessions.getConfig(),
];

// Create backend
const backend = new IndexedDBStorageBackend({
	dbName: "pi-web-ui-example",
	version: 2, // Incremented for custom-providers store
	stores: configs,
});

// Wire backend to stores
settings.setBackend(backend);
providerKeys.setBackend(backend);
customProviders.setBackend(backend);
sessions.setBackend(backend);

// Create and set app storage
const storage = new AppStorage(settings, providerKeys, sessions, customProviders, backend);
setAppStorage(storage);

let currentSessionId: string | undefined;
let currentTitle = "";
let isEditingTitle = false;
let agent: Agent;
let chatPanel: ChatPanel;
let agentUnsubscribe: (() => void) | undefined;
let showFlipbook = false;
let isDeepResearch = false;
let showRightPanel = true;
let rightPanelView: "graph" | "library" = "graph";
let sessionList: Array<{ id: string; title: string; preview?: string }> = [];
let libraryEntries: Array<{ path: string; category: string; shelf: string; title: string; summary: string }> = [];
let graphNodes: Array<{
	id: string;
	label: string;
	shelf: string;
	x: number;
	y: number;
	vx: number;
	vy: number;
	connections: number;
}> = [];
let graphEdges: Array<{ source: string; target: string }> = [];

const generateTitle = (messages: AgentMessage[]): string => {
	const firstUserMsg = messages.find((m) => m.role === "user" || m.role === "user-with-attachments");
	if (!firstUserMsg || (firstUserMsg.role !== "user" && firstUserMsg.role !== "user-with-attachments")) return "";

	let text = "";
	const content = firstUserMsg.content;

	if (typeof content === "string") {
		text = content;
	} else {
		const textBlocks = content.filter((c: any) => c.type === "text");
		text = textBlocks.map((c: any) => c.text || "").join(" ");
	}

	text = text.trim();
	if (!text) return "";

	const sentenceEnd = text.search(/[.!?]/);
	if (sentenceEnd > 0 && sentenceEnd <= 50) {
		return text.substring(0, sentenceEnd + 1);
	}
	return text.length <= 50 ? text : `${text.substring(0, 47)}...`;
};

const shouldSaveSession = (messages: AgentMessage[]): boolean => {
	const hasUserMsg = messages.some((m: any) => m.role === "user" || m.role === "user-with-attachments");
	const hasAssistantMsg = messages.some((m: any) => m.role === "assistant");
	return hasUserMsg && hasAssistantMsg;
};

const saveSession = async () => {
	if (!storage.sessions || !currentSessionId || !agent || !currentTitle) return;

	const state = agent.state;
	if (!shouldSaveSession(state.messages)) return;

	try {
		// Create session data
		const sessionData = {
			id: currentSessionId,
			title: currentTitle,
			model: state.model!,
			thinkingLevel: state.thinkingLevel,
			messages: state.messages,
			createdAt: new Date().toISOString(),
			lastModified: new Date().toISOString(),
		};

		// Create session metadata
		const metadata = {
			id: currentSessionId,
			title: currentTitle,
			createdAt: sessionData.createdAt,
			lastModified: sessionData.lastModified,
			messageCount: state.messages.length,
			usage: {
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0,
				totalTokens: 0,
				cost: {
					input: 0,
					output: 0,
					cacheRead: 0,
					cacheWrite: 0,
					total: 0,
				},
			},
			modelId: state.model?.id || null,
			thinkingLevel: state.thinkingLevel,
			preview: generateTitle(state.messages),
		};

		await storage.sessions.save(sessionData, metadata);
	} catch (err) {
		console.error("Failed to save session:", err);
	}
};

const updateUrl = (sessionId: string) => {
	const url = new URL(window.location.href);
	url.searchParams.set("session", sessionId);
	window.history.replaceState({}, "", url);
};

const createAgent = async (initialState?: Partial<AgentState>) => {
	if (agentUnsubscribe) {
		agentUnsubscribe();
	}

	const baseSystemPrompt = isDeepResearch
		? DEEP_RESEARCH_SYSTEM_PROMPT
		: `You are a helpful AI assistant with access to various tools.

Available tools:
- JavaScript REPL: Execute JavaScript code in a sandboxed browser environment (can do calculations, get time, process data, create visualizations, etc.)
- Artifacts: Create interactive HTML, SVG, Markdown, and text artifacts

Feel free to use these tools when needed to provide accurate and helpful responses.`;

	agent = new Agent({
		initialState: initialState || {
			systemPrompt: baseSystemPrompt,
			// Smart router: default to a FREE model for tool calls / chat.
			// User can override via the model selector in the UI.
			model: pickModel("fast").model,
			thinkingLevel: "off",
			messages: [],
			tools: [],
		},
		// Custom transformer: convert custom messages to LLM-compatible format
		convertToLlm: customConvertToLlm,
	});

	agentUnsubscribe = agent.subscribe((event: any) => {
		if (event.type === "state-update") {
			const messages = event.state.messages;

			// Generate title after first successful response
			if (!currentTitle && shouldSaveSession(messages)) {
				currentTitle = generateTitle(messages);
			}

			// Create session ID on first successful save
			if (!currentSessionId && shouldSaveSession(messages)) {
				currentSessionId = crypto.randomUUID();
				updateUrl(currentSessionId);
			}

			// Auto-save
			if (currentSessionId) {
				saveSession();
			}

			renderApp();
		}
	});

	await chatPanel.setAgent(agent, {
		onApiKeyRequired: async (provider: string) => {
			return await ApiKeyPromptDialog.prompt(provider);
		},
		toolsFactory: (_agent, _agentInterface, _artifactsPanel, runtimeProvidersFactory) => {
			const replTool = createJavaScriptReplTool();
			replTool.runtimeProvidersFactory = runtimeProvidersFactory;
			if (isDeepResearch) {
				return [replTool, createWebSearchTool()];
			}
			return [replTool];
		},
	});
};

const loadSession = async (sessionId: string): Promise<boolean> => {
	if (!storage.sessions) return false;

	const sessionData = await storage.sessions.get(sessionId);
	if (!sessionData) {
		console.error("Session not found:", sessionId);
		return false;
	}

	currentSessionId = sessionId;
	const metadata = await storage.sessions.getMetadata(sessionId);
	currentTitle = metadata?.title || "";

	await createAgent({
		model: sessionData.model,
		thinkingLevel: sessionData.thinkingLevel,
		messages: sessionData.messages,
		tools: [],
	});

	updateUrl(sessionId);
	renderApp();
	return true;
};

// ============================================================
// MODEL SWITCHER — user can pick any model; token tracker syncs
// ============================================================
let showModelPicker = false;

function switchModel(model: Model<any>) {
	if (agent) {
		// Recreate the agent with the new model, preserving messages and session
		const currentModel = agent.state.model;
		if (currentModel?.id === model.id && currentModel?.provider === model.provider) {
			// Same model, no need to switch
			showModelPicker = false;
			renderApp();
			return;
		}
		// Create new agent with the selected model
		createAgent({
			model,
			thinkingLevel: agent.state.thinkingLevel,
			messages: agent.state.messages,
			tools: agent.state.tools,
			systemPrompt: agent.state.systemPrompt,
		}).then(() => {
			window.dispatchEvent(
				new CustomEvent("agent-model-changed", { detail: { model: model.id, provider: model.provider } }),
			);
		});
	}
	showModelPicker = false;
	renderApp();
}

function toggleModelPicker() {
	showModelPicker = !showModelPicker;
	renderApp();
}

function getAvailableModels(): Array<{ provider: string; id: string; name: string; model: Model<any> }> {
	const result: Array<{ provider: string; id: string; name: string; model: Model<any> }> = [];
	try {
		for (const provider of getProviders()) {
			for (const model of getModels(provider as any)) {
				result.push({ provider, id: model.id, name: model.name, model });
			}
		}
	} catch {
		// ignore
	}
	return result;
}

const newSession = () => {
	const url = new URL(window.location.href);
	url.search = "";
	window.location.href = url.toString();
};

// ============================================================
// SESSION LIST + LIBRARY DATA LOADING
// ============================================================
async function refreshSessionList() {
	if (!storage.sessions) return;
	try {
		const metadatas = await storage.sessions.getAllMetadata();
		sessionList = metadatas
			.map((m: any) => ({ id: m.id, title: m.title, preview: m.preview }))
			.sort((a: any, b: any) => (b.lastModified || "").localeCompare(a.lastModified || ""));
		renderApp();
	} catch {
		// ignore
	}
}

async function loadLibraryIndex() {
	try {
		// The library index is baked into the build via Vite's import
		// We fetch it at runtime from the built JSON
		const resp = await fetch("/library-index.json");
		if (resp.ok) {
			const data = await resp.json();
			libraryEntries = (data.entries || []).slice(0, 500); // limit for perf
			buildGraphFromLibrary();
			renderApp();
		}
	} catch {
		// Library index not available — that's OK, the panels show empty state
	}
}

function buildGraphFromLibrary() {
	graphNodes = [];
	graphEdges = [];
	const shelfMap = new Map<string, string[]>();
	for (const entry of libraryEntries) {
		const nodeId = entry.path;
		graphNodes.push({
			id: nodeId,
			label: entry.title || entry.path.split("/").pop() || entry.path,
			shelf: entry.shelf,
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			connections: 0,
		});
		if (!shelfMap.has(entry.shelf)) shelfMap.set(entry.shelf, []);
		shelfMap.get(entry.shelf)!.push(nodeId);
	}
	// Connect nodes in the same shelf (co-occurrence)
	for (const [_shelf, ids] of shelfMap) {
		// Limit edges per shelf to avoid clutter
		const limit = Math.min(ids.length, 20);
		for (let i = 0; i < limit - 1; i++) {
			graphEdges.push({ source: ids[i], target: ids[i + 1] });
			const a = graphNodes.find((n) => n.id === ids[i]);
			const b = graphNodes.find((n) => n.id === ids[i + 1]);
			if (a) a.connections++;
			if (b) b.connections++;
		}
	}
}

function handleSkill(skillId: string) {
	switch (skillId) {
		case "watch":
			// Inject a prompt to watch a video
			if (agent) {
				agent.steer(
					createSystemNotification(
						"🎬 Video ingestion ready. Paste a YouTube URL in the chat to ingest it into the knowledge graph.",
					),
				);
			}
			break;
		case "scrape":
			if (agent) {
				agent.steer(createSystemNotification("🌐 Web scrape ready. Paste a URL to scrape using Bright Data."));
			}
			break;
		case "crawl":
			if (agent) {
				agent.steer(createSystemNotification("🕷️ Site crawl ready. Paste a site URL to crawl with Firecrawl."));
			}
			break;
		case "graph":
			rightPanelView = "graph";
			showRightPanel = true;
			renderApp();
			break;
		case "brain":
			if (agent) {
				agent.steer(createSystemNotification("🧠 Brain search ready. Ask a question to search your second brain."));
			}
			break;
	}
}

// ============================================================================
// RENDER
// ============================================================================
const renderApp = () => {
	const app = document.getElementById("app");
	if (!app) return;

	const appHtml = html`
		<div class="w-full h-screen flex flex-col bg-background text-foreground overflow-hidden">
			<!-- Token Tracker (floating, bottom-left) -->
			<token-tracker></token-tracker>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border shrink-0">
				<div class="flex items-center gap-2 px-4 py-">
					${Button({
						variant: "ghost",
						size: "sm",
						children: icon(History, "sm"),
						onClick: () => {
							SessionListDialog.open(
								async (sessionId) => {
									await loadSession(sessionId);
								},
								(deletedSessionId) => {
									// Only reload if the current session was deleted
									if (deletedSessionId === currentSessionId) {
										newSession();
									}
								},
							);
						},
						title: "Sessions",
					})}
					${Button({
						variant: "ghost",
						size: "sm",
						children: icon(Plus, "sm"),
						onClick: newSession,
						title: "New Session",
					})}
					${Button({
						variant: "ghost",
						size: "sm",
						children: html`<span style="font-size:16px;">📖</span>`,
						onClick: () => {
							showFlipbook = !showFlipbook;
							renderApp();
						},
						title: "Toggle Onboarding Flipbook",
					})}

					${
						currentTitle
							? isEditingTitle
								? html`<div class="flex items-center gap-2">
									${Input({
										type: "text",
										value: currentTitle,
										className: "text-sm w-64",
										onChange: async (e: Event) => {
											const newTitle = (e.target as HTMLInputElement).value.trim();
											if (newTitle && newTitle !== currentTitle && storage.sessions && currentSessionId) {
												await storage.sessions.updateTitle(currentSessionId, newTitle);
												currentTitle = newTitle;
											}
											isEditingTitle = false;
											renderApp();
										},
										onKeyDown: async (e: KeyboardEvent) => {
											if (e.key === "Enter") {
												const newTitle = (e.target as HTMLInputElement).value.trim();
												if (newTitle && newTitle !== currentTitle && storage.sessions && currentSessionId) {
													await storage.sessions.updateTitle(currentSessionId, newTitle);
													currentTitle = newTitle;
												}
												isEditingTitle = false;
												renderApp();
											} else if (e.key === "Escape") {
												isEditingTitle = false;
												renderApp();
											}
										},
									})}
								</div>`
								: html`<button
									class="px-2 py-1 text-sm text-foreground hover:bg-secondary rounded transition-colors"
									@click=${() => {
										isEditingTitle = true;
										renderApp();
										requestAnimationFrame(() => {
											const input = app?.querySelector('input[type="text"]') as HTMLInputElement;
											if (input) {
												input.focus();
												input.select();
											}
										});
									}}
									title="Click to edit title"
								>
									${currentTitle}
								</button>`
							: html`<span class="text-base font-semibold text-foreground">Pi Web UI Example</span>`
					}
				</div>
				<div class="flex items-center gap-1 px-2">
					${Button({
						variant: "ghost",
						size: "sm",
						children: icon(Bell, "sm"),
						onClick: () => {
							// Demo: Inject custom message (will appear on next agent run)
							if (agent) {
								agent.steer(
									createSystemNotification(
										"This is a custom message! It appears in the UI but is never sent to the LLM.",
									),
								);
							}
						},
						title: "Demo: Add Custom Notification",
					})}

					<!-- Deep Research toggle -->
					<button
						class="flex items-center gap-1.5 px-2 py-1 rounded text-sm font-medium transition-colors ${
							isDeepResearch
								? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 ring-1 ring-blue-500/50"
								: "text-muted-foreground hover:bg-secondary hover:text-foreground"
						}"
						@click=${async () => {
							isDeepResearch = !isDeepResearch;
							currentSessionId = undefined;
							currentTitle = "";
							await createAgent();
							renderApp();
						}}
						title="${isDeepResearch ? "Deep Research ON — click to disable" : "Enable Deep Research mode (global, multi-source, cited)"}"
					>
						${icon(Globe, "sm")}
						<span class="hidden sm:inline">${isDeepResearch ? "Researching" : "Research"}</span>
						${isDeepResearch ? html`<span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>` : ""}
					</button>

					<!-- Model Switcher -->
					<div class="relative">
						<button
							class="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
								showModelPicker
									? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
									: "text-muted-foreground hover:bg-secondary hover:text-foreground"
							}"
							@click=${() => toggleModelPicker()}
							title="Click to switch model"
						>
							<span class="max-w-24 truncate">${agent?.state.model?.id ?? "claude-sonnet-4-6"}</span>
						</button>
						${
							showModelPicker
								? html`
								<div class="absolute top-full right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto min-w-64">
									<div class="p-2 border-b border-zinc-700">
										<div class="text-xs font-semibold text-zinc-300 px-2 py-1">Switch Model</div>
										<div class="text-xs text-zinc-500 px-2">Free models first, GLM-5.2 for big tasks</div>
									</div>
									${getAvailableModels().map(
										(m) => html`
											<button
												class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 transition-colors flex justify-between items-center ${
													agent?.state.model?.id === m.id
														? "bg-emerald-500/10 text-emerald-400"
														: "text-zinc-300"
												}"
												@click=${() => switchModel(m.model)}
											>
												<span class="truncate">${m.name}</span>
												<span class="text-zinc-500 ml-2">${m.provider}</span>
											</button>
										`,
									)}
								</div>
							`
								: ""
						}
					</div>

					<theme-toggle></theme-toggle>
					${Button({
						variant: "ghost",
						size: "sm",
						children: icon(Settings, "sm"),
						onClick: () => SettingsDialog.open([new ProvidersModelsTab(), new ProxyTab()]),
						title: "Settings",
					})}
				</div>
			</div>

			<!-- 3-column layout: Sidebar | Chat | Right Panel -->
			<div class="flex-1 flex overflow-hidden">
				<!-- Left Sidebar (LibreChat-style) -->
				<div style="width: 240px; flex-shrink: 0;" class="hidden md:block">
					<cosmos-sidebar
						.sessions=${sessionList}
						.currentSessionId=${currentSessionId}
						.onNewChat=${() => newSession()}
						.onLoadSession=${(id: string) => loadSession(id)}
						.onSkill=${(skillId: string) => handleSkill(skillId)}
						.onSettings=${() => SettingsDialog.open([new ProvidersModelsTab(), new ProxyTab()])}
					></cosmos-sidebar>
				</div>

				<!-- Centered Chat Panel -->
				<div class="flex-1 flex flex-col min-w-0 overflow-hidden">
					<!-- Chat Panel / Voice Flipbook -->
					${showFlipbook ? html`<voice-flipbook></voice-flipbook>` : chatPanel}
				</div>

				<!-- Right Panel (Knowledge Graph / Library Browser) -->
				${
					showRightPanel
						? html`
							<div style="width: 320px; flex-shrink: 0;" class="hidden lg:block border-l border-border">
								<div class="flex border-b border-border">
									<button
										class="flex-1 px-3 py-2 text-xs font-medium ${
											rightPanelView === "graph"
												? "text-emerald-400 border-b-2 border-emerald-400"
												: "text-muted-foreground"
										}"
										@click=${() => {
											rightPanelView = "graph";
											renderApp();
										}}
									>
										Graph
									</button>
									<button
										class="flex-1 px-3 py-2 text-xs font-medium ${
											rightPanelView === "library"
												? "text-emerald-400 border-b-2 border-emerald-400"
												: "text-muted-foreground"
										}"
										@click=${() => {
											rightPanelView = "library";
											renderApp();
										}}
									>
										Library
									</button>
									<button
										class="px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
										@click=${() => {
											showRightPanel = false;
											renderApp();
										}}
										title="Hide panel"
									>
										✕
									</button>
								</div>
								<div class="flex-1 overflow-hidden" style="height: calc(100% - 40px);">
									${
										rightPanelView === "graph"
											? html`<knowledge-graph
													.nodes=${graphNodes}
													.edges=${graphEdges}
													.onNodeClick=${(nodeId: string) => {
														if (agent) {
															agent.steer(createSystemNotification(`📂 Opened: ${nodeId}`));
														}
													}}
												></knowledge-graph>`
											: html`<library-browser
													.entries=${libraryEntries}
													.onFileClick=${(path: string) => {
														if (agent) {
															agent.steer(createSystemNotification(`📂 Opened: ${path}`));
														}
													}}
												></library-browser>`
									}
								</div>
							</div>
						`
						: html`
							<button
								class="px-2 py-1 text-xs text-muted-foreground hover:text-foreground border-l border-border"
								@click=${() => {
									showRightPanel = true;
									renderApp();
								}}
								title="Show panel"
							>
								◀
							</button>
						`
				}
			</div>
		</div>
	`;

	render(appHtml, app);
};

// ============================================================================
// INIT
// ============================================================================
async function initApp() {
	const app = document.getElementById("app");
	if (!app) throw new Error("App container not found");

	// Show loading
	render(
		html`
			<div class="w-full h-screen flex items-center justify-center bg-background text-foreground">
				<div class="text-muted-foreground">Loading...</div>
			</div>
		`,
		app,
	);

	// TODO: Fix PersistentStorageDialog - currently broken
	// Request persistent storage
	// if (storage.sessions) {
	// 	await PersistentStorageDialog.request();
	// }

	// Create ChatPanel
	chatPanel = new ChatPanel();

	// Load session list and library index for sidebar + right panel
	refreshSessionList();
	loadLibraryIndex();

	// Check for session in URL
	const urlParams = new URLSearchParams(window.location.search);
	const sessionIdFromUrl = urlParams.get("session");

	if (sessionIdFromUrl) {
		const loaded = await loadSession(sessionIdFromUrl);
		if (!loaded) {
			// Session doesn't exist, redirect to new session
			newSession();
			return;
		}
	} else {
		await createAgent();
	}

	renderApp();
}

initApp();
