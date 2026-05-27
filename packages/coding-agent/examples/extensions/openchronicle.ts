import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const OPENCHRONICLE_PACKAGE = "git:github.com/Einsia/OpenChronicle.git";

export default function openChronicleExtension(pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		ctx.ui.notify("OpenChronicle extension loaded. Run /openchronicle-config for setup.", "info");
	});

	pi.registerCommand("openchronicle-config", {
		description: "Print settings.json snippet to load OpenChronicle from git",
		handler: async (_args, ctx) => {
			ctx.ui.notify(`settings.json packages entry: ${OPENCHRONICLE_PACKAGE}`, "info");
		},
	});
}
