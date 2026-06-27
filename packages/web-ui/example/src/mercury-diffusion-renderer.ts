/**
 * Mercury Diffusion Renderer — wires the MercuryDiffusionBubble visual component
 * into the chat message stream.
 *
 * When the agent streams a response from a diffusion model (Mercury), the
 * assistant message gets a "diffusing" visual state instead of the normal
 * typewriter append. The bubble shows the text being refined in-place with
 * a subtle emerald glow that locks to "final" when the stream completes.
 *
 * This renderer hooks into the standard assistant-message render path. When
 * the message's `metadata.mercuryDiffusion` flag is set, we wrap the content
 * in a <mercury-diffusion-bubble> element.
 */

import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { MessageRenderer } from "@mariozechner/pi-web-ui";
import { registerMessageRenderer } from "@mariozechner/pi-web-ui";
import { html } from "lit";
import "./mercury-diffusion-bubble-setup.js";

/**
 * Detect whether a message was produced by a Mercury diffusion model.
 * The agent sets `metadata.routeTag = "mercury-diffusion"` when streaming
 * via the Mercury diffusion lane.
 */
function isMercuryDiffusion(message: AssistantMessage): boolean {
	const meta = (message as AssistantMessage & { metadata?: Record<string, unknown> }).metadata;
	return Boolean(meta?.mercuryDiffusion || meta?.routeTag === "mercury-diffusion");
}

/**
 * Renderer for assistant messages in Mercury diffusion mode.
 * Delegates to the <mercury-diffusion-bubble> web component for the visual.
 */
const mercuryDiffusionRenderer: MessageRenderer<AssistantMessage> = {
	render: (message: AssistantMessage, context?: { streaming?: boolean }) => {
		const text =
			message.content
				?.filter((c): c is { type: "text"; text: string } => c.type === "text")
				.map((c) => c.text)
				.join("\n") ?? "";

		const streaming = context?.streaming ?? false;
		// State mapping: streaming → diffusing, done → final
		const state = streaming ? "diffusing" : "final";

		return html`
			<div class="px-4 py-2">
				<mercury-diffusion-bubble
					.state=${state}
					.text=${text}
				></mercury-diffusion-bubble>
			</div>
		`;
	},
};

/**
 * Register the Mercury diffusion renderer.
 * Called once at app startup.
 *
 * NOTE: This renderer is keyed to a custom message role "assistant-mercury-diffusion"
 * so it only activates for Mercury-routed responses. Standard assistant messages
 * keep using the default renderer. The agent's Mercury stream layer tags
 * diffusion responses with this role.
 */
export function registerMercuryDiffusionRenderer() {
	// Register under a custom role so it doesn't override the default assistant renderer.
	// The agent must emit messages with role "assistant-mercury-diffusion" to trigger this.
	// Cast: the registry type is a strict union; we extend it at runtime with a custom role.
	registerMessageRenderer(
		"assistant-mercury-diffusion" as "assistant",
		mercuryDiffusionRenderer as MessageRenderer<any>,
	);
}

export { isMercuryDiffusion };
