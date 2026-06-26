import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// Stubs for Node-only modules that have no browser equivalent.
// The pi-agent-core pulls in server-side code (postgres, fs, infisical secrets,
// tenant loaders, migrations) that must never run in the browser. We stub them
// at the import level so the browser bundle stays clean.
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

// Agent dist modules that are pure server-side (fs/secret/tenant loaders).
// Stub the whole module so its internal fs import never gets resolved.
const INFISICAL_STUB = `
export class InfisicalClient { constructor() {} async initialize() {} async getSecrets() { return {}; } async getSecret() { return undefined; } }
export function initializeSecrets() { return undefined; }
export function getSecretsClient() { return null; }
export async function resolveSecret(name) { return process.env?.[name] ?? undefined; }
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

// Stub the whole database barrel (re-exports migrations + types).
// In the browser there is no postgres; the agent's DB layer is a no-op.
const DATABASE_INDEX_STUB = `
export class MigrationRunner { constructor() {} async run() {} async getPending() { return []; } }
export const runMigrations = async () => {};
export const getPendingMigrations = async () => [];
export default {};
`;

const DATABASE_TYPES_STUB = "export default {};";

// Map of bare specifiers + agent dist paths to their stubs.
// Keys are matched against the import source OR the resolved absolute path.
function stubNodeOnlyPackages() {
	// Bare specifiers -> virtual stubs
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
	// Absolute path suffixes (within agent/dist) -> stubs
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
			// 1. Bare specifier match (e.g. "fs", "pg")
			if (bareStubs[source]) {
				const id = `\0virtual:stub:${source}`;
				idMap.set(id, bareStubs[source]);
				return { id, moduleSideEffects: false };
			}
			// 2. Resolve relative imports that end in a stubbed agent dist file.
			//    Vite gives us the importer; we resolve the source against it.
			if (importer && (source.startsWith("./") || source.startsWith("../"))) {
				const importerDir = importer.replace(/[/\\][^/\\]*$/, "");
				const resolved = source.replace(/^\.\//, "").replace(/^\.\.\//, "");
				// Normalize backslashes
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
			// Belt-and-suspenders: if any fs/pg import slips past the stub plugin,
			// point it at a data: URL so it never hits the filesystem.
			pg: "data:text/javascript,export default {};",
			"postgres-bytea": "data:text/javascript,export default {};",
			"pg-types": "data:text/javascript,export default {};",
		},
	},
	optimizeDeps: {
		// Don't pre-bundle the agent package; let it load via source with stubs
		exclude: ["@mariozechner/pi-agent-core", "@mariozechner/pi-data-processor"],
	},
	define: {
		global: "globalThis",
	},
	server: {
		hmr: {
			// Keep the error overlay but don't let it block reloads during iteration
			overlay: true,
		},
	},
});
