import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [tailwindcss()],
	resolve: {
		alias: {
			// Stub out Node-only modules that creep in via pi-agent-core -> data-processor -> pg
			pg: "data:text/javascript,export default {}",
			"postgres-bytea": "data:text/javascript,export default {}",
			"pg-types": "data:text/javascript,export default {}",
			"@mariozechner/pi-data-processor":
				"data:text/javascript,export const DataProcessor = class {}; export const FileIndexer = class {}; export const initializeSchema = () => {}; export const NotionImporter = class {}; export const ChatGPTImporter = class {}; export default {};",
		},
	},
	define: {
		global: "globalThis",
	},
});
