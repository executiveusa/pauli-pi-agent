import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// ============================================================
// Load secrets from the agent's .env file (gitignored, real keys)
// and inject them directly into the build as string replacements.
// This is the most reliable way to get env vars into a Vite SPA.
// ============================================================
function loadAgentEnv(): Record<string, string> {
	const envPath = path.resolve(__dirname, "../../../.env");
	if (!fs.existsSync(envPath)) return {};
	const raw = fs.readFileSync(envPath, "utf8");
	const vars: Record<string, string> = {};
	for (const line of raw.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eqIdx = trimmed.indexOf("=");
		if (eqIdx === -1) continue;
		const key = trimmed.slice(0, eqIdx).trim();
		const value = trimmed.slice(eqIdx + 1).trim();
		if (key && value) vars[key] = value;
	}
	return vars;
}

// ============================================================
// Stubs for Node-only modules that have no browser equivalent.
// ============================================================
const FS_STUB =
	"export const readdirSync = () => []; export const readFileSync = () => ''; export const writeFileSync = () => {}; export const existsSync = () => false; export const mkdirSync = () => {}; export const statSync = () => ({ isDirectory: () => false }); export default {};";

const PATH_STUB =
	"export const join = (...a) => a.join('/'); export const resolve = (...a) => a.join('/'); export const dirname = (p) => p; export const basename = (p) => p; export default {};";

const PG_STUB = "export default {};";

const DATA_PROCESSOR_STUB = `
export class DataProcessor { constructor() {} async process() {} }
export class FileIndexer { constructor() {} async index() {} }
export class ChatGPTImporter { constructor() {} async import() {} }
export class ClaudeImporter { constructor() {} async import() {} }
export class NotionImporter { constructor() {} async import() {} }
export const initializeSchema = async () => {};
export default { DataProcessor, FileIndexer, ChatGPTImporter, ClaudeImporter, NotionImporter, initializeSchema };
`;

const INFISICAL_STUB = `
export class InfisicalClient { constructor() {} async initialize() {} async getSecrets() { return {}; } async getSecret() { return undefined; } }
export function initializeSecrets() { return undefined; }
export function getSecretsClient() { return null; }
export async function resolveSecret(name) { return undefined; }
export async function getSecret(name, path, required) { return undefined; }
export default { InfisicalClient, initializeSecrets, getSecretsClient, resolveSecret, getSecret };
`;

const TENANT_LOADER_STUB = `
export const loadTenantConfig = () => ({});
export const getTenantRoot = () => '.';
export default { loadTenantConfig, getTenantRoot };
`;

const MIGRATIONS_STUB = `
export class MigrationRunner { constructor() {} async run() {} async getPending() { return []; } }
export const runMigrations = async () => {};
export const getPendingMigrations = async () => [];
export default { MigrationRunner, runMigrations, getPendingMigrations };
`;

const DATABASE_INDEX_STUB = `
export class MigrationRunner { constructor() {} async run() {} async getPending() { return []; } }
export const runMigrations = async () => {};
export const getPendingMigrations = async () => [];
export default {};
`;

const DATABASE_TYPES_STUB = "export default {};";

