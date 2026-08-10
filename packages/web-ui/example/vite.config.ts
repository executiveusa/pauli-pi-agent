import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

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

export default defineConfig({
	// Only values intentionally classified as public are allowed into the browser bundle.
	// VITE_DEEP_RESEARCH_API is a public endpoint URL retained for backward compatibility.
	// Provider keys, service-role keys, tokens, and other server secrets must never use these prefixes.
	envPrefix: ["PAULI_PUBLIC_", "VITE_DEEP_RESEARCH_API"],
	plugins: [
		stubNodeOnlyPackages(),
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
	},
	server: {
		hmr: { overlay: true },
	},
});