function stubNodeOnlyPackages() {
	const bareStubs: Record<string, string> = {
		fs: FS_STUB,
		"node:fs": FS_STUB,
		path: PATH_STUB,
		"node:path": PATH_STUB,
		pg: PG_STUB,
		"postgres-bytea": PG_STUB,
		"pg-types": PG_STUB,
		"node:stream/promises": "export const pipeline = () => {}; export default {};",
		"@mariozechner/pi-data-processor": DATA_PROCESSOR_STUB,
	};
	const pathStubs: Array<{ suffix: string; code: string }> = [
		{ suffix: "agent/dist/secrets/infisical-client.js", code: INFISICAL_STUB },
		{ suffix: "agent/dist/secrets/infisical-client.mjs", code: INFISICAL_STUB },
		{ suffix: "agent/dist/tenants/tenant-loader.js", code: TENANT_LOADER_STUB },
		{ suffix: "agent/dist/tenants/tenant-loader.mjs", code: TENANT_LOADER_STUB },
		{ suffix: "agent/dist/database/migrations.js", code: MIGRATIONS_STUB },
		{ suffix: "agent/dist/database/migrations.mjs", code: MIGRATIONS_STUB },
		{ suffix: "agent/dist/database/index.js", code: DATABASE_INDEX_STUB },
		{ suffix: "agent/dist/database/index.mjs", code: DATABASE_INDEX_STUB },
		{ suffix: "agent/dist/database/types.js", code: DATABASE_TYPES_STUB },
		{ suffix: "agent/dist/database/types.mjs", code: DATABASE_TYPES_STUB },
	];
	const idMap = new Map<string, string>();
	return {
		name: "stub-node-only-packages",
		enforce: "pre",
		resolveId(source: string, importer: string | undefined) {
			if (bareStubs[source]) {
				const id = `\0virtual:stub:${source}`;
				idMap.set(id, bareStubs[source]);
				return { id, moduleSideEffects: false };
			}
			if (importer && (source.startsWith("./") || source.startsWith("../"))) {
				const importerDir = importer.replace(/[/\\][^/\\]*$/, "");
				const resolved = source.replace(/^\.\//, "").replace(/^\.\.\//, "");
				const normalized = `${importerDir}/${resolved}`.replace(/\\/g, "/");
				for (const { suffix, code } of pathStubs) {
					if (normalized.toLowerCase().includes(suffix.toLowerCase())) {
						const id = `\0virtual:stub:${suffix}`;
						idMap.set(id, code);
						return { id, moduleSideEffects: false };
					}
				}
			}
			return null;
		},
		load(id: string) {
			return idMap.get(id) ?? null;
		},
	};
}

export default defineConfig(() => {
	// Build a __AGENT_ENV_JSON__ string with all the keys the smart-router needs.
	// This gets injected into index.html as window.__AGENT_ENV__ = JSON.parse(__AGENT_ENV_JSON__)
	const env = loadAgentEnv();
	const agentEnvDefine: Record<string, string> = {};
	// Only include LLM provider keys (never expose Coolify SSH, Supabase service roles, etc.)
	const llmKeys = [
		"GOOGLE_API_KEY",
		"GEMINI_API_KEY",
		"GROQ_API_KEY",
		"OPEN_ROUTER_API",
		"OPENROUTER_API_KEY",
		"ANTHROPIC_API_KEY",
		"OPENAI_API_KEY",
		"OPENAI_ORG_ID",
		"MISTRAL_API_KEY",
		"ZAI_API_KEY",
		"GLM_API_KEY",
		"MOONSHOT_AI_API",
		"DEEPSEEK_API_KEY",
		"FIRECRAWL_API_TOKEN",
		"BRIGHT_DATA_API",
		"COMMAND_CODE_API",
		"NOTION_API_TOKEN",
		"ELEVEN_LABS_API",
		"HEYGEN_API",
	];
	const llmEnv: Record<string, string> = {};
	for (const key of llmKeys) {
		const value = env[key];
		if (value) llmEnv[key] = value;
	}
	// Also inject the env vars directly into index.html via a transform plugin
	const envScriptContent = `<script>try{window.__AGENT_ENV__=${JSON.stringify(JSON.stringify(llmEnv))}}catch(e){window.__AGENT_ENV__={}}</script>`;

	return {
		plugins: [
			stubNodeOnlyPackages(),
			{
				name: "inject-agent-env",
				transformIndexHtml(html: string) {
					return html.replace("<!-- agent-env-injected -->", envScriptContent);
				},
			},
			tailwindcss(),
			nodePolyfills({
				include: ["buffer", "process", "stream", "util", "events", "path"],
				exclude: ["fs"],
				globals: {
					Buffer: true,
					global: true,
					process: true,
				},
			}),
		],
		resolve: {
			alias: {
				pg: "data:text/javascript,export default {};",
				"postgres-bytea": "data:text/javascript,export default {};",
				"pg-types": "data:text/javascript,export default {};",
			},
		},
		optimizeDeps: {
			exclude: ["@mariozechner/pi-agent-core", "@mariozechner/pi-data-processor"],
		},
		define: {
			global: "globalThis",
			...agentEnvDefine,
		},
		server: {
			hmr: { overlay: true },
		},
	};
});
